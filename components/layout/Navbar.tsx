"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Persistent top navigation bar shown on all authenticated pages.
 *
 * Left: SmartKitchen wordmark (leaf icon + text) → /dashboard
 * Right: profile avatar button → dropdown with "Log out"
 *
 * The dropdown closes on outside click or Escape. Logging out clears the
 * auth data stored in localStorage by the login flow and redirects to /login.
 */

// ---- localStorage-backed username (avoids setState-in-effect) -------------

const STORAGE_KEY = "username";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getClientUsername() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function getServerUsername() {
  return "";
}

function deriveInitials(username: string) {
  const parts = username.trim().split(/[\s_.-]+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Navbar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Read the stored username (saved at login) to derive avatar initials.
  // useSyncExternalStore keeps this in sync with the `storage` event and
  // avoids hydration mismatches by returning "" on the server.
  const username = useSyncExternalStore(
    subscribe,
    getClientUsername,
    getServerUsername
  );
  const initials = deriveInitials(username);

  // Close the dropdown when clicking outside of it.
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close the dropdown on Escape.
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  function handleLogout() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("username");
      localStorage.removeItem("userID");
    } catch {
      // localStorage may be unavailable; ignore.
    }
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-eco-200 bg-cream-50/95 backdrop-blur">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand / wordmark */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 focus-visible:ring-offset-2"
          aria-label="SmartKitchen home"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-eco-600 text-white shadow-sm"
            aria-hidden="true"
          >
            <LeafIcon />
          </span>
          <span className="text-lg font-bold tracking-tight text-eco-800">
            SmartKitchen
          </span>
        </Link>

        {/* Profile + logout dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label="Account menu"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-eco-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-eco-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-eco-400 focus-visible:ring-offset-2"
          >
            {initials}
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-eco-200 bg-cream-50 py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-stone-700 transition-colors hover:bg-eco-50 focus:outline-none focus-visible:bg-eco-50"
              >
                <LogoutIcon />
                Log out
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

function LeafIcon() {
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
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6" />
    </svg>
  );
}

function LogoutIcon() {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}