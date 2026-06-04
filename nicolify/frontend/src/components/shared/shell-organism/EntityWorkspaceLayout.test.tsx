// cap: abel.icp-buyer
// story-origin: nicolify-r1-abel-icp-buyer T-FE-1
/**
 * EntityWorkspaceLayout.test.tsx — Store-free skeleton test (G2 gate).
 *
 * TDD RED-first per tdd-mandatory.md.
 *
 * G2 gate: EntityWorkspaceLayout.tsx skeleton must be store-free.
 * This is a text-scan test (avoids importing SSR-sensitive code in test env).
 *
 * Covers:
 *   - File exists at expected path
 *   - Does NOT import useShellStore (skeleton path store-free)
 *   - Does NOT import shell-store (G2 — skeleton must not subscribe stores)
 *   - Exports EntityWorkspaceLayout as named export (no default)
 *   - Has "use client" directive (needs useParams / router for leaf derivation)
 *   - Renders Skeleton when loading
 *
 * spec_anchor: 03-arch-fe.md §4 SSR-safe store (G2)
 * validators_gate: no-store-in-ssr-skeleton arch test + G2 compliance
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { describe, it, expect } from "vitest";

const SHELL_DIR = resolve(__dirname);
const LAYOUT_PATH = resolve(SHELL_DIR, "EntityWorkspaceLayout.tsx");

describe("Architecture: EntityWorkspaceLayout — G2 skeleton store-free", () => {
  it("EntityWorkspaceLayout.tsx exists at expected path", () => {
    expect(existsSync(LAYOUT_PATH)).toBe(true);
  });

  it("is a 'use client' component (needs router/params for leaf derivation)", () => {
    const content = readFileSync(LAYOUT_PATH, "utf-8");
    expect(content).toContain('"use client"');
  });

  it("does NOT import useShellStore (skeleton store-free, G2 gate)", () => {
    const content = readFileSync(LAYOUT_PATH, "utf-8");
    expect(content).not.toContain("useShellStore");
  });

  it("does NOT import from shell-store (skeleton path must not subscribe)", () => {
    const content = readFileSync(LAYOUT_PATH, "utf-8");
    expect(content).not.toContain("shell-store");
  });

  it("exports EntityWorkspaceLayout as named export (no default)", () => {
    const content = readFileSync(LAYOUT_PATH, "utf-8");
    expect(content).toMatch(/export\s+function\s+EntityWorkspaceLayout/);
    expect(content).not.toMatch(/^export\s+default\s/m);
  });

  it("contains Skeleton usage for loading state", () => {
    const content = readFileSync(LAYOUT_PATH, "utf-8");
    expect(content).toContain("Skeleton");
  });

  it("renders EntitySubNavBar (mounts the N3 bar)", () => {
    const content = readFileSync(LAYOUT_PATH, "utf-8");
    expect(content).toContain("EntitySubNavBar");
  });

  it("has cap header comment (bidirectional code↔cap mapping)", () => {
    const content = readFileSync(LAYOUT_PATH, "utf-8");
    expect(content).toContain("// cap: abel.icp-buyer");
  });
});
