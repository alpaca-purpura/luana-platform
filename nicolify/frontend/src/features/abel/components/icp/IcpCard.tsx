// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-3
/**
 * IcpCard.tsx — Card for a single ICP in the master list view.
 *
 * Displays: icono + nombre + vertical + estado + #buyers.
 * NO completeness ring (RN-8: the barra de completitud was removed from the spec;
 * the mockup CSS .ring is RESIDUAL — do NOT implement it).
 *
 * Status badges:
 *   - borrador → badge muted (gray)
 *   - listo    → badge success (green)
 *
 * Clicking the card navigates to /{tenantId}/abel/icp/{icpId} (→ redirects to /datos).
 * Navigation via Link (Next.js) — NOT <a> tag.
 *
 * G3 JIT-safe: agent-abel color via agentBgClass() from _agent-tw-classes.ts.
 * NEVER template literals in class strings.
 *
 * Named export (NO default) per FSD-Lite enforce.
 * spec_anchor: 03-arch-fe.md §7 Estados visuales → lista (≥1 ICP)
 * validators_gate: RN-8 (NO completeness ring)
 */

import Link from "next/link";
import { useParams } from "next/navigation";

import { Badge, Stack } from "@luana/ui-kit";
import { agentBgClass } from "@/components/shared/shell-organism/_agent-tw-classes";
import { cn } from "@/lib/utils";

import type { IcpListItem, IcpStatus } from "../../types/icp";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IcpCardProps {
  icp: IcpListItem;
  className?: string;
}

// ── Status helpers ────────────────────────────────────────────────────────────

function getStatusLabel(status: IcpStatus): string {
  switch (status) {
    case "listo":
      return "Listo";
    case "borrador":
      return "Borrador";
    default:
      return status;
  }
}

function getStatusVariant(status: IcpStatus): "default" | "secondary" | "outline" {
  switch (status) {
    case "listo":
      return "default";
    case "borrador":
      return "secondary";
    default:
      return "outline";
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getBuyerCountLabel(count: number): string {
  if (count === 0) return "Sin buyers";
  if (count === 1) return "1 buyer";
  return `${count} buyers`;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * IcpCard — single ICP card for the master list grid.
 *
 * Contains:
 *   - Agent-abel colored avatar with 🎯 icon
 *   - ICP label (truncated)
 *   - Vertical segment (if set)
 *   - Status badge (borrador | listo)
 *   - Buyer count
 *
 * NO completeness ring per RN-8 (spec overrides mockup CSS residual .ring).
 */
export function IcpCard({ icp, className }: IcpCardProps) {
  const params = useParams<{ tenantId?: string }>();
  const tenantId = params.tenantId ?? "";
  const href = `/${tenantId}/abel/icp/${icp.id}`;

  // G3 JIT-safe: agent-abel bg via static lookup (no template literals)
  const agentBg = agentBgClass("abel");

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col gap-3 p-4 rounded-xl border border-border/60 bg-card",
        "hover:border-agent-abel/40 hover:shadow-sm transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className,
      )}
      aria-label={`Perfil de cliente: ${icp.label}, estado: ${getStatusLabel(icp.status)}`}
      data-testid={`icp-card-${icp.id}`}
    >
      {/* Header: icon + status badge */}
      <div className="flex items-start justify-between gap-2">
        {/* Agent-abel colored icon — G3 JIT-safe */}
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0",
            agentBg,
            "text-white",
          )}
          aria-hidden="true"
        >
          🎯
        </div>

        {/* Status badge — NO completeness ring (RN-8) */}
        <Badge
          variant={getStatusVariant(icp.status)}
          className="text-xs flex-shrink-0"
          data-testid={`icp-card-status-${icp.id}`}
        >
          {getStatusLabel(icp.status)}
        </Badge>
      </div>

      {/* Label */}
      <Stack gap={1} className="min-w-0">
        <h3
          className="text-sm font-semibold text-foreground truncate group-hover:text-agent-abel transition-colors"
          title={icp.label}
        >
          {icp.label}
        </h3>

        {/* Vertical segment (optional) */}
        {icp.vertical && (
          <p className="text-xs text-muted-foreground truncate" title={icp.vertical}>
            {icp.vertical}
          </p>
        )}
      </Stack>

      {/* Footer: buyer count */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-auto">
        <span aria-hidden="true">👤</span>
        <span>{getBuyerCountLabel(icp.buyerCount)}</span>
      </div>
    </Link>
  );
}
