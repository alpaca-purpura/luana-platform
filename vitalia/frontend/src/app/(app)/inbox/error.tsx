"use client";

/**
 * error.tsx — Next.js App Router error boundary for /inbox route.
 *
 * Renders when an unhandled error occurs in the inbox page or its children.
 * Per tessl__react-patterns: error boundaries at route level are mandatory.
 * Per Next.js App Router: error.tsx MUST be a Client Component ("use client").
 *
 * downstream-regression-na: brand-local FE route boundary; no cross-brand consumers
 */

import { useEffect } from "react";
import { INBOX_COPY } from "@/features/inbox";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * InboxError — route-level error boundary for /inbox.
 * Shows friendly error message with retry CTA.
 */
export default function InboxError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log to observability — non-PHI (only error message + digest)
    console.error("[inbox] route error:", error.digest ?? error.message);
  }, [error]);

  return (
    <div
      className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center"
      role="alert"
      aria-live="assertive"
    >
      <p className="text-sm font-medium vt-text-foreground">
        {INBOX_COPY.errors.generic}
      </p>
      <button
        onClick={reset}
        className={
          "inline-flex items-center rounded-md px-4 py-2 text-sm font-medium " +
          "vt-bg-primary vt-text-on-primary hover:opacity-90 transition-opacity " +
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--vitalia-cian)]"
        }
      >
        {INBOX_COPY.errors.retry}
      </button>
    </div>
  );
}
