// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-2
/**
 * LogoMark — brand logo atom for Nicolify TopBar.
 * nicolify-r0-shell T-2 — port from vitalia LogoMark.tsx, re-themed to Nicolify.
 *
 * Server Component (no "use client").
 * Renders a Next.js <Image> pair for CSS-based dark mode swap (SSR-safe).
 * No useEffect / no JS viewport detection.
 *
 * Variants:
 *   full — horizontal logotype (3:1 aspect), light + dark SVGs from /nico-assets/logotipo/
 *   mark — square isotipo (1:1 aspect), single SVG from /nico-assets/isotipo/
 *
 * Sizes: sm (24px height) | md (32px height, default) | lg (40px height)
 * Width is auto-derived from aspect ratio to preserve image shape.
 *
 * Accessibility: <a> wrapper carries aria-label="Nicolify inicio";
 *   images are decorative (alt="").
 *
 * Assets location: public/nico-assets/logotipo/ + public/nico-assets/isotipo/
 *   These were copied to public/nico-assets/ from the nico-assets worktree.
 *
 * Named export (no default export) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell atom; no cross-brand consumers
 */

import Image from "next/image";
import Link from "next/link";

export type LogoMarkSize = "sm" | "md" | "lg";
export type LogoMarkVariant = "full" | "mark";

export interface LogoMarkProps {
  /** Size variant controls height; width is auto from aspect ratio */
  size?: LogoMarkSize;
  /** full = horizontal logotype, mark = square isotipo */
  variant?: LogoMarkVariant;
  /** Additional CSS classes for the wrapper <a> */
  className?: string;
}

/** Height in px per size variant */
const heights: Record<LogoMarkSize, number> = {
  sm: 24,
  md: 32,
  lg: 40,
};

/** Approximate aspect ratio (width / height) per logo variant */
const aspectRatios: Record<LogoMarkVariant, number> = {
  full: 3,
  mark: 1,
};

/** Source paths per variant and mode — using existing nico-assets files */
const assetSrc = {
  full: {
    light: "/nico-assets/logotipo/logotipo-fondoclaro-nicolify.svg",
    dark: "/nico-assets/logotipo/logotipo-fondooscuro-nicolify.svg",
  },
  mark: {
    light: "/nico-assets/isotipo/isotipo-nicolify.svg",
    dark: "/nico-assets/isotipo/isotipo-nicolify.svg", // same SVG for both modes
  },
} as const;

/**
 * LogoMark — brand logo atom for Nicolify.
 * Server Component: no state, no effects, pure markup.
 */
export function LogoMark({ size = "md", variant = "full", className }: LogoMarkProps) {
  const h = heights[size];
  const w = Math.round(h * aspectRatios[variant]);
  const lightSrc = assetSrc[variant].light;
  const darkSrc = assetSrc[variant].dark;
  const sameSrc = lightSrc === darkSrc;

  return (
    <Link href="/" aria-label="Nicolify inicio" className={className} data-testid="logo-mark">
      {sameSrc ? (
        // mark variant: single image (same SVG for both modes)
        <Image
          src={lightSrc}
          alt=""
          height={h}
          width={w}
          priority
          draggable={false}
          data-testid="logo-mark-img"
        />
      ) : (
        // full variant: two images, CSS dark mode swap
        <>
          {/* Light mode image — hidden when dark */}
          <Image
            src={lightSrc}
            alt=""
            height={h}
            width={w}
            priority
            draggable={false}
            className="block dark:hidden"
            data-testid="logo-mark-light"
          />
          {/* Dark mode image — hidden when light */}
          <Image
            src={darkSrc}
            alt=""
            height={h}
            width={w}
            priority
            draggable={false}
            className="hidden dark:block"
            data-testid="logo-mark-dark"
          />
        </>
      )}
    </Link>
  );
}
