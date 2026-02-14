import { describe, expect, it, vi } from "vitest";

import { getProductsLoadErrorHtml, loadProducts } from "../static/js/products.js";
import { getProductPriceText } from "../static/js/price.js";

describe("products page error handling", () => {
  it("shows a user-friendly error when the API call fails", async () => {
    const container = { innerHTML: "" };
    const featuredContainer = { innerHTML: "" };
    const doc = {
      getElementById: (id) => {
        if (id === "products") {
          return container;
        }

        if (id === "featured-products") {
          return featuredContainer;
        }

        return null;
      },
    };
    const error = new Error("Network down");
    const fetchFn = vi.fn().mockRejectedValue(error);
    const logger = { error: vi.fn() };

    await loadProducts({ doc, fetchFn, logger });

    expect(fetchFn).toHaveBeenCalledWith("/api/products");
    expect(container.innerHTML).toBe(getProductsLoadErrorHtml());
    expect(container.innerHTML).toContain("Unable to load products");
    expect(featuredContainer.innerHTML).toBe(getProductsLoadErrorHtml());
    expect(logger.error).toHaveBeenCalledWith("Failed to load products:", error);
  });
});

describe("getProductPriceText", () => {
  it("returns formatted display price when present", () => {
    expect(getProductPriceText({ price: { display: "£18.00" } })).toBe("£18.00");
  });

  it("returns fallback text when price is missing", () => {
    expect(getProductPriceText({})).toBe("Price unavailable");
    expect(getProductPriceText({ price: { display: "" } })).toBe("Price unavailable");
  });
});
