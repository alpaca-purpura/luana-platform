"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { LadderOffer, OfferLadder } from "../types/ladder.types";
import { calcLadderCompleteness } from "../utils/calc-ladder-completeness";

interface LadderVisualizerProps {
  ladder?: OfferLadder;
  onReorder?: (connections: { from_offer_id: string; to_offer_id: string }[]) => void;
  isLoading?: boolean;
  className?: string;
}

const LEVEL_CONFIG = [
  { key: "level_1" as const, label: "Lead Magnet", color: "border-comunify-blue bg-comunify-primary/10", badge: "Gratis" },
  { key: "level_2" as const, label: "Oferta Core", color: "border-comunify-stable bg-comunify-stable/10", badge: "Principal" },
  { key: "level_3" as const, label: "Upsell", color: "border-comunify-warning bg-comunify-warning/10", badge: "Premium" },
  { key: "level_4" as const, label: "VIP", color: "border-comunify-primary bg-comunify-primary/10", badge: "VIP" },
];

function OfferCard({ offer, level }: { offer: LadderOffer; level: (typeof LEVEL_CONFIG)[number] }) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 p-4 shadow-sm",
        level.color
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {level.label}
        </span>
        <span className="rounded-full border px-2 py-0.5 text-xs">{level.badge}</span>
      </div>
      <p className="font-semibold leading-tight">{offer.title}</p>
      {offer.price !== null && offer.price !== undefined && (
        <p className="mt-1 text-sm font-medium">
          {offer.price === 0 ? "Gratis" : `${offer.currency ?? "$"}${offer.price}`}
        </p>
      )}
    </div>
  );
}

function EmptyLevel({ level }: { level: (typeof LEVEL_CONFIG)[number] }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4",
        "text-muted-foreground"
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-wide">{level.label}</span>
      <span className="mt-1 text-xs">Sin oferta</span>
    </div>
  );
}

/**
 * Page-level client wrapper for the ladder route.
 * TODO T-fe-3 polish post-merge: wire useLadder hook.
 */
export function LadderVisualizerClient() {
  return (
    <div className="flex flex-col gap-6 p-6" data-testid="ladder-visualizer-client">
      <h1 className="text-2xl font-bold">Escalera de valor</h1>
      <LadderVisualizer />
    </div>
  );
}

export function LadderVisualizer({ ladder, onReorder: _onReorder, isLoading, className }: LadderVisualizerProps) {
  const [dragOver, setDragOver] = useState<string | null>(null);
  const completeness = calcLadderCompleteness(ladder);

  if (isLoading) {
    return (
      <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-4", className)} aria-busy="true" aria-label="Cargando escalera">
        {LEVEL_CONFIG.map((l) => (
          <div key={l.key} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)} data-testid="ladder-visualizer">
      {/* Completeness bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                completeness.score >= 80 ? "bg-comunify-stable" : completeness.score >= 40 ? "bg-comunify-warning" : "bg-comunify-critical"
              )}
              style={{ width: `${completeness.score}%` }}
              role="progressbar"
              aria-valuenow={completeness.score}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Completitud de la escalera"
            />
          </div>
        </div>
        <span className="text-sm font-medium">{completeness.score}%</span>
      </div>

      {/* 4-column grid */}
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-4"
        role="list"
        aria-label="Escalera de ofertas"
      >
        {LEVEL_CONFIG.map((level) => {
          const offer = ladder?.[level.key];
          return (
            <div
              key={level.key}
              role="listitem"
              className={cn(
                "transition-opacity",
                dragOver === level.key && "opacity-60"
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(level.key);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => setDragOver(null)}
            >
              {offer ? (
                <OfferCard offer={offer} level={level} />
              ) : (
                <EmptyLevel level={level} />
              )}
            </div>
          );
        })}
      </div>

      {completeness.missingLevels.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Para completar tu escalera, agrega:{" "}
          {completeness.missingLevels.join(", ")}
        </p>
      )}
    </div>
  );
}
