/**
 * Shared scanner for the Design System lock arch-tests (HB-106 · canon §5 / ADR-014).
 *
 * Brand-local copy of the vitalia scanner (parity cross-brand — the detection
 * logic is brand-agnostic).
 *
 * Used by (comunify):
 *   - test-no-native-select.test.ts        (A-1: native <select> shrink-only)
 *   - test-no-div-layout.test.ts           (A-2: <div> layout shrink-only)
 *   - test-no-local-kit-primitive.test.ts  (HB-107: kit-shaped primitive left local)
 *
 * downstream-regression-na: brand-local arch fitness helper; no cross-brand consumers.
 * Promotion candidate: si ≥3 marcas portan este scanner, lift a `@luana/` (HB futuro).
 */
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const MULTI_LINE_COMMENT = /\/\*[\s\S]*?\*\//g;
const SINGLE_LINE_COMMENT = /\/\/.*$/gm;

export function stripComments(source: string): string {
  return source
    .replace(MULTI_LINE_COMMENT, (m) => " ".repeat(m.length))
    .replace(SINGLE_LINE_COMMENT, (m) => " ".repeat(m.length));
}

const SKIP_DIRS = new Set(["__tests__", "node_modules", ".next"]);

export function collectSourceFiles(
  srcDir: string,
  extensions: string[] = [".tsx", ".ts"],
): string[] {
  if (!existsSync(srcDir)) return [];
  const out: string[] = [];
  const recurse = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (SKIP_DIRS.has(entry)) continue;
        recurse(full);
      } else if (extensions.some((ext) => entry.endsWith(ext))) {
        out.push(full);
      }
    }
  };
  recurse(srcDir);
  return out;
}

/** Relative POSIX path from a root. */
export function relPosix(root: string, abs: string): string {
  return relative(root, abs).replace(/\\/g, "/");
}

// A-2 — raw <div> used as a LAYOUT container (canon §2.7). className forms: "...", {`...`}, {cn(...)}.
const DIV_CLASSNAME_RE =
  /<div\b[^>]*?\bclassName=(?:"([^"]*)"|\{`([^`]*)`\}|\{cn\(([\s\S]*?)\)\})/g;

/** True when a className string describes a layout container (flex-col+gap or grid-cols). */
export function isLayoutDiv(cls: string): boolean {
  if (!cls) return false;
  const hasGrid = /grid-cols-/.test(cls);
  const hasFlexColGap = /flex-col/.test(cls) && /\bgap-/.test(cls);
  return hasGrid || hasFlexColGap;
}

/** Count raw layout `<div>` containers in one source string (comments stripped). */
export function countLayoutDivs(rawSource: string): number {
  const src = stripComments(rawSource);
  let n = 0;
  let m: RegExpExecArray | null;
  DIV_CLASSNAME_RE.lastIndex = 0;
  while ((m = DIV_CLASSNAME_RE.exec(src))) {
    const cls = m[1] ?? m[2] ?? m[3] ?? "";
    if (isLayoutDiv(cls)) n += 1;
  }
  return n;
}

/** Read a file (utf-8). */
export function read(abs: string): string {
  return readFileSync(abs, "utf-8");
}
