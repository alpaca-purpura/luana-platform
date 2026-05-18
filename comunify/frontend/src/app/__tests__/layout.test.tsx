/**
 * @vitest-environment happy-dom
 *
 * Scenario 1 (happy): tokens-cargados-render-correcto
 * Scenario 3 (edge):  satoshi-fallback-grace
 *
 * These are static-analysis tests — they verify the layout.tsx source code
 * contains the expected CSS variable names and class tokens, avoiding the
 * need for a full Next.js server render in unit context.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const LAYOUT_SRC = readFileSync(
  join(__dirname, "../layout.tsx"),
  "utf-8"
);

describe("comunify layout.tsx — design system tokens", () => {
  it("declares --font-satoshi CSS variable", () => {
    expect(LAYOUT_SRC).toContain('variable: "--font-satoshi"');
  });

  it("declares --font-manrope CSS variable", () => {
    expect(LAYOUT_SRC).toContain('variable: "--font-manrope"');
  });

  it("declares --font-inter CSS variable", () => {
    expect(LAYOUT_SRC).toContain('variable: "--font-inter"');
  });

  it("applies all 3 font variables to <html> className", () => {
    expect(LAYOUT_SRC).toContain("satoshi.variable");
    expect(LAYOUT_SRC).toContain("manrope.variable");
    expect(LAYOUT_SRC).toContain("inter.variable");
  });

  it("body uses bg-comunify-bg brand token (not bg-white)", () => {
    expect(LAYOUT_SRC).toContain("bg-comunify-bg");
    expect(LAYOUT_SRC).not.toContain("bg-white");
  });

  it("body uses font-inter brand token (not font-sans)", () => {
    expect(LAYOUT_SRC).toContain("font-inter");
    expect(LAYOUT_SRC).not.toContain("font-sans");
  });

  it("body uses text-comunify-text brand token", () => {
    expect(LAYOUT_SRC).toContain("text-comunify-text");
  });

  it("imports globals.css", () => {
    expect(LAYOUT_SRC).toContain('import "./globals.css"');
  });

  // Scenario 3 edge: satoshi-fallback-grace
  // --font-satoshi var MUST always be present regardless of whether Satoshi
  // binary loaded or Plus Jakarta Sans fallback is active (Path B, D2 spec option c)
  it("font-satoshi var present — fallback to Plus Jakarta Sans (D2 Path B)", () => {
    expect(LAYOUT_SRC).toContain('variable: "--font-satoshi"');
    // Plus_Jakarta_Sans is the resolved import (Path B)
    expect(LAYOUT_SRC).toContain("Plus_Jakarta_Sans");
  });
});
