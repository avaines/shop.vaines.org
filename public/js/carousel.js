const FALLBACK_IMAGE = "https://placehold.co/600x600/e0e0e0/666?text=No+Image";
const boundRoots = new WeakSet();

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
    return `<img src="${firstImage}" alt="${safeName}" class="product-image product-image-loading" loading="lazy">`;
  }

  const encodedImages = encodeURIComponent(JSON.stringify(images));

  return `
    <div class="product-carousel" data-current-index="0" tabindex="0">
      <button type="button" class="carousel-button carousel-prev" aria-label="Previous image">Prev</button>
      <img
        src="${firstImage}"
        alt="${safeName}"
        class="product-image carousel-image product-image-loading"
        loading="lazy"
        data-images="${encodedImages}"
      >
      <button type="button" class="carousel-button carousel-next" aria-label="Next image">Next</button>
    </div>
  `;
}

function getCarouselImages(imageElement) {
  const encodedImages = imageElement?.dataset?.images;

  if (!encodedImages) {
    return [];
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(encodedImages));
    return toImageList(parsed);
  } catch {
    return [];
  }
}

function showImageAtIndex(carouselElement, index) {
  const imageElement = carouselElement.querySelector(".carousel-image");

  if (!imageElement) {
    return;
  }

  const images = getCarouselImages(imageElement);

  if (images.length === 0) {
    return;
  }

  const nextIndex = ((index % images.length) + images.length) % images.length;
  imageElement.classList.add("product-image-loading");
  imageElement.src = images[nextIndex];
  carouselElement.dataset.currentIndex = String(nextIndex);
}

function moveCarouselBy(carouselElement, delta) {
  const currentIndex = Number(carouselElement.dataset.currentIndex || "0");
  showImageAtIndex(carouselElement, currentIndex + delta);
}

export function initProductCarousels(root = document) {
  if (boundRoots.has(root)) {
    return;
  }

  boundRoots.add(root);

  root.addEventListener("load", (event) => {
    if (event.target instanceof HTMLImageElement) {
      event.target.classList.remove("product-image-loading");
    }
  }, true);

  root.addEventListener("error", (event) => {
    if (event.target instanceof HTMLImageElement) {
      event.target.classList.remove("product-image-loading");
    }
  }, true);

  root.addEventListener("click", (event) => {
    const carouselFromClick = event.target.closest(".product-carousel");

    if (carouselFromClick) {
      carouselFromClick.focus();
    }

    const button = event.target.closest(".carousel-button");

    if (!button) {
      return;
    }

    const carouselElement = button.closest(".product-carousel");

    if (!carouselElement) {
      return;
    }

    if (button.classList.contains("carousel-next")) {
      moveCarouselBy(carouselElement, 1);
      return;
    }

    if (button.classList.contains("carousel-prev")) {
      moveCarouselBy(carouselElement, -1);
    }
  });

  root.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    const carouselElement = event.target.closest(".product-carousel");

    if (!carouselElement) {
      return;
    }

    event.preventDefault();
    moveCarouselBy(carouselElement, event.key === "ArrowRight" ? 1 : -1);
  });
}
