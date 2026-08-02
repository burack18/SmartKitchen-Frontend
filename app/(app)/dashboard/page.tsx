"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import ConfirmDialog from "@/components/ConfirmDialog";
import ProductStatusCard, {
  type ProductStatus,
} from "@/components/ProductStatusCard";
import {
  ApiError,
  deleteProduct,
  getContainerStatus,
  getProductHistory,
  type ContainerStatus,
} from "@/lib/api";

/**
 * Dashboard
 * ---------
 * Landing screen for authenticated users. Fetches the current container
 * status from GET /Container/status on mount and shows either:
 *  - the active product in a ProductStatusCard (when productName is present),
 *  - an empty state with a prominent "Add Product" button (when no product),
 *  - a loading skeleton while fetching,
 *  - or an error state with a retry option.
 *
 * After the initial load, the status is re-fetched every 10 seconds so the
 * weight/fill/expiry info stays current as the ESP32 sends new readings.
 * Polling pauses when the browser tab is hidden and resumes when visible
 * again. Poll failures are silent (only the initial load can show an error).
 *
 * A header "Add Product" button is always shown so users can add/replace a
 * product regardless of state.
 */

const POLL_INTERVAL_MS = 10_000;

type LoadState = "loading" | "success" | "error";

export default function DashboardPage() {
  const [status, setStatus] = useState<ContainerStatus | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  // Active product's id (fetched from product history) — needed for delete.
  const [activeProductId, setActiveProductId] = useState<string | null>(null);

  // Delete confirmation dialog state.
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Manual retry from the error state (a user event, so synchronous setState
  // is fine). Resets to the loading state and re-fetches.
  function handleRetry() {
    setLoadState("loading");
    getContainerStatus()
      .then((data) => {
        setStatus(data);
        setLoadState("success");
      })
      .catch(() => {
        setLoadState("error");
      });
  }

  // When the container has an active product, fetch the product history to
  // get the active product's id (needed for the delete endpoint). This runs
  // whenever the status changes and a product is present.
  useEffect(() => {
    if (!status?.containerId || !status.productName) {
      setActiveProductId(null);
      return;
    }
    let active = true;
    getProductHistory(status.containerId)
      .then((history) => {
        if (!active) return;
        const entry = history.find((p) => p.isActive);
        setActiveProductId(entry?.id ?? null);
      })
      .catch(() => {
        // Non-critical: delete just won't be available if this fails.
        if (active) setActiveProductId(null);
      });
    return () => {
      active = false;
    };
  }, [status?.containerId, status?.productName]);

  // Open the delete confirmation dialog.
  function handleDeleteClick() {
    setDeleteError("");
    setDeleteOpen(true);
  }

  // Confirm delete: call DELETE /Product/{id}, then refresh the status.
  async function handleDeleteConfirm() {
    if (!activeProductId) {
      setDeleteError("Could not identify the product to delete.");
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteProduct(activeProductId);
      setDeleteOpen(false);
      // Refresh the container status so the dashboard shows the empty state.
      getContainerStatus()
        .then((data) => {
          setStatus(data);
          setLoadState("success");
        })
        .catch(() => {
          // Silent: the next poll will retry.
        });
    } catch (err) {
      if (err instanceof ApiError) {
        setDeleteError(err.message);
      } else {
        setDeleteError("Failed to delete product, please try again.");
      }
    } finally {
      setDeleting(false);
    }
  }

  // Initial load + background polling with Page Visibility awareness.
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setInterval> | null;

    function poll() {
      getContainerStatus()
        .then((data) => {
          if (active) {
            setStatus(data);
            setLoadState("success");
          }
        })
        .catch(() => {
          // Silent failure on background polls.
        });
    }

    function startPolling() {
      if (timer) return;
      timer = setInterval(poll, POLL_INTERVAL_MS);
    }

    function stopPolling() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        // Refresh immediately when returning to the tab, then resume polling.
        poll();
        startPolling();
      } else {
        stopPolling();
      }
    }

    // Initial load. Initial state is already "loading", so we only set state
    // inside the async callbacks (avoiding synchronous setState in the effect
    // body, which can trigger cascading renders).
    getContainerStatus()
      .then((data) => {
        if (active) {
          setStatus(data);
          setLoadState("success");
        }
      })
      .catch(() => {
        if (active) setLoadState("error");
      });

    startPolling();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const hasActiveProduct = Boolean(status?.productName);

  // Map the API response (nullable fields) to the card's expected shape,
  // providing safe defaults for the null case (shouldn't render when empty,
  // but keeps the types satisfied).
  const productStatus: ProductStatus | null = status
    ? {
        containerId: status.containerId,
        currentWeight: status.currentWeight ?? 0,
        fillPercentage: status.fillPercentage ?? 0,
        productName: status.productName ?? "",
        expiryDate: status.expiryDate ?? "",
        daysUntilExpiry: status.daysUntilExpiry ?? 0,
        isEmpty: status.isEmpty,
        isExpiringSoon: status.isExpiringSoon,
        isExpired: status.isExpired,
      }
    : null;

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">
            Your container
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {hasActiveProduct
              ? "Here\u2019s the product currently tracked in your smart container."
              : "Track what\u2019s inside your smart container."}
          </p>
        </div>
        <Link
          href="/dashboard/add-product"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-eco-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-eco-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 focus-visible:ring-offset-2"
        >
          <PlusIcon />
          Add Product
        </Link>
      </header>

      {loadState === "loading" && <LoadingSkeleton />}

      {loadState === "error" && <ErrorState onRetry={handleRetry} />}

      {loadState === "success" && hasActiveProduct && productStatus && (
        <ProductStatusCard
          product={productStatus}
          onDelete={handleDeleteClick}
        />
      )}

      {loadState === "success" && !hasActiveProduct && <EmptyState />}

      {/* Delete confirmation modal */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete product"
        description={
          <>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-stone-800">
              {status?.productName}
            </span>
            ? This action cannot be undone.
          </>
        }
        confirmLabel="Delete"
        loading={deleting}
        error={deleteError}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!deleting) setDeleteOpen(false);
        }}
      />
    </div>
  );
}

// ---- States -----------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div
      className="rounded-2xl border border-eco-200 bg-cream-50 p-5 shadow-sm sm:p-6"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch">
        {/* Image placeholder skeleton */}
        <div className="flex shrink-0 justify-center sm:justify-start">
          <div className="aspect-square w-full max-w-[14rem] animate-pulse rounded-2xl bg-eco-100 sm:w-48" />
        </div>
        {/* Details skeleton */}
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-eco-100" />
          <div className="h-4 w-32 animate-pulse rounded-lg bg-eco-100" />
          <div className="mt-2 h-6 w-28 animate-pulse rounded-full bg-eco-100" />
          <div className="mt-2 h-4 w-full max-w-xs animate-pulse rounded-lg bg-eco-100" />
          <div className="h-2.5 w-full animate-pulse rounded-full bg-eco-100" />
          <div className="mt-4 flex gap-3">
            <div className="h-11 w-28 animate-pulse rounded-xl bg-eco-100" />
            <div className="h-11 w-24 animate-pulse rounded-xl bg-eco-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-eco-300 bg-cream-50 p-10 text-center shadow-sm">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl bg-eco-100 text-eco-500"
        aria-hidden="true"
      >
        <EmptyIcon />
      </div>
      <div>
        <p className="text-lg font-semibold text-stone-800">
          No active product yet
        </p>
        <p className="mt-1 text-sm text-stone-500">
          Add a product to start tracking what{"'"}s in your container.
        </p>
      </div>
      <Link
        href="/dashboard/add-product"
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-eco-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-eco-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 focus-visible:ring-offset-2"
      >
        <PlusIcon />
        Add Product
      </Link>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
      <p className="text-sm font-medium text-red-700">
        Could not load your container status.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-eco-700 border border-eco-200 transition-colors hover:bg-eco-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 focus-visible:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );
}

// ---- Icons ------------------------------------------------------------------

function PlusIcon() {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function EmptyIcon() {
  return (
    <svg
      className="h-8 w-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 3h10v3l-1.5 1.5v12a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V7.5L7 6V3Z" />
      <path d="M7 6h10" />
      <path d="M9.5 11h5" />
    </svg>
  );
}