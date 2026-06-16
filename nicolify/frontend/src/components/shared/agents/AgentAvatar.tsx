// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
"use client";

/**
 * AgentAvatar — circular avatar for Nicolify AI agents.
 *
 * Port re-tematizado from vitalia/components/shared/agents/AgentAvatar.tsx.
 * Re-themed: uses AgentSlug from nicolify agent-catalog + agentBgClass from _agent-tw-classes.
 *
 * Displays agent thumbnail image with initial-letter fallback when asset 404.
 * E4 scenario: avatar fallback to initial if 404 (no crash, graceful degradation).
 *
 * Size variants: sm (24px) | md (32px, default) | lg (48px)
 *
 * "use client" required: useState for img error handling.
 *
 * Named export (no default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local shell-organism; no cross-brand consumers
 */

import { useState } from "react";

import { agentBgClass } from "@/components/shared/shell-organism/_agent-tw-classes";
import { cn } from "@/lib/utils";

import type { AgentSlug } from "@/lib/agent-catalog";

export interface AgentAvatarProps {
  slug: AgentSlug;
  name: string;
  initial: string;
  thumbnail: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  // ds-lock-allow: 10px initial in 24px circle; below text-xs (12px), no smaller token in brand scale
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-12 h-12 text-sm",
} as const;

const IMG_SIZE_CLASSES = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-12 h-12",
} as const;

/**
 * AgentAvatar — circular agent avatar with image + initial fallback.
 * Image has onError fallback showing initial letter in agent color circle.
 */
export function AgentAvatar({
  slug,
  name,
  initial,
  thumbnail,
  size = "md",
  className,
}: AgentAvatarProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full overflow-hidden shrink-0",
        "font-semibold text-white select-none",
        agentBgClass(slug),
        SIZE_CLASSES[size],
        className,
      )}
      aria-label={`Agente ${name}`}
      role="img"
      title={name}
    >
      {imgError ? (
        <span
          className={cn(
            "font-semibold text-white select-none",
            SIZE_CLASSES[size].split(" ").pop(),
          )}
        >
          {initial}
        </span>
      ) : (
        <img
          src={thumbnail}
          alt=""
          aria-hidden="true"
          className={cn("object-cover", IMG_SIZE_CLASSES[size])}
          onError={() => setImgError(true)}
        />
      )}
    </span>
  );
}
