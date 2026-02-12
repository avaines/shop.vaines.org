const FALLBACK_IMAGE = "https://placehold.co/600x600/e0e0e0/666?text=No+Image";

function toImageList(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.filter((image) => typeof image === "string" && image.trim().length > 0);
}

export function createProductImageMarkup(product) {
  const images = toImageList(product?.images);
  const firstImage = images[0] || FALLBACK_IMAGE;
  const name = product?.name || "Product image";
  const safeName = String(name).replace(/"/g, "&quot;");

  if (images.length <= 1) {
    return `<img src="${firstImage}" alt="${safeName}" class="product-image" loading="lazy">`;
  }

  const encodedImages = encodeURIComponent(JSON.stringify(images));

  return `
    <div class="product-carousel" data-current-index="0">
      <button type="button" class="carousel-button carousel-prev" aria-label="Previous image">Prev</button>
      <img
        src="${firstImage}"
        alt="${safeName}"
        class="product-image carousel-image"
        loading="lazy"
        data-images="${encodedImages}"
      >
      <button type="button" class="carousel-button carousel-next" aria-label="Next image">Next</button>
    </div>
  `;
}
