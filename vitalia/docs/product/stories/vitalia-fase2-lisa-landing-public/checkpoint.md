---
story_id: vitalia-fase2-lisa-landing-public
outcome: vitalia-mvp-ui-foundation
phase: fase-2
type: ui-story
state: idea
architecture_pattern: ADR-vitalia-004
agent_owner: lisa
module: brand_studio
capability: lisa.landing_public
spawned_at: 2026-05-27
spawned_by: /pm-vitalia (via /po-ux session lisa-marca v2)
spawn_reason: "Landing pública editor descoped de lisa-marca por decisión Chris 2026-05-27 ('no sé dónde va aún'). Refinement pendiente cuando Chris decida ubicación (sub-tab dedicada de Lisa, sub-sub-tab de Configurar, o feature standalone)."
last_modified: 2026-05-27
ratified_by_chris: false
ratified_visual_by_chris: false
parallel_safe: true
priority: low
estimated_dev_days: 5-7
dependencies:
  hard:
    - vitalia-fase2-lisa-marca                  # consume identidad + voz + presencia configuradas
  soft:
    - vitalia-fase2-lisa-doctores               # equipo mostrado en landing
    - vitalia-fase2-lisa-servicios              # catálogo tratamientos mostrado en landing
blocks_hard: []
blocks_soft: []
next_action: "Pendiente decisión Chris sobre ubicación. Opciones: (a) sub-tab dedicada Lisa→Landing (extender AGENT_SUBTABS), (b) sub-sub-tab de Configurar (config→presencia-publica), (c) feature standalone fuera del shell-organism agéntico (settings global). Hasta entonces, story queda parked en `idea` sin refinement activo."

# Schema v2 migration (cement 2026-05-27)
release: F2   # release ID · ver releases/
cap_target: lisa.landing_public   # capability slug target (v2 cement 2026-05-27)
cap_change_type: new   # new | fix | extend | derive
parent_story: null   # story padre si spawned · null si independiente
---

# F2-Sx vitalia-fase2-lisa-landing-public — checkpoint (idea state)

## Goal

Editor visual de la **landing pública Vitalia** (subdomain `{slug}.vitalia.app`) que muestra al paciente externa información de la clínica:
- Hero con identidad (logo + tagline + colores marca)
- Sección "Quiénes somos" (story + valores)
- Equipo destacado (consume lisa-doctores)
- Catálogo tratamientos visibles (consume lisa-servicios)
- Trust signals (certificaciones + reseñas Google Business)
- Form contacto / CTA "Reservar cita" → integrado con Valeria booking
- SEO básico + Open Graph para compartir
- Multi-sede si aplica

## Scope ambiguo (pendiente Chris decision)

Esta story se **descopó de lisa-marca** durante refinement 2026-05-27 porque Chris ratificó "Landing no va aquí, no sé dónde va aún". Tres ubicaciones candidatas:

| Opción | Pros | Contras |
|---|---|---|
| **(a) Sub-tab dedicada Lisa→Landing** | Cohesión con identidad/voz/presencia (todo lo "público externo") | Quinta sub-tab Lisa (junto marca/doctores/servicios/compliance) — barra carga visual |
| **(b) Sub-sub-tab de Configurar→presencia-publica** | Más alineado a "ajustes técnicos" | Configurar es admin transversal, no specific Lisa workflow |
| **(c) Feature standalone fuera shell-organism** | Editor visual fullscreen WYSIWYG (Webflow-like) | Rompe paradigma agéntico shell |

## Refinement preconditions

Cuando Chris decida ubicación, refinement requerirá:
1. `/po-ux` arranca con 01-spec.md
2. Mockups por componente (overlay shell-mockup-per-component) — Hero, Sección Equipo, Form Contacto, etc.
3. Architecture: si elige (a) o (b) → respeta ADR-vitalia-004 con SubSubTabsBar
4. Backend: NEW endpoints landing rendering + form submission → routing inbox Adrián
5. SEO: integración Open Graph + sitemap.xml + robots.txt per tenant

## Anti-objetivos (cementados a la fecha)

- NO duplicar form-runtime de brand_studio (REUSE)
- NO custom landing builder (drag-drop) → out-of-MVP, considerar template-based first
- NO competir con Webflow/Wix — Vitalia landing es "configurable, no diseñable"
- NO permitir CSS/HTML custom (riesgo XSS + brand consistency)

## Dependencies map

### Hard
- `vitalia-fase2-lisa-marca` — landing renderiza identidad + voz visualmente

### Soft
- `vitalia-fase2-lisa-doctores` — sección "Nuestro equipo"
- `vitalia-fase2-lisa-servicios` — sección "Tratamientos"
- `vitalia-fase2-camila-reputacion` — sección "Reseñas" pulled from Google Business

### Esta historia desbloquea
- (potencial) `vitalia-fase2-lucas-mercado` — landing como conversion funnel measurable

## Referencias

- **ADR transversal:** `vitalia/docs/architecture/ADR-vitalia-004-shell-feature-architecture.md`
- **Spawn context:** sesión /po-ux lisa-marca v2 2026-05-27 (Chris descopó Landing)
- **Spec lisa-marca:** `vitalia/docs/product/stories/vitalia-fase2-lisa-marca/01-spec.md` § Out-of-scope
- **Existing brand-studio backup patterns:** `Documentos/ap_sales_agent/.trae/specs/brand-studio-ux-refactor/` (reference para landing legacy)
