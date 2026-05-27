/**
 * InfoBannerLandingDescoped.tsx — Info banner for landing pública deferred scope.
 *
 * Explains to the clinic admin that the public landing page editor (landing pública)
 * is not yet available in this release. The publicLandingUrl field from the API
 * is displayed as read-only for informational purposes.
 *
 * Spanish neutro LatAm — no voseo.
 *
 * T-7 vitalia-fase2-lisa-marca
 * spec_anchor: 06-tickets.yaml T-7 + mockups/presencia-section.html § info-banner
 * downstream-regression-na: brand-local vitalia FE component; no cross-brand consumers
 */

import { cn } from "@/lib/utils";

export interface InfoBannerLandingDescopedProps {
  /** Read-only landing URL from API, or null if not set. */
  publicLandingUrl?: string | null;
  className?: string;
}

/**
 * InfoBannerLandingDescoped — renders a subtle info callout explaining the landing
 * editor is deferred to a future story. Shows the current URL if available.
 */
export function InfoBannerLandingDescoped({
  publicLandingUrl,
  className,
}: InfoBannerLandingDescopedProps) {
  return (
    <div
      role="note"
      aria-label="Información sobre la landing pública"
      className={cn(
        "flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3",
        "dark:border-blue-800 dark:bg-blue-950/30",
        className,
      )}
    >
      {/* Icon */}
      <svg
        aria-hidden="true"
        className="mt-0.5 h-4 w-4 shrink-0 text-blue-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>

      {/* Content */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
          Editor de landing pública — próximamente
        </p>
        <p className="text-xs text-blue-700 dark:text-blue-400">
          El editor visual de la landing pública estará disponible en una próxima versión.
          {publicLandingUrl ? (
            <>
              {" "}Tu URL actual es:{" "}
              <a
                href={publicLandingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-blue-900 dark:hover:text-blue-200"
              >
                {publicLandingUrl}
              </a>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}

InfoBannerLandingDescoped.displayName = "InfoBannerLandingDescoped";
