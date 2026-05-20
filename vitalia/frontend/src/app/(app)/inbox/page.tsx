/**
 * /inbox page — RSC entry point (Server Component).
 *
 * Pure Server Component: no state, no effects, no event handlers.
 * Delegates all interactivity to InboxPageClient ("use client").
 *
 * Auth: Clerk auth() resolves server-side. If unauthenticated,
 * middleware redirects to /sign-in before this page renders.
 *
 * Layout: (app)/layout.tsx provides AppShell + Sidebar + TopBar.
 *
 * Per 03-arch-fe.md § 2: RSC entry resolves layout shell.
 * Client component owns nuqs state + data fetching.
 *
 * downstream-regression-na: brand-local FE page; no cross-brand consumers
 */

import { type Metadata } from "next";

import { InboxPageClient } from "@/features/inbox";

export const metadata: Metadata = {
  title: "Inbox — Vitalia",
  description: "Conversaciones con pacientes — Adrián co-piloto IA",
};

/** Force dynamic rendering — requires auth context + tenant context per request */
export const dynamic = "force-dynamic";

/**
 * InboxPage — Server Component wrapper for /inbox route.
 * Thin shell: renders InboxPageClient with nuqs + Zustand + React Query.
 */
export default function InboxPage() {
  return <InboxPageClient />;
}
