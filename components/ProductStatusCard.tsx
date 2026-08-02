"use client";

import { getProductIcon } from "@/lib/mockProducts";

/**
 * ProductStatusCard
 * -----------------
 * Displays the current status of the single product tracked in the user's
 * smart container: image, name, expiry, days-until-expiry badge, current
 * weight, fill-level progress bar, and Update/Delete actions.
 *
 * The card is responsive: image and details sit side-by-side on tablet/desktop
 * and stack vertically (image on top) on mobile.
 *
 * The `product` prop matches the backend's product-status response shape so
 * this component can be wired up to a real API call later without changes.
 */

// ---- Types ------------------------------------------------------------------

/** Shape of a product status response from the backend. */
export interface ProductStatus {
  containerId: string;
  currentWeight: number; // e.g. 850 (grams)
  fillPercentage: number; // 0-100
  productName: string; // e.g. "Milk"
  expiryDate: string; // ISO date string, e.g. "2026-08-05T00:00:00"
  daysUntilExpiry: number; // e.g. 3
  isEmpty: boolean;
  isExpiringSoon: boolean;
  isExpired: boolean;
}

interface ProductStatusCardProps {
  product: ProductStatus;
  onUpdate?: (product: ProductStatus) => void;
  onDelete?: (product: ProductStatus) => void;
}

// ---- Helpers ----------------------------------------------------------------

/** Format an ISO date string as e.g. "Aug 5, 2026". */
function formatExpiryDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type ExpiryTone = "good" | "soon" | "expired";

function expiryTone(product: ProductStatus): ExpiryTone {
  if (product.isExpired) return "expired";
  if (product.isExpiringSoon) return "soon";
  return "good";
}

const expiryBadgeStyles: Record<ExpiryTone, string> = {
  good: "bg-eco-100 text-eco-800",
  soon: "bg-amber-100 text-amber-800",
  expired: "bg-red-100 text-red-800",
};

function expiryBadgeLabel(product: ProductStatus): string {
  if (product.isExpired) {
    const days = Math.abs(product.daysUntilExpiry);
    return days === 1 ? "Expired 1 day ago" : `Expired ${days} days ago`;
  }
  if (product.daysUntilExpiry === 0) return "Expires today";
  if (product.daysUntilExpiry === 1) return "Expires tomorrow";
  if (product.isExpiringSoon) {
    return `Expires in ${product.daysUntilExpiry} days`;
  }
  return `${product.daysUntilExpiry} days left`;
}

type FillTone = "full" | "low" | "empty";

function fillTone(product: ProductStatus): FillTone {
  if (product.isEmpty || product.fillPercentage <= 5) return "empty";
  if (product.fillPercentage <= 25) return "low";
  return "full";
}

const fillBarStyles: Record<FillTone, string> = {
  full: "bg-eco-500",
  low: "bg-amber-500",
  empty: "bg-red-500",
};

const fillTextStyles: Record<FillTone, string> = {
  full: "text-eco-700",
  low: "text-amber-700",
  empty: "text-red-700",
};

// ---- Component --------------------------------------------------------------

export default function ProductStatusCard({
  product,
  onUpdate,
  onDelete,
}: ProductStatusCardProps) {
  const expiry = expiryTone(product);
  const fill = fillTone(product);
  const clampedFill = Math.max(0, Math.min(100, product.fillPercentage));

  return (
    <article className="rounded-2xl border border-eco-200 bg-cream-50 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
        {/* Product image placeholder (visual anchor) */}
        <div className="flex shrink-0 justify-center sm:justify-start">
          <div
            className="flex aspect-square w-full max-w-[14rem] items-center justify-center rounded-2xl border border-eco-200 bg-gradient-to-br from-eco-100 to-eco-200 sm:w-48"
            aria-label={`${product.productName} product image`}
            role="img"
          >
            <span className="text-6xl" aria-hidden="true">
              {getProductIcon(product.productName)}
            </span>
          </div>
        </div>

        {/* Product details */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-stone-800 sm:text-3xl">
              {product.productName}
            </h2>
            <p className="text-sm text-stone-500">
              Expires: {formatExpiryDate(product.expiryDate)}
            </p>
          </div>

          {/* Days-until-expiry badge */}
          <div className="mt-3">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${expiryBadgeStyles[expiry]}`}
            >
              {expiryBadgeLabel(product)}
            </span>
          </div>

          {/* Current weight */}
          <dl className="mt-4 flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-sm font-medium text-stone-600">
                Current weight
              </dt>
              <dd className="text-base font-semibold text-stone-800">
                {product.currentWeight}g
              </dd>
            </div>

            {/* Fill percentage progress bar */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-sm font-medium text-stone-600">
                  Fill level
                </dt>
                <dd
                  className={`text-sm font-semibold ${fillTextStyles[fill]}`}
                >
                  {clampedFill}%
                </dd>
              </div>
              <div
                className="h-2.5 w-full overflow-hidden rounded-full bg-eco-100"
                role="progressbar"
                aria-valuenow={clampedFill}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Container fill level"
              >
                <div
                  className={`h-full rounded-full transition-all ${fillBarStyles[fill]}`}
                  style={{ width: `${clampedFill}%` }}
                />
              </div>
            </div>
          </dl>

          {/* Action buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                console.log("update clicked");
                onUpdate?.(product);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-eco-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-eco-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 focus-visible:ring-offset-2"
            >
              <EditIcon />
              Update
            </button>
            <button
              type="button"
              onClick={() => {
                console.log("delete clicked");
                onDelete?.(product);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-300 bg-white px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2"
            >
              <TrashIcon />
              Delete
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

// ---- Icons ------------------------------------------------------------------

function EditIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}