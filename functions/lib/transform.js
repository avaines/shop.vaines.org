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
 *   etsyUrl: string,
 * }}
 */
export function transformListing(listing) {
  const listingId = String(listing?.listing_id ?? '');

  const images = Array.isArray(listing?.images)
    ? listing.images
      .map((image) => {
        if (typeof image === 'string') {
          return image;
        }

        return image?.url_fullxfull ?? image?.url_570xN ?? image?.url_170x135 ?? image?.url ?? '';
      })
      .filter((url) => typeof url === 'string' && url.length > 0)
    : [];

  const categories = Array.isArray(listing?.taxonomy_path)
    ? listing.taxonomy_path.filter((category) => typeof category === 'string' && category.length > 0)
    : [];
  const normalisedCategories = categories.length > 0 ? categories : ['Uncategorised'];

  return {
    id: listingId,
    name: listing?.title ?? '',
    description: listing?.description ?? '',
    images,
    available: listing?.state === 'active',
    categories: normalisedCategories,
    etsyUrl: `https://www.etsy.com/listing/${listingId}`,
  };
}
