import { createProductImageMarkup } from "./carousel.js";

async function loadProducts() {
  const container = document.getElementById("products");

  if (!container) {
    return;
  }

  try {
    const response = await fetch("/api/products");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const products = await response.json();

    if (!Array.isArray(products) || products.length === 0) {
      container.innerHTML = '<div class="error">No products available</div>';
      return;
    }

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
  } catch (error) {
    console.error("Failed to load products:", error);
    container.innerHTML = "<div class=\"error\">Failed to load products. Please try again later.</div>";
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadProducts);
} else {
  loadProducts();
}
