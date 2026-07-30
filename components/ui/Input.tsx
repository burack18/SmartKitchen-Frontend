import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function Input({
  label,
  error,
  id,
  className = "",
  ...rest
}: InputProps) {
  const inputId = id || rest.name;
  const hasError = Boolean(error);

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-stone-700"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-xl border bg-white px-4 py-3 text-base text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-400 ${
          hasError
            ? "border-red-400 focus:ring-red-400"
            : "border-stone-200 hover:border-stone-300"
        } ${className}`}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${inputId}-error` : undefined}
        {...rest}
      />
      {hasError && (
        <p id={`${inputId}-error`} className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}