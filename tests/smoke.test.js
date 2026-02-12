import { describe, expect, it } from "vitest";

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:8788";
const shouldRunSmokeTests = process.env.RUN_SMOKE_TESTS === "1";
const describeSmoke = shouldRunSmokeTests ? describe : describe.skip;

describeSmoke("local smoke tests", () => {
  it("returns product JSON from /api/products", async () => {
    const response = await fetch(`${BASE_URL}/api/products`);

    expect(response.status).toBe(200);

    const payload = await response.json();
    expect(Array.isArray(payload)).toBe(true);
  });

  it("returns homepage HTML containing the products container", async () => {
    const response = await fetch(`${BASE_URL}/`);

    expect(response.status).toBe(200);

    const html = await response.text();
    expect(html).toContain('id="products"');
  });
});
