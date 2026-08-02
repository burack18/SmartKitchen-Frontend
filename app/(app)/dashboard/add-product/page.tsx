"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import ProductDetailsForm from "@/components/ProductDetailsForm";
import ProductPickerGrid from "@/components/ProductPickerGrid";
import {
  ApiError,
  addProduct,
  getContainerStatus,
  type ContainerStatus,
} from "@/lib/api";
import {
  CUSTOM_PRODUCT_ID,
  mockProducts,
  type CatalogProduct,
} from "@/lib/mockProducts";

type Step = 1 | 2 | 3;

type Selection =
  | { kind: "catalog"; product: CatalogProduct }
  | { kind: "custom" };

/**
 * AddProduct
 * ----------
 * Two-step wizard for adding a product to the user's container.
 *
 * On load it calls GET /Container/status to obtain the `containerId` (needed
 * for the POST later) and to detect whether an active product already exists
 * (so Step 2 can show an override warning).
 *
 * Step 1 — Choose a product: search bar + responsive grid of common
 *          fridge/pantry items (with an "Other / Custom product" option).
 * Step 2 — Product details: name (read-only or editable for custom) + a
 *          required expiry date, then confirm. If an active product exists,
 *          an amber warning is shown and the button reads "Replace & Add
 *          Product".
 * Step 3 — Success state.
 *
 * On confirm it calls POST /Product with the real containerId, name, and
 * ISO expiry date. On success it redirects to /dashboard.
 */
export default function AddProductPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Selection | null>(null);
  const [result, setResult] = useState<{ name: string; expiryDate: string } | null>(
    null
  );

  // Container status fetched on mount (provides containerId + active product).
  const [status, setStatus] = useState<ContainerStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState(false);

  // Submit state for POST /Product.
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Initial load on mount. Initial state is already statusLoading=true /
  // statusError=false, so we only set state inside the async callbacks
  // (avoiding synchronous setState in the effect body).
  useEffect(() => {
    let active = true;
    getContainerStatus()
      .then((data) => {
        if (active) setStatus(data);
      })
      .catch(() => {
        if (active) setStatusError(true);
      })
      .finally(() => {
        if (active) setStatusLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Retry handler (user event, so synchronous setState is fine).
  function retryStatus() {
    setStatusLoading(true);
    setStatusError(false);
    getContainerStatus()
      .then(setStatus)
      .catch(() => setStatusError(true))
      .finally(() => setStatusLoading(false));
  }

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mockProducts;
    return mockProducts.filter((p) => p.name.toLowerCase().includes(q));
  }, [query]);

  function handleSelect(
    picked: CatalogProduct | { id: string; name: string }
  ) {
    if (picked.id === CUSTOM_PRODUCT_ID) {
      setSelection({ kind: "custom" });
    } else {
      setSelection({ kind: "catalog", product: picked as CatalogProduct });
    }
    setStep(2);
  }

  async function handleConfirm(payload: {
    name: string;
    expiryDate: string;
  }) {
    if (!status) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await addProduct({
        containerId: status.containerId,
        name: payload.name,
        expiryDate: payload.expiryDate,
      });
      setResult(payload);
      setStep(3);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Something went wrong, please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const selectedName =
    selection?.kind === "catalog" ? selection.product.name : "";
  const activeProductName = status?.productName ?? null;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      {/* Header + step indicator */}
      <header className="mb-6">
        <div className="flex items-center gap-2 text-sm text-stone-500">
          <Link
            href="/dashboard"
            className="font-medium text-eco-700 hover:text-eco-800 hover:underline"
          >
            Dashboard
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-medium text-stone-600">Add product</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-stone-800 sm:text-3xl">
          {step === 3 ? "Product added" : "Add a product"}
        </h1>
        <StepIndicator step={step} />
      </header>

      <div className="rounded-2xl border border-eco-200 bg-cream-50 p-5 shadow-sm sm:p-6">
        {statusLoading && <LoadingState />}

        {!statusLoading && statusError && <ErrorState onRetry={retryStatus} />}

        {!statusLoading && !statusError && step === 1 && (
          <Step1
            query={query}
            onQueryChange={setQuery}
            products={filteredProducts}
            onSelect={handleSelect}
          />
        )}

        {!statusLoading && !statusError && step === 2 && selection && (
          <ProductDetailsForm
            initialName={selectedName}
            isCustom={selection.kind === "custom"}
            activeProductName={activeProductName}
            loading={submitting}
            formError={submitError}
            onBack={() => {
              setSelection(null);
              setStep(1);
            }}
            onConfirm={handleConfirm}
          />
        )}

        {!statusLoading && !statusError && step === 3 && result && (
          <Step3
            result={result}
            onGoToDashboard={() => router.push("/dashboard")}
          />
        )}
      </div>
    </div>
  );
}

// ---- Step 1 -----------------------------------------------------------------

function Step1({
  query,
  onQueryChange,
  products,
  onSelect,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  products: CatalogProduct[];
  onSelect: (product: CatalogProduct | { id: string; name: string }) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="relative">
        <span
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400"
          aria-hidden="true"
        >
          <SearchIcon />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search products..."
          className="w-full rounded-xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-base text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-eco-400"
          aria-label="Search products"
        />
      </div>

      {products.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-500">
          No products match &ldquo;{query}&rdquo;. Try a different search or
          pick &ldquo;Other / Custom product&rdquo;.
        </p>
      ) : (
        <ProductPickerGrid products={products} query={query} onSelect={onSelect} />
      )}
    </div>
  );
}

// ---- Step 3 -----------------------------------------------------------------

function Step3({
  result,
  onGoToDashboard,
}: {
  result: { name: string; expiryDate: string };
  onGoToDashboard: () => void;
}) {
  const formatted = new Date(result.expiryDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-eco-100 text-eco-600"
        aria-hidden="true"
      >
        <CheckIcon />
      </div>
      <div>
        <p className="text-lg font-semibold text-stone-800">
          {result.name} added
        </p>
        <p className="mt-1 text-sm text-stone-500">Expires: {formatted}</p>
      </div>
      <button
        type="button"
        onClick={onGoToDashboard}
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-eco-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-eco-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 focus-visible:ring-offset-2"
      >
        Back to dashboard
      </button>
    </div>
  );
}

// ---- States -----------------------------------------------------------------

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-3 py-10 text-stone-500">
      <Spinner />
      <span className="text-sm">Loading your container…</span>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-sm text-red-600">
        Could not load your container status.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-cream-50 px-5 py-2.5 text-sm font-semibold text-eco-700 border border-eco-200 transition-colors hover:bg-eco-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 focus-visible:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );
}

// ---- Step indicator ---------------------------------------------------------

function StepIndicator({ step }: { step: Step }) {
  const labels = ["Choose", "Details", "Done"];
  return (
    <ol className="mt-3 flex items-center gap-2">
      {labels.map((label, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                done || active
                  ? "bg-eco-600 text-white"
                  : "bg-eco-100 text-eco-700"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {n}
            </span>
            <span
              className={`text-sm font-medium ${
                active ? "text-eco-800" : "text-stone-500"
              }`}
            >
              {label}
            </span>
            {n < labels.length && (
              <span className="mx-1 h-px w-6 bg-eco-200" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ---- Icons ------------------------------------------------------------------

function SearchIcon() {
  return (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-7 w-7"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-eco-500"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}