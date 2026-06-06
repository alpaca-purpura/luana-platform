// cap: crm.adrian-embudo
// story-origin: vitalia-fase2-adrian-embudo
/**
 * EmbudoMetrics — KPI strip for the board header (D.2 spec).
 * T-FE-2 vitalia-fase2-adrian-embudo
 *
 * Shows: N activos · 🤖 N Adrián · 🙋 N humano · 🔥/❄️ hot/cold · score prom
 *        · ⭐ tasa depósito % · 🧊 N congeladas (link to Recuperar)
 *
 * Server Component: YES — no state, pure display.
 * spec_anchor: 01-spec.md § V1 KPI strip
 *
 * B1 fix (2026-06-04): frozen-kpi-badge uses hard-nav (<a>) instead of Next
 * <Link> to avoid the "Rendered more hooks" hang caused by the shell
 * dynamic({ssr:false}) layout on soft-nav (learning 2026-06-03-next16-softnav).
 */
import { cn } from "@/lib/utils";
import type { BoardKpis } from "../../types/embudo.types";

export interface EmbudoMetricsProps {
  kpis: BoardKpis;
  tenantId: string;
  className?: string;
}

interface KpiChip {
  icon: string;
  label: string;
  value: string | number;
  href?: string;
  colorClass?: string;
}

export function EmbudoMetrics({ kpis, tenantId, className }: EmbudoMetricsProps) {
  const chips: KpiChip[] = [
    { icon: "", label: "activos", value: kpis.totalActive, colorClass: "text-foreground" },
    { icon: "🤖", label: "Adrián", value: kpis.adrianCount, colorClass: "text-[hsl(var(--agent-adrian))]" },
    { icon: "🙋", label: "humano", value: kpis.humanCount, colorClass: "text-emerald-700 dark:text-emerald-400" },
    { icon: "🔥", label: "hot", value: kpis.hotCount, colorClass: "text-red-600 dark:text-red-400" },
    { icon: "❄️", label: "cold", value: kpis.coldCount, colorClass: "text-sky-600 dark:text-sky-400" },
    {
      icon: "⭐",
      label: "depósitos",
      value: `${Math.round(kpis.depositRate * 100)}%`,
      colorClass: "text-amber-700 dark:text-amber-400",
    },
    {
      icon: "🧊",
      label: "congelados",
      value: kpis.frozenCount,
      href: `/${tenantId}/adrian/recuperar`,
      colorClass: "text-sky-700 dark:text-sky-300",
    },
  ];

  return (
    <div
      className={cn("flex flex-wrap items-center gap-3 text-xs", className)}
      aria-label="Indicadores del embudo"
      data-testid="embudo-metrics"
    >
      {chips.map((chip) => {
        const content = (
          <span
            key={chip.label}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted",
              chip.colorClass,
              chip.href && "hover:bg-muted/70 transition-colors",
            )}
          >
            {chip.icon && <span aria-hidden>{chip.icon}</span>}
            <strong className="font-semibold">{chip.value}</strong>
            <span className="text-muted-foreground">{chip.label}</span>
          </span>
        );

        if (chip.href) {
          return (
            // Hard-nav via <a> (not Next <Link>) — intentional: avoids "Rendered more hooks"
            // hang from shell dynamic({ssr:false}) on soft-nav. See learning 2026-06-03-next16-softnav.
            <a
              key={chip.label}
              href={chip.href}
              className="inline-flex"
              aria-label={`${chip.value} leads ${chip.label} — ir a Recuperar`}
              data-testid="frozen-kpi-badge"
            >
              {content}
            </a>
          );
        }

        return (
          <span key={chip.label} className="inline-flex" aria-label={`${chip.value} ${chip.label}`}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
