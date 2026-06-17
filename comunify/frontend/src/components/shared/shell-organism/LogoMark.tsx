// cap: comunify-shell-organism
/**
 * LogoMark — brand logo atom for Comunify TopBar.
 * T-shell — port from nicolify LogoMark.tsx, re-themed to Comunify.
 *
 * Server Component (no "use client").
 * Renders a Next.js <Image> pair for CSS-based dark mode swap (SSR-safe).
 * No useEffect / no JS viewport detection.
 *
 * Variants:
 *   full — horizontal logotype (3:1 aspect), light + dark PNGs from /brand/
 *   mark — square isotipo (1:1 aspect), single PNG from /brand/
 *
 * Sizes: sm (24px height) | md (32px height, default) | lg (40px height)
 *
 * Accessibility: <Link> wrapper carries aria-label="Comunify inicio";
 *   images are decorative (alt="").
 *
 * Assets location: public/brand/
 *   Logo.png (isotipo), Logo_fondo_claro.png (light), Logo_fondo_oscuro.png (dark)
 *   (design-inventory.md: logos real en /brand/ — no nico-assets prefix)
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
  /** Additional CSS classes for the wrapper <Link> */
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

/** Source paths per variant and mode — using comunify /brand/ assets */
const assetSrc = {
  full: {
    light: "/brand/Logo_fondo_claro.png",
    dark: "/brand/Logo_fondo_oscuro.png",
  },
  mark: {
    light: "/brand/Logo.png",
    dark: "/brand/Logo.png", // same for both modes
  },
} as const;

/**
 * LogoMark — brand logo atom for Comunify.
 * Server Component: no state, no effects, pure markup.
 */
export function LogoMark({ size = "md", variant = "full", className }: LogoMarkProps) {
  const h = heights[size];
  const w = Math.round(h * aspectRatios[variant]);
  const lightSrc = assetSrc[variant].light;
  const darkSrc = assetSrc[variant].dark;
  const sameSrc = lightSrc === darkSrc;

  return (
    <Link href="/" aria-label="Comunify inicio" className={className} data-testid="logo-mark">
      {sameSrc ? (
        // mark variant: single image (same PNG for both modes)
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
