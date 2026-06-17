# ADR-comunify-001 — Elenco de agentes (cast) del shell-organism

| | |
|---|---|
| **Status** | accepted |
| **Date** | 2026-06-15 |
| **Owner** | /pm-comunify |
| **Ratified by** | Chris (intake-handshake story `comunify-shell-organism`, 2026-06-15) |
| **Context** | Comunify migra del dashboard viejo al shell-organism agéntico (story `comunify-shell-organism`, R-shell MVP). El shell es un Ribbon de especialistas + supervisora sidebar (PARADIGM.md · 3 planos / 3 zonas). Comunify no tenía cast definido. |
| **Supersedes** | — (primer ADR comunify) |
| **Related** | `PARADIGM.md` · `ADR-010-orquestacion-agentica` · `ADR-vitalia-004` · `ADR-nicolify-002` · `.claude/rules/paradigm-arquitectura.md` |

## Decisión

Comunify adopta un cast **comunify-específico** (nombres propios) mapeado **1:1 a la cadena de
valor canónica** (= vitalia/nicolify), con **una sola supervisora-orquestadora** en el sidebar.

### D-1 · Orquestadora == supervisora (entidad única) — **Luana**

Confirmado vs vitalia (Valeria) + nicolify (Luana): en ambas marcas la orquestadora y la supervisora
son **la misma entidad**, vive en el **sidebar** (fuera del Ribbon), y su runtime (grafo supervisor
LangGraph) vive en zona **Infraestructura · motor-agentico** (no ocupa caja del mapa de valor).

Comunify usa el nombre **Luana** (= nicolify; Chris ratificó 2026-06-15). PARADIGM.md usa "Valeria"
como ejemplo canónico y vitalia la nombra Valeria — comunify se alinea con nicolify en el nombre, NO
en separar las entidades (que sería el anti-patrón). **Razón:** no hay razón técnica para separar
orquestadora de supervisora; el patrón de ambas marcas es entidad única.

**Luana también es la cara que guía el onboarding** (el *surface* de onboarding vive en zona
Plataforma — tab Plataforma — pero Luana lo narra/orquesta).

### D-2 · Ribbon = 5 especialistas (zona Agentes) + tab Plataforma

| Orden Ribbon | Persona | Rol (cadena de valor) | = canónico (vit/nico) | Dominio comunify |
|---|---|---|---|---|
| 1 | **Nina** | Estratega — marca + producto | Lisa / Abel | perfil del creator, offer ladder, cohorts, brand-studio, authority vault |
| 2 | **Tomás** | Atraer — marketing orgánico + paid | Lucas / Brenda | promueve lo que arma Nina; setter + growth marketing; contenido + pauta |
| 3 | **Sofía** | Vender — closer estrella | Adrián / Christian | todos los canales de venta; cierra + **recupera leads** |
| 4 | **Bruno** | Operar — día a día | Mateo / Sara | comunidad + moderación + entrega de cohorts (scope fino en refining) |
| 5 | **Lucía** | Retener — fidelización | Camila / Norvil | CRM al día con acciones digitales; suscripciones + dunning; cliente valorado |

- **Sidebar (no Ribbon):** Luana (supervisora-orquestadora + onboarding).
- **tab Plataforma:** zona Plataforma = acceso · onboarding · configuración (no es un agente).

### D-3 · Zona mapping (PARADIGM 3 zonas)

- **zona Agentes:** `boxes = [nina, tomas, sofia, bruno, lucia]` (los 5 del Ribbon).
- **supervisor de zona Agentes:** `luana` (sidebar; runtime → Infraestructura·motor-agentico).
- **zona Plataforma:** tab Plataforma (acceso · onboarding · configuración).
- **zona Infraestructura:** no user-facing (sin tab).

→ se refleja en `comunify/docs/architecture/SYSTEM-MAP.yaml::zones` (lo escribe /architect en la story).

## Cast catalog (slugs · colores · avatares)

Colores = tokens existentes de `comunify/docs/architecture/design-system.md` (NO hardcode nuevo).
Cada agente con tab declara `--agent-{slug}` + `--agent-{slug}-soft` (patrón vitalia/nicolify).
**Avatares = placeholders SVG** en `comunify/frontend/public/agents/{slug}/avatar.svg` (Chris entrega
finales después · reemplazo 1:1). Default chat = `luana`.

| Persona | slug | color propuesto | token comunify | avatar |
|---|---|---|---|---|
| Luana | `luana` | `#7B2FF7` (primary) | `--comunify-primary` | `public/agents/luana/avatar.svg` |
| Nina | `nina` | `#6A3CFF` (purple-mid) | `--comunify-purple-mid` | `public/agents/nina/avatar.svg` |
| Tomás | `tomas` | `#2D7FF9` (blue) | `--comunify-blue` | `public/agents/tomas/avatar.svg` |
| Sofía | `sofia` | `#16C784` (stable) | `--comunify-stable` | `public/agents/sofia/avatar.svg` |
| Bruno | `bruno` | `#F5B700` (warning gold) | `--comunify-warning` | `public/agents/bruno/avatar.svg` |
| Lucía | `lucia` | `#1246D6` (blue-deep) | `--comunify-blue-deep` | `public/agents/lucia/avatar.svg` |

> Colores = **propuesta**; /po-ux + diseño los ratifican (contraste AA, separación visual en Ribbon).
> `--comunify-critical` (rojo) queda reservado a errores/moderación, no es color de agente.

## Consecuencias

- **Positivas:** cast alineado a la cadena de valor canónica (mantiene el motor único, 1:1 con
  vitalia/nicolify) → port del shell directo. Supervisora única evita el anti-patrón orquestadora≠supervisora.
- **A resolver en refining (/po-ux):** scope fino de Bruno (Operar) en contexto creator economy;
  colores AA-verificados; SHELL-DESIGN-CONTRACT de comunify (port re-temizado de vitalia/nicolify);
  skill `comunify-design-system`.
- **Pendiente Chris:** avatares finales (placeholders mientras tanto).

## Mapeo a los módulos backend existentes (comunify ya shipped)

El backend agentic ya existe (tools EP-3 + guardrails EP-13). El cast es la **cara**; las acciones que
invoca ya están. Mapeo tentativo (refining confirma):
- Nina → brand_studio, offer_studio (offer ladder), cohorts (diseño)
- Tomás → content/campaigns + authority vault (nurture)
- Sofía → sales_agent (`qualify_for_cohort`, `book_discovery_call`), recuperación de leads
- Bruno → community (`link_to_community`, moderation rails), cohort delivery
- Lucía → payment (recurring subscriptions + dunning), CRM/retención
