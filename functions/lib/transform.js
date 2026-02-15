/**
 * Normalize category names to plural form for consistency.
 * @param {string} category
 * @returns {string}
 */
function normalizeCategoryPlural(category) {
  const pluralMap = {
    'bowl': 'Bowls',
    'bowls': 'Bowls',
    'pen': 'Pens',
    'pens': 'Pens',
  };

  const lower = category.toLowerCase();
  return pluralMap[lower] || category;
}

/**
 * Transform an Etsy listing object into the app product schema.
 *
 * @param {object} listing
 * @returns {{
 *   id: string,
 *   name: string,
 *   description: string,
 *   images: string[],
 *   available: boolean,
 *   categories: string[],
 *   price: { amount: number | null, currency: string | null, display: string | null },
 *   etsyUrl: string,
 * }}
 */
export function transformListing(listing) {
  const listingId = String(listing?.listing_id ?? '');
  const listingImages = Array.isArray(listing?.images)
    ? listing.images
    : Array.isArray(listing?.Images)
      ? listing.Images
      : [];

  const images = listingImages
    .map((image) => {
      if (typeof image === 'string') {
        return image;
      }

      return image?.url_fullxfull ?? image?.url_570xN ?? image?.url_170x135 ?? image?.url ?? '';
    })
    .filter((url) => typeof url === 'string' && url.length > 0);

  const taxonomyCategories = Array.isArray(listing?.taxonomy_path)
    ? listing.taxonomy_path
    : [];
  const tagCategories = Array.isArray(listing?.tags)
    ? listing.tags
    : [];

  const categorySource = taxonomyCategories.length > 0 ? taxonomyCategories : tagCategories;
  const normalisedCategories = [...new Set(
    categorySource
      .filter((category) => typeof category === 'string')
      .map((category) => category.trim())
      .filter((category) => category.length > 0)
      .map((category) => normalizeCategoryPlural(category)),
  )];

  const categories = normalisedCategories.length > 0 ? normalisedCategories : ['Uncategorised'];
  const currencyCode = resolveCurrencyCode(listing);
  const amount = resolvePriceAmount(listing?.price);
  const display = formatPriceDisplay(amount, currencyCode);

  return {
    id: listingId,
    name: listing?.title ?? '',
    description: listing?.description ?? '',
    images,
    available: listing?.state === 'active',
    categories,
    price: {
      amount,
      currency: currencyCode,
      display,
    },
    etsyUrl: `https://www.etsy.com/listing/${listingId}`,
  };
}

function resolveCurrencyCode(listing) {
  const rawValue = listing?.currency_code ?? listing?.price?.currency_code ?? listing?.price?.currencyCode;

  if (typeof rawValue !== 'string') {
    return null;
  }

  const normalised = rawValue.trim().toUpperCase();
  return normalised.length > 0 ? normalised : null;
}

function resolvePriceAmount(rawPrice) {
  if (typeof rawPrice === 'number' && Number.isFinite(rawPrice)) {
    return rawPrice;
  }

  if (typeof rawPrice === 'string') {
    const parsed = Number.parseFloat(rawPrice);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (!rawPrice || typeof rawPrice !== 'object') {
    return null;
  }

  const rawAmount = rawPrice.amount;
  const rawDivisor = rawPrice.divisor;
  const amount = typeof rawAmount === 'string' ? Number.parseFloat(rawAmount) : rawAmount;
  const divisor = typeof rawDivisor === 'string' ? Number.parseFloat(rawDivisor) : rawDivisor;

  if (Number.isFinite(amount) && Number.isFinite(divisor) && divisor > 0) {
    return amount / divisor;
  }

  if (Number.isFinite(amount)) {
    return amount;
  }

  return null;
}

function formatPriceDisplay(amount, currencyCode) {
  if (!Number.isFinite(amount) || !currencyCode) {
    return null;
  }

  try {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch {
    return null;
  }
}
