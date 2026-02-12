import { fetchActiveListings } from '../lib/etsy.js';
import { transformListing } from '../lib/transform.js';
import { Cache } from '../lib/cache.js';

const PRODUCT_CACHE_KEY = 'products';
const productCache = new Cache();
const REQUIRED_ENV_VARS = ['ETSY_API_KEY', 'ETSY_SHOP_ID', 'ETSY_API_SHARED_SECRET'];

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
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
      `${env?.ETSY_API_KEY}:${env?.ETSY_API_SHARED_SECRET}`,
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
    console.error('Failed to fetch Etsy listings', error);

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

async function refreshProducts(env) {
  const refreshFallbackProducts = productCache.getStale(PRODUCT_CACHE_KEY);
  productCache.delete(PRODUCT_CACHE_KEY);

  return syncProducts(env, {
    forceRefresh: true,
    refreshFallbackProducts,
  });
}

/**
 * Cloudflare Pages Function: Product API
 * Returns product data from Etsy API with in-memory TTL caching.
 */
export async function onRequest(context) {
  const requestUrl = new URL(context.request.url);
  const refreshToken = requestUrl.searchParams.get('refresh');
  const isRefreshRequest = refreshToken !== null;

  if (isRefreshRequest) {
    if (refreshToken !== context.env?.ETSY_API_SHARED_SECRET) {
      return jsonResponse({ error: 'Forbidden: invalid refresh secret' }, 403);
    }
  }

  const result = isRefreshRequest
    ? await refreshProducts(context.env)
    : await syncProducts(context.env);

  if (!result.ok) {
    return jsonResponse(
      {
        error: `Missing required environment variables: ${result.missingEnvVars.join(', ')}`,
        missing: result.missingEnvVars,
      },
      500,
    );
  }

  return jsonResponse(result.products);
}

/**
 * Cloudflare scheduled handler: refreshes product cache daily.
 */
export async function onScheduled(_event, env, _ctx) {
  const result = await refreshProducts(env);

  if (!result.ok) {
    console.error(
      `Scheduled refresh skipped: missing required environment variables: ${result.missingEnvVars.join(', ')}`,
    );
  }
}
