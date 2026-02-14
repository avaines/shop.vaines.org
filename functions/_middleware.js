import { Cache } from './lib/cache.js';
import { fetchActiveListings } from './lib/etsy.js';
import { transformListing } from './lib/transform.js';

const PRODUCT_CACHE_KEY = 'products';
const productCache = new Cache();

/**
 * Scheduled handler for cache refresh
 */
async function handleScheduled(event, env, ctx) {
  console.log('Scheduled refresh triggered at', new Date(event.scheduledTime || Date.now()).toISOString());

  // Clear existing cache to force refresh
  const fallbackProducts = productCache.getStale(PRODUCT_CACHE_KEY);
  productCache.delete(PRODUCT_CACHE_KEY);

  try {
    const etsyData = await fetchActiveListings(
      env?.ETSY_SHOP_ID,
      env?.ETSY_API_KEY,
      env?.ETSY_API_SHARED_SECRET,
    );

    const listings = Array.isArray(etsyData?.results) ? etsyData.results : [];
    const products = listings.map((listing) => transformListing(listing));

    productCache.set(PRODUCT_CACHE_KEY, products);
    console.log(`Successfully refreshed ${products.length} products`);
  } catch (error) {
    console.error('Scheduled refresh failed:', error);

    // Restore fallback if available
    if (fallbackProducts !== null) {
      productCache.set(PRODUCT_CACHE_KEY, fallbackProducts);
    }
  }
}

// Export as both onScheduled (Pages) and scheduled (Workers)
export async function onScheduled(event, env, ctx) {
  return handleScheduled(event, env, ctx);
}

export default {
  async scheduled(event, env, ctx) {
    return handleScheduled(event, env, ctx);
  }
};
