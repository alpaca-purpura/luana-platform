// cap: shell-organism.shell-nicolify
// story-origin: nicolify-r0-shell T-4
"use client";

/**
 * useKeyboardShortcuts.ts — Generic hardened keyboard shortcut hook.
 *
 * Port verbatim from vitalia/hooks/useKeyboardShortcuts.ts.
 * Re-themed: Valeria→Luana (no user-facing strings in this file).
 *
 * ShortcutsMap key format:
 *   - Bare key: "r", "f", "c", "Escape"  — simple key match (no modifier)
 *   - Modifier key: "mod+k"               — Cmd (Mac) OR Ctrl (Win/Linux)
 *
 * Guard — SKIP handler if:
 *   1. e.isComposing === true  → IME composition
 *   2. target is INPUT/TEXTAREA → user typing
 *   3. target is [contenteditable] → user editing inline
 * EXCEPTION: modifier shortcuts (mod+key) bypass the input guard.
 *
 * Named export (no default) per FSD-Lite enforce.
 * downstream-regression-na: brand-local hook; no cross-brand consumers
 */

import { useEffect } from "react";

export type ShortcutsMap = Record<string, () => void>;

function hasModifier(shortcutKey: string): boolean {
  return shortcutKey.startsWith("mod+");
}

function isModifierActive(e: KeyboardEvent): boolean {
  return e.metaKey || e.ctrlKey;
}

function isInEditableContext(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  const tag = (target as Element).tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return true;

  let node: Element | null = target as Element;
  while (node !== null) {
    if (
      node.getAttribute("contenteditable") === "true" ||
      (node instanceof HTMLElement && node.isContentEditable) ||
      node.getAttribute("role") === "textbox"
    ) {
      return true;
    }
    node = node.parentElement;
  }

  return false;
}

/** Returns true if the event matches the given shortcut key string. */
function matchesShortcut(e: KeyboardEvent, shortcutKey: string, modActive: boolean): boolean {
  if (hasModifier(shortcutKey)) {
    return modActive && e.key === shortcutKey.slice(4);
  }
  return !modActive && e.key === shortcutKey;
}

export function useKeyboardShortcuts(shortcuts: ShortcutsMap): void {
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent): void {
      if (e.isComposing) return;

      const modActive = isModifierActive(e);
      const inEditable = isInEditableContext(e.target);

      for (const [shortcutKey, handler] of Object.entries(shortcuts)) {
        if (inEditable && !hasModifier(shortcutKey)) continue;
        if (matchesShortcut(e, shortcutKey, modActive)) {
          handler();
          break;
        }
      }
    }

    window.addEventListener("keydown", handleKeydown, { passive: true });

    return () => {
      window.removeEventListener("keydown", handleKeydown, {
        passive: true,
      } as EventListenerOptions);
    };
  }, [shortcuts]);
}
