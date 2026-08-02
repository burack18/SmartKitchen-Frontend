import type { ReactNode } from "react";

import Navbar from "@/components/layout/Navbar";

/**
 * Layout for authenticated pages.
 *
 * Everything inside the `(app)` route group is rendered with the persistent
 * Navbar at the top. The route group is omitted from the URL, so pages like
 * `app/(app)/dashboard/page.tsx` are served at `/dashboard` while auth pages
 * (`/login`, `/signup`) stay outside this group and remain navbar-free.
 *
 * Route protection/middleware is intentionally not added here yet.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-eco-50">
      <Navbar />
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}