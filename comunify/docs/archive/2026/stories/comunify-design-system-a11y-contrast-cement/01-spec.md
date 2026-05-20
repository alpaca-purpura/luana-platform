<!-- voseo-allowed: glosario reference (verifica patrones voseo prohibidos en arch test) -->
---
story_id: comunify-design-system-a11y-contrast-cement
brand: comunify
type: ui-story
state: refining
po_ux_version: 1
ratified_by_chris: true
ratified_at: 2026-05-20
supersedes: comunify-warning-token-contrast-fix
hot_fix: false
created: 2026-05-20
last_updated: 2026-05-20
ssot_owner: /po-ux
next_handoff: /architect
---

# Comunify — Design System a11y Contrast Cement

## § Context

**Outcome ancla:** continuación del módulo `frontend_design_system` post `comunify-design-system-cement` v0.2.0 + `comunify-design-system-tailwind-v4-tokens` v0.2.1. Tercera capability del módulo.

**Origen scope expandido:**
- Auditor `auditor-frontend` flagged 1 WARN en cement (1.80:1 `text-white` sobre `bg-comunify-warning`).
- Audit comprehensive ejecutado por `/po-ux` 2026-05-20 reveló **10 pares color que fallan WCAG AA**, 6 de ellos críticos (FAIL incluso UI/large text).
- Chris ratificó scope expandido + auditar TODAS las parejas.

**Módulo afectado:** `frontend_design_system` (módulo brand-local cementado en Story 12.cement).

**User journey insertion point:**
- Comunify dashboard `/dashboard/community` (moderation card) — botones approve/reject/ban
- Comunify dashboard `/dashboard/membership` (dunning banner) — botón "Reintentar cobro"
- Comunify multiple components con badges/status pills/error labels

**Objetivo:** garantizar accesibilidad WCAG AA en todo el design system Comunify, cementar pares canónicos token-foreground/token-background, codificar como arch fitness para prevenir regresiones. Mantener integridad HSL del brandbook (NO oscurecer colores principales).

**Out of scope (anti-creep):**
- Dark mode (ADR separado futuro)
- Logo wordmark SVG (story `comunify-brand-logo` futura)
- Audit otras brands (vitalia/nicolify/lupulo) — promotable candidate
- Lift a `core/luana-core-platform/design-tokens/` (requiere `/pm-luana` promotion gate)
- Cambios visuales NO relacionados con contrast (typography, spacing, motion)

## § Audit findings (data dura — 22 pares verificados)

### 🔴 CRÍTICOS — fail incluso UI/large text (6 pares)

| Foreground | Background | Ratio | Donde aparece HOY |
|---|---|---|---|
| `text-white` | `bg-comunify-warning` | **1.80:1** | `community-moderation-card.tsx:22` + `dunning-active-banner.tsx:31` |
| `text-white` | `bg-comunify-stable` | **2.20:1** | `community-moderation-card.tsx:21` |
| `text-white` | `bg-comunify-accent` (coral) | **2.95:1** | 0 usos hoy (latente) |
| `text-comunify-warning` | `bg-comunify-bg` | **1.72:1** | 5 archivos (badges status) |
| `text-comunify-stable` | `bg-comunify-bg` | **2.10:1** | 4 archivos (badges status) |
| `text-comunify-accent` | `bg-comunify-bg` | **2.82:1** | 0 usos hoy (latente) |

### 🟡 MARGINALES — OK UI/large only (4 pares)

| Foreground | Background | Ratio | Decisión |
|---|---|---|---|
| `text-white` | `bg-comunify-blue` | 3.81:1 | Permitido (opción C híbrida — responsabilidad dev) |
| `text-white` | `bg-comunify-critical` | 3.76:1 | Permitido (UI/large only — `community-moderation-card.tsx:23` ban button migra igual a Camino B por consistencia) |
| `text-comunify-text` | `bg-comunify-primary` | 3.24:1 | No bloqueado (latente, casos raros) |
| `text-comunify-critical` | `bg-comunify-bg` | 3.60:1 | Migrado a `text-comunify-critical-text` para PASS AA |

## § Decisión técnica cementada (post Chris ratification 3 batches)

### Tokens nuevos (5 — solo `*-text` para foreground sobre light bg)

```css
--comunify-warning-text:   45 100% 28%   /* #8E6B00 — gold oscuro */
--comunify-stable-text:    152 80% 28%   /* #0E804B — verde oscuro */
--comunify-accent-text:    355 100% 45%  /* #E50013 — coral oscuro */
--comunify-critical-text:  0 84% 49%     /* #E51313 — rojo oscuro */
--comunify-blue-text:      217 95% 52%   /* #1069F8 — azul oscuro */
```

Todos rinden ≥4.5:1 sobre `bg-comunify-bg` (#F8FAFC) = WCAG AA body. HSL principales del brandbook (`warning #F5B700`, `stable #16C784`, `accent #FF5F6D`) **se conservan intactos** — paleta de logo respetada.

### Pares canónicos cementados (`design-system.md` § 6 NEW recipes)

| Use case | Background | Foreground | Ratio | Status |
|---|---|---|---|---|
| Botón primary CTA | `bg-comunify-primary` o `bg-comunify-gradient` | `text-comunify-primary-foreground` (white) | 5.85:1 | ✅ AA |
| **Botón outline semantic (NEW)** | `bg-comunify-{X}/10 border border-comunify-{X}` | `text-comunify-{X}-text` | 4.5-9.7:1 | ✅ AA |
| Badge / status pill | `bg-comunify-{X}/10` | `text-comunify-{X}-text` | idem | ✅ AA |
| Alert banner sólido | `bg-comunify-{X}` | `text-comunify-text` (oscuro) | 5-10:1 | ✅ AA-AAA |
| Error label inline form | (transparente) | `text-comunify-critical-text` | 5.5:1 | ✅ AA |

### Camino B universal (botones moderation + dunning)

Outline pattern reemplaza solid bg + text-white:

```tsx
// Pattern Camino B (verbatim cement)
"bg-comunify-{X}/10 border border-comunify-{X} text-comunify-{X}-text hover:bg-comunify-{X}/20"
```

Aplica a:
- `community-moderation-card.tsx:21-23` (approve / reject / ban)
- `dunning-active-banner.tsx:31` (Reintentar cobro)

### Arch fitness — bloqueo híbrido (opción C ratificada)

Patrones HARD blocked (fail build automáticamente):
- `bg-comunify-warning text-white`
- `bg-comunify-stable text-white`
- `bg-comunify-accent text-white`
- `text-comunify-warning bg-comunify-bg` (sin sufijo `-text`)
- `text-comunify-stable bg-comunify-bg`
- `text-comunify-accent bg-comunify-bg`

NO bloqueados (responsabilidad dev, casos UI/large válidos):
- `bg-comunify-critical text-white` (3.76:1 OK como UI/large)
- `bg-comunify-blue text-white` (3.81:1 OK como UI/large)
- `text-comunify-critical bg-comunify-bg` (3.60:1 marginal — pero migración cement la elimina)

## § Gherkin scenarios (4 base + 1 a11y mandatory)

### SC-01 — Happy: pares canónicos del recipe aplican

```gherkin
Given un developer agrega un botón warning outline (Camino B) en un component nuevo
When usa el snippet del § Component recipes:
  "bg-comunify-warning/10 border border-comunify-warning text-comunify-warning-text hover:bg-comunify-warning/20"
Then el contrast ratio computed (Playwright getComputedStyle + WCAG formula) ≥ 4.5:1
 And la utility class `text-comunify-warning-text` existe en el CSS bundle emitido (grep)
 And el vitest unit test `resolveTokenContrast()` retorna PASS para el par
```

**playwright_required:** true
**graders:**
- `{ type: e2e, path: "comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/design-system-pairs.spec.ts" }`
- `{ type: visual_state, screen: "moderation-card-buttons", element: "button[data-action=approve]", expect: "computed contrast ≥ 4.5:1" }`

### SC-02 — Negative: par prohibido bloqueado por arch fitness

```gherkin
Given un developer escribe en un componente nuevo `bg-comunify-warning text-white`
When corre `npx vitest run src/__tests__/architecture/test-no-low-contrast-pairs.test.ts`
Then el test FALLA con error cite:
  "comunify/path/to/file.tsx:N — bg-comunify-warning + text-white = 1.80:1 (use text-comunify-text or text-comunify-warning-text per design-system.md §6)"
 And la allowlist `_low-contrast-allowlist.json` NO permite agregar la violación sin magic comment `// a11y-allow: <razón>`
 And la baseline allowlist es `[]` (clean slate ratchet)
```

**playwright_required:** false (es arch test, no E2E)
**graders:**
- `{ type: arch_fitness, path: "comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts" }`

### SC-03 — Edge: Camino B en moderation card preserva semántica color

```gherkin
Given community-moderation-card.tsx renderiza con 3 botones approve/reject/ban
When el user navega visual al card (Playwright + axe)
Then cada botón mantiene el color semántico identificable (verde=approve, amarillo=reject, rojo=ban)
 And cada botón tiene visible border + bg/10 tint + text color saturado oscuro
 And hover transition `bg-{X}/10 → bg-{X}/20` aplica sin layout shift
 And keyboard focus muestra ring `focus:ring-2 focus:ring-comunify-{X}` con 2px
 And axe-core ruleset wcag2aa reporta zero color-contrast violations en el card
```

**playwright_required:** true
**graders:**
- `{ type: e2e, path: "comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/moderation-card.spec.ts" }`
- `{ type: axe, ruleset: "wcag2aa", target_route: "/dashboard/community" }`

### SC-04 — Adversarial: tints sobre light bg verificados

```gherkin
Given un developer agrega badge con `bg-comunify-warning/10 text-comunify-warning-text`
When Playwright spec evalúa getComputedStyle (color + backgroundColor) sobre el badge
Then el contrast ratio sample reportado ≥ 4.5:1 (warning-text yields 4.72:1 sobre bg-bg)
 And NINGÚN componente migrado en el sweep usa el patrón legacy `text-comunify-{warning,stable,accent}` sin sufijo `-text` (grep ratchet)
 And el arch test FALLA si se reintroduce el patrón legacy
```

**playwright_required:** true
**graders:**
- `{ type: e2e, path: "comunify/frontend/e2e/regression/comunify-design-system-a11y-contrast-cement/badges-tints.spec.ts" }`
- `{ type: arch_fitness, path: "comunify/frontend/src/__tests__/architecture/test-no-low-contrast-pairs.test.ts" }`

### SC-a11y — Sub-categoría mandatory accessibility

```yaml
accessibility:
  covered_by: [SC-01, SC-02, SC-03, SC-04]
  ruleset: wcag2aa
  target_routes:
    - /dashboard/community     # moderation card
    - /dashboard/membership    # dunning banner
  axe_run: true
  manual_checklist:
    - keyboard_navigation: Tab order lógico en card buttons, focus ring visible
    - screen_reader: aria-label en botones (approve/reject/ban + action description)
    - contrast: zero violations reportadas por axe en target_routes
    - color_alone: cada botón tiene icon + text (no solo color para distinguir)
```

### Sub-categorías mandatory NO aplicables (declarado explícito v4.1)

```yaml
not_applicable:
  - sub_category: race_condition
    reason: "Story es CSS-only — no hay endpoint con create/update con unique constraint"
  - sub_category: concurrent_users
    reason: "No hay list/detail filterable involucrado en el scope"
  - sub_category: network_failure
    reason: "No hay fetch FE — cambio es Tailwind classes + CSS vars"
  - sub_category: empty_state
    reason: "No hay list/dashboard nuevo — solo migración classes en existentes"
  - sub_category: large_dataset
    reason: "No hay pagination involucrada"
  - sub_category: i18n
    reason: "No toca microcopy — solo classes Tailwind. Spanish neutro preserva su estado actual"
ratified_by_chris: true
```

## § Wireframes inline (ASCII antes / después)

### Moderation card buttons (Camino B universal)

```
ANTES (FAIL WCAG AA)                          DESPUÉS (Camino B — PASS AA)
┌────────────────────────────────────┐        ┌────────────────────────────────────┐
│ Post pendiente moderación          │        │ Post pendiente moderación          │
│ "..." [content]                    │        │ "..." [content]                    │
│                                    │        │                                    │
│ [ ✓ Aprobar ]  ← verde + white     │        │ [ ⌐ ✓ Aprobar ]  ← outline verde   │
│   contrast: 2.20:1 ❌              │        │   contrast: 4.77:1 ✅              │
│ [ ⚠ Rechazar ] ← amarillo + white  │        │ [ ⌐ ⚠ Rechazar ] ← outline amar    │
│   contrast: 1.80:1 ❌              │        │   contrast: 4.72:1 ✅              │
│ [ ✕ Banear ]   ← rojo + white      │        │ [ ⌐ ✕ Banear ]   ← outline rojo    │
│   contrast: 3.76:1 ⚠️ (UI only)    │        │   contrast: 4.53:1 ✅              │
└────────────────────────────────────┘        └────────────────────────────────────┘
```

Tailwind verbatim:
```tsx
// ANTES (community-moderation-card.tsx:21-23)
approve: "bg-comunify-stable hover:bg-comunify-stable/90 text-white"
reject:  "bg-comunify-warning hover:bg-comunify-warning/90 text-white"
ban:     "bg-comunify-critical hover:bg-comunify-critical/90 text-white"

// DESPUÉS (Camino B)
approve: "bg-comunify-stable/10 border border-comunify-stable text-comunify-stable-text hover:bg-comunify-stable/20"
reject:  "bg-comunify-warning/10 border border-comunify-warning text-comunify-warning-text hover:bg-comunify-warning/20"
ban:     "bg-comunify-critical/10 border border-comunify-critical text-comunify-critical-text hover:bg-comunify-critical/20"
```

### Dunning banner (Camino B universal — opción B ratificada)

```
ANTES (FAIL WCAG AA)
┌───────────────────────────────────────────────────────────────┐
│ ⚠ Tu suscripción no pudo cobrarse                             │
│   Reintentaremos automáticamente en 2 días.                   │
│                                                               │
│                                          [ Reintentar cobro ] │ ← bg amar + white
│                                          contrast: 1.80:1 ❌  │
└───────────────────────────────────────────────────────────────┘
texto h3/p: text-comunify-warning sobre bg amar/10 → 1.72:1 ❌

DESPUÉS (Camino B)
┌───────────────────────────────────────────────────────────────┐
│ ⚠ Tu suscripción no pudo cobrarse                             │ ← texto warning-text 4.72:1 ✅
│   Reintentaremos automáticamente en 2 días.                   │
│                                                               │
│                                        [ ⌐ Reintentar cobro ] │ ← outline + warning-text 4.72:1 ✅
└───────────────────────────────────────────────────────────────┘
```

Tailwind verbatim:
```tsx
// ANTES (dunning-active-banner.tsx:20,23,31)
<p className="font-semibold text-comunify-warning">                             // h3
<p className="text-sm text-comunify-warning">                                   // p
<button className="rounded-lg bg-comunify-warning ... text-white ...">          // CTA

// DESPUÉS
<p className="font-semibold text-comunify-warning-text">                        // h3
<p className="text-sm text-comunify-warning-text">                              // p
<button className="rounded-lg border border-comunify-warning bg-comunify-warning/10 ... text-comunify-warning-text hover:bg-comunify-warning/20 focus:ring-2 focus:ring-comunify-warning">
```

## § Estados visuales

| Estado | Trigger | Componentes visibles | Componentes ocultos |
|---|---|---|---|
| `idle` | Botón sin interacción | Border full color + bg/10 + text-{X}-text | Hover/focus rings |
| `hover` | Mouse over | Border + bg/20 (tint más saturado) + text-{X}-text | — |
| `focus` | Tab keyboard | Border + bg/10 + text + `ring-2 ring-comunify-{X}` | — |
| `active` | Click pressed | Border + bg/30 + text | — |
| `disabled` | Prop disabled | Border 50% opacity + bg/5 + text 50% opacity | Hover transitions |

## § Componentes (sin nuevos componentes — solo migración classes)

| Componente | Path | Cambio |
|---|---|---|
| `community-moderation-card.tsx` | `comunify/frontend/src/features/comunify/components/` | 3 botones Camino B + 3 status pills text→-text |
| `dunning-active-banner.tsx` | idem | h3/p text→-text + button Camino B |
| `voice-samples-uploader.tsx` | idem | 3 badges text→-text |
| `voice-distilled-preview.tsx` | idem | 1 badge text→-text |
| `cohort-broadcast-composer.tsx` | idem | 2 error labels text→-text |
| `authority-vault-editor.tsx` | idem | 2 badges text→-text |
| `format-engagement-bucket.ts` | `comunify/frontend/src/features/comunify/utils/` | 2 keys text→-text |
| `ladder-visualizer.tsx` | `comunify/frontend/src/features/comunify/components/` | No-op (border-warning OK sin text overlay sobre warning bg) |

**0 componentes nuevos.** Solo migración classes Tailwind.

## § Data flow (CSS-only — no toca data)

- 0 API endpoints afectados
- 0 React Query keys afectados
- 0 mutations afectadas
- 0 form libraries afectadas
- 0 global state afectado

Story es **puramente CSS/Tailwind classes migration** + **CSS vars new** + **arch test new**.

## § Microcopy

**Sin cambios.** Spanish neutro preserva su estado actual. No se modifica copy de ningún componente. Solo classes Tailwind. (Sub-categoría `i18n` declarada not_applicable.)

## § Responsive breakpoints

Sin cambios respecto al baseline post-cement v0.2.1. Todos los botones y badges mantienen su layout responsive existente.

## § Accessibility

- ARIA labels preservados en botones moderation (no se tocan)
- Focus visible explícito en Camino B: `focus:ring-2 focus:ring-comunify-{X}`
- Keyboard navigation: Tab order preservado (CSS-only no afecta)
- Contrast ratio: TODOS los pares migrados ≥ 4.5:1 (verificado en audit)
- Screen reader: icons + text preservan dual signal (color + text + icon — never color alone)

## § Telemetría

```yaml
events: []   # sin eventos nuevos (no es feature, es a11y migration)
```

## § Brand voice

No aplica (no toca texto user-facing). Chrome UI Spanish neutro preserva su estado.

## § Open questions

**Ninguna.** Refinement loop closed en 3 batches. Todo cerrado con Chris 2026-05-20.

## § References

- `comunify/docs/architecture/design-system.md` — SSoT a modificar (§ 1.5 tokens + § 6 recipes Camino B)
- `comunify/frontend/src/app/globals.css` — vars a agregar
- `comunify/frontend/tailwind.config.ts` — slots a agregar
- `comunify/docs/product/capabilities/frontend_design_system/design-system-cement.yaml` — capability cement v0.2.0
- `comunify/docs/product/capabilities/frontend_design_system/tailwind-v4-tokens.yaml` — capability hot-fix v0.2.1
- `.claude/rules/frontend-fsd.md` — FSD-Lite + Shadcn baseline
- `.claude/rules/spanish-text.md` — voseo glosario (este file usa magic comment)
- Audit script: `/tmp/wcag_audit.py` (22 pares verificados, snapshot data dura)
- Find HSL script: `/tmp/find_text_hsl.py` (optimal lightness *-text tokens)

## § Audit trail iteration

- **v1 (2026-05-20):** ratificada Chris en 3 batches. Slug supersedes `comunify-warning-token-contrast-fix`. Scope expandido per Chris autorización auditar TODAS las parejas.

## § Next action

`/architect <brand>: comunify` lee este 01-spec.md → spawn `architect-orchestrator` single-shot full-stack frontend-focus → produce ready package:
- 03-arch.md (con § Test Construction Plan v4.1 — orden, POMs, fixtures, scenario_to_test mapping)
- 04-validators.yaml (5 categorías incluyendo architectural_validation)
- 05-guidelines.md (must_load_skills enforceable)
- 06-tickets.yaml (gherkin_coverage mandatory)

State transition: `refining → refined` ratificada inline (Chris autorizó "continúa hasta llegar al done").
