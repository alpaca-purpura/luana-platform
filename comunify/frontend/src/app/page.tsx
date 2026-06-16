// cap: comunify-shell-organism
/**
 * Root page — T-shell (2026-06-15).
 *
 * Clerk proxy (proxy.ts) redirects authenticated users from / to /sign-in
 * (unauthenticated) or the tenant deep-link (authenticated via /:tenantId redirect).
 * This page is a fallback for edge cases where proxy hasn't fired.
 *
 * No metadata export with "use client" — pure Server Component.
 * Previous static landing retired: T-shell replaces (dashboard) with shell-organism.
 */

import { redirect } from "next/navigation";

/**
 * Root fallback — Clerk proxy handles auth redirect.
 * This redirect covers edge cases (pre-rendered page, no proxy match).
 */
export default function HomePage() {
  // Proxy handles auth redirect; this covers any gap.
  redirect("/sign-in");
}
