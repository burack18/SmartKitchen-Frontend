"use client";

import { useState, type FormEvent } from "react";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

interface ProductDetailsFormProps {
  /** Selected product name (read-only when picked from the catalog). */
  initialName: string;
  /** Whether the name field is editable (true for the "Custom" option). */
  isCustom: boolean;
  /** Name of the currently active product, if one exists (for override warning). */
  activeProductName?: string | null;
  /** Whether the submit request is in flight. */
  loading?: boolean;
  /** Inline error message to display (from a failed submit). */
  formError?: string;
  onBack: () => void;
  onConfirm: (payload: { name: string; expiryDate: string }) => void;
}

/**
 * ProductDetailsForm
 * ------------------
 * Step 2 of the "Add Product" flow. Shows the selected product name at the
 * top (read-only unless a custom product was chosen), a required expiry-date
 * picker, a "Back" button to return to Step 1, and a confirm button.
 *
 * If `activeProductName` is provided, an amber warning banner is shown above
 * the confirm button and its label becomes "Replace & Add Product".
 *
 * On confirm it calls `onConfirm` with `{ name, expiryDate }` where
 * `expiryDate` is an ISO string (the native date input value `YYYY-MM-DD` is
 * normalized to an ISO datetime at midnight).
 */
export default function ProductDetailsForm({
  initialName,
  isCustom,
  activeProductName,
  loading = false,
  formError,
  onBack,
  onConfirm,
}: ProductDetailsFormProps) {
  const [name, setName] = useState(initialName);
  const [expiryDate, setExpiryDate] = useState("");
  const [errors, setErrors] = useState<{ name?: string; expiryDate?: string }>(
    {}
  );

  const hasActiveProduct = Boolean(activeProductName);

  function validate() {
    const next: { name?: string; expiryDate?: string } = {};
    if (isCustom && !name.trim()) next.name = "Product name is required.";
    if (!expiryDate) next.expiryDate = "Expiry date is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;
    // Normalize the native date input value (YYYY-MM-DD) to an ISO datetime
    // string at midnight, matching the backend's expected format.
    const iso = new Date(`${expiryDate}T00:00:00`).toISOString();
    onConfirm({ name: name.trim(), expiryDate: iso });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
      {isCustom ? (
        <Input
          label="Product name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="e.g. Almond milk"
          autoFocus
          disabled={loading}
        />
      ) : (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-700">
            Product name
          </span>
          <div className="rounded-xl border border-eco-200 bg-eco-50 px-4 py-3 text-base font-semibold text-stone-800">
            {initialName}
          </div>
        </div>
      )}

      <Input
        label="Expiry date"
        name="expiryDate"
        type="date"
        value={expiryDate}
        onChange={(e) => setExpiryDate(e.target.value)}
        error={errors.expiryDate}
        required
        disabled={loading}
      />

      {hasActiveProduct && (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <WarningIcon />
          <p>
            You already have an active product:{" "}
            <span className="font-semibold">{activeProductName}</span>. Adding
            a new product will replace it.
          </p>
        </div>
      )}

      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <Button type="submit" loading={loading}>
          {hasActiveProduct ? "Replace & Add Product" : "Confirm / Add Product"}
        </Button>
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cream-50 px-5 py-3 text-base font-semibold text-eco-700 border border-eco-200 transition-colors hover:bg-eco-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Back
        </button>
      </div>
    </form>
  );
}

function WarningIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}