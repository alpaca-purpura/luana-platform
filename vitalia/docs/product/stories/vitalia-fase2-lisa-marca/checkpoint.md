---
story_id: vitalia-fase2-lisa-marca
outcome: vitalia-mvp-ui-foundation
phase: fase-2
type: ui-story
agent_owner: lisa
module: brand_studio
capability: lisa.marca
state: refining
architecture_pattern: ADR-vitalia-004
phase: AWAITING_PO_UX_DRAFT
last_modified: 2026-05-26
transitioned_at: 2026-05-26T00:00:00Z
transitioned_by: /pm-vitalia
ratified_by_chris: false
po_ux_iter: 0
ratified_visual_by_chris: false
parallel_safe: true
priority: high
estimated_dev_days: 3-4
dependencies:
  hard:
    - vitalia-fase1-empty-states
    - vitalia-fase1-routing-shell
  soft: []
blocks_hard: []
blocks_soft:
  - vitalia-fase2-camila-reputacion
  - vitalia-fase2-adrian-propuestas        # templates términos usan voice brand
reuse_map_summary: "REUSE 90% brand_studio shipped (core/luana-core-brand-studio + vitalia/backend/src/modules/vitalia/brand_studio/) · NEW UI shell-organism · ADAPT salud overlay (specialty · doctors-as-faces · trust-signals · compliance-friendly tone)"
spawned_at: 2026-05-22
next_action: "/po-ux refinar 01-spec.md con wireframes 3 sub-secciones (Identidad · Voz y tono · Landing & presencia)"
---

# F2-S7 vitalia-fase2-lisa-marca — checkpoint

## Goal

Sub-tab Marca de Lisa: workspace administración brand-identity salud-overlay. 3 sub-secciones internas:
1. **Identidad** — Nombre · logo · colores · tipografía · especialidad (dental/estética/psicología/psiquiatría/general) · ubicaciones
2. **Voz y tono** — Personality profile (Jung archetype + slot architecture sales-agent) · vocabulario · evitar
3. **Landing & presencia** — Landing pública · web link · Google Business · Instagram · TikTok

Reusa engine `core/luana-core-brand-studio` (Story 5+ shipped) + brand_studio backend Vitalia. UI shell-organism replace dashboard legacy `/brand-studio/[section]`.

## Anti-objetivos

- NO tocar engine `core/luana-core-brand-studio` (read-only via API)
- NO duplicar PersonalityProfile/BuyerPersona (shipped en engine)
- NO implementar AI logo-generator (out-of-scope MVP)
- NO implementar editor landing visual (delegate a Lucas recursos future)

## Scope verbatim

### § 1 — Page + sub-sections

`vitalia/frontend/src/app/[tenantId]/(shell-organism)/lisa/marca/page.tsx`:

Server initial state via `getBrandStudioState({ tenantId })`. Renderiza `<LisaMarcaView>` con 3 sub-sections como tabs internas (NO sub-tabs del shell — son sub-secciones de UNA sub-tab).

### § 2 — `LisaMarcaView` 3 sub-sections

`vitalia/frontend/src/features/lisa/components/marca/LisaMarcaView.tsx`:

Shadcn `Tabs` internas:
- **Identidad** — `<IdentidadSection>` con form CRUD (Zod schema) · upload logo (S3) · color picker · specialty selector
- **Voz y tono** — `<VozTonoSection>` con personality archetype selector (Sage/Caregiver/Hero per Jung) · slot architecture preview · vocabulario do/don't editable
- **Landing & presencia** — `<LandingPresenciaSection>` con preview landing pública + slug editor + redes sociales links

Autosave on-change (debounce 600ms · per `form-runtime-array.md` rule).

### § 3 — Voice & tone overlay salud

Salud overlay agrega validations:
- ❌ NO promesas curativas no respaldadas
- ❌ NO before/after que viole compliance local
- ✅ Incluir disclaimers cuando aplique
- ✅ Tono empático + profesional + claro

Backend `vitalia/backend/src/modules/vitalia/brand_studio/application/health_voice_validator.py` valida ANTES guardar.

### § 4 — Doctors-as-faces preview

Sub-sección Identidad incluye preview "Equipo de doctores" (consume F2-S8 lisa-doctores via API):
- Lista doctors con avatar + nombre + especialidad
- CTA "Editar equipo" → linkea F2-S8

### § 5 — Trust signals

Incluye campos:
- Certificaciones / acreditaciones (logos colegio médico · DIGESA · etc.)
- Premios y reconocimientos
- Años de experiencia
- Cantidad pacientes atendidos (opcional)

Backend valida format + sanitize.

## Acceptance criteria

| AC | Verificación |
|---|---|
| AC-1 | Page renderiza 3 sub-sections (Identidad · Voz · Landing) |
| AC-2 | CRUD Identidad funciona con autosave on-change |
| AC-3 | Upload logo S3 + preview live |
| AC-4 | Color picker + specialty selector funcional |
| AC-5 | Personality archetype selector (Jung) actualiza PersonalityProfile engine |
| AC-6 | Voice validator salud bloquea promesas curativas |
| AC-7 | Landing pública link funciona |
| AC-8 | Doctors preview consume F2-S8 API (link disabled si F2-S8 not done) |
| AC-9 | Trust signals sanitize + format validation |
| AC-10 | Visual goldens × 6 (3 secciones × 2 themes) |
| AC-11 | a11y axe pass |
| AC-12 | Cross-tenant query bloqueada |
| AC-13 | Vitest + Playwright + a11y pass |

## Gherkin scenarios

### Scenario 1 — happy: actualizar identidad + autosave

**Given:** User en Lisa→Marca, sección Identidad. Tenant `clinica-dental-pe`.

**When:** Cambia campo "Nombre clínica" + waits 600ms

**Then:**
- Autosave dispara POST `/api/brand-studio/identity` con cambio
- Toast tiny "Guardado" (3s timeout)
- Audit log row creado
- Backend valida + persiste

### Scenario 2 — negative: voice violator bloqueado

**Given:** User edita voz vocabulario "Sí" pattern incluyendo "curamos todos los casos garantizado"

**When:** Save submit

**Then:**
- Backend `health_voice_validator` retorna 422 con explanation
- UI muestra `<Alert variant="warning">` "Esta frase puede violar regulación de salud. Sugerencia: 'Tratamientos avalados por protocolos clínicos'"
- NO persiste
- Audit log: `voice_validation_failed`

### Scenario 3 — edge: logo upload muy grande

**Given:** User intenta upload logo > 5 MB

**When:** Upload submit

**Then:**
- Client-side validation bloquea ANTES request
- UI muestra "Logo máximo 5 MB. Comprimí la imagen."
- Server-side validation duplicate como defense-in-depth

### Scenario 4 — keyboard-a11y tabs

**Given:** Foco en primer tab (Identidad)

**When:** Tab → traverse fields. Arrow keys cycle tabs.

**Then:**
- aria-selected en tab activa
- Tab field order lógico
- Color picker accesible (open via Enter)

## Deliverables

| File | Acción |
|---|---|
| `vitalia/frontend/src/app/[tenantId]/(shell-organism)/lisa/marca/page.tsx` | MODIFY |
| `vitalia/frontend/src/features/lisa/components/marca/LisaMarcaView.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/marca/sections/IdentidadSection.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/marca/sections/VozTonoSection.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/marca/sections/LandingPresenciaSection.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/marca/sections/DoctorsPreview.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/components/marca/sections/TrustSignals.tsx` | NEW |
| `vitalia/frontend/src/features/lisa/api/marca.ts` | NEW |
| `vitalia/frontend/src/features/lisa/types/marca.types.ts` | NEW |
| `vitalia/frontend/src/features/lisa/types/marca-schema.ts` | NEW (Zod) |
| `vitalia/backend/src/modules/vitalia/brand_studio/api/identity_router.py` | MODIFY |
| `vitalia/backend/src/modules/vitalia/brand_studio/application/health_voice_validator.py` | NEW |
| `vitalia/frontend/e2e/shell-organism/lisa-marca-autosave.spec.ts` | NEW |
| `vitalia/frontend/e2e/shell-organism/lisa-marca-voice-validator.spec.ts` | NEW |
| `vitalia/frontend/e2e/__screenshots__/marca/{section}-{light\|dark}.png` (×6) | NEW |
| `vitalia/backend/tests/modules/vitalia/brand_studio/test_health_voice_validator.py` | NEW |
| `vitalia/backend/tests/modules/vitalia/brand_studio/test_marca_cross_tenant.py` | NEW |

## Reuse map

| Origen | Componente / pattern | Adaptación |
|---|---|---|
| `core/luana-core-brand-studio` | Engine BrandStudio + PersonalityProfile + BuyerPersona | CONSUME via API · NO tocar engine |
| Vitalia shipped — `vitalia/backend/src/modules/vitalia/brand_studio/` | Brand backend + identity endpoints | EXTEND con health_voice_validator |
| Vitalia shipped — brand_studio FE legacy `/brand-studio/[section]` | UI primera version | REFACTOR: migrar componentes core al espacio lisa/marca + adaptar tokens shell-organism |
| Shadcn primitives | `Tabs` · `Form` · `Input` · `Textarea` · `Select` · `ColorPicker` (custom) · `Upload` (custom) | npx install |

## Dependencies map

### Hard
- `vitalia-fase1-empty-states` — shell con sub-tab nav
- `vitalia-fase1-routing-shell` — App Router

### Soft
- ninguna

### Esta historia desbloquea
- `vitalia-fase2-camila-reputacion` — consume brand voice signals
- `vitalia-fase2-adrian-propuestas` — templates términos usan voice brand
- `vitalia-fase2-lisa-doctores` — recibe preview en Identidad

## Riesgos identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Voice validator falsos positivos | Media | Bajo | Whitelist phrases + override admin con audit |
| Personality archetype confuso para users | Media | Bajo | Tooltips + ejemplos · default `Caregiver` para vertical salud |
| Upload logo grande lento | Baja | Bajo | Client compress + size validation |

## Definición de "Done"

1. AC verificados
2. Visual goldens × 6 generated + ratified
3. Backend tests health-voice + cross-tenant pass
4. Story pushed + handoff `/auditor`
5. Auditor APPROVED → merge → capability `lisa.marca` registrada

## Próximo paso post-done

- F2-S8 lisa-doctores extiende equipo preview con CRUD doctors
- F2-S9 lisa-servicios consume voice brand para descripciones

## Referencias

- **Design Contract:** `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md`
- **Template:** `vitalia/docs/specs/templates/01-spec-shell-template.md`
- **Navigation tree:** § lisa.marca
- **HIPAA-lite:** `vitalia/.claude/rules/hipaa-lite.md`
- **brand-expert skill:** PersonalityProfile + StoryBrand + BuyerPersona
