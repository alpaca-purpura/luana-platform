# 05-guidelines — Comunify Design System Tailwind v4 token activation

## Files in scope (T-1)

| File | Action | Reason |
|---|---|---|
| `comunify/frontend/src/app/globals.css` | EDIT — insert `@theme` block | Native v4 token registration (Option A ratified by Chris). |
| `comunify/frontend/e2e/specs/smoke/design-system.smoke.spec.ts` | EDIT — fix 2 assertion bugs | Test was authored incorrectly: htmlClassName regex + hasComunifyClasses startsWith. See `01-spec.md` § "Test corrections required" for verbatim diff. |

## Files OUT of scope

- ❌ `comunify/frontend/tailwind.config.ts` — leave untouched. Borrar es story de cleanup separada.
- ❌ Cualquier consumer component (`*.tsx`) — no migration de utility classes (siguen usando `bg-comunify-bg` etc. — solo destrabamos generación CSS).
- ❌ `:root` block existente en globals.css — preserve as-is (retro-compat con consumers que leen `hsl(var(--comunify-X))` directamente).
- ❌ `comunify/frontend/next.config.ts` / `postcss.config.*` — no toques build pipeline (no postcss config existe ni hace falta agregar para v4).
- ❌ Otros brands (`vitalia/`, `nicolify/`, `lupulo/`) — cross-brand mirror prohibido per `.claude/rules/anti-duplication.md`. Lift candidate post-merge.

## Required patterns

### `@theme` block (canonical structure)

Tailwind v4 lee tokens declarados como `--color-{name}` / `--font-{name}` / `--spacing-{name}` etc.
y genera utilities automáticamente (`.bg-{name}`, `.text-{name}`, `.border-{name}`, `.font-{name}`, etc.).

```css
@import "tailwindcss";

@theme {
  /* Color utilities — Tailwind v4 generates .bg-comunify-X / .text-comunify-X / .border-comunify-X */
  --color-comunify-primary: hsl(264 92% 58%);
  --color-comunify-primary-foreground: hsl(0 0% 100%);
  --color-comunify-primary-hover: hsl(254 79% 49%);
  --color-comunify-purple-mid: hsl(252 100% 62%);
  --color-comunify-blue: hsl(217 95% 58%);
  --color-comunify-blue-deep: hsl(220 84% 45%);
  --color-comunify-accent: hsl(355 100% 69%);
  --color-comunify-stable: hsl(152 80% 43%);
  --color-comunify-warning: hsl(45 100% 48%);
  --color-comunify-critical: hsl(0 84% 60%);
  --color-comunify-text: hsl(226 49% 9%);
  --color-comunify-text-muted: hsl(215 16% 47%);
  --color-comunify-bg: hsl(210 40% 98%);
  --color-comunify-surface: hsl(0 0% 100%);
  --color-comunify-border: hsl(214 32% 91%);

  /* Font utilities — Tailwind v4 generates .font-satoshi / .font-manrope / .font-inter */
  --font-satoshi: var(--font-satoshi), "ui-sans-serif", "system-ui", "sans-serif";
  --font-manrope: var(--font-manrope), "ui-sans-serif", "system-ui", "sans-serif";
  --font-inter: var(--font-inter), "ui-sans-serif", "system-ui", "sans-serif";

  /* Border radius — Tailwind v4 generates .rounded-* / .rounded-lg-* */
  --radius-default: 0.75rem;
  --radius-lg: 1.25rem;

  /* Background image — Tailwind v4 generates .bg-comunify-gradient */
  --background-image-comunify-gradient: linear-gradient(135deg, #7B2FF7 0%, #6A3CFF 35%, #2D7FF9 70%, #1E5EFF 100%);
}

:root {
  /* DO NOT REMOVE — retro-compat con consumers que leen hsl(var(--comunify-X)) directly.
   * Estos siguen vivos para casos donde algún componente referencia el HSL crudo. */
  --comunify-primary: 264 92% 58%;
  --comunify-primary-foreground: 0 0% 100%;
  /* ... resto del :root existente queda igual ... */
}
```

> **Nota crítica sobre `--font-X` collision:** Next.js Google Fonts API genera CSS modules
> que DEFINEN `--font-satoshi` etc. en una scope cerrada (`.plus_jakarta_sans_..._variable { --font-satoshi: ... }`).
> El `@theme` block usa `var(--font-satoshi)` como fallback chain — Tailwind v4 evalúa el var
> en runtime, asegurando que la fuente real se aplique correctamente. NO duplicar la
> declaración de fuente literal en `@theme` (eso rompe el font module injection de Next.js).

### Test correction patterns

Ver `01-spec.md` § "Test corrections required" para los 2 diffs verbatim. Aplica como parte de T-1.

## Forbidden patterns

- ❌ Borrar `tailwind.config.ts` (out of scope esta story — cleanup separado)
- ❌ Borrar `:root` block existente (rompe retro-compat)
- ❌ Cambiar valores HSL canónicos (esos son SSoT en `design-system.md`, no modificarlos aquí)
- ❌ Agregar `@config "../../tailwind.config.ts"` directive (Opción B — descartada en ratificación Chris a favor de Opción A)
- ❌ Migrar componentes consumer `bg-comunify-X` a `bg-[hsl(var(--comunify-X))]` syntax (deja utilities idiomáticos, no inline)
- ❌ `git add .` / `-A` / `-u` (per `.claude/rules/git-safety.md`)
- ❌ Skip val-fe-1 / val-fe-2 / val-fe-3 con `--no-verify` (per `.claude/rules/tdd-mandatory.md`)
- ❌ Tocar archivos de otra brand (vitalia/nicolify/lupulo) — cross-brand mirror ban

## Skills + rules a cargar para builder

- `.claude/rules/frontend-fsd.md` — FSD-Lite boundaries
- `.claude/rules/frontend-quality.md` — ESLint + TSC + Vitest thresholds
- `.claude/rules/e2e-testing.md` — Playwright execution patterns (NATIVE, NEVER `make e2e`)
- `.claude/rules/hotfix-repro-mandatory.md` — repro_verified=true ya confirmado en checkpoint
- `.claude/rules/git-safety.md` — triple-branch + stage por nombre
- `.claude/rules/git-haiku-delegation.md` — commit+push pattern
- `.claude/rules/spanish-text.md` — Spanish neutro (sólo si modifica labels user-facing, NO aplica acá)
- `frontend-expert` skill — quality patterns + arch fitness ratchet
- `playwright-expert` skill — smoke spec patterns + Clerk auth boundary (NO aplica /sign-in unauth, pero referencia útil)
