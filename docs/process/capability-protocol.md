# Capability Protocol — Story ↔ Capability Doctrine (v3.2 cement 2026-05-28)

**Cement-date v3.2:** 2026-05-28 (extiende v3.1 misma fecha · 4 bloques nuevos aditivos + header convention código).
**Cement-date v3.1:** 2026-05-28 (extiende v3 · atomic schema canónico v3.1 + Fase F.3 enforce rules).
**Cement-date v3:** 2026-05-27 (extiende v2 misma fecha · Sec 7-9 v3 son aditivas).
**Origen v2:** plan `/home/chalreme/.claude/plans/ok-lo-apruebo-realiza-cheeky-harbor.md` § Phase 1.1.A.
**Origen v3:** sesión `/pm-vitalia` 2026-05-27 — ADR-vitalia-005 (4 dimensiones + dev_preview + areas/).
**Origen v3.1:** sesión cap-verification 2026-05-28 — audit cockpit Mapa Implementado · atomic schema canónico + Fase F.3 enforce rules.
**Origen v3.2:** sesión bidirectional code↔cap mapping 2026-05-28 — Chris ratificó P1-P4 (scenarios híbrido + Copy gherkin + comentario header + validator cross-check).
**SSoT capability YAML schema v3.2.**

> Doctrina cementada: **Story** es transitoria (idea→done→archive), **Capability** es permanente (append-only ledger). Cada story declara `cap_target` + `cap_change_type` para mantener trazabilidad qué tocó qué. **v3 añade:** cada cap declara 4 dimensiones (`tech_module` + `agent_owner` + `functional_area` + `user_visible`) + bloque `dev_preview` para que el producto sea navegable en lenguaje humano.

---

## Sección 1 · Story vs Capability — la separación

| Dimensión | Story | Capability |
|---|---|---|
| Naturaleza | unidad **transitoria** de trabajo | unidad **permanente** del producto |
| Lifecycle | idea → refining → ... → done → archive | viva mientras el cap exista en el producto |
| Path activo | `{brand}/docs/product/stories/{id}/` | `{brand}/docs/product/capabilities/{module}/{cap}.yaml` |
| Path archive | `{brand}/docs/archive/{year}/stories/{id}/` | N/A (cap nunca se archiva, queda en `capabilities/`) |
| Append-only | NO (los archivos editan + se cierran) | SÍ (`change_log[]` append-only) |
| Ratifica Chris | sí (en cada transition relevante) | no (Chris ratifica via story que la toca) |

**Regla cardinal:** una story sin `cap_target` declarado en checkpoint NO puede pasar de `refining → refined`. El cap target define qué pieza del producto se toca. Si la story crea un cap nuevo, `cap_target` = el slug nuevo + `cap_change_type: new`.

---

## Sección 2 · Schema cap YAML v3.1

```yaml
---
capability_id: vitalia.scheduling.valeria-agenda
module: scheduling                        # alias de tech_module · deprecation 2026-Q3
tech_module: scheduling                   # REQUIRED v3 · kebab path canónico
slug: valeria-agenda
status: live                              # live | beta | deprecated | sunset
license: brand-local                      # brand-local | core-shared

# Dimensiones v3 (4 campos · cement 2026-05-27 · REQUIRED todos)
agent_owner: valeria                      # lisa | valeria | adrian | lucas | camila | config | infra
functional_area: valeria.agenda           # <agent>.<area-kebab>
user_visible: true                        # true | false
nature: feature                           # feature | scaffold | extension-point

# Ledger fields (v2 cement 2026-05-27)
created_in_story: vitalia-fase2-valeria-agenda
created_date: 2026-05-27
last_modified: 2026-05-27
package_version: vitalia-fase2-v1.0.0
package_path: vitalia/backend/src/modules/vitalia/scheduling/

# Architecture
architecture_pattern: ADR-vitalia-004     # ADR slug si aplica
hipaa_lite_overlay: true                  # opcional (vitalia-specific)

# Capability lineage
parent_cap: null                          # null si root · slug si derive
derives_capabilities: []                  # caps hijas spawned via derive

# Atomics como objects (v3.1 — schema canónico · cement 2026-05-28)
atomics:
  - id: vista-calendario-semanal                    # REQUIRED · kebab-case unique dentro del cap · max 60 chars
    name: "Vista calendario semanal"                # REQUIRED · Spanish neutro
    surface: FE                                     # REQUIRED · FE | BE | AGENTIC | FE+BE | FE+BE+AGENTIC | DOCS | INFRA
    added_in_story: vitalia-fase2-valeria-agenda    # REQUIRED · debe existir en stories/ o archive/*/stories/
    added_date: 2026-05-27                          # REQUIRED · ISO date
    status: live                                    # REQUIRED · live | wip | deprecated
    verification:                                   # OPTIONAL en v3.1 (warnings) · REQUIRED en v3.2
      fe_path: "vitalia/frontend/src/features/scheduling/components/AgendaWeekly.tsx"
      be_path: null
      agentic_path: null
      e2e_test: "vitalia/frontend/e2e/specs/valeria-agenda-create.spec.ts"
    # deprecated_in_story: null                     # OPTIONAL · si status=deprecated
    # deprecated_date: null                         # OPTIONAL · si status=deprecated
  - id: drag-to-reschedule
    name: "Drag-to-reschedule"
    surface: FE
    added_in_story: vitalia-fase2-valeria-agenda
    added_date: 2026-05-27
    status: live
    verification:
      fe_path: null
      be_path: null
      agentic_path: null
      e2e_test: null
  # futuro: cuando llegue extend, agregar aquí más con added_in_story distinto

# Append-only ledger (v2 · atomics_added lista IDs desde v3.1)
change_log:
  - story_id: vitalia-fase2-valeria-agenda
    date: 2026-05-27
    type: new                              # new | fix | extend | derive
    summary: "Implementación inicial · vista calendario + drag-to-reschedule + advisory lock"
    atomics_added: ["vista-calendario-semanal", "drag-to-reschedule"]
    atomics_modified: []
    merge_sha: 4562140c
    status: done                           # in-progress | done
---

# Resumen markdown opcional debajo del frontmatter
```

---

## Sección 3 · `cap_change_type` ∈ {new, fix, extend, derive}

Cada story declara qué tipo de cambio aplica al cap target. Es enforce-able via pre-commit hook + auditor Phase D + skill /architect coherence check.

| Tipo | Cuándo aplica | Efecto en cap YAML |
|---|---|---|
| `new` | Story crea un cap que NO existía antes | Crea el YAML + `change_log[0]` + atomics iniciales |
| `fix` | Story arregla bug/regresión SIN agregar funcionalidad | Append `change_log` entry (atomics NO cambia) |
| `extend` | Story agrega capacidades NUEVAS al mismo cap | Append `change_log` + append nuevos atomics |
| `derive` | Story crea cap HIJO basado en uno existente | Crea YAML hijo con `parent_cap: {origen}` + `change_log[0]` + actualiza `derives_capabilities[]` del padre |

### Ejemplos:

**new** — F2-S1 `valeria-agenda` (cap nueva):
```yaml
# story checkpoint
cap_target: valeria-agenda
cap_change_type: new
```

**fix** — F1-FIX `shell-layout-5050-race-fix`:
```yaml
cap_target: shell.layout-5050
cap_change_type: fix
```

**extend** — F2-S7v2 `lisa-marca v2` agrega atomics adicionales a `lisa-marca`:
```yaml
cap_target: lisa.marca
cap_change_type: extend
```

**derive** — Story futura crea `valeria.agenda.mobile` como cap derivado de `valeria.agenda`:
```yaml
cap_target: valeria.agenda.mobile
cap_change_type: derive
parent_story: vitalia-fase2-valeria-agenda
# en cap YAML target:
# parent_cap: valeria-agenda
```

---

## Sección 4 · Atomics — schema canónico v3.1 (cement 2026-05-28)

### Evolución histórica

**v1 (plano):**
```yaml
atomics: ["Vista calendario semanal", "Drag-to-reschedule"]
```

**v2 (objects con label):**
```yaml
atomics:
  - label: "Vista calendario semanal"
    added_in_story: vitalia-fase2-valeria-agenda
    added_date: 2026-05-27
```

**v3.1 (schema canónico completo):**
```yaml
atomics:
  - id: vista-calendario-semanal           # REQUIRED · kebab-case · unique dentro del cap · max 60 chars
    name: "Vista calendario semanal"       # REQUIRED · Spanish neutro · string user-facing
    surface: FE                            # REQUIRED · enum (ver tabla abajo)
    added_in_story: vitalia-fase2-valeria-agenda  # REQUIRED · debe existir en stories/ o archive/*/stories/
    added_date: 2026-05-27                 # REQUIRED · ISO date YYYY-MM-DD
    status: live                           # REQUIRED · live | wip | deprecated
    verification:                          # OPTIONAL en v3.1 (genera warnings) · REQUIRED en v3.2 (errores)
      fe_path: <relative path|null>        # ej: "vitalia/frontend/src/features/scheduling/components/AgendaWeekly.tsx"
      be_path: <relative path|null>        # ej: "vitalia/backend/src/modules/vitalia/scheduling/api/appointments.py"
      agentic_path: <relative path|null>   # ej: "vitalia/backend/src/modules/vitalia/sales_agent/prompts/slots/valeria_voice.txt"
      e2e_test: <relative path|null>       # ej: "vitalia/frontend/e2e/specs/scheduling/create-appointment.spec.ts"
    deprecated_in_story: null              # OPTIONAL · story que depreca el atomic (si status=deprecated)
    deprecated_date: null                  # OPTIONAL · ISO date (si status=deprecated)
```

### Tabla campos REQUIRED

| Campo | Tipo | Constraint |
|---|---|---|
| `id` | string | kebab-case · único dentro del cap · max 60 chars · inmutable post-merge |
| `name` | string | Spanish neutro · user-facing · max 120 chars |
| `surface` | enum | ver tabla Surface enum abajo |
| `added_in_story` | string | debe existir como story-id en `stories/` activo o `archive/*/stories/` |
| `added_date` | string | ISO date `YYYY-MM-DD` |
| `status` | enum | `live` \| `wip` \| `deprecated` |

### Surface enum

| Valor | Cuándo usar |
|---|---|
| `FE` | Atomic solo visible en frontend (componente, hook, store, route) |
| `BE` | Atomic solo en backend (endpoint, domain service, repo, migration) |
| `AGENTIC` | Atomic en capa agentic (prompt, tool, workflow LangGraph, LLM call) |
| `FE+BE` | Atomic con superficie frontend + backend (integración form → API) |
| `FE+BE+AGENTIC` | Atomic full-stack incluyendo agentic engine |
| `DOCS` | Atomic de documentación/spec/ADR sin código (compliance docs, contracts) |
| `INFRA` | Atomic de infraestructura (migration, fixture, worker, script ops, config) |

### Reglas verificación path-surface coherencia

- Si `surface: FE` → solo `fe_path` y `e2e_test` pueden ser non-null en `verification`. `be_path` y `agentic_path` deben ser null.
- Si `surface: BE` → solo `be_path` puede ser non-null. `fe_path` debe ser null.
- Si `surface: AGENTIC` → solo `agentic_path` puede ser non-null. `fe_path` debe ser null.
- Si `surface: FE+BE` → al menos `fe_path` y `be_path` declarados (o `e2e_test` ratifica ambas).
- Si `surface: FE+BE+AGENTIC` → al menos 2 de 3 paths (`fe_path`, `be_path`, `agentic_path`) declarados.
- Si `surface: DOCS` o `INFRA` → todos los verification paths pueden ser null (advisory si e2e_test declarado).

### Status enum

| Valor | Significado |
|---|---|
| `live` | Atomic implementado y en producción |
| `wip` | Atomic en desarrollo (story en flight) |
| `deprecated` | Atomic retirado (NO eliminar del array — marcar con `deprecated_in_story` + `deprecated_date`) |

**Regla deprecation:** NUNCA eliminar un atomic del array. Marca `status: deprecated` + `deprecated_in_story` + `deprecated_date`. El ledger es append-only + mark-deprecated.

### Ejemplo canónico shell-vitalia (anchor)

```yaml
atomics:
  - id: topbar-global
    name: "Barra superior global de navegación"
    surface: FE
    added_in_story: vitalia-fase1-topbar-global
    added_date: 2026-05-15
    status: live
    verification:
      fe_path: "vitalia/frontend/src/components/shared/shell-organism/TopBar.tsx"
      be_path: null
      agentic_path: null
      e2e_test: "vitalia/frontend/e2e/specs/smoke/shell-topbar.spec.ts"
```

**Migración v2 → v3.1:** `scripts/migrate_capability_ledger.py` extiende atomics existentes con los campos nuevos. Items sin `id` asignado usan slug generado desde el `label` (kebab-case truncado a 60 chars). Items sin `surface` infieren desde los campos de `verification` si están declarados; si no, default `FE` + advisory warning para revisión Chris.

**Migración v1 → v2 → v3.1:** `scripts/migrate_capability_ledger.py` (Phase 4a) convierte arrays planos → arrays de objects usando `story_introduced` + `date_introduced` del frontmatter v1, luego amplía al schema v3.1.

---

## Sección 5 · Fase F MERGE — ledger logic en `/pm-{brand}`

Cuando una story pasa `reviewing → done` (Fase F MERGE), `/pm-{brand}` aplica logic del `cap_change_type` al YAML target:

### Rama A — `cap_change_type: new`
1. Crear `{brand}/docs/product/capabilities/{module}/{slug}.yaml` con schema v2 completo
2. `change_log[0]` con `type: new` + `summary` + `atomics_added` listando atomics iniciales
3. `created_in_story` = story.id
4. `created_date` = today
5. Append commit body: "cap nueva: {slug}"

### Rama B — `cap_change_type: fix`
1. Append `change_log` entry con `type: fix`, atomics_added: [], atomics_modified: []
2. NO modifica `atomics[]` (eso solo cambia con extend)
3. Update `last_modified` = today

### Rama C — `cap_change_type: extend`
1. Append `change_log` entry con `type: extend` + lista de atomics nuevos
2. Append nuevos atomics al array `atomics[]` con `added_in_story` apuntando a esta story
3. Update `last_modified` = today

### Rama D — `cap_change_type: derive`
1. Crear cap YAML hijo con schema v3.1 + `parent_cap: {origen_slug}`
2. `change_log[0]` con `type: derive` + `summary` referenciando el cap padre
3. Update cap padre: append `derives_capabilities: [hijo_slug]`
4. Update padre `last_modified` (modificación de su array `derives_capabilities`)

**Order matters:** en `derive`, primero crear cap hijo (con parent_cap declarado), luego actualizar padre. Atomic write para evitar estado inconsistente.

### Enforce reglas Fase F.3 (cement 2026-05-28 · cap verification v3.1)

Antes de cerrar el merge commit, `/pm-{brand}` MUST verificar que el `change_log` entry de esta story cumpla:

| `cap_change_type` | `change_log[ultimo].atomics_added.length` | Otros checks |
|---|---|---|
| `new` | `>= 1` **REQUIRED** | `atomics[]` overall debe tener ≥1 atomic con shape v3.1 válido (campos REQUIRED presentes) |
| `extend` | `>= 1` **REQUIRED** | `atomics[]` debe haber crecido respecto al commit anterior (diff positivo) |
| `fix` | `>= 0` (puede ser `[]`) | NO requiere atomic nuevo · solo append `change_log` con fix entry |
| `derive` | `>= 1` **REQUIRED** en cap hijo | `parent_cap.derives_capabilities[]` debe listar el hijo nuevo |

**Violación detectada** → REFUSE cerrar Fase F.3. Escalar a Chris con message: "cap_change_type={type} declarado pero atomics_added={n} en change_log · mínimo requerido: 1".

**Enforce point:** `scripts/reconcile_capabilities.py --validate-ledger` detecta violaciones post-merge. Pre-commit hook:
- HARD block en `main/release/*` si commit toca checkpoint con `cap_change_type ∈ {new, extend}` y NO toca cap YAML correspondiente.
- WARN advisory en `wip/*` (no bloquea, muestra mensaje).

---

## Sección 6 · Anti-patterns prohibidos

- ❌ Editar `atomics[]` manualmente desde un commit que no sea Fase F MERGE de la story que los introduce
- ❌ Story sin `cap_target` declarado pasa `refining → refined` (skill /architect debe rechazar)
- ❌ Cross-brand mirror cap: dos brands replican el mismo cap → debe vivir en `core/luana-core-*/` (lift gate `/pm-luana`)
- ❌ `change_log[]` modificado (no append) — viola append-only ledger
- ❌ Atomic con `added_in_story` que NO existe en `change_log[]` → inconsistencia (pre-commit hook bloquea)
- ❌ Cap nuevo con `parent_cap` declarado pero padre NO tiene este cap en `derives_capabilities[]` → inconsistencia
- ❌ `cap_change_type: extend` con archivos producidos que crean cap nuevo (incoherencia spec/code)
- ❌ Borrar atomic existente: NUNCA (deprecation cementada → marca `deprecated_in_story` + sigue en array)
- ❌ Cap YAML sin `agent_owner` o sin `functional_area` declarado (v3 cement · pre-commit hook bloquea)
- ❌ Cap `user_visible: true` sin bloque `dev_preview` (v3 cement · pre-commit hook bloquea)
- ❌ `agent_owner:` con valor fuera del set cerrado vitalia `{lisa, valeria, adrian, lucas, camila, config, infra}` (v3 cement)
- ❌ `functional_area:` sin pattern `<agent>.<slug-kebab>` (e.g. `valeria_agenda` con underscore → debe ser `valeria.agenda`)
- ❌ Crear cap nuevo cuando `functional_area` existente la cubre — refining favorece `extend` over `new` (rule anti-duplication-refining)
- ❌ Renombrar `tech_module:` post-merge (path canónico inmutable · usar `superseded_by:` si hay refactor real)

---

## Sección 7 · Las 4 dimensiones de un cap (v3 cement 2026-05-27)

> Origen: ADR-vitalia-005. Acordado con Chris en sesión `/pm-vitalia` 2026-05-27.

El schema v2 introdujo `change_log[]` + atomics objects. El schema v3 NO modifica esos campos — los preserva — pero **agrega 4 dimensiones de clasificación** que el cockpit usa para agrupar caps en lenguaje humano (vs el bucket "Otros módulos" actual).

### Las 4 dimensiones

| # | Campo YAML | Concepto | Valores válidos |
|---|---|---|---|
| 1 | `tech_module:` | dominio técnico (DDD backend · FSD frontend) — path canónico | `scheduling`, `crm`, `brand_studio`, ... (kebab del path real) |
| 2 | `agent_owner:` | quién es el dueño UI/UX user-facing | `lisa` · `valeria` · `adrian` · `lucas` · `camila` · `config` · `infra` |
| 3 | `functional_area:` | sub-categoría user-facing **dentro** del agente | `<agent>.<area-kebab>` (ej. `valeria.agenda`, `config.compliance`) |
| 4 | `user_visible:` | aparece en mapa principal del producto | `true` (default) · `false` (infra cross-cutting) |

**Regla cardinal:** todo cap (nuevo o existente) MUST declarar las 4 dimensiones. Cap sin `agent_owner` o sin `functional_area` válido → pre-commit hook bloquea y refining no avanza.

### Mapeo brand `agent_owner` (vitalia · v1)

| `agent_owner` | Emoji | Subtitle | Functional areas válidas |
|---|---|---|---|
| `lisa` | 🏥 | Mi Clínica | `lisa.identidad-marca` · `lisa.servicios` · `lisa.autoridad` · `lisa.equipo` |
| `valeria` | 🗓 | Mi Día | `valeria.agenda` · `valeria.bookings` · `valeria.shell` |
| `adrian` | 💼 | Vender | `adrian.embudo` · `adrian.inbox` · `adrian.crm` · `adrian.reactivacion` |
| `lucas` | 📣 | Marketing | `lucas.atribucion` · `lucas.bowtie` · `lucas.recommendations` · `lucas.referrals` |
| `camila` | 🌟 | Reputación + cohortes | `camila.nps` · `camila.followup` · `camila.cohorts` |
| `config` | ⚙ | Configurar | `config.onboarding` · `config.compliance` · `config.auth` · `config.iam` · `config.clinics` · `config.public-landing` · `config.patients-records` · `config.connections` · `config.admin` |
| `infra` | 🔧 | Infra Vitalia | `infra.copilot` · `infra.observability` · `infra.platform` · `infra.payment` · `infra.agentic-engine` · `infra.sales-agent-engine` · `infra.scaffolding` |

Otras brands declaran su propio mapeo `agent_owner` en su ADR-brand-XXX (lift propuesto via `/pm-luana` post-cement vitalia).

### Backward compatibility

El campo `module:` v2 se conserva como **alias de `tech_module:`** durante 1 release. Pre-commit hook acepta ambos (warning si `module:` solo, error si ninguno). Post-deprecation (2026-Q3) solo `tech_module:` válido.

---

## Sección 8 · `user_visible` + `nature`

### `user_visible: true | false` (default true)

Define si el cap aparece en el **mapa principal** del cockpit (vista user-facing del producto) o solo cuando se activa el toggle "Mostrar infra".

| Cap es… | `user_visible:` | Ejemplos |
|---|---|---|
| Funcionalidad terminada que un user puede ver/usar | `true` | `valeria.agenda`, `lisa.identidad-marca`, `adrian.inbox` |
| Infra cross-cutting que habilita features pero no es navegable | `false` | `infra.observability`, `infra.platform`, `infra.payment` |
| Scaffolding (tests, fixtures, migrations, workers, ops) | `false` | `infra.scaffolding.playwright-smoke-suite`, `infra.scaffolding.3-clinic-fixture-latam` |

**Regla:** si `user_visible: true` → `dev_preview` block obligatorio (Sección 9).

### `nature: feature | scaffold | extension-point` (default feature)

| Valor | Significado | Ejemplos |
|---|---|---|
| `feature` | capacidad user-facing terminada | `valeria.agenda` · `adrian.inbox` |
| `scaffold` | estructura técnica sin user value directo | migrations · fixtures · test suites · cron workers |
| `extension-point` | cap que otras caps consumen (raro en brand · usual en core) | `compliance.phi-repository-base` |

Caps `nature: scaffold` siempre exentas de `dev_preview` (no hay "cómo llegar" porque no es navegable).

---

## Sección 9 · `dev_preview` block (obligatorio si `user_visible: true`)

> Propósito: responder en 1 vistazo "¿dónde está esto en la app? ¿qué endpoint pegar? ¿cómo verlo en development?".

```yaml
user_facing_name: "Agenda semanal de Valeria"
# Nombre human-readable de la capacidad (no el slug · no el tech_module)
# Máx 80 chars · Spanish neutro (NO voseo per .claude/rules/spanish-text.md
# salvo sales_agent voice)

user_facing_description: >
  La vista calendario con drag-to-reschedule donde Valeria muestra los turnos
  de la semana. El doctor arrastra un slot vacío para crear una reserva o
  arrastra un slot ocupado para reagendarlo.
# 2-5 líneas · Spanish neutro · lenguaje humano sin jerga técnica
# Lo que un médico clínica entendería leyendo

dev_preview:
  route: "/valeria/agenda"                # ruta Next.js · null si BE-only
  how_to_navigate: "Login → ribbon clic en avatar Valeria → sub-tab Agenda"
  # Pasos verbatim para llegar al cap en una sesión local dev

  main_component: "vitalia/frontend/src/features/scheduling/components/AgendaWeekly.tsx"
  # Path al componente FE principal · null si BE-only

  api_endpoints:                          # endpoints que el cap consume
    - "GET /api/v1/scheduling/slots?week={iso}"
    - "POST /api/v1/scheduling/appointments"

  e2e_test: "vitalia/frontend/e2e/specs/valeria-agenda-create.spec.ts"
  # Path al test Playwright que cubre el happy path · null si no hay E2E aún

  fixtures_required:                       # fixtures que el cap necesita pre-cargadas
    - "3-clinic-fixture-latam"

  storybook_url: null                      # opcional · null si no aplica
  loom_demo: null                          # opcional · link Loom 30s si Chris grabó demo
```

### Reglas de llenado

- `route:` **null** si cap es BE-only (no hay UI · ej. `infra.payment.mercado-pago-adapter`)
- `how_to_navigate:` siempre poblado si `route:` existe — Spanish neutro 1-2 oraciones
- `main_component:` path absoluto desde repo root — null si BE-only
- `api_endpoints:` lista de strings — vacía `[]` si cap es FE-only sin API
- `e2e_test:` null si cap no tiene E2E aún (advisory · no bloqueante)
- `fixtures_required:` vacía `[]` si cap no requiere fixtures

### Cap BE-only ejemplo

```yaml
agent_owner: infra
functional_area: infra.payment
user_visible: false
nature: feature
user_facing_name: "Adaptador Mercado Pago para reservas prepagadas"
user_facing_description: >
  Integra Mercado Pago para procesar pagos de reservas prepagadas en Vitalia.
  Genera preference, recibe webhook IPN, marca booking como paid.

dev_preview:
  route: null
  how_to_navigate: "BE-only · ver via tests de integración + logs payment_callback"
  main_component: null
  api_endpoints:
    - "POST /api/v1/payments/preference"
    - "POST /api/v1/payments/webhook/mercado-pago"
  e2e_test: null
  fixtures_required: []
```

---

## Sección 10 · Migración stories legacy → schema v2

Para cada cap YAML actual sin `change_log[]`:

1. Leer `story_introduced` + `date_introduced` del frontmatter v1
2. Inicializar `change_log[0]`:
   ```yaml
   change_log:
     - story_id: {story_introduced}
       date: {date_introduced}
       type: new                  # default · migración legacy
       summary: "Implementación inicial · migración legacy"
       atomics_added: [todos los atomics existentes en v1]
       atomics_modified: []
       merge_sha: null            # no recuperable retroactivamente
       status: done
   ```
3. Convertir `atomics[]` (array string → array object): cada item gana `added_in_story: {story_introduced}` + `added_date: {date_introduced}`
4. Si `extends_capability:` poblado → `parent_cap` (alias, mantener ambos por compat)
5. `created_in_story` = `story_introduced`
6. `created_date` = `date_introduced`
7. `last_modified` = `date_updated` si existe, else `date_introduced`

Script: `scripts/migrate_capability_ledger.py --brand {b} [--dry-run]`. Idempotente.

**Casos edge:**
- Cap sin atomics → `atomics: []` + `change_log[0].atomics_added: []` + warning para Chris ratify caso por caso
- Cap con `extends_capability:` poblado pero el padre no existe → marca como `parent_cap: {orphan-slug}` + WARN
- Cap con timestamps inconsistentes → usar `date_introduced` siempre como `created_date`

---

## Sección 11 · Schema v3.2 — bloques nuevos (cement 2026-05-28)

> Origen: sesión bidirectional code↔cap mapping 2026-05-28. Chris ratificó P1-P4 (scenarios híbrido + Copy gherkin + comentario header + validator cross-check). Los bloques v3.2 son **estricto aditivos sobre v3.1** — no modifican `identity`, `4 dimensions`, `dev_preview`, `atomics+verification`, ni `ledger`.

### Propósito v3.2

Que el cockpit Luana sea **la fuente verificable y narrada** de qué hace realmente el sistema:
1. **`access`** — extiende `dev_preview` con roles + multi-entry-point. Validator cross-checks contra `@require_phi_access` decorators del código.
2. **`scenarios`** — captura BDD user-facing (Given/When/Then) como SSoT permanente. Reemplaza navegar archive 01-spec.md.
3. **`business_rules`** — invariantes + HIPAA + retention + business logic explícitos.
4. **`related_capabilities`** — grafo dependencias (depends_on/enables/similar/obsoletes).

### Reglas obligatoriedad v3.2

- Bloques v3.2 son **opcionales** en v3.2 (compat con v3.1 caps existentes).
- Para caps `user_visible: true`, los bloques `access` + `scenarios` + `business_rules` se vuelven **REQUIRED** al merge Fase F.3 cuando `cap_change_type ∈ {new, extend}` (cement 2026-Q3).
- `related_capabilities` siempre opcional.
- v3.1 caps existentes migran gradualmente cuando se tocan via stories.

### Bloque 1 — `access` (extiende `dev_preview`)

```yaml
access:
  entry_points:                          # 1+ rutas para acceder al cap
    - path: "/valeria/agenda"             # REQUIRED · Next.js route O backend path
      navigation: "Login → ribbon Valeria → sub-tab Agenda"  # REQUIRED · Spanish neutro
      requires_role: [doctor, admin_clinic, nurse]  # REQUIRED si HIPAA · []  si público
      requires_clinic_scope: true         # OPTIONAL · default false · true = dual filter HIPAA
      entry_type: ui                      # OPTIONAL · ui | api | webhook | event | cli · default ui
  forbidden_roles: [marketing, patient]   # OPTIONAL · roles explícitamente denegados (audit)
  authentication: required                # REQUIRED · required | optional | none
```

**Roles canónicos vitalia** (per `vitalia/.claude/rules/hipaa-lite.md`):
- `doctor` · `nurse` · `admin_clinic` · `marketing` · `receptionist` · `patient`
- `staff_vitalia` (admin panel)

**Cross-check runtime (P4 ratificada):** validator `validate_code_cap_bidirectional.py` detecta drift entre `access.entry_points[].requires_role` y `@require_phi_access(roles=[...])` decorators en código + middleware Clerk. **Runtime mantiene enforcement actual · cap es fuente documental.**

### Bloque 2 — `scenarios` (BDD user-facing capability lifecycle)

```yaml
scenarios:
  - id: doctor-ve-agenda-semanal         # REQUIRED · kebab unique dentro del cap · max 60 chars
    name: "Doctor abre su agenda de la semana"  # REQUIRED · user-facing Spanish neutro · max 120 chars
    actor: doctor                         # REQUIRED · rol que actúa (debe estar en access.entry_points[].requires_role)
    status: live                          # REQUIRED · live | wip | deprecated
    given: "Doctor autenticado con clinic_scope=clinic-A"  # REQUIRED · 1 línea contexto inicial
    when: "Navega a /valeria/agenda"      # REQUIRED · 1 línea acción del actor
    then: "Ve calendario semana actual con turnos coloreados por estado pago"  # REQUIRED · 1+ líneas resultado esperado
    e2e_test: "vitalia/frontend/e2e/specs/valeria-agenda-list.spec.ts"  # OPTIONAL · path al test que cubre
    story_spec_ref: "vitalia/docs/archive/2026/stories/vitalia-fase2-valeria-agenda/01-spec.md#scenario-1"  # OPTIONAL · trazabilidad spec origen
    atomic_ref: vista-calendario-semanal  # OPTIONAL · solo si scenario aplica a atomic cross-surface (P1 híbrido)
    edge_cases:                           # OPTIONAL · lista narrativa Spanish neutro
      - "Semana sin turnos → empty state amigable con call-to-action 'agendar primer turno'"
      - "Doctor sin clinic_scope → 403 + redirect a setup clínica"
    added_in_story: vitalia-fase2-valeria-agenda  # REQUIRED · trazabilidad
    added_date: 2026-05-27                # REQUIRED · ISO date
    # deprecated_in_story: null           # OPTIONAL · si status=deprecated
    # deprecated_date: null               # OPTIONAL · ISO date
```

**Granularidad P1 ratificada (híbrido):**
- Scenarios cuelgan **directo de cap.scenarios[]** para 90% caps single-surface.
- `atomic_ref` OPCIONAL solo cuando scenario aplica a atomic cross-surface (FE+BE / FE+BE+AGENTIC).
- Evita overhead del 3-niveles obligatorio.

**Migración Gherkin P2 ratificada (Copy + story_spec_ref):**
- Scenarios principales (happy path + business rules) **copy verbatim** desde `01-spec.md` archive al cap YAML al merge Fase F.3.
- Edge cases extensos opcionalmente solo linkean al spec.
- Cap autocontenido = SSoT navegable sin necesidad de leer archive.

### Bloque 3 — `business_rules` (invariantes user-facing + HIPAA + retention)

```yaml
business_rules:
  - id: dual-tenant-clinic-filter         # REQUIRED · kebab unique dentro del cap
    rule: "Toda query a Appointment filtra tenant_id AND clinic_id (HIPAA dual filter)"  # REQUIRED · 1-2 líneas Spanish neutro
    enforcement:                          # REQUIRED · paths a rules/docs que enforce
      - ".claude/rules/tenant-isolation.md"
      - "vitalia/.claude/rules/hipaa-lite.md"
    code_ref: "vitalia/backend/src/modules/vitalia/scheduling/infrastructure/repositories.py"  # OPTIONAL · path código que implementa
    severity: critical                    # REQUIRED · critical | high | medium | low
    audit_trail: true                     # OPTIONAL · default false · true = action genera audit_log row
```

### Bloque 4 — `related_capabilities` (grafo de dependencias)

```yaml
related_capabilities:
  depends_on:                             # OPTIONAL · caps que ESTE cap necesita activas
    - shell-organism.shell-vitalia
    - iam.luana-core-adoption
  enables:                                # OPTIONAL · caps que SE habilitan por este (rev de depends_on)
    - scheduling.bookings-prepagadas
  similar:                                # OPTIONAL · variantes/derive children
    - valeria.agenda.mobile
  obsoletes:                              # OPTIONAL · caps marcados deprecated por este (refactor)
    - valeria.legacy-agenda-v1
```

### Reglas Fase F.3 enforce v3.2 (extiende § 5)

Al merge story con `cap_change_type ∈ {new, extend}`, `/pm-{brand}` MUST verificar adicionalmente (sobre § 5):

| cap_change_type | scenarios[] | access | business_rules |
|---|---|---|---|
| `new` + `user_visible: true` | `>= 1` REQUIRED (cement 2026-Q3) | REQUIRED (cement 2026-Q3) | OPTIONAL (advisory hasta 2026-Q4) |
| `new` + `user_visible: false` | OPTIONAL | OPTIONAL | OPTIONAL |
| `extend` + cap target tiene scenarios | append nuevos opcional | si nueva entry_point → REQUIRED | si nueva business rule → REQUIRED |
| `fix` | NO requiere cambio | NO requiere cambio | NO requiere cambio |
| `derive` | hijo hereda + customiza scenarios | hijo declara su access | hijo hereda + override |

**Enforce point:** `scripts/validate_code_cap_bidirectional.py` (cement 2026-05-28) detecta drift:
- HARD pre-push si scenarios[].e2e_test path declarado no existe
- HARD pre-push si access.entry_points[].requires_role contradice runtime decorators
- Advisory pre-commit wip si caps user_visible carecen de bloques v3.2 obligatorios (cement 2026-Q3)

---

## Sección 12 · Header convention código (P3 ratificada · cement 2026-05-28)

Cada archivo de código (`.py`, `.ts`, `.tsx`) declara su capability owner via header de 3 líneas en posición 1.

### Formato canónico

**Python (`*.py`):**
```python
# cap: scheduling.valeria-agenda
# atomics: vista-calendario-semanal, drag-to-reschedule
# story-origin: vitalia-fase2-valeria-agenda
"""(docstring de la función/clase normal)"""
```

**TS/TSX (`*.ts`, `*.tsx`):**
```tsx
// cap: scheduling.valeria-agenda
// atomics: vista-calendario-semanal
// story-origin: vitalia-fase2-valeria-agenda
'use client';

export function AgendaWeekly() { ... }
```

**Multi-cap (archivo aporta a 2+ caps):**
```python
# cap: [shell-organism.shell-vitalia, scheduling.valeria-agenda]
# atomics: [shell-routing, vista-calendario-semanal]
# story-origin: [vitalia-fase1-routing-shell, vitalia-fase2-valeria-agenda]
```

### Special markers

| Marker | Significado | Cuándo usar |
|---|---|---|
| `__orphan__` | Archivo sin cap owner principal (candidato refactor) | Cross-module utilities sin claro home |
| `__shared__` | Cross-cap consumer multi-feature | Shadcn UI primitives, format helpers, hooks compartidos |
| `__skip__` | Intencionalmente sin cap (testing infra, fixtures) | `test-setup.ts`, `test-utils/`, fixtures |

### Reglas obligatorias

| Campo | Required | Constraint |
|---|---|---|
| `cap:` | YES | string `<module>.<slug>` OR array OR special marker · debe existir en `{brand}/docs/product/capabilities/{module}/{slug}.yaml` |
| `atomics:` | NO | string OR array · IDs deben existir en `cap.atomics[].id` · advisory si missing |
| `story-origin:` | YES | story-id del primer commit que tocó este archivo dentro del cap · trazabilidad |

**Position rules:**
- BE Python: header ANTES de docstring del módulo (líneas 1-5). Si shebang `#!/usr/bin/env python3`, header DESPUÉS.
- FE TS/TSX: header ANTES de `'use client'`. Si JSDoc preexistente, header después de JSDoc.
- Idempotente: re-aplicar NO duplica headers (validator detecta header existente).

### Regex parseable (validators usan estos exactos)

```regex
# Python
^\s*#\s*cap:\s*(\[.+?\]|\S+)
^\s*#\s*atomics:\s*(\[.+?\]|.+)
^\s*#\s*story-origin:\s*(\[.+?\]|\S+)

# TS/TSX
^\s*//\s*cap:\s*(\[.+?\]|\S+)
^\s*//\s*atomics:\s*(\[.+?\]|.+)
^\s*//\s*story-origin:\s*(\[.+?\]|\S+)
```

### Excepciones (NO requieren header)

- `vitalia/backend/alembic/` (migrations infra)
- Test files (`*.test.ts`, `*.spec.ts`, `__tests__/`) — heredan cap del file que testean
- `_pycache_/` (bytecode)

### Tooling

- `scripts/generate_code_to_cap_index.py` (cement 2026-05-28) — grep headers + produce `{brand}/docs/product/capabilities/_code-index.json` (gitignored R3 v2)
- `scripts/git-hooks/pre-commit` § Section 5c — advisory regen al stage code files
- `scripts/validate_code_cap_bidirectional.py` (cement 2026-05-28) — cross-check 4 niveles entre headers, atomics verification paths, decorators runtime

---

## Sección 13 · Bidirectional validator cross-checks (cement 2026-05-28)

`scripts/validate_code_cap_bidirectional.py` ejecuta 4 cross-checks que detectan drift entre code headers + cap YAML + runtime enforcement.

### Cross-check 1 — Atomics verification ↔ headers

Para cada `cap.atomics[*].verification.{fe_path,be_path,agentic_path,e2e_test}` declarado:
- El archivo apuntado MUST tener header `# cap: <cap_id>` (o multi-cap incluyendo `<cap_id>`)
- Si header apunta a cap distinto → DRIFT (cap.atomics declara archivo X pero X dice ser de otro cap)

### Cross-check 2 — Headers ↔ atomics referenced

Para cada archivo con header `# atomics: <id1>, <id2>`:
- Los IDs declarados MUST existir en `cap.atomics[].id` del cap declarado en header
- IDs huérfanos (no en cap.atomics) → DRIFT (header cita atomic inexistente)

### Cross-check 3 — Scenarios e2e_test path existence

Para cada `cap.scenarios[*].e2e_test` declarado:
- El path MUST existir en filesystem
- El archivo MUST contener `test(` o `test.describe(` (Playwright pattern)
- Si missing → HARD pre-push block

### Cross-check 4 — Access roles ↔ runtime decorators (P4 ratificada)

Para cada `cap.access.entry_points[*].requires_role: [...]`:
- Si `entry_type: ui` → buscar Next.js route en `vitalia/frontend/src/app/...{path}/page.tsx` + verificar middleware Clerk + tenant context
- Si `entry_type: api` → buscar FastAPI endpoint en `vitalia/backend/src/modules/vitalia/{module}/api/` + verificar `@require_phi_access(roles=[...])` decorator
- Roles declarados en cap MUST coincidir con roles en decorator (cross-check sets equal)
- Drift → DRIFT advisory (no block · cap doc puede estar deliberadamente más permissive que runtime para futuras releases)

### Output

`{brand}/docs/product/capabilities/_bidirectional-validation.json` (gitignored R3 v2):
```json
{
  "validated_at": "2026-05-28T...",
  "brand": "vitalia",
  "cross_check_1": { "total": 7, "pass": 5, "drift": 2, "details": [...] },
  "cross_check_2": { "total": 1097, "pass": 1097, "drift": 0, "details": [] },
  "cross_check_3": { "total": 0, "pass": 0, "drift": 0, "details": [] },
  "cross_check_4": { "total": 0, "pass": 0, "drift": 0, "details": [] },
  "summary": { "drift_total": 2, "verdict": "PARTIAL" }
}
```

### Enforcement

| Layer | Mecanismo | Status |
|---|---|---|
| 1 | Pre-commit Section 5d advisory wip | cement 2026-05-28 |
| 2 | Pre-push HARD block en main/release/* si cross_check_3 drift > 0 | cement 2026-05-28 |
| 3 | Pre-push HARD block en cualquier branch si cross_check_1 drift > 0 | cement 2026-05-28 |
| 4 | Cockpit DriftView lee `_bidirectional-validation.json` + muestra drift visualmente | Fase C |

---

## Sección 14 · Referencias

- `vitalia/docs/architecture/ADR-vitalia-005-capability-model-4-dimensions.md` — ADR brand-local que cementa Sec 7-9 v3
- `docs/process/release-protocol.md` — entity Release agrupa stories que tocan caps
- `docs/process/chris-input-protocol.md` — chris-input.md donde Chris ratifica `cap_change_type`
- `docs/process/cockpit-permissions.md` — qué fields del cap son read-only desde cockpit
- `.claude/rules/anti-duplication-refining.md` — prior-art scan detect cap existente antes `cap_change_type: new` · favoreciendo `extend` over `new`
- `.claude/rules/story-closure-gate.md` § Fase F.3 — capability ledger update step
- `.claude/rules/brand-docs-schema.md` — schema canónico `{brand}/docs/product/capabilities/`
- `scripts/migrate_capability_ledger.py` — migration script
- `scripts/reconcile_capabilities.py --validate-ledger` — validation
- `scripts/generate_capability_index.py` — auto-gen `docs/portfolio/{brand}-capabilities.md` user-facing
- `tools/luana-cockpit/lib/cap-ledger.ts` — implementación 4 ramas (new/fix/extend/derive)
- `tools/luana-cockpit/components/map/MapView.tsx` — UI consumer del cap YAML (lee `agent_owner` + `functional_area` + `user_visible`)
- `vitalia/docs/product/areas/` — 7 markdowns user-facing (1 por agent_owner)
- `vitalia/docs/product/modules/` — markdowns técnicos paralelos (DDD paths para devs)
- `scripts/generate_code_to_cap_index.py` (cement 2026-05-28) — code↔cap index R3 v2
- `scripts/validate_code_cap_bidirectional.py` (cement 2026-05-28) — bidirectional validator 4 cross-checks
- `scripts/git-hooks/pre-commit` § Section 5c (regen advisory) + 5d (bidirectional advisory) — wip gates
- `_research-notes.md` + `_fase-decisions.md` (temporales · eliminados al cerrar Fase C 2026-05-28)
