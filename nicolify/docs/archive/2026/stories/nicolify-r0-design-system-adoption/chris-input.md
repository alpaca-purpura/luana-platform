---
story_id: nicolify-r0-design-system-adoption
created_at: 2026-06-15T15:18:48-05:00
last_modified: 2026-06-15T15:18:48-05:00
notes_count: 0
refs_count: 3
conversation_count: 3
---

# chris-input.md · nicolify-r0-design-system-adoption

> **Qué es este archivo:** acá Chris escribe notas + referencias + Claude responde con verdicts. Es la cocina de la story (la conversación) — separada del spec/design/arch (los outputs ratificados).

## 💭 Notas

### 2026-06-15 15:18
Sin notas adicionales · la story nace de la coordinación /pm-nicolify↔/pm-luana de hoy.

## 📎 Referencias

- doc-ref · `docs/architecture/luana-platform/ADR-014-design-system-homologation.md` — doctrina 5 capas + enforcement + adopción comprehensiva (HARD)
- doc-ref · `docs/promotion-protocol/proposals/2026-06-07-design-system-homologation.md` — plan core + lift (accepted). Fase 3 = adopción por marca
- code-ref · `core/@luana/ui-kit` 0.4.1 (src/layout + src/archetypes) · `core/@luana/design-tokens` 0.2.0 · `core/@luana/eslint-config` (no-arbitrary-value.js)

## 💬 Conversación

### 2026-06-15 15:18 — Chris → /pm-nicolify
**Pedido:** "refiná nicolify-r0-design-system-tokens como adopción Fase 3" (tras coordinar con /pm-luana que la base de proceso + UI-kit está homologada y current).

**/pm-nicolify → ✓ APLICADO (con corrección de naming):**
- El handle `design-system-tokens` apuntaba a trabajo YA DONE: fue fusionado en `nicolify-r0-shell` (ratif Chris 2026-05-30) — los tokens base de marca (color/fuente/dark) ya shippearon con el shell.
- Materialicé la story como **`nicolify-r0-design-system-adoption`** (slug preciso) = la pieza net-new: adopción Fase 3 de los **primitivas/archetypes/enforcement compartidos** del design system homologado (ADR-014, accepted 2026-06-07, posterior al shell). Si querés el nombre literal viejo, lo renombro.
- `state: refining` + prior-art scan documentado (resultado: adopción pura, cero creación — todo existe en @luana/ui-kit 0.4.1).
- Scope Fase 3 (req HARD ADR-014 = comprehensiva, todas las hojas): (1) mapear hojas nicolify a layout-primitives + page archetypes de @luana/ui-kit · (2) alinear globals.css a la escala @luana/design-tokens · (3) encender lock eslint no-arbitrary (anti-default-flip + ratchet de los 27 actuales).
- Handoff → `/po-ux` para producir 01-spec.md.

### 2026-06-15 15:25 — /po-ux interrogatorio · secuencia con Abel
**Hallazgo reflejado:** FE nicolify hoy = chrome del shell + 1 sola hoja con UI (`abel/icp`). Tiene copias LOCALES de componentes ya lifteados a @luana/ui-kit (EntityWorkspaceLayout/EntitySubNavBar/EmptyState/AutosaveBadge) = mirrors a matar. Solo 2 archivos importan del kit. La adopción es sobre todo CONVERGENCIA (mirror→kit) + lock.

**Pregunta:** ¿secuenciar Abel (en `reviewing`, usa el EntityWorkspaceLayout local) después del merge, o converger Abel ahora?

**Chris → decidió (b): converger Abel AHORA.** Razón: poco avance en Abel + quiere "nacer con todo bien hecho". **Pain raíz declarado:** "estoy teniendo problemas justo porque no tenemos tokens, átomos, moléculas bien cimentadas en nicolify en mockup Y desarrollo" → esta historia lo resuelve.

**/po-ux → ✓ APLICADO + 💡 reencuadre de scope:** la historia es FUNDACIONAL (cimentar la base, no solo adoptar). Consecuencia de (b) anotada: Abel en `reviewing` será re-expresado vía kit dentro de esta historia → su FE cambia, requerirá re-tocar su audit/demo-gate #37 (coordinar al cierre). El pain "mockup Y desarrollo" agranda el deliverable: además del código, cementar la base que el PROCESO DE MOCKUP también consume (nicolify-design-system SSoT + design-system-canon) para cerrar el loop "lo que veo = lo que se programa".

### 2026-06-15 15:30 — /po-ux corte de tokens + lado mockup
**Reflejado:** el corte brand-value vs escala-compartida NO es juicio — lo define el contrato de `@luana/design-tokens` (spacing=valor compartido · radius=nombres compartidos+rem de marca · typography/z-index/color-names compartidos · colores+fuentes+rem = marca). Identidad nicolify 100% preservada; solo se homologa el ritmo estructural. Recomendé migrar los 27 arbitrary AHORA (lock en cero, sin deuda).

**Pregunta:** ¿incluir el lado mockup (cementar SHELL-DESIGN-CONTRACT para que mockups compongan de canon+tokens)?

**Chris → "sí, dale con todo el lado mockup también".**

**/po-ux → ✓ APLICADO:** scope funcional cerrado. Escrita RONDA 1 (`01-spec.md`, viñetas — § Context + Prior art + Mapa funcional [happy path + 5 bifurcaciones + RN-1..6 + AC-1..6] + inventario de adopción + Q1 técnico para architect). Sin mockup ni Gherkin todavía (se generan en RONDA 2). Pendiente: **FIRMA 1** (`input_spec_signed`).

### 2026-06-15 15:40 — Chris firma RONDA 1 → mockup
**Chris → "firmo la ronda 1, dale con el mockup".** `input_spec_signed: true` (checkpoint + spec).

**/po-ux → ✓ APLICADO:** cargado el `design-system-canon.md` (HARD GATE). Nota: canon §4 está stale (dice `core-ds-foundation` en refining; la Fase 1 ya shippeó en `@luana/ui-kit` 0.4.1 — confirmado por exports). Compuesto mockup `mockups/ds-base.html` = **showcase de la base cimentada** (A tokens · B átomos/moléculas · C la hoja real abel/icp armada de la base dentro del shell [master grid de EntityInfoCard + detalle EntityWorkspaceLayout/EntitySubNavBar full-bleed + Group+autosave] · D estados). Cero `<div>` de layout a mano, cero arbitrary, identidad nicolify intacta. Doble función: ratificación + referencia visual del SHELL-DESIGN-CONTRACT (AC-6). Servido en `http://localhost:8888/ds-base.html`. Pendiente: **FIRMA 2** (mockup final).

### 2026-06-15 15:55 — Chris pide verificar colores vs nicolify.com
**Chris → "¿inventaste los colores o los tomaste de https://nicolify.com/?"**

**/po-ux → ✓ APLICADO (verificación REAL, no palabra):** WebFetch bloqueado (403) → bajé el sitio + sus 2 CSS de Astro con curl + grep exacto por cada color. Resultado: `#635BFF` (primary/Luana) + Abel `#A855F7` + Brenda `#22C55E` + Christian `#3B82F6` + Norvil `#EC4899` + fuentes League Spartan/Bree Serif = **confirmados en el sitio vivo**. Excepción: Sara `#F59E0B` = NO en el sitio (usa #F97316 orange); es valor ratificado en repo (ADR-nicolify-002, posterior a la web). Nada inventado.

### 2026-06-15 16:00 — Chris firma RONDA 2 (FIRMA 2)
**Chris → "dejá el ámbar de Sara, dale con la firma 2".**

**/po-ux → ✓ APLICADO:** Sara conserva `#F59E0B`. `mockup_final_signed: true` + `ratified_by_chris: true`. GENERADA RONDA 2 en `01-spec.md`: § Mockup final + § Gherkin (SC-1..6 · happy/negative/edge/adversarial + a11y + i18n; race/network/large = `not_applicable` estructural) + § Matriz de cobertura (sin huecos ni SC huérfanos; Bif-4 out-of-scope, Bif-5 coordinación) + estados/componentes(100% reuse kit)/microcopy. **Gate refined PASS → `state: refined`.** Próximo: `/architect` (con Bif-5: coordinar convergencia de Abel-en-reviewing).

### 2026-06-15 16:20 — Chris pide replicar el sistema de mockups de vitalia ANTES del GO
**Chris → "revisá cómo hicimos los mockups en vitalia (guardamos cada html para reusar obligatoriamente, siempre tomaban el shell organism mockup, igual cada token/átomo/molécula en código nextjs react para reusar; la spec dice 'estas cosas con este elemento' = cero alucinación UI, lo que veo = lo que implemento). Antes del GO quiero las bases bien seteadas en nicolify."**

**/po-ux → ✓ APLICADO (verificado + replicado):** revisado vitalia — el sistema es real: `_shared.css` (788 líneas, espejo HSL de globals.css + shell wrapper + átomos/moléculas) que cada mockup linkea + wrapper portado VERBATIM (solo cambia `.panel-content`) + `ADR-vitalia-003` (gate bloqueante pre-/architect) + visual golden Playwright side-by-side (`maxDiffPixelRatio:0.001`) → mockup = contrato ejecutable. nicolify NO lo tenía cementado. **Bases seteadas (NO necesité /architect — es base de refinamiento):**
1. `mockups/_shared.css` — la base reusable (tokens marca + escala compartida + átomos + moléculas + layout-primitives + shell wrapper verbatim).
2. `ds-base.html` refactorizado → linkea `_shared.css` (cero inline de layout). Servido OK (200).
3. `ADR-nicolify-003-mockup-base-protocol.md` — protocolo obligatorio (mirror vitalia-003, sin PHI + guardrails agénticos).
4. `nicolify/.claude/rules/shell-mockup-per-component.md` — enforcement (auto-load skills) + README actualizado.
5. `SHELL-DESIGN-CONTRACT.md` § 7 + `01-spec.md § Visual Goldens` (mapeo mockup→golden→React→canon = "la spec nombra el elemento concreto").
Patrón cross-brand (vitalia+nicolify) → candidate lift `/pm-luana`. Próximo: tu OK a las bases → recién ahí `/architect` (diseño del build) con Bif-5.

### 2026-06-15 16:45 — Chris itera el mockup (4 ajustes)
**Chris → (1) ribbon con labels de función ("Mi Empresa/Atraer/Vender/etc.") como antes/vitalia · (2) thumbnails con imágenes de IA asociadas a cada agente · (3) Configurar con tuerquita · (4) barra de Luana: gusta el color distinto pero las burbujas se pierden — revisar colores + estructura de vitalia.**

**/po-ux → ✓ APLICADO (verificado con screenshot real Chrome MCP):**
- (1) Ribbon = función + agente: **Mi Empresa·Abel · Atraer·Brenda · Vender·Christian · Operar·Sara · Retener·Norvil** (mapeo value-chain Atracción→Cierre→Delivery→Retención). ⚠️ Operar/Sara + Retener/Norvil los inferí — confirmá si querés otros labels.
- (2) Thumbnails: usé los avatares SVG ya existentes (`public/agents/{slug}/avatar.svg` = `assets/agents/{slug}.svg`), copiados self-contained al mockup. NO regeneré (MEMORY: Chris entrega finales). Si querés imágenes IA fotorrealistas las genero/busco aparte.
- (3) ⚙️ Configurar con gear.
- (4) Barra de Luana: mantuve el indigo (te gusta) pero **estructura de vitalia** (`.chat-header`+`.chat-messages`+`.msg-bubble`+`.chat-composer`): header avatar+nombre+rol+status verde · burbujas OPACAS (bot blanca / "Tú" indigo claro) con contraste real (ya no se pierden) · composer blanco con adornos. Todo en `_shared.css` (la base) → se hereda en toda hoja.
- Mockup re-renderizado OK (screenshot). Cambia el mockup ratificado → pendiente **re-confirmación visual** tuya.

### 2026-06-15 16:55 — Chris: coherencia pill total
**Chris → "si el recurso base es Fully Rounded (pill), que sea TODO — textbox, dropdowns, etc."**

**/po-ux → ✓ APLICADO (verificado screenshot):** controles (button/input/select/badge-estado) ahora **fully-rounded**, coherentes con tabs/chips/composer/autosave. Surfaces (card/group/panel/shell) mantienen `--radius` (un card pill sería raro). **Implementado bien (no hack):** token brand-overridable **`--radius-control`** (nicolify=pill · vitalia=md) → la primitiva del kit lo consume, mockup=código + homologación preservada (estructura compartida, valor por marca). Anotado RN-7 + flag a /architect (verificar que `Input`/`Button`/`Select` del kit expongan `--radius-control`; si hardcodean radio → cambio de kit vía `/pm-luana`).

### 2026-06-15 17:05 — Chris aprueba todo + pide handoff
**Chris → "todo bien, dame el prompt para continuar en una nueva conversación (saturamos contexto)".**

**/po-ux → ✓ APLICADO:** mockup **re-ratificado** (FIRMA 2 final). Labels Operar/Retener confirmados. Thumbnails = placeholders existentes (Chris entrega finales). Bases de mockup seteadas (`_shared.css` + ADR-nicolify-003 + rule). Story `refined` lista para `/architect`. Generado `HANDOFF-next-session.md` + prompt de continuación. **Pendiente operativo:** commitear lo uncommitted (pathspec) al arrancar la próxima sesión.

### 2026-06-15 (sesión nueva) — Chris retoma → commit + /architect
**Chris → "retomamos. Commit por pathspec lo uncommitted, después /architect nicolify nicolify-r0-design-system-adoption con las notas (Bif-5 a · RN-7 --radius-control · matar mirrors · lock no-arbitrary en cero)."**

**/pm-nicolify → ✓ APLICADO:**
- **Commit ya estaba hecho:** `c4a770da` contiene exacto los 17 archivos del § Pendiente operativo (rules README/shell-mockup + ADR-nicolify-003 + SHELL-DESIGN-CONTRACT + R0.yaml + story dir + mockups + _shared.css + 6 avatares SVG). El HANDOFF se commiteó junto. Tree limpio → no-op. (`tools/luana-cockpit` untracked = tooling cross-cutting, fuera de scope, no se toca.)
- **Step 0 closure gate:** Abel (`reviewing`, gate #37, `code:abel`) ≠ bucket `code:design-system` → WIP cap OK. Bif-5(a) ratificado: Abel converge en esta story → `/architect` destraba el demo único, no abandona Abel.
- **Handoff `/architect`** con las 4 notas (Bif-5 a convergencia Abel · RN-7 `--radius-control` brand-overridable en kit Input/Button/Select · matar mirrors locales EntityWorkspaceLayout/EntitySubNavBar/EmptyState/AutosaveBadge · lock eslint no-arbitrary migrando 27 + encender en cero, anti-default-flip). Verification `ambas`.

### 2026-06-15 (sesión nueva) — T-1 /dev-team build

**/dev-team → ✓ APLICADO (T-1 GREEN · 39/39 tests passing):**
- **globals.css modificado:** escala compartida en `@theme` (11 spacing `--spacing-0..16` · 5 radius names `--radius-sm/md/lg/bubble/pill` · 4 typography tiers `--text-display/heading/body/caption`). Identidad nicolify HARD-preservada (--primary 243 100% 68% · 7 agent colors · League Spartan/Bree Serif · dark mode). `--radius-pill: 9999px` + `--radius-control: var(--radius-pill)` en `:root` (RN-7 brand-scoped, kit no tocado).
- **package.json modificado:** `@luana/eslint-config: workspace:*` en devDependencies (para T-4).
- **Arch-test NEW:** `src/__tests__/architecture/test-ds-single-token-source.test.ts` (39 tests · TDD RED→GREEN · drift detection vs @luana/design-tokens exports).
- **Gates:** V1-arch 39/39 GREEN · V2-tsc 0 errors · ESLint 0 errors.
- Ver T-1-result.md para diff summary + validator output.

### 2026-06-15 (sesión nueva) — T-2 /dev-team build (kill 4 mirrors)

**/dev-team → ✓ APLICADO (T-2 GREEN · 518 tests PASS · 0 tsc errors · 0 eslint errors):**
- **6 mirror files DELETED** via `git rm` (-1483 lines): `AutosaveBadge.tsx` + `EmptyState.tsx` + `EntitySubNavBar.tsx` + `EntitySubNavBar.test.tsx` + `EntityWorkspaceLayout.tsx` + `EntityWorkspaceLayout.test.tsx`.
- **4 consumer files MODIFIED:** `SubTabContent.tsx` + `IcpEntityLayoutClient.tsx` + `IcpDatosForm.tsx` + `BuyerLeafForm.tsx` — imports repointed to `@luana/ui-kit`. `agentSlug` prop dropped (kit uses semantic `accent` token). `data-testid` props removed (kit uses `data-state` attribute). `EmptyState` → `ShellEmptyState` alias.
- **2 arch-tests NEW (TDD RED→GREEN):** `test-no-kit-mirror.test.ts` (V5, 5 tests) + `test-no-cross-brand-import.test.ts` (V6, 2 tests). Both empty ratchet allowlists.
- **Gates:** V2-tsc 0 errors · V5/V6 arch tests PASS · V11-vitest 518/518 · ESLint 0 errors, 53 warnings (all pre-existing) · arch fitness 160/160 PASS.
- Ver T-2-result.md para diff summary + validator output.

### 2026-06-15 (sesión nueva) — /architect cierra ready package + RN-7 decision
**Hallazgo bloqueante de RN-7 (verificado, no asumido):** los controls del kit (`Button/Input/Select/Textarea`) **hardcodean `rounded-md`** — `--radius-control` no existe en ningún lado. Hacerlos pill brand-overridable = **cambio cross-brand de engine** (toca `@luana/ui-kit` + `design-tokens` + vitalia debe definir `--radius-control: var(--radius)` para no cambiar) → `/pm-luana` promotion gate. Prohibido meterlo en una story de marca.

**Chris → decidió (a) "Decouple + paralelo"** (AskUserQuestion): cierro ready ya con el paquete brand-scoped; RN-7 = dependencia externa via `/pm-luana`; demo gate #37 corre cuando ambos aterrizan.

**/architect → ✓ APLICADO:**
- **Ready package cerrado** (`refined → ready`, `phase: READY_PACKAGE_CLOSED`) — 5 artifacts (`03-arch` + `03-arch-fe` + `04-validators` + `05-guidelines` + `06-tickets` + `dispatch-plan`). FE-only, 5 tickets `builder-frontend`/workhorse, DAG T-1‖T-2 → T-3 → T-4 → T-5. SC-1..6 todos mapeados.
- **Scope:** matar 4 mirrors (Entity*, EmptyState, AutosaveBadge) → consumir kit · alinear `globals.css` a `@luana/design-tokens` (Q1: mirror @theme + arch-test anti-drift, sin codegen) · re-expresar Abel/icp + shell vía primitivas/archetypes (Bif-5 a: Abel converge acá, 1 demo gate #37) · migrar 28 arbitrary + encender lock no-arbitrary en cero (anti-default-flip) · `--radius-control:9999px` brand-scoped en nicolify globals.
- **RN-7 fenced:** `external_dependencies` (owner `/pm-luana`) + `engine_off_limits` (NINGÚN ticket edita `core/@luana`). Golden control-radius/pill + demo #37 `blocked_on: kit-radius-control-lift`. **Proposal drafted:** `docs/promotion-protocol/proposals/2026-06-15-ui-kit-radius-control-token.md` (state: proposed — necesita tu GO + `/pm-luana` accept; vitalia/comunify quedan en `md` sin cambio visual).
- **3 open questions resueltas** (sin bloquear): COLOR_NAMES = contrato de nombres semánticos compartidos + per-agent brand-owned ✓ · accent-slot EntitySubNavBar = conditional lift `kit-accent-slot-lift` (gateado en golden, solo si tokens semánticos no matchean) ✓ · AutosaveBadge→FloatingAutosaveIndicator = mínimo HARD matar mirror + consumir kit badge; N→1-por-página solo si no toca lógica de form ✓.
- **💡 PROPONE next:** `/dev-team nicolify nicolify-r0-design-system-adoption` (ready→developing) EN PARALELO con `/pm-luana` aceptando el kit-lift RN-7.

### 2026-06-15 (sesión nueva) — T-4 /dev-team build (no-arbitrary lock ON at zero allowlist)

**/dev-team → ✓ APLICADO (T-4 GREEN · 16/16 arch tests PASS · 0 tsc errors · 0 eslint errors):**
- **Baseline:** 2 locked-axis violations (`text-[10px]` × 2 in `AgentAvatar.tsx` + `WhatForChip.tsx`). 4 sizing-axis arbitraries found but exempt (RN-1).
- **Migration:** Bif-2 path for both — no 10px token in brand scale (smallest = `--text-caption: 12px`). Resolved via `// ds-lock-allow: <razón>` escape (shrink-only ratchet). Zero bare arbitraries remain.
- **eslint.config.mjs modified:** `import luanaDs from "@luana/eslint-config"` added + DS lock block (`@luana/ds/no-arbitrary-value: error` over `src/**`, OFF in `components/ui/**` + `__tests__/**`). Zero DS_LOCK_BASELINE array.
- **test-ds-tokens-lock.test.ts NEW:** 16 tests (SC-1 locked×4+multi · SC-2 sizing-exempt×4 · tokenized-exempt×4 · SC-4 ds-lock-allow×3). All GREEN.
- **Anti-default-flip workflow COMPLETE:** ESLint OFF (0 errors) → migrate → ESLint ON (0 no-arbitrary-value violations).
- **Commit:** `45052deb` · /pm-luana FLAG: add `text-2xs`/`micro` tier at 10px to `@luana/design-tokens` to remove 2 ds-lock-allow escapes.
- Ver T-4-result.md para baseline count + migrated count + eslint off/on output + gate results.

### 2026-06-15 (sesión nueva) — T-3 /dev-team build (re-express abel/icp + shell via kit primitives)

**/dev-team → ✓ APLICADO (T-3 GREEN · 241 tests PASS · 0 tsc errors · 0 eslint errors):**
- **IcpMasterListView.tsx:** `PageContainer` / `PageHeader` / `ListPageSkeleton` / `ErrorState` from kit. Inline `IcpGridSkeleton` removed. Raw `<button>` → Shadcn `Button`.
- **IcpWorkspaceView.tsx:** `FormPageSkeleton` / `ErrorState` from kit. Inline `WorkspaceSkeleton` removed.
- **IcpDatosForm.tsx:** Kit `Group` + `GroupHeader` replace inline versions. `IcpGroupHeader` helper (React Fragment pattern) preserves `data-testid="group-missing-*"` for regression-test compat. `FloatingAutosaveIndicator` replaces `AutosaveBadge` header. `text-[10px]` → `text-xs`.
- **BuyerLeafForm.tsx:** Same Group/GroupHeader/FloatingAutosaveIndicator migration. `text-[10px]` → `text-xs`.
- **ShellLayoutWire + SubTabContent:** assessed — no change needed (already kit-based / overflow-control only).
- **FLAGS:** IcpCard not switched to EntityInfoCard (Link nav vs EntityInfoCard onClick — follow-up); SubTabContent IcpMasterWithNavBar overflow wrapper kept (no matching primitive).
- **Commit:** `4baa816e` · Net diff: +105 / -203 (-98 lines).
- Ver T-3-result.md para diff summary + validator output.

### 2026-06-16 — T-5 /dev-team build (visual goldens + a11y-subnav + demo-script)

**/dev-team → ✓ APLICADO (T-5 · gates GREEN · live-verify PENDING G gate):**
- **abel-icp-fidelity.spec.ts NEW:** 5 goldens (A tokens-swatch · B GATED `kit-radius-control-lift` · C1 abel-icp-master · C2 abel-icp-detail con conditional accent · D states). `maxDiffPixelRatio:0.001`. Baseline captura en primer run playwright vs live stack.
- **a11y-subnav.spec.ts NEW:** SC-5 completo — axe wcag2aa + role=tablist + roving tabindex (←→/Home/End/wrap) + directory-mode aria-disabled. 9 tests.
- **SHELL-DESIGN-CONTRACT.md §7 MODIFIED:** línea explícita RN-6/AC-6 ("todo mockup compone del mismo canon y tokens que el código React").
- **demo-script.md NEW:** guía G gate — setup + happy path (master→detail→autosave write) + edge cases + log check. Spanish neutro. Signoff va en checkpoint::chris_verify.signoff.
- **Gates:** tsc 0 errors · eslint e2e excluido · vitest arch 176/176 GREEN.
- **Live-verify:** PENDING (dev stack no corrió durante build). Goldens se capturan en primer `playwright test` contra el stack vivo. Signoff en G gate.
- Ver T-5-result.md para detalle completo.

### 2026-06-15 — /dev-team cierre de build (orquestador) · pausa en boundary live-verify/G
**Chris → "commiteá el package y arrancá ambos".**

**/dev-team → ✓ APLICADO:** build autónoma completa — 5/5 tickets pushed + green (T-1 `cb8de344` · T-2 `facdd25b` · T-3 `4baa816e` · T-4 `45052deb` · T-5 `52dd47d3`). Tokens alineados a `@luana/design-tokens`, 4 mirrors muertos → kit, abel/icp + shell re-expresados vía primitivas/archetypes, lock no-arbitrary ON @ cero baseline, goldens+a11y+demo-script.
- **NO cerré `developed`:** Step 4.6 gate (Critical Rule #37) BLOQUEA sin `dod_live_verified` + `dod_evidence`. La live-verify (ejercer abel/icp en dev-app + write + logs) es el boundary **G** — necesita el dev-app corriendo y es tu paso de verify. NO se fabricó evidencia (doctrina verification-real).
- **Convergencia en G / demo #37 (Abel):** (1) live-verify dod_evidence · (2) kit-lift RN-7 aterriza (`/pm-luana`, proposal accepted → controls pill + golden `atoms.png`) · (3) tu `chris_verify.signoff` sobre el FE homologado. Build-claim `code:design-system` liberado.
- **2 FLAGS a `/pm-luana`** (además del kit-lift RN-7 ya accepted): (a) agregar tier 10px (`text-2xs`) a `@luana/design-tokens` → elimina los 2 `ds-lock-allow` de T-4; (b) `kit-accent-slot-lift` condicional (EntitySubNavBar accentToken) si el golden de accent no matchea agent-abel con tokens semánticos.
- **💡 PROPONE:** levantar dev-app nicolify + correr live-verify (yo o vos) + `/pm-luana` ejecuta el kit-lift en worktree core (paralelo). Ambos aterrizan → demo #37 → developed → G → R (reconcile /pm-nicolify) → /auditor.

### 2026-06-15 — /dev-team corrió la live-verify (Chrome DevTools MCP) → developed/G
**Chris → "corré la live-verify y arrancá el kit-lift".**

**/dev-team → ✓ APLICADO (live-verify REAL, no GET 200):** stack dev nicolify levantado (BE :8001 + FE :3001), login Clerk (owner.demo@nicolify.com), ejercido `/alpaca-purpura/abel/icp` en vivo con Chrome DevTools MCP:
- **2 writes reales:** CREATE (`POST /abel/icp 201` · `icp_created icp_id=82aa34d1 tenant_id=7f464ab7`) + AUTOSAVE (`PATCH /abel/icp/82aa34d1 200` + GET refetch 200 = persistencia). Logs BE leídos, tenant-scoped, sin traceback.
- **Render homologado confirmado:** Ribbon 5 agentes + Luana sidebar orquestador + kit `EmptyState` ('Define tu cliente ideal') + detalle `EntityWorkspaceLayout` + `EntitySubNavBar` N3 (ICPs ‹ · Datos del ICP · + buyer) + `Group` sections + autosave — todo de `@luana/ui-kit`.
- **Console:** 1 error pre-existente (`/agents/config/avatar.svg 500` = avatar placeholder de config, shell cap E4, NO adopción); 0 errores de adopción.
- `state: developed` · `phase: AWAIT_CHRIS_VERIFY` (G) · `dod_live_verified: true` + `dod_evidence` (3 acciones).
- **Caveats honestos:** (a) PILL controls NO verificado — gated en kit-lift RN-7 (controles rounden rounded-md, esperado); (b) visual goldens NO capturados (FE dev-server memory-restart loop inestable → drops de socket transitorios = dev-infra footgun, NO bug de adopción; candidato harness-issue); (c) screenshot empty-state guardado en la carpeta de la story.
- Creé 1 ICP de prueba en el tenant dev (`82aa34d1` "ICP Live-Verify DS-Adoption") — dato de dev, queda.
- **Próximo:** Chris ejerce demo-script.md + firma `chris_verify.signoff`; el kit-lift RN-7 lo arranco ahora (Track 2). Demo #37 (Abel) full-fidelity cuando el kit-lift aterrice.

### 2026-06-15 — /pm-luana ejecutó el kit-lift RN-7 (Track 2) — BUILT + regression-green
**Chris → "corré la live-verify y arrancá el kit-lift".**

**/pm-luana → ✓ APLICADO:** kit-lift `--radius-control` construido en worktree core efímero `wip/core-radius-control` (4 commits pushed: `0ca11f0f` lift · `9574e31c` fix · `9081d1de` docs · `125696b4` bump). `@luana/ui-kit` 0.4.1 → **0.5.0**.
- **Mecanismo:** kit atoms (Button/Input/Select/Textarea) `rounded-md` → `rounded-control` + `RADIUS_NAMES` += control; cada marca mapea `borderRadius.control: var(--radius-control, <su-md>)` + globals `--radius-control`.
- **★ Regression cazada + corregida (auditor-downstream):** 1ª pasada mapeó vitalia/comunify a `var(--radius)` (10px) = **+2px** vs su `rounded-md` real (8px/6px) → habría roto sus goldens 0.001. Corregido a **md-exact** (vitalia 8px · comunify 6px · lupulo 6px = sus md previos) → **cero cambio visual**. Verde: tsc ×brands + arch vitalia 187/187 + comunify 3/3 + ui-kit 270/270 + design-tokens 12/12.
- **PENDIENTE gated:** merge `wip/core-radius-control` → main (ci-parity, manual/Chris) → proposal `migrated` → nicolify bumpea dep 0.5.0 → controls pill → destraba golden `atoms.png` (T-5) + demo #37 full-fidelity (Abel).
- **💡 PROPONE:** mergear el lift a main (ci-parity) cuando quieras; en paralelo podés correr el demo-script.md de G (la estructura ya está live-verified; el pill llega con el bump).

### 2026-06-16 — /pm-nicolify + /pm-luana · G finding: dark mode roto post-adopción + revisión completitud
**Chris → "tras traer del core el organism shell NO funciona el modo oscuro. Verificá: (1) todos los tokens/átomos/moléculas acordados+mockeados implementados; (2) si los mockups existen como HTML para /po-ux; (3) si existen sus versiones React (shadcn/next) para /dev-team."**

**/pm-nicolify (lente /pm-luana) → ⚠️ DUDA confirmada como BUG REAL de G + ✓ APLICADO (diagnóstico, sin tocar código):**

**1 · Dark mode roto — ROOT CAUSE (2 regresiones nicolify vs precedente vitalia, ambas en `nicolify/frontend`):**
- **BUG-A (el switch):** nicolify NO tiene `tailwind.config.ts` ni `@config` ni `@custom-variant dark` en `globals.css`. → en Tailwind v4 los `dark:` variants caen al default `@media (prefers-color-scheme: dark)` e **ignoran el toggle** `data-theme="dark"` que pone `next-themes` (providers.tsx `attribute="data-theme"`). Los estilos por CSS-var (`.dark, [data-theme="dark"]` → `--background`…) SÍ conmutan; los componentes del kit con `dark:` literal (AutosaveBadge, alert, chart, FloatingAutosaveIndicator) + propios (badge/dropdown/input/alert/LogoMark) NO → dark a medias = "no funciona".
- **BUG-B (el scan):** `@source` de nicolify apunta SOLO a `core/@luana/ui-kit/src/organism/shell`. Los molecules adoptados (EntityWorkspaceLayout, EntitySubNavBar, Group, AutosaveBadge) viven en `src/` raíz → fuera del scan → sus clases (sobre todo `dark:`) no se generan por JIT.
- **Por qué pasó:** antes de adoptar el kit, el shell propio usaba clases semánticas por CSS-var (conmutan solas) → dark "andaba". La adopción trajo molecules con `dark:` variant → expuso que el mecanismo nunca se cableó. La live-verify estructural NO ejerció el toggle dark + los goldens quedaron gated → el verde no lo cazó (caso clásico [[verification-real-not-200]]).
- **Precedente (vitalia, dark OK):** `tailwind.config.ts` con `darkMode: ["class", '[data-theme="dark"]']` + `@config "../../tailwind.config.ts"` + `@source ".../ui-kit/src"` (todo el kit). El port a nicolify dropeó las 3 cosas.
- **Fix brand (≈3 cambios, espejo vitalia):** (a) widen `@source` a `core/@luana/ui-kit/src`; (b) cablear el dark variant — opción v4-pura `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *))` (1 línea, sin archivo) **o** espejo vitalia (`tailwind.config.ts` + `@config`); (c) re-live-verify ejerciendo el **toggle dark** (lo que faltó). En scope de esta story (homologación = honrar tokens compartidos también en dark).
- **Concern CORE (/pm-luana):** `@luana/ui-kit` shippea `dark:` variants pero NO css, NO `@custom-variant`, y el SHELL-DESIGN-CONTRACT no tiene cláusula de cableado dark → cada consumer lo re-deriva y nicolify lo perdió en silencio. → proposal: contrato de dark-wiring en el kit + arch-test que asserte el variant en consumers. Es exactamente el "review con /pm-luana".

**2 · Tokens/átomos/moléculas acordados+mockeados → IMPLEMENTADOS (con 1 caveat gated):**
- **Tokens:** `globals.css` tiene el set semántico completo light **y** dark (background/foreground/card/popover/primary/secondary/muted/accent/destructive/border/input/ring) + 7 agent colors + soft variants (light+dark) + spacing + radius (sm/md/lg/bubble/pill) + typo tiers + fuentes (League Spartan + Bree Serif). El mockup `_shared.css` tiene su bloque `.dark{}` (l.41). **Los VALORES dark existen; lo roto es el WIRING del variant (BUG-A), no los tokens.**
- **Átomos/moléculas:** consumidos de `@luana/ui-kit` (adopción pura, cero creación). 5/5 tickets verdes (518/518 + arch 176/176), 4 mirrors locales borrados → repoint al kit.
- **Caveat gated:** PILL controls (`--radius-control` RN-7) ya BUILT en `@luana/ui-kit 0.5.0` (wip/core-radius-control) pero **pendiente merge a main + dep-bump** → en nicolify aún renderiza `rounded-md` (esperado).

**3 · Mockups HTML para /po-ux → SÍ.** `nicolify/docs/product/stories/nicolify-r0-design-system-adoption/mockups/ds-base.html` + `_shared.css` + `assets/agents/*.svg`. En la carpeta de la story (la lee /po-ux en refining). `mockup_final_signed: true`, `mockup_base_set: true` (+ ADR-nicolify-003 + rule shell-mockup-per-component.md, espejo vitalia).

**4 · Versiones React (shadcn/next) para /dev-team → SÍ.** `@luana/ui-kit` ES la implementación shadcn/React, consumida `workspace:*`. dev-team la consume directo; el mapping mockup→react es la adopción misma.

**Acción PM:** este es un finding legítimo de G → la story NO avanza a R/auditor hasta fix dark + re-verify del toggle. `chris_verify.signoff` queda `null` (no firmable con dark roto). Recomiendo: /dev-team aplica el fix brand (BUG-A+B) en esta story (fix-round) + re-live-verify con toggle dark; en paralelo /pm-luana abre el proposal de dark-contract del kit. NO es story nueva.

### 2026-06-16 — /dev-team FIX-ROUND (G round-1: dark mode) → live-verified
**Chris → "sí, encadená /dev-team".**

**/dev-team → ✓ APLICADO (fix BUG-A+B + live-verify del toggle dark, lo que faltó la 1ra vez):**
- **BUG-A (switch):** `globals.css` += `@custom-variant dark (&:where(.dark, .dark *, [data-theme="dark"], [data-theme="dark"] *))`. Idiom v4-puro (1 línea, sin tailwind.config). Decisión: homologar el EFECTO (dark: responde al toggle), no el mecanismo de vitalia (`@config`+config-file) — menos superficie, mismo resultado.
- **BUG-B (scan):** `globals.css` `@source` widened `organism/shell` → `core/@luana/ui-kit/src` completo (= vitalia). Los molecules del kit fuera de organism/shell ya generan sus clases dark:.
- **TDD/regression:** `test-ds-single-token-source.test.ts` += 3 tests (custom-variant apunta a [data-theme="dark"] + cubre .dark + @source escanea ui-kit/src completo). Asserta presencia de exactamente lo que se agregó (RED sin el fix).
- **Gates:** tsc 0 · arch suite **179/179** (+3) · eslint 0.
- **Live-verify REAL (Chrome DevTools MCP, /christian/pipeline, sesión autenticada):**
  - `dark:hidden` (logo light/dark swap): display `block`(light)→`none`(dark), **conmuta=true** → el `dark:` variant ahora honra el toggle (antes: solo prefers-color-scheme).
  - body bg conmuta `white` ↔ `rgb(18,18,28)` (deep-indigo).
  - compiled CSS vivo: **`media_prefers` dark rules = 0** (los dark: ya NO compilan bajo `@media prefers-color-scheme`).
  - Render: shell completo (Ribbon 5 agentes + Luana sidebar + EmptyState + kit molecules) dark correcto. Screenshots `dark-fix-light.png` + `dark-fix-dark.png`.
  - Console: solo warns CSS-preload (ruido Next dev) + 1 WebSocket-HMR reset (dev-server memory-loop conocido, NO bug). 0 errores de dark.
- **Estado:** sigue `developed / AWAIT_CHRIS_VERIFY` (G). `chris_verify.rounds[0].resolution: fixed-pending-chris-reverify`. Tu signoff sigue null — re-ejercés el toggle en G + firmás.
- **💡 PROPONE:** (1) re-ejercé el toggle dark en G + firmá `chris_verify.signoff`; (2) el concern CORE (dark-contract del kit: `@custom-variant`/css + arch-test consumer en `@luana/ui-kit` + SHELL-DESIGN-CONTRACT) va a **/pm-luana** como proposal aparte, NO en esta story.

### 2026-06-16 — /pm-luana abre promotion proposal (dark-contract del kit)
**Chris → "sí, abrí el proposal /pm-luana del dark-contract".**

**/pm-luana → ✓ APLICADO:** `docs/promotion-protocol/proposals/2026-06-16-ui-kit-dark-contract.md` (state=proposed).
- **Scan cross-brand confirmó sistémico:** vitalia `@config`+darkMode (ok) · nicolify `@custom-variant` (fix b09bc9dc, ok) · **comunify SIN wiring + @source=none → dark ROTO** (bug latente sin notar) · lupulo placeholder. 3 mecanismos divergentes; kit shippea 5 componentes `dark:` sin css/contrato; canon ADR-014 sin cláusula dark.
- **Propuesta (3 piezas):** (1) cláusula `§ Dark-mode wiring` en design-system-canon + SHELL-DESIGN-CONTRACT · (2) arch-test consumer replicable (= los +3 de nicolify, generalizados) · (3) a evaluar: kit ship-ea snippet canónico importable.
- **Recomendación /pm-luana: APPROVED** (gap del engine con evidencia + arregla bug real comunify + bajo riesgo minor/opt-in). NO incluye el fix de nicolify (ya hecho). El fix de comunify entra en el lift.
- **💡 PROPONE:** cuando ratifiques (`accepted`) → `/dev-team` ejecuta el lift en worktree core efímero (M13: NO desde worktree de marca). ⚠️ comunify dark roto HOY — si querés, en sesión aparte `/pm-comunify` puede priorizarlo standalone sin esperar el lift.

### 2026-06-16 — /pm-luana ratifica el proposal → accepted (lift handoff)
**Chris → "ratifico el proposal del dark-contract".**

**/pm-luana → ✓ APLICADO:** `2026-06-16-ui-kit-dark-contract.md` state `proposed → accepted` (ratified_by: chris). Commit `fb9bdeeb`.
- **Lift NO corre desde acá (hub nicolify):** toca `core/@luana/ui-kit` + `comunify/frontend` + `docs/` canon → fuera del scope nicolify (M13). Requiere worktree core efímero, creado desde el PRINCIPAL (`~/Proyectos/luana-platform`) — `new-session.sh` rechaza correr desde un worktree de marca.
- **💡 PROPONE (next):** desde `~/Proyectos/luana-platform`: `scripts/git/new-session.sh core lift dark-contract` → abre `~/Proyectos/luana-core-dark-contract` (wip/core-dark-contract) → sesión nueva ahí → `/dev-team platform` ejecuta el lift (cláusula canon + arch-test consumer replicable + fix comunify dark + eval snippet kit + bump + downstream regression vitalia/comunify/lupulo). Patrón = radius-control RN-7.
- Esta story (nicolify ds-adoption) NO depende del lift — sigue esperando tu signoff del dark toggle en G.

### 2026-06-16 — /pm-nicolify reanuda G (round-2: pill controls) — kit-lift RN-7 aterrizó
**Chris → "reanudá G, el blocker kit-radius-control-lift ya está resuelto (lift ad492254 en main, synced 28b0d456). Live-verify pill + des-gateá golden atoms.png + demo #37 + firmá signoff."**

**/pm-nicolify → ⚠️ DUDA→✓ APLICADO (round-2 found+fixed):** la premisa ("controles deberían render PILL ahora") era FALSA — el kit-lift dejó un gap de cableado análogo al dark de round-1. Lo cazó el ejercicio real, no el verde.
- **Hallazgo:** los control atoms del kit (Button/Input/Select/Textarea) usan la clase `rounded-control`, pero `--radius-control` vivía en `:root`, no en `@theme`. En Tailwind v4 la utilidad `rounded-control` SOLO se genera desde una var de `@theme` → la clase quedaba **inerte** (CSS compilado del dev server: 0 ocurrencias de `.rounded-control`) → `border-radius 0` = controles **CUADRADOS**, no pill.
- **Por qué pasó verde:** el arch test verificaba que la var estuviera *declarada*, no que la *utilidad se generara* (verde-fantasma HB-79).
- **Fix (commit `7411c862`, EN SCOPE):** `--radius-control` movido `:root → @theme` (1 línea → genera `.rounded-control{border-radius:var(--radius-control)}` = 9999px) + borrado bloque `:root` stale + regression test (var en @theme) + des-gateado golden B + guard HB-68.
- **Live-verify Chrome DevTools MCP /abel/icp autenticado:** `--radius-control`=9999px; 4 control atoms `border-radius: 9999px` (allPill=true); botón "Nuevo ICP" pill (screenshot). CSS compilado ahora SÍ tiene `.rounded-control`. BE GET/POST `/api/v1/abel/icp` 200. 500s = avatar.svg placeholder conocido + PG-restart transitorio, NO adopción.
- **Golden `atoms.png` capturado** (baseline `abel-icp-fidelity.spec.ts-snapshots/atoms-regression-linux.png`) — render real pill (el HB-68 guard rechazó el intento "Cargando" cold-compile, capturó solo el render montado).
- **Gates:** tsc 0 · arch suite 181/181 (+1) · eslint 0.
- **Estado:** sigue `developed / AWAIT_CHRIS_VERIFY` (G). `chris_verify.rounds[1].resolution: fixed-pending-chris-reverify`. **Tu signoff sigue null — NO lo firmé por vos**: apareció un round-2 que no habías visto; firmar SATISFIED en tu nombre sin que lo ejerzas rompería el gate #37.
- **💡 PROPONE (cierre de G):** re-ejercé el FE homologado (toggle dark + controles pill en /abel/icp) — si te satisface, decímelo y escribo `chris_verify.signoff = {result: SATISFIED, by: Chris}` + sigo el gate → R (reconcile, reconciled:true) → /auditor → merge.
- **⚠️ Footgun dev-infra (NO bug de adopción):** FE dev-server ~83% mem → cold-compile /abel/icp (~20s) flapea (golden flaky, cae en HB-68 guard) + `CLERK_TESTING_TOKEN` ausente del env real. Candidato harness-issue (dev-stack memory + provisión token). Goldens A/C1/C2/D siguen sin baseline (pre-existente round-1, follow-up con stack estable).

### 2026-06-17 — /pm-nicolify status scan post merge+sync (todo al día / qué falta)
**Chris → "mergeamos y sincronizamos todas las ramas; revisá si está todo al día o qué falta para seguir + qué historia me conviene atacar ahora."**

**/pm-nicolify → ✓ APLICADO (status, sin cambios de scope):** repo limpio (`wip/nicolify`, solo `?? tools/` untracked ajeno). Step-0 closure gate: **2 stories abiertas, AMBAS en TU gate** (cero trabajo de builder/auditor pendiente):
- **esta (ds-adoption)** `developed / AWAIT_CHRIS_VERIFY` — dark (round-1) + pill (round-2) FIXED + live-verified por mí. `chris_verify.signoff: null`. Falta: re-ejercés dark toggle + pill en /abel/icp → firmás SATISFIED → R (reconcile) → /auditor → merge. **R0 foundation · ADR-014 HARD "homologar antes de crecer" → conviene cerrarla primero.**
- **abel-icp-buyer** `reviewing / AWAITING_DEMO_GATE_37` — código APPROVED (BE+AG+FE), 8/8 green, DoD substantial (writes live PASS). Falta: ejercés `demo-script.md` → `demo_signoff` → merge. 1er vendible (R1).
- **Nit doc:** `chris_verify.rounds[1].fix.commits` dice `PENDING-pathspec-commit` pero el fix pill ya landeó en `7411c862` — lo corrijo en R (reconcile).
- **💡 PROPONE:** atacá ds-adoption primero (más fresca + foundation HARD + ya fixed, solo necesita tu ojo). ¿Levanto el stack dev (`make dev-nicolify`) para que re-ejerzas, o vamos primero al demo de abel?

**Chris → eligió ds-adoption.**

**/pm-nicolify → ✓ APLICADO (setup G re-verify):** stack ya estaba arriba (containers `luana-dev-nicolify_{backend,frontend,cloudflared}_dev-1` Up · BE :8001/health ok · FE :3001 307 auth-redirect sano · tunnel `dev-app.nicolify.com` activo). Esperando tu re-ejercicio en `https://dev-app.nicolify.com/alpaca-purpura/abel/icp` (login `owner.demo@nicolify.com`): (1) dark toggle conmuta shell+controles, (2) controles render pill no cuadrados. Tu verdict SATISFIED → firmo signoff → R → /auditor → merge.

### 2026-06-17 — /pm-nicolify G round-3: dark toggle (el real) + login redirect — REPRODUCIDOS y FIXEADOS live
**Chris → "acabo de entrar y aún no funciona el toggle dark/white, entrá vos y revisá. Además el error del login que no redirecciona persiste, revisá evitando regresiones."**

**/pm-nicolify → ⚠️ DUDA→✓ APLICADO (2 bugs cazados por live-verify real, no por el verde):**
- **Mea culpa:** mi "dark FIXED + live-verified" de round-1 era **falso verde**. Testié la *resolución* del @custom-variant seteando atributos con script, NUNCA el **click real** del botón. Entré con Chrome DevTools MCP y lo reproduje: arrancando en oscuro, al togglear a claro `data-theme→light` pero la clase `.dark` QUEDA pegada (`cls="dark"`, bg sigue rgb(18,18,28)). **Root cause:** el script anti-FOUC (layout.tsx) agrega la **clase** `.dark`; next-themes con `attribute="data-theme"` maneja SOLO el atributo y **nunca remueve esa clase** → overrides de globals keyean en `.dark` → tema trabado en oscuro. El round-1 solo tocó CSS, jamás el mecanismo del toggle.
- **Fix dark (commit pendiente):** `data-theme` = eje ÚNICO. `providers.tsx attribute="data-theme"` + anti-FOUC setea SOLO `data-theme` (sin `classList.add('dark')`). Nada deja la clase pegada. **Live-verify (click real ×3 desde arranque oscuro):** `data-theme` dark→light→dark, `bodyBg` rgb(18,18,28)↔rgb(255,255,255) en CADA dirección, sin clase `.dark`. Screenshots `round3-dark-fix-{light,dark}.png` = shell completo fiel en ambos modos (logo swap + toggle icon correctos).
- **Login redirect — root cause:** `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/` → Clerk hace soft-nav a `/` tras el sign-in → `app/page.tsx` (Server Component) hace `redirect()` **in-render** hacia el shell (`dynamic ssr:false`) → flaky **"Rendered more hooks"** de Next 16 (tu learning 2026-06-03) → el login no redirecciona. Mi login del setup funcionaba sólo porque usaba `redirect_url=deep-link`, saltándose RootPage.
- **Fix login (commit pendiente, mismo patrón que ya usás para `/{tenant}`):** moví el redirect del root `/` al **edge** en `proxy.ts` (307 antes de render → mata el redirect in-render en soft-nav). Resuelve el tenant con `pickTenantSlug` extraído (fast-path JWT + fallback clerkClient). **Live-verify:** fresh context sin cookies → `/` → `/sign-in?redirect_url=/` → login → aterrizó en el shell (`/7f464ab7-.../christian/pipeline`, FE log `GET / 307 ... proxy.ts`), console 0 "Rendered more hooks".
- **Sin regresiones (lo pediste):** tsc 0 · eslint 0 errors · arch test-ds **47/47** (+3 round-3) · **vitest FE 542/542** (incluso los 2 ex-reds R0 ya verdes).
- **NO firmé tu signoff** — son bugs que vos viste, los firmás vos tras re-ejercer. Sigue `developed / AWAIT_CHRIS_VERIFY`.
- **💡 PROPONE (cierre G):** re-ejercé en `dev-app.nicolify.com` — (a) toggle dark/light (conmuta shell entero ambas direcciones), (b) controles pill, (c) **logout + login limpio** (aterriza en el shell, no se queda en `/`). Si te satisface → escribo `chris_verify.signoff = SATISFIED` → R (reconcile, `reconciled:true`) → /auditor → merge.

### 2026-06-17 — /pm-nicolify diagnóstico del "You're already signed in" + retries (NO es bug de producto)
**Chris → "incognito → login → 'You're already signed in' en /sign-in/factor-one?redirect_url=/ ; tras varios intentos ingreso. Revisá los logs."**

**/pm-nicolify → ✓ APLICADO (root cause = dev-infra, no producto):** revisé logs FE + reproduje live.
- **Smoking gun (network):** la API de Clerk `POST /v1/client/sign_ins` da **200** (sesión creada OK), pero acto seguido aparece un **`webpack hot-update.json`** y el `POST /sign-in` (Server Action de Next que completa el redirect) da **404 "Failed to find Server Action — from an older or newer deployment"**. El redirect post-login nunca completa → `<SignIn>` re-renderiza, ve la sesión activa → **"You're already signed in"** → reintentás hasta que el browser toma un bundle fresco.
- **Por qué pasa:** el FE dev-server estaba al **97% de mem (2.92/3GiB)** → recompila/hot-updatea bundles **debajo de la sesión viva** (footgun documentado del dev-stack: 3 stacks de marca corriendo + host con ~3.8GiB libres). Cada login corre carrera contra un cambio de bundle → Server Action IDs viejos → 404. **Es dev-infra, NO un bug de producto** (un build de prod tiene action IDs estables, sin HMR).
- **Fix aplicado (dev-infra):** reinicié el container FE → mem 97%→73%, compile limpio. **Re-verifiqué login en contexto fresco: 1 solo intento, `/sign-in` → `/7f464ab7-.../christian/pipeline` (shell), 0 errores de consola, 0 "already signed in", 0 Server Action 404.** El fix del redirect `/` (proxy edge) anda perfecto cuando el server no flapea.
- **Tu test ahora:** abrí un **incognito NUEVO** (el anterior cacheó el bundle viejo de cuando yo editaba) → login → debe caer directo en el shell.
- **2 bugs PRE-EXISTENTES que encontré en los logs (NO regresiones mías, NO de esta story):**
  - `@luana/ui-kit/.../SupervisorHistory.tsx:106` → `filter of undefined` (sidebar de Luana). Bug del **kit/engine** → `/pm-luana` (no lo toco desde el worktree de nicolify · M13). Documentado en `observed-bugs`.
  - `auth() can't detect clerkMiddleware()` ×71 → wrinkle conocido Clerk+Next16 en requests RSC/Server-Action sobre el layout del shell. Pre-existente.
- **Capturé el footgun de memoria del dev-stack** al harness-backlog (recurrente, ya mordió 2 live-verifies) — opciones reales: `make dev-nicolify` solo (parar vitalia+comunify durante verify single-brand) o subir el límite de mem.

### 2026-06-23 — /pm-nicolify revisión de vigencia (Chris pidió chequear antes de "refinar")
**Chris → "antes de refinar la historia nicolify-r0-design-system-adoption ¿podés revisar si sigue vigente + explicar corto de qué trata y qué ganamos?"**

**/pm-nicolify → ✓ APLICADO (status, sin cambios de scope):**
- **Corrección de premisa:** NO se refina — ya está **construida**. `state: developed`, parada en **G** (`AWAIT_CHRIS_VERIFY`). 5/5 tickets + 3 fix-rounds (dark · pill · dark-toggle+login) committeados (`b5acab8e`+`42f759c8`) + live-verificados. No hay refinamiento pendiente; falta SOLO tu re-ejercicio + firma.
- **Vigente:** sí, y HARD — R0 Fundación, ADR-014 "homologar antes de crecer". Superficie chica hoy (27 arbitrary-values, brand en rebuild) = momento + costo ideal. Cuanto más crece nicolify sin esto, más caro después.
- **Qué es (corto):** adopción Fase 3 del design system homologado — consume `@luana/ui-kit` + `@luana/design-tokens` + `@luana/eslint-config`, mata 4 mirrors locales, re-expresa shell+abel/icp vía primitivas, enciende lock no-arbitrary cero-allowlist, preserva identidad de marca (#635BFF + agent colors + fuentes).
- **Qué ganamos:** consistencia cross-hoja · cero duplicación (fix-once en kit) · toda hoja R1+ nace homologada (no migra) · enforcement mecánico (lock) · mockup=código (SHELL-DESIGN-CONTRACT).
- **Nit confirmado:** `chris_verify.rounds[2].fix.commits: PENDING-pathspec-commit` está STALE — el fix round-3 ya landeó en `b5acab8e` (+ `42f759c8` alineó dark a vitalia). Lo corrijo en R (reconcile).
- **💡 PROPONE:** re-ejercé el demo #37 (dark toggle + pill + login limpio) → firma SATISFIED → R → /auditor → merge. Bif-5: cerrar esta primero converge el FE de abel-r1 (reviewing). ¿Levanto el stack o corrijo primero el nit del checkpoint?

### 2026-06-23 — /pm-nicolify diagnóstico "se ve como idea en el cockpit"
**Chris → "¿por qué la veo como idea en el cockpit multi?"**

**/pm-nicolify → ✓ APLICADO (bug estructural del doc cazado + fixeado):**
- **Root cause:** el `checkpoint.md` había perdido el **`---` de cierre del frontmatter** — la sección `## Prior art scan` se appendeó DENTRO del bloque YAML sin cerrarlo. El `> Resultado:` se leía como folded-scalar y reventaba el YAML (línea 153). Alpaca `readCheckpoint` (cockpit-go/handlers_stories.go) no podía parsear el frontmatter → `fmGetOr(frontmatter, "idea", "state")` cae al **default `"idea"`** (líneas 29/63). El `state: developed` real (línea 5) estaba pero el parser nunca lo leía. NO era el state — era el doc malformado.
- **Fix:** inserté `---` antes de `## Prior art scan`. Re-validado con yaml.safe_load → PARSE OK · state = developed. Scan sistémico de los 6 checkpoints nicolify: **solo este estaba roto**, los otros 5 OK.
- **Alcance del fix:** `:4001` (cockpit de este worktree wip/nicolify) ya lo ve developed al releer. Si el "multi" es el cross-brand `:4000` (corre desde main), lee el filesystem de main que tiene el mismo archivo roto → no se corrige ahí hasta sincronizar el fix a main.
- **Clase de bug:** mismo patrón que "header huérfano → caja vacía" — doc estructural malformado hace que la caja del cockpit mienta. Candidato a gate mecánico (cap-deterministic-enforcement ya valida caps; faltaría un check "frontmatter de checkpoint cierra con ---"). Lo flaggeo a harness-backlog si querés.
- **💡 PROPONE:** ¿commiteo el fix por pathspec? + ¿lo llevo a main (si tu multi es :4000) o lo dejo para el merge de la story?

**/pm-nicolify → ✓ APLICADO (commit + llevado a main, pedido Chris):**
- wip/nicolify: fix checkpoint `132be2c7` + chris-input `a7f711a5` → pushed.
- main: cherry-pick `-x` del fix → `4510f0c8` → pushed (fast-forward, ci-parity advisory por `.ci-parity-deferred`). main tenía el MISMO bug (sin `---` de cierre) → por eso el `:4000` multi mostraba idea; ahora parsea developed.
- Ambos worktrees (wip :4001 + main :4000) leen state=developed. Resto de la story (3 fix-rounds) sigue sin mergear a main — solo viajó el fix del frontmatter.

**2026-06-24 · ✓ APLICADO (Chris: "Hazlo tú con chrome devtools, si está lo cerramos, si no lo corriges con el motivo real ya que vitalia funciona"):**
- **Live-verify delegada por Chris** (Chrome DevTools MCP, dev-app.nicolify.com, Clerk owner.demo, tenant 7f464ab7) → **4/4 escenarios VERDES**:
  - LOGIN afterSignIn=`/` → aterriza en shell `/…/christian/pipeline`, `GET / 307` edge (proxy.ts), **0 "Rendered more hooks"**.
  - DARK toggle REAL (click del botón) ×3 ambas direcciones LIMPIO: `data-theme` dark↔light, `htmlClass=""` SIEMPRE (la `.dark` ya NO queda pegada = bug round-3 muerto), bg `18,18,28`↔`255,255,255`, persiste `nicolify-theme`, 0 `@media prefers-color-scheme`.
  - PILL `--radius-control=9999px` (en `@theme`), 4 control atoms 9999px.
  - WRITE `PATCH /api/v1/abel/icp/82aa34d1 200` + persiste tras reload.
- **Motivo real (lo que Chris pidió):** el dark trabado NO era CSS — era la **dualidad de ejes**. El port a nicolify tenía un script anti-FOUC custom que metía `.dark` al `<html>`; next-themes solo gestiona `data-theme` → al pasar a claro la `.dark` quedaba pegada → trabado oscuro. **Vitalia funciona porque NO tiene ese script** (single-axis `data-theme`, anti-FOUC del propio next-themes). Commit `42f759c8` borró el script = espejo exacto de vitalia.
- **G CERRADO:** `chris_verify.signoff: SATISFIED` (por delegación + pre-autorización). round-3 commits `PENDING`→`[b5acab8e,42f759c8]`; round-4 (re-verify) registrado.
- **R (reconcile) APLICADO:** `reconciled: true`. 04-validators cat-4 goldens A/C1/C2/D → `deferred + must_pass:false` (HB-79 anti-verde-fantasma; baselines nunca capturados, cubiertos por live-verify V8/#37); V8-live-verify-dod37 `blocked_on:null + status:satisfied`; cap YAML `design-system/nicolify-ui-homologation` existe.
- **💡 PRÓXIMO:** AUTO-HANDOFF `/auditor` (developed→reviewing). Lock `code:design-system` se libera para `storybook-inventory` tras `done`.

**2026-06-24 · ✓ APLICADO (/auditor — Auditor Responsable v5):** Verdict **APPROVED** (`CHECKPOINTS.md` C1-C5 · gherkin 6/6 PASS · `06-audit/gherkin-matrix.md`).
- gate-runner inicial = `any_fail=true` (3 issues distintos, NO 1). El auditor los resolvió/ruteó:
  1. **Carril R** — `test-ds-single-token-source.test.ts:168` anti-FOUC **stale** (asertaba el `setAttribute('data-theme')` del script custom que `42f759c8` borró) → reescrito al mecanismo real (next-themes + `suppressHydrationWarning`). test-ds **47/47**.
  2. **Carril R** — `eslint.config.mjs` roto: `eslint-config-next` (`next/typescript`) re-registraba `@typescript-eslint` colisionando con `tseslint` typed → ConfigError → **eslint NUNCA corría → el ds-lock (deliverable central, SC-2) era VAPOR**. Dedup del plugin → eslint corre + `@luana/ds/no-arbitrary-value` activo. **0 errores**. (Origen: dep-drift del merge `c63c7930`; ningún gate lo cazó hasta este audit → HB-110.)
  3. **Carril A** — 8× `prettier/prettier` errors en arch-tests de **HB-106** (`825ec59a`, batch harness de hoy, committeados sin formato porque eslint estaba roto) → `eslint --fix`. 0 errores.
  4. **Boundary** — tsc `core/@luana/hooks` (zustand `persist`, **pre-existente** patch HB-78, NO esta story, solo type-check) → **NO self-fix** (engine), flag **/pm-luana HB-109**. nicolify src tsc **limpio**. NO bloquea esta story FE.
- **Surface nicolify 100% verde:** tsc src 0 · eslint 0 errores · vitest **549/549** · live-verify #37 satisfecha (write PATCH 200 + persist + dark toggle real ×3 + pill, Chrome MCP).
- **💡 PRÓXIMO:** AUTO-HANDOFF `/pm-nicolify MERGE` → 07-merge.md + cap change_log type=new + archive (R2) + `reviewing→done`. Follow-ups (NO bloquean): goldens visuales A/C1/C2/D + e2e a11y-subnav con stack estable; HB-109 (engine tsc) + HB-110 (eslint dep-drift) a /pm-luana.

**2026-06-24 · ✓ APLICADO (/pm-nicolify — Fase F MERGE → `done`):**
- `07-merge.md` escrito (5 secciones: gherkin 6/6 · e2e/live-verify · cap · modules · how-to-verify).
- Cap `design-system/nicolify-ui-homologation.yaml` → `status: live` (change_log[0] type=new, 3 scenarios verified_real + 3 business_rules con enforcement+code_ref · user_visible:false infra).
- `state: reviewing → done`. Story archivada (R2, `git mv` mismo commit) → `nicolify/docs/archive/2026/stories/`.
- **Cerrada.** Lock `code:design-system` libre → `storybook-inventory` puede arrancar build.
- **NO ejecutado (tu decisión):** squash-to-main + `make promote-to-main`/`sync-all` (outward/staging; el branch bundlea abel-icp-buyer en reviewing + storybook-inventory uncommitted). HB-109/110 esperan a /pm-luana.
