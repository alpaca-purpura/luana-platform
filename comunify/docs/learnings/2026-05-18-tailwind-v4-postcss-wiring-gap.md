---
brand: comunify
date: 2026-05-18
slug: tailwind-v4-postcss-wiring-gap
promotable: yes
applies_to_other_brands_potentially: [vitalia, saasora, inmoflow, retailly, fixia, guestly, fitflow]
target_core_package: _pm-brand-template (scaffold rule)
origin_story: comunify-design-system-tailwind-v4-tokens
audited_at: 2026-05-18
ratified_for_promote_by: /pm-comunify (this merge artifact)
---

# Tailwind v4 PostCSS plugin wiring gap (cross-brand)

**Qué aprendimos:** Tailwind v4 requiere obligatoriamente:
1. `@tailwindcss/postcss` plugin en `devDependencies`
2. `postcss.config.mjs` (o `.cjs`/`.ts`/`.js`) declarando ese plugin

Sin AMBOS, el `@theme` block en `globals.css` se procesa parcialmente: las CSS variables del `:root` se inyectan, pero las **utility classes** (`.bg-{token}`, `.text-{token}`, `.font-{token}`, `.rounded-{token}`) **NUNCA se generan** en el bundle CSS. El runtime aplica `<body class="bg-comunify-bg ...">` pero ninguna regla CSS matches → bg transparente, fonts caen a stack default, etc.

**El bug es silencioso:**
- Tests vitest (unit) pasan porque solo verifican que la clase está aplicada al DOM, no que tenga efecto computado.
- Build no falla — Next.js compila feliz, PostCSS no se quema por la ausencia del plugin (silent skip).
- Solo se detecta vía Playwright smoke con `getComputedStyle()` assertions O inspección física del CSS bundle.

**Origen:** Story `comunify-design-system-cement` shipped `globals.css @theme` block correcto + 23 archivos FE migrados (91 occurrences stock palette → 0) + arch fitness ratchet PASS + 38/38 vitest unit GREEN — **APPROVED y mergeado a main**. Visual smoke fue deferida ("worktree mount mismatch", documentado) y Chris no notó nada raro porque `comunify-design-system-cement` shipped en wip/comunify y nadie corrió el visual smoke post-merge.

Otra sesión `/pm-comunify` autonomous run 2026-05-18 verificó los validators diferidos y descubrió: 467 líneas de CSS bundle, solo `:root` vars, ZERO utility classes. Repro local confirmó root cause. Hot-fix story `comunify-design-system-tailwind-v4-tokens` abierta + closed con 27/27 CHECKPOINTS ✅.

**Why (raíz arquitectónica):**
- En Tailwind v3, las utilities se generaban incluso sin `postcss.config.*` explícito porque Next.js incluía PostCSS auto-config con tailwindcss plugin.
- Tailwind v4 cambió el modelo: el plugin de PostCSS es **separado** (`@tailwindcss/postcss`) y debe declararse explícitamente.
- Brands creadas pre-migración v4 (o usando `_pm-brand-template/` viejo) heredaron `tailwindcss ^4.1.0` en package.json sin el wiring correspondiente.

**How to apply (futuro):**

1. **Para cada brand existente:** verificar que `{brand}/frontend/` tiene:
   - `postcss.config.mjs` declarando `@tailwindcss/postcss`
   - `package.json::devDependencies::@tailwindcss/postcss ^4.1.0+`
   - CSS bundle al runtime contiene utilities (no solo `:root` vars)

2. **Cross-brand audit pendiente:**
   - **Vitalia:** mismo gap confirmado vía grep (`tailwindcss ^4.1.0` declared, no `postcss.config.*` file, no `@tailwindcss/postcss` devDep). Probable que vitalia sirva CSS bundle sin utilities también. Visual no verificado live (otra story).
   - **Brands no-bootstrap todavía (6):** deben recibir el scaffold completo desde `_pm-brand-template/`.

3. **Para `_pm-brand-template/`:** cementar el scaffold:
   ```
   .claude/skills/_pm-brand-template/scaffold/{brand}/frontend/
   ├── postcss.config.mjs              # @tailwindcss/postcss
   ├── package.json                    # devDeps include @tailwindcss/postcss + tailwindcss
   └── src/app/globals.css             # @theme block placeholder
   ```

4. **Detection regla (pre-commit hook o arch test, candidate):**
   ```bash
   # For each {brand}/frontend/ directory:
   if grep -q 'tailwindcss"' {brand}/frontend/package.json && \
      ! [ -f {brand}/frontend/postcss.config.* ]; then
     echo "ERROR: Tailwind declared but no PostCSS config — utilities won't emit"
   fi
   ```

**Promotable target:** `/pm-luana` evalúa lift a `_pm-brand-template/` (scaffold rule cross-brand) + posible arch test cross-brand global.

**Severity ranking:** silent ship pattern es **ALTO** porque escapa: arch fitness + vitest unit + auditor visual smoke deferido. Único catch: Playwright smoke con computed-style assertions o CSS bundle physical inspection. `_pm-brand-template/` debe cementar el scaffold + asegurar que cada brand pase visual smoke ANTES de merge cement story.

**Cross-reference:**
- `comunify/docs/product/stories/comunify-design-system-tailwind-v4-tokens/01-spec.md` — Gherkin SC-01..07 + diff verbatim fix
- `comunify/docs/archive/2026/stories/comunify-design-system-tailwind-v4-tokens/` (post merge)
- `comunify/docs/product/capabilities/frontend_design_system/tailwind-v4-tokens.yaml`
- `comunify/docs/product/modules/frontend_design_system.md`
