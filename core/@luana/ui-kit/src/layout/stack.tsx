// cap: platform.micro-layout-primitive-platform
// canon: design-system-canon.md §2.7 · story-origin: core-ds-foundation · HB-111
//
// Stack + Grid — micro-layout primitives (component-internal).
// Distinct from the PAGE-level layout (PageContainer/PageContentStack gap-6):
// these compose card label stacks, dialog empty-states, FieldRow label+control
// stacks and 2/3-col field grids — semantics where the page primitives misfit.
//
// JIT-safe: classes come from STATIC `as const` lookup maps (NEVER template
// literals like `gap-${n}` — Tailwind JIT can't see those). `cn` (tailwind-merge)
// lets a consumer override via className (e.g. <Stack gap={1} className="min-w-0">).
import * as React from "react";

import { cn } from "@luana/format/utils";

// ── Token-based class maps (spacing scale = design tokens) ───────────────────

const GAP = {
  0: "gap-0",
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  5: "gap-5",
  6: "gap-6",
  8: "gap-8",
} as const;

const DIRECTION = {
  col: "flex-col",
  row: "flex-row",
} as const;

const ALIGN = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
} as const;

const JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
} as const;

const COLS = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
} as const;

// ── Stack ────────────────────────────────────────────────────────────────────

export type StackGap = keyof typeof GAP;
export type StackDirection = keyof typeof DIRECTION;
export type StackAlign = keyof typeof ALIGN;
export type StackJustify = keyof typeof JUSTIFY;

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Eje principal del flex. Default `"col"` → `flex-col`. */
  direction?: StackDirection;
  /** Separación entre hijos (escala de spacing). Default `2` → `gap-2`. */
  gap?: StackGap;
  /** Alineación cruzada (`items-*`). Omitido → sin clase. */
  align?: StackAlign;
  /** Distribución en el eje principal (`justify-*`). Omitido → sin clase. */
  justify?: StackJustify;
}

/** Stack flex genérico para micro-layout interno de componentes. */
export function Stack({
  direction = "col",
  gap = 2,
  align,
  justify,
  className,
  children,
  ...props
}: StackProps) {
  return (
    <div
      className={cn(
        "flex",
        DIRECTION[direction],
        GAP[gap],
        align ? ALIGN[align] : undefined,
        justify ? JUSTIFY[justify] : undefined,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

Stack.displayName = "Stack";

// ── Grid ───────────────────────────────────────────────────────────────────

export type GridCols = keyof typeof COLS;
export type GridGap = keyof typeof GAP;

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Número de columnas (`grid-cols-*`). Default `1`. */
  cols?: GridCols;
  /** Separación entre celdas (escala de spacing). Default `3` → `gap-3`. */
  gap?: GridGap;
}

/** Grid genérico para micro-layout interno de componentes. */
export function Grid({ cols = 1, gap = 3, className, children, ...props }: GridProps) {
  return (
    <div className={cn("grid", COLS[cols], GAP[gap], className)} {...props}>
      {children}
    </div>
  );
}

Grid.displayName = "Grid";
