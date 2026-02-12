import { createProductImageMarkup, initProductCarousels } from "./carousel.js";

export function slugifyCategory(category) {
  return String(category)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function renderCategoryNav(products, doc = document) {
  const categoryNav = doc.getElementById("category-nav");

  if (!categoryNav) {
    return;
  }

  const uniqueCategories = [...new Set(
    products
      .flatMap((product) => (Array.isArray(product.categories) ? product.categories : []))
      .map((category) => String(category).trim())
      .filter((category) => category.length > 0),
  )];

  const links = [
    '<a class="category-link is-active" href="/">All Products</a>',
    ...uniqueCategories.map((category) => {
      const slug = slugifyCategory(category);
      return `<a class="category-link" href="/categories/${slug}/">${category}</a>`;
    }),
  ];

  categoryNav.innerHTML = links.join("");
}

export function getProductsLoadErrorHtml() {
  return '<div class="error">Unable to load products. Please try again later.</div>';
}

export async function loadProducts({ doc = document, fetchFn = fetch, logger = console } = {}) {
  const container = doc.getElementById("products");

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
      renderCategoryNav([], doc);
      return;
    }

    renderCategoryNav(products, doc);

    container.innerHTML = products
      .map((product) => {
        const categories = product.categories && product.categories.length > 0
          ? product.categories.join(", ")
          : "Uncategorised";

        const availabilityClass = product.available ? "badge-available" : "badge-sold-out";
        const availabilityText = product.available ? "In Stock" : "Sold Out";
        const cardStateClass = product.available ? "" : " product-card-sold-out";

        return `
          <div class="product-card${cardStateClass}">
            <span class="badge ${availabilityClass}">${availabilityText}</span>
            ${createProductImageMarkup(product)}
            <div class="product-info">
              <h3 class="product-name">${product.name}</h3>
              <p class="product-description">${product.description}</p>
              <div class="product-categories">${categories}</div>
              <div class="product-footer">
                <a href="${product.etsyUrl}" class="etsy-link" target="_blank" rel="noopener">View on Etsy</a>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    initProductCarousels(container);
  } catch (error) {
    logger.error("Failed to load products:", error);
    container.innerHTML = getProductsLoadErrorHtml();
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadProducts);
  } else {
    loadProducts();
  }
}
