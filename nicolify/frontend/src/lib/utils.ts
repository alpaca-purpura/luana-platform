// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-2
/**
 * utils.ts — shared utility functions for nicolify frontend.
 *
 * cn(): Tailwind class merger utility (clsx + tailwind-merge).
 * Server Component safe: pure function, no side effects.
 *
 * Named export (no default export) per FSD-Lite enforce.
 * downstream-regression-na: brand-local util; no cross-brand consumers
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class strings, resolving conflicts via tailwind-merge.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
