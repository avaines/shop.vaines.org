const ETSY_API_BASE_URL = 'https://openapi.etsy.com/v3/application';

/**
 * Fetch active listings for an Etsy shop.
 *
 * @param {string} shop_id
 * @param {string} api_key
 * @param {typeof fetch} [fetch_impl]
 * @returns {Promise<object>}
 */
export async function fetchActiveListings(shop_id, api_key, fetch_impl = fetch) {
  const url = new URL(`${ETSY_API_BASE_URL}/shops/${shop_id}/listings/active`);
  url.searchParams.set('includes', 'Images');
  url.searchParams.set(
    'fields[ListingImage]',
    'url_fullxfull,url_570xN,url_170x135,url_75x75,url',
  );

  const response = await fetch_impl(url.toString(), {
    method: 'GET',
    headers: {
      'x-api-key': api_key,
    },
  });

  if (!response.ok) {
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

  try {
    return JSON.parse(payloadText);
  } catch {
    throw new Error('Etsy API returned invalid JSON');
  }
}
