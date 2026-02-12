/**
 * Cloudflare Worker function to retrieve and cache product data from Etsy's API.
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
    const ETSY_API_KEY = env.ETSY_API_KEY;
    const ETSY_SHARED_SECRET = env.ETSY_SHARED_SECRET;
    const ETSY_SHOP_ID = env.ETSY_SHOP_ID;
    const ETSY_API_BASE_URL = env.ETSY_API_BASE_URL || 'https://openapi.etsy.com/v2/';
    const CATALOG_CHANGE_HOOK_URL = env.CATALOG_CHANGE_HOOK_URL || null;
    const DEBUG = env.DEBUG === 'true'; // Enable debug logging if DEBUG is 'true'
    const cacheKey = "product_list_cache";
    const cacheAgeStampKey = 'product_list_cache_age';

    function logDebug(message, data) {
      if (DEBUG) {
        console.log(message, data || '');
      }
    }

    async function apiRequest(endpoint, method, params = {}) {
      /**
       * Helper function to make API requests to Etsy
       * @param {string} endpoint - The API endpoint ('shops/:shop_id/listings/active')
       * @param {string} method - HTTP method
       * @param {object} [params] - Optional query parameters
       * @returns {Promise<object>} - The JSON response
       */
      const url = new URL(`${ETSY_API_BASE_URL}${endpoint}`);
      url.search = new URLSearchParams({ ...params, api_key: ETSY_API_KEY }).toString();

      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ETSY_API_KEY,
          'x-api-secret': ETSY_SHARED_SECRET,
        },
      };

      logDebug(`Making ${method} request to ${url}...`);

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`Failed to fetch from ${endpoint}: ${JSON.stringify(response)}`);
      }
      return response.json();
    }

    async function fetchFromEtsyAPI() {
      logDebug("Fetching product list from Etsy API...");
      const listingsData = await apiRequest(`shops/${ETSY_SHOP_ID}/listings/active`, 'GET');
      logDebug("Received listings data", listingsData);

      const itemsWithDetails = listingsData.results.map(item => ({
        id: item.listing_id,
        name: item.title,
        price: item.price,
        description: item.description,
        images: item.Images.map(image => image.url_fullxfull),
        available: item.state === 'active',
        payment_url: item.url,
      }));

      await env.PRODUCT_CACHE_KV.put(cacheAgeStampKey, Date.now());

      // Check if the product catalogue is the same as the stuff stored in the KV
      const cachedItemDetails = await env.PRODUCT_CACHE_KV.get(cacheKey);
      if (cachedItemDetails && cachedItemDetails == JSON.stringify(itemsWithDetails)) {
        logDebug("Product catalogue matches what we already have cached in KV");
      } else {
        logDebug("Product catalogue has changed, updating and caching data in KV", itemsWithDetails);
        await env.PRODUCT_CACHE_KV.put(cacheKey, JSON.stringify(itemsWithDetails));

        if (CATALOG_CHANGE_HOOK_URL != null) {
          // Call the web hook to rebuild the pages
          logDebug("Triggering Pages deployment for data-reload.");
          await apiRequest(CATALOG_CHANGE_HOOK_URL, 'POST');
        }
      }

      return itemsWithDetails;
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

    // Fetch fresh data from Etsy if cache is outdated or doesn't exist
    const data = await fetchFromEtsyAPI();
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
