/**
 * Mock product catalog
 * --------------------
 * A small list of common household fridge/pantry items used by the
 * "Add Product" flow's product picker. This is mock data — replace with a
 * real catalog/API later.
 *
 * Each entry has a stable `id`, a display `name`, and an `emoji` used as a
 * lightweight generic icon placeholder (no image assets needed yet).
 */

export interface CatalogProduct {
  id: string;
  name: string;
  emoji: string;
}

export const mockProducts: CatalogProduct[] = [
  { id: "milk", name: "Milk", emoji: "🥛" },
  { id: "eggs", name: "Eggs", emoji: "🥚" },
  { id: "butter", name: "Butter", emoji: "🧈" },
  { id: "yogurt", name: "Yogurt", emoji: "🍶" },
  { id: "cheese", name: "Cheese", emoji: "🧀" },
  { id: "orange-juice", name: "Orange Juice", emoji: "🧃" },
  { id: "bread", name: "Bread", emoji: "🍞" },
  { id: "tomato", name: "Tomato", emoji: "🍅" },
  { id: "carrot", name: "Carrot", emoji: "🥕" },
  { id: "apple", name: "Apple", emoji: "🍎" },
  { id: "banana", name: "Banana", emoji: "🍌" },
  { id: "chicken", name: "Chicken", emoji: "🍗" },
  { id: "fish", name: "Fish", emoji: "🐟" },
  { id: "lettuce", name: "Lettuce", emoji: "🥬" },
  { id: "jam", name: "Jam", emoji: "🍯" },
];

/** Sentinel id used for the "Other / Custom product" option. */
export const CUSTOM_PRODUCT_ID = "__custom__";

/** Fallback emoji used when a product name isn't in the catalog. */
export const DEFAULT_PRODUCT_EMOJI = "📦";

/**
 * Look up a product's emoji by name (case-insensitive).
 * Returns `DEFAULT_PRODUCT_EMOJI` when no match is found (e.g. a custom
 * product that isn't in the catalog).
 */
export function getProductIcon(name: string): string {
  const q = name.trim().toLowerCase();
  if (!q) return DEFAULT_PRODUCT_EMOJI;
  const match = mockProducts.find((p) => p.name.toLowerCase() === q);
  return match ? match.emoji : DEFAULT_PRODUCT_EMOJI;
}
