const customerColdDrinkNames = new Set([
  "code red",
  "vitamin c",
  "vitamen c",
  "water",
  "bottled water",
]);

export function getCustomerMenuCategory(product) {
  if (product?.category !== "snack") return product?.category;

  const name = normalizeProductName(product?.name);
  return customerColdDrinkNames.has(name) ? "cold" : product.category;
}

function normalizeProductName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
