const ETSY_API_BASE_URL = 'https://openapi.etsy.com/v3/application';

/**
 * Fetch listing images for a specific listing.
 *
 * @param {string} listing_id
 * @param {string} api_key
 * @param {string} shared_secret
 * @param {typeof fetch} [fetch_impl]
 * @returns {Promise<object[]>}
 */
async function fetchListingImages(listing_id, api_key, shared_secret, fetch_impl = fetch) {
  const url = `${ETSY_API_BASE_URL}/listings/${listing_id}/images`;

  const response = await fetch_impl(url, {
    method: 'GET',
    headers: {
      'x-api-key': `${api_key}:${shared_secret}`,
    },
  });

  if (!response.ok) {
    // Don't fail the whole sync if images fail for one listing
    console.warn(`Failed to fetch images for listing ${listing_id}: ${response.status}`);
    return [];
  }

  const data = await response.json();
  return Array.isArray(data.results) ? data.results : [];
}

/**
 * Fetch active listings for an Etsy shop with images.
 *
 * @param {string} shop_id
 * @param {string} api_key
 * @param {string} shared_secret
 * @param {typeof fetch} [fetch_impl]
 * @returns {Promise<object>}
 */
export async function fetchActiveListings(shop_id, api_key, shared_secret, fetch_impl = fetch) {
  const url = new URL(`${ETSY_API_BASE_URL}/shops/${shop_id}/listings/active`);

  const response = await fetch_impl(url.toString(), {
    method: 'GET',
    headers: {
      'x-api-key': `${api_key}:${shared_secret}`,
    },
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Etsy API rate limit exceeded. Try again later.');
    }
    throw new Error(`Etsy API request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return { results: [] };
  }

  if (typeof response.text !== 'function') {
    return response.json();
  }

  const payloadText = await response.text();

  if (!payloadText || payloadText.trim().length === 0) {
    return { results: [] };
  }

  let data;
  try {
    data = JSON.parse(payloadText);
  } catch {
    throw new Error('Etsy API returned invalid JSON');
  }

  // Fetch images for each listing
  const listings = Array.isArray(data.results) ? data.results : [];
  const listingsWithImages = await Promise.all(
    listings.map(async (listing) => {
      const images = await fetchListingImages(listing.listing_id, api_key, shared_secret, fetch_impl);
      return { ...listing, images };
    }),
  );

  return { ...data, results: listingsWithImages };
}
