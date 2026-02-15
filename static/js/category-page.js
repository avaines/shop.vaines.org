import { createProductImageMarkup, initProductCarousels } from "./carousel.js";
import { getProductPriceText } from "./price.js";

export function slugifyCategory(category) {
  return String(category)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCategorySlugFromPath(pathname) {
  const segments = String(pathname || "")
    .split("/")
    .filter(Boolean);

  if (segments[0] !== "categories") {
    return "";
  }

  return segments[1] || "";
}

function prettyCategoryName(slug) {
  return String(slug)
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function filterProductsByCategory(products, categorySlug) {
  if (!Array.isArray(products)) {
    return [];
  }

  if (!categorySlug) {
    return products;
  }

  return products.filter((product) => {
    if (!Array.isArray(product?.categories)) {
      return false;
    }

    return product.categories.some((category) => slugifyCategory(category) === categorySlug);
  });
}

function findCategoryDisplayName(products, categorySlug) {
  if (!Array.isArray(products) || !categorySlug) {
    return "All Products";
  }

  for (const product of products) {
    if (!Array.isArray(product?.categories)) {
      continue;
    }

    for (const category of product.categories) {
      if (slugifyCategory(category) === categorySlug) {
        return category;
      }
    }
  }

  return prettyCategoryName(categorySlug);
}

function renderCategoryNav(products, categorySlug, allowedCategories = null) {
  const categoryNav = document.getElementById("category-nav");

  if (!categoryNav) {
    return;
  }

  let uniqueCategories = [...new Set(
    products
      .flatMap((product) => (Array.isArray(product.categories) ? product.categories : []))
      .map((category) => String(category).trim())
      .filter((category) => category.length > 0),
  )];

  // Filter to allowed categories if whitelist provided
  if (Array.isArray(allowedCategories) && allowedCategories.length > 0) {
    const allowedSet = new Set(allowedCategories.map((c) => c.toLowerCase()));
    uniqueCategories = uniqueCategories.filter((category) =>
      allowedSet.has(category.toLowerCase()),
    );
  }

  const links = [
    `<a class="category-link${categorySlug ? "" : " is-active"}" href="/">All Products</a>`,
    ...uniqueCategories.map((category) => {
      const slug = slugifyCategory(category);
      const activeClass = slug === categorySlug ? " is-active" : "";
      return `<a class="category-link${activeClass}" href="/categories/${slug}/">${category}</a>`;
    }),
  ];

  categoryNav.innerHTML = links.join("");
}

function renderProducts(container, products) {
  container.innerHTML = products.map((product) => {
    const categories = product.categories && product.categories.length > 0
      ? product.categories.join(", ")
      : "Uncategorised";

    const availabilityClass = product.available ? "badge-available" : "badge-sold-out";
    const availabilityText = product.available ? "In Stock" : "Sold Out";
    const cardStateClass = product.available ? "" : " product-card-sold-out";
    const productPrice = getProductPriceText(product);
    const unavailablePriceClass = productPrice === "Price unavailable"
      ? " product-price-unavailable"
      : "";

    return `
      <div class="product-card${cardStateClass}">
        <span class="badge ${availabilityClass}">${availabilityText}</span>
        ${createProductImageMarkup(product)}
        <div class="product-info">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-description">${product.description}</p>
          <div class="product-categories">${categories}</div>
          <p class="product-price${unavailablePriceClass}">${productPrice}</p>
          <div class="product-footer">
            <a href="${product.etsyUrl}" class="etsy-link" target="_blank" rel="noopener">View on Etsy</a>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

async function loadCategoryPage() {
  const container = document.getElementById("products");
  const heading = document.getElementById("category-heading");

  if (!container || !heading) {
    return;
  }

  const categorySlug = getCategorySlugFromPath(window.location.pathname);

  try {
    const response = await fetch("/api/products");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const products = await response.json();

    if (!Array.isArray(products) || products.length === 0) {
      heading.textContent = "Product Category";
      container.innerHTML = '<div class="error">No products available</div>';
      renderCategoryNav([], categorySlug, window.SITE_CONFIG?.allowedCategories);
      return;
    }

    const filteredProducts = filterProductsByCategory(products, categorySlug);
    heading.textContent = findCategoryDisplayName(products, categorySlug);
    renderCategoryNav(products, categorySlug, window.SITE_CONFIG?.allowedCategories);

    if (filteredProducts.length === 0) {
      container.innerHTML = '<div class="error">No products found in this category.</div>';
      return;
    }

    renderProducts(container, filteredProducts);
    initProductCarousels(container);
  } catch (error) {
    console.error("Failed to load products:", error);
    container.innerHTML = "<div class=\"error\">Unable to load products. Please try again later.</div>";
  }
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadCategoryPage);
  } else {
    loadCategoryPage();
  }
}
