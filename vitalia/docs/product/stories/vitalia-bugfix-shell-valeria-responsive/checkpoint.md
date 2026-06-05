---
story_id: vitalia-bugfix-shell-valeria-responsive
type: bugfix

# Release entity (contenedor temporal · lifecycle.md § 5)
release: F3

# Capability lineage
cap_target: null                    # higiene UX cross-cap del shell-organism (como vitalia-bugfix-shell-nav-scroll-errors)
cap_change_type: fix                # corrige el squeeze (BUG #1) + ajusta defaults responsive del shell
parent_story: null

state: idea
module: shell
agent_owner: null                   # shell-organism transversal (no es de un agente)
map_zone: infraestructura           # superficie no-funcional del shell (wrapper), no una caja de agente
last_modified: 2026-06-04T00:00:00-05:00

# Naturaleza de verificación (DoD #37 / definition-of-done-live-verify)
verification_nature: funcional      # user-reachable (layout visible) → demo manual + anti-burbuja + live-verify
demo_required: true

repro_evidence: vitalia/docs/observed-bugs/2026-06-04-shell-valeria-squeeze-plus-darkmode.md   # BUG #1 (responsive squeeze)

next_action: >-
  Story en `idea`. Próximo: /po-ux (o /pm-vitalia) refina los 3 puntos de Chris en 01-spec
  (RN + AC + mapa funcional + propuesta tablet) → /architect (toca shell-store + useViewportGuard
  + ShellOrganismLayout + ValeriaSidebar/Rail) → /dev-team → live-verify (AC del shell + desbloquea
  AC-4/5/7 del inbox) → demo Chris. Coordinar bucket lock `code:shell` (cross-tab). NO 2 stories
  del shell en developing a la vez.
---

# vitalia-bugfix-shell-valeria-responsive — checkpoint

## Goal

Mejorar el responsive del shell-organism para que **Valeria deje de exprimir el contenido del agente** a anchos comunes (1104–~1400px). Tres cambios pedidos por Chris (ver `chris-input.md` verbatim):

1. **Rail del historial collapsed por default.** El rail de historial de Valeria arranca colapsado (hoy arranca abierto/rail visible).
2. **Default 30/70 en vez de 50/50.** El estado 'full' de Valeria (hoy ~50/50) pasa a **Valeria 30% / agente 70%** por default — **conservando que sigue siendo resizable** por el usuario (el splitter no desaparece; solo cambia el default).
3. **Tablet.** Revisar + **proponer** cómo se comporta el shell en tamaños tablet (≈768–1024px): ¿Valeria rail forzado? ¿drawer? ¿overlay? Entregar propuesta antes de implementar.

## Anti-objetivos

- NO tocar el **dark mode** (BUG #2 del observed-bug — `vt-*` sin variante dark) → story hermana separada (token audit).
- NO re-hacer el ContactSidebarToggle (BUG #3 — ya existe en `ThreadHeader`).
- NO romper el comportamiento mobile (<768px) existente (drawer governado por `mobileDrawerOpen`, ADR-vitalia-006 § D5).
- NO romper la persistencia del splitter/valeriaState (next-themes-style persist en shell-store, ADR-vitalia-006).

## Estado actual del shell (análisis 2026-06-04 · para architect/builder)

- **Splitter / valeriaState:** `src/stores/shell-store.ts` — `valeriaState ∈ {collapsed, rail, full}` (persistido, ADR-vitalia-006). El default + el ancho de 'full' (~50/50) viven acá / en `ShellOrganismLayout.tsx`.
- **Viewport guard:** `src/components/shared/shell-organism/useViewportGuard.ts` — `FULL_STATE_MIN_VIEWPORT = 1104` (Valeria 620 + handle + app 480). Fuerza 'full'→'rail' SOLO en [768,1104). **El supuesto app=480px es la causa del squeeze**: las sub-tabs de agente (inbox 3-pane) necesitan ~640+. Con el cambio a 30/70 el app-panel gana ancho; revisar si el umbral 1104 sigue sirviendo o sube.
- **Historial rail:** `ValeriaSidebar.tsx` / `ValeriaHistory.tsx` — el rail de historial. Punto 1 = default collapsed.
- **Layout:** `ShellOrganismLayout.tsx` — compone Valeria-side + app-panel (el splitter 50/50).
- **Medición live (Chrome MCP, viewport 1280, Valeria full):** Valeria-side ~584px, app-panel `inbox-desktop` 696px → thread del inbox 56px. Con 30/70: Valeria ~384px, app ~896px → inbox 3-pane (list 320 + contact 320 + thread 256) usable; con ContactSidebar cerrado, thread ~576px.

## Acceptance (borrador — /po-ux refina)

| AC | Verificación |
|---|---|
| AC-1 | Por default, el rail de historial de Valeria arranca **collapsed** (fresh load, sin persistencia previa) |
| AC-2 | El default de Valeria 'full' es **30% / 70%** (no 50/50); el agente recibe ~70% del ancho |
| AC-3 | El splitter **sigue resizable** — el usuario puede mover Valeria a otro ancho; se persiste (ADR-006) |
| AC-4 | A 1280px con Valeria 'full' default, el contenido del agente (inbox thread) es **usable** (no exprimido a <~300px) — desbloquea los e2e modes/states del inbox |
| AC-5 | **Tablet (768–1024):** propuesta documentada + implementada (rail forzado / drawer / overlay — a definir en spec) |
| AC-6 | Mobile (<768) sin regresión (drawer `mobileDrawerOpen` intacto) · persistencia valeriaState intacta |
| AC-7 | Dark mode NO en scope (story hermana) · live-verify dev-app + demo Chris |

## § Tablet — propuesta (Punto 3 de Chris · review + recomendación)

**Problema en tablet:** los breakpoints actuales tratan 768–1104px como "desktop angosto" → `useViewportGuard` fuerza Valeria 'full'→'rail', pero el rail INLINE igual consume ancho. A 768 con rail (~72px) el app-panel queda ~696px → el inbox 3-pane vuelve a exprimir el thread (56px). O sea: en la franja tablet, partir la pantalla entre Valeria + agente (aunque sea rail) no alcanza para el contenido de 3 paneles.

**Tres tiers propuestos (revisar con Chris):**

| Tier | Ancho | Valeria | Agente | Racional |
|---|---|---|---|---|
| **mobile** | < 768 | **drawer/overlay** (`mobileDrawerOpen`, ya existe) | full width, single-panel | sin cambio (ADR-006 § D5) |
| **tablet** | 768–1024 | ★ **drawer/overlay** (extender el patrón mobile hasta `lg`) — NO inline | **full width** → el agente reflowea internamente (inbox: auto-colapsa ContactSidebar o usa su layout tabs) | partir la pantalla a esta franja exprime el contenido; mejor Valeria como capa invocable + agente full |
| **desktop** | ≥ 1024 (o ≥ ~1280) | inline **30/70** default (Punto 2), resizable; rail historial collapsed (Punto 1) | 70% | hay ancho para split + 3-pane usable |

**Recomendación:** en **tablet (768–1024) Valeria pasa a drawer/overlay** (igual que mobile, no split inline) → el agente recibe el 100% del ancho y reflowea solo. Esto resuelve el squeeze en la franja angosta sin micro-tunear umbrales del split. El `useViewportGuard` se reescribe a 3 tiers (mobile-drawer / tablet-drawer / desktop-split) en vez del binario actual (rail-forzado vs full). El breakpoint exacto desktop (1024 vs 1280) lo define `/po-ux`+`/architect` con live-judgment de Chris (a 1024 con 30/70: Valeria ~307px, agente ~717px → inbox list 320 + thread 397 + contact cerrado, o contact 320 + thread 77 → habría que auto-colapsar contact; por eso quizás el split inline arranca recién en ~1280).

**Alternativa (si Chris prefiere mantener Valeria siempre visible en tablet):** rail inline en tablet PERO el agente reflowea agresivo (inbox auto-colapsa ContactSidebar por container-width vía ResizeObserver). Menos limpio (deja a Valeria robando ~72px) pero conserva la presencia de la supervisora.

> Decisión pendiente Chris (en refining /po-ux): drawer-en-tablet (recomendado) vs rail-inline-en-tablet + breakpoint desktop (1024 vs 1280).

## Riesgos

- Cross-tab: toca el shell → afecta TODAS las sub-tabs (Lisa/Mateo/Adrián/Lucas/Camila). Regression-guard de las stories shell ya done.
- Persistencia: cambiar el default no debe pisar la preferencia ya guardada del usuario (default aplica solo a fresh / sin valor persistido).
- El umbral del `useViewportGuard` puede necesitar recálculo con el nuevo 30/70.

## Refs

- `chris-input.md` — input verbatim Chris (3 puntos)
- `vitalia/docs/observed-bugs/2026-06-04-shell-valeria-squeeze-plus-darkmode.md` — repro BUG #1
- `src/stores/shell-store.ts` · `src/components/shared/shell-organism/{useViewportGuard,ShellOrganismLayout,ValeriaSidebar,ValeriaHistory}.tsx`
- `vitalia/docs/architecture/ADR-vitalia-006*` (shell-state persistence) · `vitalia-fase1-shell-layout-5050` (origen 50/50)
- Sibling pendiente: dark-mode token audit (BUG #2)
