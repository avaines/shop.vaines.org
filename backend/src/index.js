/**
 * Cloudflare Worker function to retrieve and cache product data from Square's API.
 *
 * This script caches the result in Cloudflare KV storage to avoid frequent API calls, 
 *   reducing the risk of hitting rate limits.
 * 
 * The cache expires after a set number of minutes, defined by the environment variable CACHE_EXPIRATION_MINUTES.
 * 
 * Returns a JSON object containing item id, name, price, description, list of image URLs, and payment links.
 */
export default {
  async fetch(request, env, ctx) {
    const CACHE_EXPIRATION_MINUTES = parseInt(env.CACHE_EXPIRATION_MINUTES || "10");
    const SQUARE_ACCESS_TOKEN = env.SQUARE_ACCESS_TOKEN;
    const SQUARE_API_BASE_URL = env.SQUARE_API_BASE_URL || 'https://connect.squareupsandbox.com/v2/';
    const LOCATION_ID = env.LOCATION_ID
    const CATALOG_CHANGE_HOOK_URL = env.CATALOG_CHANGE_HOOK_URL || null
    const DEBUG = env.DEBUG === 'true'; // Enable debug logging if DEBUG is 'true'
    const cacheKey = "product_list_cache";
    const cacheAgeStampKey = 'product_list_cache_age'

    function logDebug(message, data) {
      if (DEBUG) {
        console.log(message, data || '');
      }
    }

    async function apiRequest(endpoint, method, body = null) {
      /**
       * Helper function to make API requests to Square
       * @param {string} endpoint - The API endpoint ('catalog/list', 'catalog/batch-retrieve')
       * @param {string} method - HTTP method
       * @param {object} [body] - Optional body
       * @returns {Promise<object>} - The JSON response
       */
      const url = `${endpoint}`;
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
      };

      if (body) {
        options.body = JSON.stringify(body);
      }

      logDebug(`Making ${method} request to ${url}...${JSON.stringify(body)}}`);

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Failed to fetch from ${endpoint}: ${JSON.stringify(response)}`);
      }
      return response.json();
    }


    async function fetchFromSquareAPI() {
      logDebug("Fetching product list and categories from Square API...");
      const catalogData = await apiRequest(`${SQUARE_API_BASE_URL}/catalog/list?types=ITEM,CATEGORY`, 'GET');
      logDebug("Received catalog data", catalogData);

      const items = catalogData.objects.filter(obj => obj.type === 'ITEM');
      const categories = catalogData.objects.filter(obj => obj.type === 'CATEGORY');

      // Create a map of category_id to category name for easier lookup
      const categoryMap = categories.reduce((map, category) => {
        map[category.id] = category.category_data.name;
        return map;
      }, {});

      // Get additional image information and payment URLs for each item
      const itemsWithDetails = await fetchDetailsForItems(items, categoryMap);

      await env.PRODUCT_CACHE_KV.put(cacheAgeStampKey, Date.now());

      // Check if the product catalogue is the same as the stuff stored in the KB
      const cachedPitemDetails = await env.PRODUCT_CACHE_KV.get(cacheKey)
      if (cachedPitemDetails && cachedPitemDetails == JSON.stringify(itemsWithDetails)) {
        logDebug("Product catalogue matches what we already have cached in KV");

      } else {
        logDebug("Product catalogue has changed updating, caching data in KV", itemsWithDetails);
        await env.PRODUCT_CACHE_KV.put(cacheKey, JSON.stringify(itemsWithDetails));

        if (CATALOG_CHANGE_HOOK_URL != null ) {
          // Call the web hook to rebuild the pages
          logDebug("Triggering Pages deployment for data-reload.");
          await apiRequest(CATALOG_CHANGE_HOOK_URL, 'POST');
        }

      }
      
      return itemsWithDetails;
    }

    async function fetchDetailsForItems(items, categoryMap) {
      const itemIds = items.map(item => item.id);

      const body = {
        include_related_objects: true,
        object_ids: itemIds,
      };

      logDebug("Fetching batch of item images and payment links from Square API...", body);
      const batchData = await apiRequest(`${SQUARE_API_BASE_URL}/catalog/batch-retrieve`, 'POST', body);
      logDebug("Received batch data for items", batchData);

      const results = await Promise.all(items.map(async (item) => {
        const imageIds = item.item_data.image_ids;
        const imageUrls = batchData.related_objects
          .filter(obj => obj.type === "IMAGE" && imageIds.includes(obj.id))
          .map(imageObj => imageObj.image_data.url);
        const paymentUrl = await getOrCreatePaymentLink(item.item_data.variations[0].id, item.item_data.name);
          
        // For each category, check the ID aggainst the Category Map to get a list of the friendly. Empty list if theres no categories
        const categories = item.item_data.categories ? item.item_data.categories.map(ittr => categoryMap[ittr.id]) : []

        const hasStockAvailable = !(item.item_data.is_archived || item.is_deleted || 
          item.item_data.variations[0].item_variation_data.location_overrides.every(location => location.sold_out === true)
        );

        if ( item.item_data.is_archived || item.is_deleted ) {
          return null //explicitly skip the element if this item isnt suitable (archived or deleted)
        }

        return {
          id: item.id,
          name: item.item_data.name,
          price: item.item_data.variations[0].item_variation_data.price_money.amount / 100, // Square API returns currency in thousands
          description: item.item_data.description,
          images: imageUrls,
          available: hasStockAvailable,
          categories: categories,
          payment_url: paymentUrl,
        };
        
      }));

      return results.filter(item => item !== null);
    }

    async function getOrCreatePaymentLink(variationId, itemName) {
      logDebug(`Checking for existing payment link for variation ${variationId}...`);
 
      // Check if a payment link exists for the item variation
      const cachedPaymentLink = await env.PRODUCT_CACHE_KV.get(variationId);
        if (cachedPaymentLink) {
          logDebug(`Found existing payment link for variation ${variationId}`, cachedPaymentLink);
          return cachedPaymentLink;
        }
    
      // If no payment link exists, create a new one
      logDebug(`No payment link found for variation ${variationId}, creating a new one...`);
    
      const newPaymentLinkData = {
        idempotency_key: crypto.randomUUID(), // Unique ID to ensure the request is not repeated
        order: {
          location_id: LOCATION_ID,
          line_items: [{
            name: itemName, 
            catalog_object_id: variationId,
            quantity: '1'
          }]
        },
        checkout_options: {
          ask_for_shipping_address: true
        }
      };
    
      const createPaymentLinkResponse = await apiRequest(`${SQUARE_API_BASE_URL}/online-checkout/payment-links`, 'POST', newPaymentLinkData);
    
      if (!createPaymentLinkResponse || !createPaymentLinkResponse.payment_link) {
        throw new Error(`Failed to create payment link for variation ${variationId}`);
      }
      
      logDebug(`Created new payment link for variation ${variationId}`, createPaymentLinkResponse);
      await env.PRODUCT_CACHE_KV.put(variationId, createPaymentLinkResponse.payment_link.url);
      logDebug(`New payment link cached as ${variationId}:createPaymentLinkResponse`);

      return createPaymentLinkResponse.payment_link.url;
    }
        

    // Check cache
    logDebug("Checking KV cache for product list...");
    const itemsWithDetails = await env.PRODUCT_CACHE_KV.get(cacheKey);
    const itemDetailCacheAge = await env.PRODUCT_CACHE_KV.get(cacheAgeStampKey);
  
    if (itemsWithDetails) {
      const parsedCache = JSON.parse(itemsWithDetails);

      if (itemDetailCacheAge) {
        const ageInMinutes = (Date.now() - itemDetailCacheAge) / 60000;
        logDebug(`Cache age: ${ageInMinutes} minutes`);

        if (ageInMinutes < CACHE_EXPIRATION_MINUTES) {
          logDebug("Cache is fresh, returning cached data.");
          return new Response(JSON.stringify(parsedCache), {
            headers: { 'Content-Type': 'application/json' },
          });
        } else {
          logDebug("Cache is stale, fetching fresh data...");
        }
      }
    } else {
      logDebug("No cached data found, fetching fresh data...");
    }

    // Fetch fresh data from Square if cache is outdated or doesn't exist
    const data = await fetchFromSquareAPI();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
