<!-- voseo-allowed: internal architecture decision record, not user-facing -->

# ADR-vitalia-005 — Capability Model · 4 dimensiones + dev_preview + areas user-facing

| Campo | Valor |
|---|---|
| **Status** | Accepted (v1.0 — 2026-05-27 cementación inicial) |
| **Date** | 2026-05-27 |
| **Authors** | Chris + `/pm-vitalia` (orchestrator Opus 4.7) |
| **Brand** | vitalia (modelo aplicable a otras brands vía promotion gate `/pm-luana`) |
| **Scope** | Schema `vitalia/docs/product/capabilities/{tech_module}/{slug}.yaml` + cockpit MapView + areas/ user-facing |
| **Supersedes** | — (extiende `docs/process/capability-protocol.md` v2 cement 2026-05-27) |
| **Sources** | Sesión `/pm-vitalia` 2026-05-27 (Chris ratificó modelo 4 dimensiones + merge shell-organism + areas/). Diagnóstico raíz: 27 caps "huérfanas" en cockpit + mismatch `module:` técnico vs user-facing + ausencia de "user guide" por cap |
| **Changelog** | v1.0 (2026-05-27): cementación inicial · 4 dimensiones + dev_preview + areas/ + merge shell-organism 7 caps → 1 cap atomics |

---

## § 1 — Context

El modelo capability v2 (cement 2026-05-27) introdujo `cap_change_type ∈ {new, fix, extend, derive}` + `change_log[]` append-only + atomics objects con `added_in_story`. Eso resolvió la trazabilidad story↔cap (qué story creó/modificó qué cap).

Pero al inventariar el estado vitalia (55 caps en 30 directorios al 2026-05-27) emergen 5 problemas raíz que el modelo v2 no resuelve:

**P1 · 27 caps "huérfanas" en el cockpit.** `MapView.tsx:22-72` hardcodea 6 agentes con `modules: string[]` que cubre solo 6 módulos. Los demás 24 módulos caen en bucket "Otros módulos" (❓) sin pertenencia clara a ningún agente ni a infra explícita. Resultado: el mapa user-facing del producto está roto — Chris no puede contestar "¿qué tiene Vitalia?" leyendo el cockpit porque la mitad del producto está en el bucket "Otros".

**P2 · El campo `module:` mezcla 3 ejes distintos.** Hoy `module:` significa cosas diferentes según el cap:

- `scheduling`, `crm`, `brand_studio` → dominio técnico backend (DDD)
- `shell-organism`, `marketing` → área funcional UI (no DDD)
- `agentic`, `copilot`, `observability` → infra cross-cutting
- `tests`, `fixtures`, `ops`, `workers` → scaffolding no user-facing

Un solo campo cargando 3 conceptos colapsa la taxonomía.

**P3 · Stories crean cap 1:1 en vez de extender.** Aunque doctrina v2 cementa `extend`/`derive`/`fix`, la práctica muestra que la mayoría de stories nuevas marcan `cap_change_type: new` aunque exista cap relacionado. Resultado: granularidad excesiva. Caso emblemático: shell-organism con 7 caps (`empty-states`, `layout-5050`, `ribbon`, `routing`, `sub-tabs`, `valeria-chat`, `valeria-sidebar`) cuando todas son partes de **una sola capacidad humana**: "el shell visual de Vitalia post-login".

**P4 · Caps no tienen "user guide".** Ninguna cap declara cómo verla en development: qué ruta, qué componente, qué endpoint pegar, qué fixture cargar, qué test E2E la cubre. Resultado: para confirmar "¿esto existe en producción?" hay que leer múltiples archivos cross-codebase.

**P5 · `modules/{m}.md` desincronizado.** 23 module.md vs 30 dirs capabilities/. `tests/`, `fixtures/`, `ops/`, `workers/`, `audit/`, `clinics/`, `agentic/`, `admin/`, `auth/` tienen caps pero NO module.md. Drift silencioso del SSoT funcional.

**Decisión Chris (2026-05-27):** "los capabilities son capacidades de mi producto, si no tengo mapeado exactamente a qué modulo, funcionalidad exacta es, no tiene sentido. (...) debe ser entendible, casi en lenguaje humano. (...) cada capability debería tener el cómo verlo en development, como llegar a el, como una guía de usuario".

---

## § 2 — Decision

Cada YAML `vitalia/docs/product/capabilities/{tech_module}/{slug}.yaml` declara **4 dimensiones explícitas** + bloque `dev_preview` + naturaleza + visibilidad. El cockpit MapView agrupa por las dimensiones leídas del YAML (no por hardcoded mapping en TS). Se promueve una taxonomía paralela `areas/` user-facing (7 archivos · 1 por agente + Configurar + Infra) como SSoT del producto en lenguaje humano. Los `modules/{m}.md` técnicos se mantienen para devs.

### 2.1 · Las 4 dimensiones

```yaml
# Dim 1 — TÉCNICA (DDD backend · FSD frontend · path canónico)
tech_module: scheduling
# Path donde vive el código. Inmutable post-merge. Equivale al `module:` previo
# del schema v2, pero renombrado para evitar el cargo de 3 conceptos en uno.

# Dim 2 — USER-FACING (agrupación del cockpit + producto humano)
agent_owner: valeria
# valeria | lisa | adrian | lucas | camila | config | infra
# Quién es el agente owner UI/UX. "config" para opciones tenant. "infra" para
# cross-cutting NO user-facing (audit, observability, platform).

functional_area: valeria.agenda
# Sub-categoría user-facing DENTRO del agente. Slug `<agent>.<area>` (kebab).
# Ej: lisa.identidad-marca, valeria.agenda, adrian.embudo, lucas.atribucion,
# camila.nps, config.compliance, infra.observability.
# NO existe "huérfano" — todo cap declara functional_area. Si no se sabe →
# refining bloqueado hasta que Chris ratifique.

# Dim 3 — VISIBILIDAD (filtro del mapa)
user_visible: true
# true  → aparece en mapa principal del cockpit. Cap user-facing terminada.
# false → infra cross-cutting. Visible solo con toggle "Mostrar infra".

# Dim 4 — NATURALEZA (qué tipo de pieza es)
nature: feature
# feature           → capacidad user-facing terminada
# scaffold          → estructura técnica (migration, test suite, fixture)
# extension-point   → cap que otras caps consumen (raro en brand · usual en core)
```

### 2.2 · Bloque `dev_preview` (obligatorio si `user_visible: true`)

```yaml
user_facing_name: "Agenda semanal de Valeria"
user_facing_description: >
  La vista calendario con drag-to-reschedule donde Valeria muestra los turnos
  de la semana. El doctor arrastra un slot vacío para crear una reserva o
  arrastra un slot ocupado para reagendarlo.

dev_preview:
  route: "/valeria/agenda"
  how_to_navigate: "Login → ribbon clic en avatar Valeria → sub-tab Agenda"
  main_component: "vitalia/frontend/src/features/scheduling/components/AgendaWeekly.tsx"
  api_endpoints:
    - "GET /api/v1/scheduling/slots?week={iso}"
    - "POST /api/v1/scheduling/appointments"
  e2e_test: "vitalia/frontend/e2e/specs/valeria-agenda-create.spec.ts"
  fixtures_required: ["3-clinic-fixture-latam"]
  storybook_url: null  # opcional · link Storybook si existe
  loom_demo: null      # opcional · video Loom 30s si existe
```

Caps `user_visible: false` (infra) pueden omitir `dev_preview` o llenarlo parcial. Caps `nature: scaffold` siempre exentas.

### 2.3 · Taxonomía completa Vitalia (7 agentes user-facing + infra)

| Agent owner | Emoji | Subtitle | Functional areas |
|---|---|---|---|
| `lisa` | 🏥 | Mi Clínica | `lisa.identidad-marca` · `lisa.servicios` · `lisa.autoridad` · `lisa.equipo` |
| `valeria` | 🗓 | Mi Día | `valeria.agenda` · `valeria.bookings` · `valeria.shell` (★ merge) |
| `adrian` | 💼 | Vender | `adrian.embudo` · `adrian.inbox` · `adrian.crm` · `adrian.reactivacion` |
| `lucas` | 📣 | Marketing | `lucas.atribucion` · `lucas.bowtie` · `lucas.recommendations` · `lucas.referrals` |
| `camila` | 🌟 | Reputación + cohortes | `camila.nps` · `camila.followup` · `camila.cohorts` |
| `config` | ⚙ | Configurar | `config.onboarding` · `config.compliance` · `config.auth` · `config.iam` · `config.clinics` · `config.public-landing` · `config.patients-records` · `config.connections` · `config.admin` |
| `infra` | 🔧 | Infra Vitalia | `infra.copilot` · `infra.observability` · `infra.platform` · `infra.payment` · `infra.agentic-engine` · `infra.sales-agent-engine` · `infra.scaffolding` (tests+fixtures+workers+ops+audit) |

### 2.4 · Merge shell-organism (decisión Chris #3)

Las 7 caps actuales de `shell-organism/` (`empty-states`, `layout-5050`, `ribbon`, `routing`, `sub-tabs`, `valeria-chat`, `valeria-sidebar`) se mergean a **1 sola capability** `shell-organism/shell-vitalia.yaml`:

- `agent_owner: valeria` (Valeria es el host del shell)
- `functional_area: valeria.shell`
- `user_facing_name: "Shell visual de Vitalia post-login"`
- `nature: feature`
- `atomics:` 7 items (uno por slice F1-S4..S10) — `added_in_story` preserva trazabilidad
- `change_log:` 7 entries (una por slice) — `type: new` para S4, `type: extend` para S5..S10
- Las 7 caps actuales se mergean a archive: NO se borran sus YAML (preserva trazabilidad histórica), pero el cockpit solo lee el cap merged (campo `superseded_by: shell-vitalia` en los 7 originales)

Pattern análogo aplicable a otros casos de granularidad excesiva (e.g. compliance/* tres caps que probablemente son atomics de `config.compliance`).

### 2.5 · Areas/ user-facing (decisión Chris #2)

Se promueve `vitalia/docs/product/areas/` como SSoT user-facing del producto:

```
vitalia/docs/product/
├── areas/                       ★ NEW · 7 archivos · SSoT user-facing
│   ├── lisa.md
│   ├── valeria.md
│   ├── adrian.md
│   ├── lucas.md
│   ├── camila.md
│   ├── configurar.md
│   └── infra.md
├── modules/                     mantener · técnico para devs (DDD paths)
│   ├── scheduling.md            (paths backend/frontend)
│   ├── crm.md
│   └── ...
└── capabilities/                YAML SSoT (4 dimensiones)
    ├── scheduling/
    ├── crm/
    └── ...
```

Cada `areas/{agent}.md` lista functional_areas → caps. Auto-gen via `scripts/generate_capability_index.py --brand vitalia` (Fase E).

### 2.6 · Cockpit MapView refactor

`tools/luana-cockpit/components/map/MapView.tsx`:

1. Elimina `const AGENTS` con hardcoded `modules: string[]`.
2. Lee `cap.agent_owner` + `cap.functional_area` del YAML.
3. Agrupa por agent → functional_area → caps (3 niveles).
4. Filtro user_visible toggle (default: hide infra · matches "Mostrar live" actual semánticamente).
5. Cap drawer nuevas tabs:
   - **Cómo verlo** → render `dev_preview` block (route, navigation, component path, endpoints, test path, fixtures)
   - **Historial** → timeline `change_log[]` (story_id → date → type → atomics_added/modified → merge_sha)
6. **Cero bucket "Otros módulos"** — si un cap llega sin `agent_owner` declarado → renderiza warning visual rojo + sugiere refining flow.

---

## § 3 — Consequences

### Positivas

- **Cero "huérfanos" en el cockpit.** Todo cap declara dueño explícito → mapa user-facing completo.
- **Lenguaje humano del producto.** `areas/{agent}.md` legible sin entender DDD ni paths.
- **Trazabilidad reversa.** Drawer Historial expone qué stories crearon/modificaron cada cap.
- **Onboarding nuevo dev.** "Cómo verlo" responde "dónde está esto en la app" en 1 click.
- **Anti-mirror.** Refining `extend` favorecido sobre `new` cuando functional_area ya existe.
- **Promotion candidate.** Modelo aplicable a otras brands (nicolify, comunify) si pasa el lift gate `/pm-luana`.

### Negativas / costos

- **Backfill 55 caps existentes** anotar 4 dimensiones + dev_preview. Sesión única autónoma (Fase B).
- **Refactor cockpit** MapView + drawer tabs. ~1-2 horas de subagent (Fase C).
- **Drift potencial** si stories nuevas olvidan declarar las 4 dimensiones. Mitigación: pre-commit hook valida que YAML cap nuevo tenga los 4 campos + `dev_preview` si `user_visible: true`.
- **Cross-brand divergence.** Si otras brands no adoptan el modelo, vitalia diverge. Mitigación: promotion proposal post-cement en vitalia.

### Migración (Fase A → F)

| Fase | Output | Owner | Estimado |
|---|---|---|---|
| A | ADR-vitalia-005 (este) + capability-protocol.md secciones 7-9 + template v3 | orchestrator | 30 min |
| B | 55 caps anotados con 4 dims + dev_preview | 3 subagentes paralelos | 30-45 min |
| C | Cockpit MapView + drawer refactor + typecheck pass | 1 subagente dedicado | 45-60 min |
| D | `areas/` 7 markdowns user-facing | orchestrator | 15 min |
| E | `scripts/generate_capability_index.py` + Makefile target | orchestrator | 30 min |
| F | Validate (lint + typecheck + cockpit smoke) + commit + push | orchestrator + haiku | 15 min |

Total: ~3 horas autónomo en una sesión.

---

## § 4 — Alternatives considered

### Alt 1 — Solo agregar `agent_owner` + `user_visible` (rechazada)

Más liviano (2 campos vs 4 + dev_preview). Pero no resuelve P2 (mezcla 3 conceptos en `module:`) ni P4 (user guide). Funcionalmente equivalente a hardcoded mapping movido al YAML — gana muy poco vs el costo de refactor.

### Alt 2 — Renombrar `modules/` → `areas/` borrando los técnicos (rechazada)

Más limpio en el árbol, pero rompe links cross-codebase de devs (los `modules/{m}.md` son linkeados desde 03-arch + audit reviews). Coexistencia paralela (modules técnicos + areas user-facing) tiene doble mantenimiento pero compatible.

### Alt 3 — Mantener taxonomía actual + solo arreglar hardcoded mapping (rechazada)

Hace 1 PR pequeño cockpit-only sin tocar YAML schema. Resuelve P1 mecánicamente. Pero deja P2, P3, P4, P5 sin resolver. Sería deuda técnica que vuelve la próxima ronda.

### Alt 4 — Modelo elegido (accepted)

4 dimensiones + dev_preview + areas/ paralela + merge shell-organism. Resuelve los 5 problemas raíz + entrega "lenguaje humano del producto" pedido por Chris.

---

## § 5 — Replication to other brands (promotion candidate)

Este ADR es brand-local vitalia. Si nicolify, comunify o futuras brands quieren adoptar el modelo:

1. `/pm-luana` evalúa promotion proposal post-Fase F cementada en vitalia
2. Si accepted → lift `docs/process/capability-protocol.md` secciones 7-9 + template a engine
3. Cada brand replica `areas/` con sus agentes propios (nicolify tiene agentes distintos: account_manager, project_lead, etc.)
4. Cockpit MapView ya quedaría brand-agnostic (lee del YAML, no hardcoded)

Promotion candidate flag: `promotable: candidate` en learnings post-cement vitalia (Fase F).

---

## § 6 — Anti-patterns

- ❌ Cap YAML nuevo sin `agent_owner` declarado (refining bloqueado)
- ❌ Cap `user_visible: true` sin `dev_preview` block (pre-commit hook bloquea)
- ❌ `functional_area` que no respete pattern `<agent>.<slug-kebab>` (e.g. `valeria_agenda` con underscore en vez de kebab)
- ❌ `agent_owner: orphan` o `agent_owner: other` (taxonomía cerrada · 7 valores válidos)
- ❌ Mover el bucket "Otros módulos" al frontend sin resolver el YAML (Band-aid)
- ❌ Borrar `modules/{m}.md` técnicos (los devs los usan)
- ❌ Crear nueva cap `shell-organism/X` post-merge cuando `valeria.shell` ya cubre (debe ser extend del cap merged)

---

## § 7 — References

- `docs/process/capability-protocol.md` (v2 cement 2026-05-27 · este ADR cementa Sección 7-9 v3)
- `docs/specs/templates/04-validators-template.yaml`
- `tools/luana-cockpit/components/map/MapView.tsx` (target refactor Fase C)
- `vitalia/docs/learnings/2026-05-16-capabilities-inventory-gap.md` (gap detection origen)
- `vitalia/docs/architecture/ADR-vitalia-004-shell-feature-architecture.md` (patrón shell que mergea a `valeria.shell`)
- `.claude/rules/anti-duplication-refining.md` (favoreciendo `extend` over `new`)
- `.claude/skills/pm-vitalia/SKILL.md` § "Capability promotion (al merge)"

---

## § 8 — Status board

- ✅ v1.0 cemented 2026-05-27 — Chris ratificó 4 decisiones (modelo 4 dims · renombrar `modules→areas` paralelo · merge shell-organism · sesión autónoma)
- ⏳ Fase A2 — capability-protocol.md secciones 7-9
- ⏳ Fase B — backfill 55 caps
- ⏳ Fase C — cockpit refactor
- ⏳ Fase D — areas/ creation
- ⏳ Fase E — auto-gen script
- ⏳ Fase F — validate + commit + push
