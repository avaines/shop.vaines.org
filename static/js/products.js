import { createProductImageMarkup, initProductCarousels } from "./carousel.js";
import { getProductPriceText } from "./price.js";

function decodeHtmlEntities(text) {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function sanitizeHtml(text) {
  return escapeHtml(decodeHtmlEntities(text));
}

export function slugifyCategory(category) {
  return String(category)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getProductsLoadErrorHtml() {
  return '<div class="error">Unable to load products. Please try again later.</div>';
}

function getCardMarkup(product) {
  const categories = product.categories && product.categories.length > 0
    ? product.categories.map(c => sanitizeHtml(c)).join(", ")
    : "Uncategorised";

  const availabilityClass = product.available ? "badge-available" : "badge-sold-out";
  const availabilityText = product.available ? "In Stock" : "Sold Out";
  const cardStateClass = product.available ? "" : " product-card-sold-out";
  const productPrice = getProductPriceText(product);
  const unavailablePriceClass = productPrice === "Price unavailable"
    ? " product-price-unavailable"
    : "";

  const safeName = sanitizeHtml(product.name || '');
  const safeDescription = sanitizeHtml(product.description || '');
  const safeEtsyUrl = escapeHtml(product.etsyUrl || '#');

  return `
    <div class="product-card${cardStateClass}">
      <span class="badge ${availabilityClass}">${availabilityText}</span>
      ${createProductImageMarkup(product)}
      <div class="product-info">
        <h3 class="product-name">${safeName}</h3>
        <p class="product-description">${safeDescription}</p>
        <div class="product-categories">${categories}</div>
        <p class="product-price${unavailablePriceClass}">${productPrice}</p>
        <div class="product-footer">
          <a href="${safeEtsyUrl}" class="etsy-link" target="_blank" rel="noopener">View on Etsy</a>
        </div>
      </div>
    </div>
  `;
}

function selectFeaturedProducts(products, count = 3) {
  if (!Array.isArray(products)) {
    return [];
  }

  const availableProducts = products.filter((product) => product?.available);
  const source = availableProducts.length >= count ? availableProducts : products;
  return source.slice(0, count);
}

export async function loadProducts({ doc = document, fetchFn = fetch, logger = console } = {}) {
  const container = doc.getElementById("products");
  const featuredContainer = doc.getElementById("featured-products");

  if (!container) {
    return;
  }

  try {
    const response = await fetchFn("/api/products");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const products = await response.json();

    if (!Array.isArray(products) || products.length === 0) {
      container.innerHTML = '<div class="error">No products available</div>';
      if (featuredContainer) {
        featuredContainer.innerHTML = '<div class="error">No featured products available</div>';
      }
      return;
    }

    if (featuredContainer) {
      const featuredProducts = selectFeaturedProducts(products);
      featuredContainer.innerHTML = featuredProducts.map(getCardMarkup).join("");
      initProductCarousels(featuredContainer);
    }

    container.innerHTML = products.map(getCardMarkup).join("");

    initProductCarousels(container);
  } catch (error) {
    logger.error("Failed to load products:", error);
    container.innerHTML = getProductsLoadErrorHtml();
    if (featuredContainer) {
      featuredContainer.innerHTML = getProductsLoadErrorHtml();
    }
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadProducts);
  } else {
    loadProducts();
  }
}
