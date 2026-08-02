"use client";

import { CUSTOM_PRODUCT_ID, type CatalogProduct } from "@/lib/mockProducts";

interface ProductPickerGridProps {
  products: CatalogProduct[];
  query: string;
  onSelect: (product: CatalogProduct | { id: string; name: string }) => void;
}

/**
 * ProductPickerGrid
 * -----------------
 * Responsive grid of selectable catalog products for the "Add Product" flow.
 * Each item is a button showing an emoji icon placeholder + product name.
 * A trailing "Other / Custom product" option lets the user pick a free-text
 * name instead. Filtering is handled by the parent (the `products` prop is
 * already filtered by the search query).
 */
export default function ProductPickerGrid({
  products,
  onSelect,
}: ProductPickerGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {products.map((product) => (
        <button
          key={product.id}
          type="button"
          onClick={() => onSelect(product)}
          className="group flex flex-col items-center gap-2 rounded-2xl border border-eco-200 bg-cream-50 p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-eco-400 hover:bg-eco-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 focus-visible:ring-offset-2"
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-eco-50 text-3xl group-hover:bg-eco-100"
            aria-hidden="true"
          >
            {product.emoji}
          </span>
          <span className="text-sm font-semibold text-stone-700">
            {product.name}
          </span>
        </button>
      ))}

      {/* Other / Custom product option */}
      <button
        type="button"
        onClick={() => onSelect({ id: CUSTOM_PRODUCT_ID, name: "Custom" })}
        className="group flex flex-col items-center gap-2 rounded-2xl border border-dashed border-eco-300 bg-cream-50 p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-eco-500 hover:bg-eco-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 focus-visible:ring-offset-2"
      >
        <span
          className="flex h-14 w-14 items-center justify-center rounded-xl bg-eco-50 text-eco-500 group-hover:bg-eco-100"
          aria-hidden="true"
        >
          <PlusIcon />
        </span>
        <span className="text-sm font-semibold text-stone-700">
          Other / Custom product
        </span>
      </button>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}