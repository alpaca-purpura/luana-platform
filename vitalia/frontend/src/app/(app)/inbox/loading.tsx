/**
 * loading.tsx — Next.js App Router loading boundary for /inbox route.
 *
 * Renders as a skeleton shell while the inbox page is streaming/loading.
 * Per tessl__react-patterns: loading states on every async UI are mandatory.
 * Server Component (no "use client" required — no interactivity).
 *
 * downstream-regression-na: brand-local FE route boundary; no cross-brand consumers
 */

/**
 * InboxLoading — route-level loading skeleton for /inbox.
 * Mirrors the 3-column InboxLayout shell (list | thread | sidebar).
 */
export default function InboxLoading() {
  return (
    <div
      className="flex h-full w-full overflow-hidden"
      aria-busy="true"
      aria-label="Cargando inbox…"
      data-testid="inbox-loading"
    >
      {/* Left pane — conversation list skeleton (320px) */}
      <div className="flex w-80 shrink-0 flex-col border-r vt-border vt-bg-surface">
        {/* Search bar skeleton */}
        <div className="shrink-0 border-b vt-border px-3 py-2">
          <div className="h-8 w-full animate-pulse rounded-lg vt-bg-muted" />
        </div>
        {/* Filter chips skeleton */}
        <div className="flex shrink-0 gap-2 border-b vt-border px-3 py-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-16 animate-pulse rounded-full vt-bg-muted" />
          ))}
        </div>
        {/* Conversation item skeletons */}
        <div className="flex-1 divide-y vt-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-pulse rounded vt-bg-muted" />
                <div className="h-3 flex-1 animate-pulse rounded vt-bg-muted" />
                <div className="h-3 w-8 animate-pulse rounded vt-bg-muted" />
              </div>
              <div className="ml-6 h-3 w-3/4 animate-pulse rounded vt-bg-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Center pane — thread skeleton (flex-1) */}
      <div className="flex flex-1 flex-col overflow-hidden vt-bg-surface">
        {/* Thread header skeleton */}
        <div className="shrink-0 border-b vt-border px-4 py-3">
          <div className="mb-2 h-8 w-48 animate-pulse rounded-lg vt-bg-muted" />
          <div className="h-8 w-64 animate-pulse rounded-lg vt-bg-muted" />
        </div>
        {/* Messages skeleton */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {[
            "w-3/4",
            "w-1/2 ml-auto",
            "w-2/3",
            "w-1/3 ml-auto",
            "w-3/5",
          ].map((width, i) => (
            <div
              key={i}
              className={`h-10 animate-pulse rounded-xl vt-bg-muted ${width}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {/* Right pane — contact sidebar skeleton (280px) */}
      <div className="flex w-70 shrink-0 flex-col border-l vt-border vt-bg-surface px-4 pt-4">
        <div className="mb-3 h-3 w-20 animate-pulse rounded vt-bg-muted" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-1">
              <div className="h-2 w-12 animate-pulse rounded vt-bg-muted" />
              <div className="h-4 w-32 animate-pulse rounded vt-bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
