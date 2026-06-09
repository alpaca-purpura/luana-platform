# HANDOFF — core-ds-foundation (build del Design System a DONE) · para conversación nueva

> Bootstrap para construir TODO el core del design system de una vez, sin re-armar lo ya hecho. Owner: `/pm-luana` → `/architect` → `/dev-team` → `/auditor` → `/pm-luana` merge. Origen: sesión 2026-06-07/08 (showcase ratificado + canon cementado + consolidación Fase 0+1+2). Worktree: `~/Proyectos/luana-vitalia` (wip/vitalia). **Todo en disco (uncommitted) → la sesión nueva lo ve.**

## La esencia

Chris: *"el dev-team crea cada interfaz a su forma → se siente otra app."* Solución = un **design system buildable cross-brand** en `core/@luana/{design-tokens,ui-kit}` con **enforcement mecánico**, para que `/po-ux` componga mockups y `/dev-team` construya **de la misma pieza** (no re-tallada). El showcase fue **ratificado** (8 rondas /po-ux); sus decisiones son contratos en el **canon**. Esta story construye esos contratos. **Punto de partida nuevo:** toda hoja nueva/tocada se homologa al canon; lo existente se modifica (Fase 3, aparte).

## Leé en ORDEN (los 3 SSoT)

```bash
cd ~/Proyectos/luana-vitalia
cat docs/product/stories/core-ds-foundation/checkpoint.md                 # 1. el brief (scope · already_done · build_inventory · D1-D11)
cat docs/architecture/luana-platform/design-system-canon.md              # 2. CONTRATOS + EJEMPLOS DE CÓDIGO (lo que se construye)
cat docs/architecture/luana-platform/design-system-inventory-best-of-best.md  # 3. análisis best-of-best (file:line de dónde liftear)
```

Doctrina: `ADR-014`. Plan/lift: `proposals/2026-06-07-design-system-homologation.md`.

## Estado

`core-ds-foundation` = `state: refining`, `brand: platform`, `track: A` (independiente — NO gateada por las stories code abiertas). Falta: producir el ready package + construir + verificar + merge.

## ★ NO REHACER (Chris: "no quiero volver a armar lo ya armado")

- **Bindings de proceso (ya hechos 2026-06-08):** `design-system-canon.md` + `.claude/rules/frontend-visual-fidelity.md § Design System Canon` + gates en `/po-ux` + `/dev-team` + `/architect` + `HB-60`. **NO re-editar** (ya enforced).
- **`@luana/ui-kit` ya tiene 40+ átomos:** incl. **`select.tsx` (ya Shadcn canónico = el "Select canónico")**, `tooltip.tsx` (Provider/Arrow), `AutosaveBadge`, `detail-panel`, `skeleton`, card/dialog/popover/etc. → **CONSUMIR**, no recrear.
- **Lifts (generalizar lo existente, NO from-scratch):** `EntityWorkspaceLayout`+`EntitySubNavBar` (base nicolify) · `use-autosave`+`FloatingAutosaveIndicator` (base vitalia) · `EntityInfoCard` (base vitalia StaffCard) · `Group/GroupHeader` (base nicolify).

## ★ CONSTRUIR (el trabajo real — § build_inventory del checkpoint)

1. **Tokens** — escala completa en `@luana/design-tokens` (spacing/radius/font-size/color sobre nombres compartidos) + resolver **R-1SRC** (dedup `--radius` 0.625 vs 0.5 + `--vitalia-*` legacy en `vitalia/globals.css`).
2. **Layout-primitives** — `PageContainer · PageHeader · PageSection · PageContentStack · Toolbar · FilterBar · EmptyState · ErrorState · ListPageSkeleton · FormPageSkeleton · Pagination · DetailLayout · FormLayout`.
3. **Entity components** — `EntityWorkspaceLayout`(lift) · `EntitySubNavBar`(lift, franja = **tercer-ribbon full-bleed**) · `EntityInfoCard` B + Skeleton + Empty (lift) · `EntityPicker` (**net-new**: buscar server-side + paginado + windowed + lazy).
4. **Autosave** — lift `use-autosave` 600ms+coalesce + `FloatingAutosaveIndicator`.
5. **Archetypes** — scaffolds list/detail/form/dashboard (rellenar slots).
6. **`/showcase` route** en la app real (R-FID durable — renderiza los componentes REALES; reemplaza el `showcase.html` estático). Piloto: vitalia (`:3002`).
7. **Enforcement** — eslint `no-arbitrary-value` (spacing/radius/font-size/color-hex; allowlist w/h/min/max ratchet shrink-only) + arch-test FE `no-div-layout`/`no-native-select`/`no-hardcoded-hex`.

## Flujo a DONE (todo el core en esta corrida)

```
/architect brand: platform core-ds-foundation     → ready package (03-arch + 04-validators + 05-guidelines + 06-tickets)
   └─ consume design-system-canon.md (contratos+código) · declara gates mecánicos en 04-validators
   └─ propone autonomous_mode (Chris ratifica) para correr a done sin pausas innecesarias
/dev-team brand: platform core-ds-foundation       → build ticket-por-ticket, TDD, contra @luana/ui-kit
   └─ consume los EJEMPLOS DE CÓDIGO del canon §6 como base · lifts, no from-scratch
/auditor brand: platform core-ds-foundation        → review + gates GREEN
/pm-luana merge core-ds-foundation                 → done (capability/changelog @luana + bump semver minor)
```

## Guardrails

- **TDD** (Vitest hook→component; arch-test RED antes de implementar el gate).
- **Lifts vía import** desde la mejor versión existente (anti-duplication) — el inventario tiene los `file:line`.
- **`/showcase` route = live-verify real** (Critical Rule #37): ejercer en dev-app/localhost:3002, leer consola (0 errores), confirmar que renderiza los componentes reales. NO "GET 200".
- **Ratchet shrink-only** en el lock + allowlist documentado (no romper casos legítimos de sizing).
- **R-1SRC primero** (sin fuente única de tokens, el lock no tiene sentido).
- Semver `@luana/*` = **minor** (opt-in por marca; el lock se enciende por marca en Fase 3, no acá).

## Notas / riesgos

- `01-spec.md` en esta carpeta es el viejo (Fase-0 tokens-lock) — el `/architect` lo expande o `/po` lo rehace al scope consolidado. No es el SSoT; el canon + checkpoint mandan.
- Fase 3 (adopción comprehensiva por marca, migrar las pantallas existentes + encender el lock) = stories `{brand}-ds-adoption` APARTE (no en esta corrida).
- Las stories code abiertas (adrian-embudo/lisa-doctores/abel-icp) NO se tocan (Chris las retoma aparte).

## Prompt para pegar en la conversación nueva

```
/pm-luana

Construí el Design System core de una vez, hasta DONE: la story platform `core-ds-foundation`
(Fase 0+1+2 consolidada). Leé en orden ANTES de arrancar:
1. docs/product/stories/core-ds-foundation/HANDOFF-next-session.md   ← esencia + flujo + guardrails
2. docs/product/stories/core-ds-foundation/checkpoint.md             ← scope · § already_done (NO rehacer) · § build_inventory · D1-D11
3. docs/architecture/luana-platform/design-system-canon.md          ← contratos + EJEMPLOS DE CÓDIGO

Reglas duras:
- NO re-armar lo de § already_done: los bindings de skills/rule ya están + @luana/ui-kit ya tiene 40+
  átomos (select.tsx ya canónico, tooltip Provider/Arrow, AutosaveBadge, detail-panel, skeleton) = consumir.
- EntityWorkspaceLayout/EntitySubNavBar/use-autosave/FloatingAutosaveIndicator/EntityInfoCard/Group = LIFTS
  (generalizar lo existente, file:line en el inventario), no from-scratch. EntityPicker = net-new.
- Construir SOLO § build_inventory. Respetar el canon TAL CUAL (es lo que ratifiqué viendo el showcase).
- /showcase route = live-verify real (no GET 200). R-1SRC (dedup tokens) primero.

Encadená el flujo completo a DONE: /architect (brand: platform, propone autonomous_mode para que ratifique)
→ /dev-team → /auditor → /pm-luana merge. Avisame en cada gate que requiera mi ratificación.
```
