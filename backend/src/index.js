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
    const DEBUG = env.DEBUG === 'true'; // Enable debug logging if DEBUG is 'true'

    const cacheKey = "product_list_cache";

    function logDebug(message, data) {
      // Helper function for logging if DEBUG is enabled
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
      const url = `${SQUARE_API_BASE_URL}${endpoint}`;
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

      logDebug(`Making ${method} request to ${url}...`);

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Failed to fetch from ${endpoint}: ${response.statusText}`);
      }
      return response.json();
    }


    async function fetchFromSquareAPI() {
      logDebug("Fetching product list from Square API...");
      const catalogData = await apiRequest('catalog/list?types=ITEM', 'GET');
      // const catalogData = await apiResponse.json();
      logDebug("Received catalog data", catalogData);

      // Get additional image information for each item
      const itemsWithImages = await fetchImagesForItems(catalogData.objects);

      // Cache response with a timestamp
      const cacheData = {
        data: itemsWithImages,
        timestamp: Date.now(),
      };
      await env.KV_NAMESPACE.put(cacheKey, JSON.stringify(cacheData));

      logDebug("Caching data in KV with timestamp", cacheData);

      return itemsWithImages;
    }

    async function fetchImagesForItems(items) {
      const itemIds = items.map(item => item.id);

      const body = {
        include_related_objects: true,
        object_ids: itemIds,
      };

      logDebug("Fetching batch of item images from Square API...", body);
      const batchData = await apiRequest('catalog/batch-retrieve', 'POST', body);
      // const batchData = await batchResponse.json();
      logDebug("Received batch data for items", batchData);

      return items.map(item => {
        const imageIds = item.item_data.image_ids;

        const imageUrls = batchData.related_objects
            .filter(obj => obj.type === "IMAGE" && imageIds.includes(obj.id)) // Filter out the relevant images
            .map(imageObj => imageObj.image_data.url); // Extract the image URLs

        // TODO: The payment linux API doesnt seem to work properly, as a temporary fix ive stuck the link in a 'tmp_payment_linux' custom attribute
        let tmpPaymentLink = "#"
        const customAttributes = item.custom_attribute_values

        for (const key in customAttributes) {
          if (customAttributes[key].name === "tmp_payment_link") {
            tmpPaymentLink = customAttributes[key].string_value;
            break;
          }
        }
        // TODO: End

        return {
          id: item.id,
          name: item.item_data.name,
          price: item.item_data.variations[0].item_variation_data.price_money.amount/100, // Square API returns currency in 
          description: item.item_data.description,
          images: imageUrls,
          payment_url: tmpPaymentLink, // TODO: The payment linux API doesnt seem to work properly, as a temporary fix ive stuck the link in a 'tmp_payment_linux' custom attribute
          // payment_url: `https://squareup.com/pay/${item.id}`,
        };
      });
    }

    // Check cache
    logDebug("Checking KV cache for product list...");
    const cachedData = await env.KV_NAMESPACE.get(cacheKey);
    if (cachedData) {
      const parsedCache = JSON.parse(cachedData);
      const ageInMinutes = (Date.now() - parsedCache.timestamp) / 60000;
      logDebug(`Cache age: ${ageInMinutes} minutes`);

      if (ageInMinutes < CACHE_EXPIRATION_MINUTES) {
        logDebug("Cache is fresh, returning cached data.");
        return new Response(JSON.stringify(parsedCache.data), {
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        logDebug("Cache is stale, fetching fresh data...");
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
