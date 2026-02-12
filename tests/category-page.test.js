import { describe, expect, it } from "vitest";

import { filterProductsByCategory, getCategorySlugFromPath } from "../static/js/category-page.js";

describe("category page helpers", () => {
  it("extracts category slug from category routes", () => {
    expect(getCategorySlugFromPath("/categories/home-decor/")).toBe("home-decor");
    expect(getCategorySlugFromPath("/categories/")).toBe("");
    expect(getCategorySlugFromPath("/about/")).toBe("");
  });

  it("filters products to the requested category slug", () => {
    const products = [
      { id: "1", categories: ["Home Decor", "Ceramics"] },
      { id: "2", categories: ["Art Prints"] },
      { id: "3", categories: ["Uncategorised"] },
    ];

    expect(filterProductsByCategory(products, "home-decor")).toEqual([{ id: "1", categories: ["Home Decor", "Ceramics"] }]);
    expect(filterProductsByCategory(products, "art-prints")).toEqual([{ id: "2", categories: ["Art Prints"] }]);
    expect(filterProductsByCategory(products, "uncategorised")).toEqual([{ id: "3", categories: ["Uncategorised"] }]);
    expect(filterProductsByCategory(products, "")).toEqual(products);
  });
});
