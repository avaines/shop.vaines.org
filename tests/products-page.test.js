import { describe, expect, it, vi } from "vitest";

import { getProductsLoadErrorHtml, loadProducts } from "../static/js/products.js";

describe("products page error handling", () => {
  it("shows a user-friendly error when the API call fails", async () => {
    const container = { innerHTML: "" };
    const doc = {
      getElementById: (id) => (id === "products" ? container : null),
    };
    const error = new Error("Network down");
    const fetchFn = vi.fn().mockRejectedValue(error);
    const logger = { error: vi.fn() };

    await loadProducts({ doc, fetchFn, logger });

    expect(fetchFn).toHaveBeenCalledWith("/api/products");
    expect(container.innerHTML).toBe(getProductsLoadErrorHtml());
    expect(container.innerHTML).toContain("Unable to load products");
    expect(logger.error).toHaveBeenCalledWith("Failed to load products:", error);
  });
});
