import type { ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Shared warm, kitchen-themed card layout for the auth screens.
 * Centered card on tablet/desktop, full-width on mobile.
 */
export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-eco-50 via-eco-100 to-eco-200 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center gap-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-terracotta-500 text-2xl shadow-sm">
            <span aria-hidden="true">🍳</span>
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-eco-700">
            SmartKitchen
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-eco-200 bg-cream-50 p-6 shadow-sm sm:p-8">
          <header className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-stone-800 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm text-stone-500">{subtitle}</p>
          </header>

          {children}
        </div>

        {/* Footer (link to the other auth screen) */}
        <p className="mt-6 text-center text-sm text-stone-600">{footer}</p>
      </div>
    </div>
  );
}