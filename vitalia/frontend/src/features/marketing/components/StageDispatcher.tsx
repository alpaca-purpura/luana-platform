/**
 * StageDispatcher — renders the correct stage section content based on active URL tab.
 *
 * Dispatches based on ?tab= nuqs URL param (RecommendationStage).
 * Each stage section is a Server/Client composition placeholder for T-mk-fe-3..5 content.
 *
 * T-mk-fe-3: LucasStageRecommendationsCard (for all tabs)
 * T-mk-fe-4: ChannelBreakdownRow (attraction only)
 * T-mk-fe-5: AttributionMatrixWidget (reservation only), ReferralsWidget (expansion only)
 *
 * Per 02-design-ui.md:
 *   - AttributionMatrix ONLY on reservation tab
 *   - ReferralsWidget ONLY on expansion tab
 *
 * downstream-regression-na: brand-local FE component; no cross-brand consumers
 */
"use client";

import { cn } from "@/lib/cn";
import type { RecommendationStage } from "../types/lucas-recommendation";
import { MARKETING_COPY } from "../copy";
import { LucasStageRecommendationsCard } from "./LucasStageRecommendationsCard";

export type StageDispatcherProps = {
  activeTab: RecommendationStage;
  className?: string;
};

const STAGE_LABELS: Record<RecommendationStage, string> = {
  attraction: MARKETING_COPY.stages.attraction,
  qualification: MARKETING_COPY.stages.qualification,
  reservation: MARKETING_COPY.stages.reservation,
  adoption: MARKETING_COPY.stages.adoption,
  expansion: MARKETING_COPY.stages.expansion,
};

/**
 * Stage section placeholder — T-mk-fe-3..5 will fill these with real content.
 * Each panel is identified by its aria-labelledby pointing to the tab button.
 */
function StagePlaceholder({ stage }: { stage: RecommendationStage }) {
  return (
    <section
      role="tabpanel"
      id={`stage-panel-${stage}`}
      aria-labelledby={`stage-tab-${stage}`}
      className="flex flex-col gap-4"
    >
      {/* T-mk-fe-3: LucasStageRecommendationsCard — real implementation */}
      <div data-slot="lucas-recommendations">
        <LucasStageRecommendationsCard stage={stage} />
      </div>

      {/* Attraction tab: channel breakdown rows slot (T-mk-fe-4) */}
      {stage === "attraction" && (
        <div
          data-slot="channel-breakdown"
          className="rounded-lg vt-bg-surface vt-border border overflow-hidden"
          aria-label="Canales de atracción"
        >
          <div className="px-4 py-3 border-b vt-border-soft text-xs font-semibold vt-text">
            {MARKETING_COPY.channels.title}
          </div>
          <div
            className="p-4 text-xs vt-text-muted italic"
            aria-label="Canal breakdown (T-mk-fe-4)"
          >
            {/* T-mk-fe-4 fills this slot with ChannelBreakdownRow components */}
            {MARKETING_COPY.channels.loadingMessage}
          </div>
        </div>
      )}

      {/* Reservation tab: attribution matrix slot (T-mk-fe-5) */}
      {stage === "reservation" && (
        <div
          data-slot="attribution-matrix"
          className="rounded-lg vt-bg-surface vt-border border p-4"
          aria-label="Matriz de atribución"
        >
          <div className="text-xs font-semibold vt-text mb-2">
            {MARKETING_COPY.attribution.title}
          </div>
          <div className="text-xs vt-text-muted italic">
            {/* T-mk-fe-5 fills this slot with AttributionMatrixWidget */}
            {MARKETING_COPY.attribution.loadingMessage}
          </div>
        </div>
      )}

      {/* Expansion tab: referrals widget slot (T-mk-fe-5) */}
      {stage === "expansion" && (
        <div
          data-slot="referrals-widget"
          className="rounded-lg vt-bg-surface vt-border border p-4"
          aria-label="Referidos"
        >
          <div className="text-xs font-semibold vt-text mb-2">
            {MARKETING_COPY.referrals.title}
          </div>
          <div className="text-xs vt-text-muted italic">
            {/* T-mk-fe-5 fills this slot with ReferralsWidget */}
            {MARKETING_COPY.referrals.loadingMessage}
          </div>
        </div>
      )}
    </section>
  );
}

export function StageDispatcher({ activeTab, className }: StageDispatcherProps) {
  return (
    <div
      className={cn(
        "flex-1 overflow-auto vt-bg-surface-alt p-4",
        className,
      )}
    >
      <StagePlaceholder stage={activeTab} />
    </div>
  );
}

StageDispatcher.displayName = "StageDispatcher";
