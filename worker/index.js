/**
 * Cloudflare Worker: Etsy Product API
 * Handles HTTP requests to /api/products and scheduled cache refresh
 */

import { fetchActiveListings } from './lib/etsy.js';
import { transformListing } from './lib/transform.js';
import { Cache } from './lib/cache.js';

const PRODUCT_CACHE_KEY = 'products';
const productCache = new Cache();
const REQUIRED_ENV_VARS = ['ETSY_API_KEY', 'ETSY_SHOP_ID', 'ETSY_API_SHARED_SECRET'];

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
    },
  });
}

function getMissingEnvVars(env = {}) {
  return REQUIRED_ENV_VARS.filter((name) => !env[name]);
}

async function syncProducts(env, { forceRefresh = false, refreshFallbackProducts = null } = {}) {
  const missingEnvVars = getMissingEnvVars(env);

  if (missingEnvVars.length > 0) {
    return {
      ok: false,
      missingEnvVars,
      products: [],
    };
  }

  const cachedProducts = productCache.get(PRODUCT_CACHE_KEY);

  if (cachedProducts && !forceRefresh) {
    return {
      ok: true,
      missingEnvVars: [],
      products: cachedProducts,
    };
  }

  try {
    const etsyData = await fetchActiveListings(
      env?.ETSY_SHOP_ID,
      env?.ETSY_API_KEY,
      env?.ETSY_API_SHARED_SECRET,
    );
    const listings = Array.isArray(etsyData?.results) ? etsyData.results : [];
    const products = listings.map((listing) => transformListing(listing));

    productCache.set(PRODUCT_CACHE_KEY, products);

    return {
      ok: true,
      missingEnvVars: [],
      products,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Failed to fetch Etsy listings: ${message}`);

    const staleProducts = refreshFallbackProducts ?? productCache.getStale(PRODUCT_CACHE_KEY);

    if (staleProducts !== null) {
      return {
        ok: true,
        missingEnvVars: [],
        products: staleProducts,
      };
    }

    return {
      ok: true,
      missingEnvVars: [],
      products: [],
    };
  }
}

/**
 * HTTP Request Handler
 * Serves /api/products endpoint
 */
export default {
  async fetch(request, env, _ctx) {
    const url = new URL(request.url);

    // Only handle /api/products
    if (url.pathname !== '/api/products') {
      return new Response('Not Found', { status: 404 });
    }

    const result = await syncProducts(env);

    if (!result.ok) {
      console.error(`Missing environment variables: ${result.missingEnvVars.join(', ')}`);
      return jsonResponse(
        {
          error: 'Service configuration error',
        },
        500,
      );
    }

    return jsonResponse({ products: result.products });
  },

  /**
   * Scheduled Handler
   * Runs on cron trigger to refresh product cache
   */
  async scheduled(event, env, _ctx) {
    console.log('Running scheduled cache refresh');

    const result = await syncProducts(env, { forceRefresh: true });

    if (result.ok) {
      console.log(`Cache refreshed: ${result.products.length} products`);
    } else {
      console.error(`Cache refresh failed: ${result.missingEnvVars.join(', ')}`);
    }
  },
};
