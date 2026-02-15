export function getProductPriceText(product) {
  const display = product?.price?.display;

  if (typeof display === "string" && display.trim().length > 0) {
    return display.trim();
  }

  return "Price unavailable";
}
