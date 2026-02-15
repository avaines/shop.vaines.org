import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("homepage layout structure", () => {
  it("keeps dedicated intro, featured, and full product sections", () => {
    const indexLayout = readFileSync("layouts/index.html", "utf8");

    expect(indexLayout).toContain('class="home-intro"');
    expect(indexLayout).toContain('id="featured-products"');
    expect(indexLayout).toContain('id="all-products"');
    expect(indexLayout).toContain('id="products"');
  });
});
