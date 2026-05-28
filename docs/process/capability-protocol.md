# Capability Protocol — Story ↔ Capability Doctrine (v3 cement 2026-05-27)

**Cement-date v3:** 2026-05-27 (extiende v2 misma fecha · Sec 7-9 v3 son aditivas).
**Origen v2:** plan `/home/chalreme/.claude/plans/ok-lo-apruebo-realiza-cheeky-harbor.md` § Phase 1.1.A.
**Origen v3:** sesión `/pm-vitalia` 2026-05-27 — ADR-vitalia-005 (4 dimensiones + dev_preview + areas/).
**SSoT capability YAML schema v3.**

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

## Sección 2 · Schema cap YAML v2

```yaml
---
capability_id: vitalia.scheduling.valeria-agenda
module: scheduling
slug: valeria-agenda
status: live                              # live | beta | deprecated | sunset
license: brand-local                      # brand-local | core-shared

# Ledger fields (v2 cement 2026-05-27)
created_in_story: vitalia-fase2-valeria-agenda
created_date: 2026-05-27
last_modified: 2026-05-27
package_version: vitalia-fase2-v1.0.0
package_path: vitalia/backend/src/modules/vitalia/scheduling/

# Architecture
architecture_pattern: ADR-vitalia-004     # ADR slug si aplica
hipaa_lite_overlay: true                  # opcional (vitalia-specific)

# Capability lineage (reuso de extends_capability existente · renombrado conceptualmente como parent_cap)
parent_cap: null                          # null si root · slug si derive
derives_capabilities: []                  # caps hijas spawned via derive

# Atomics como objects (v2 — antes era array plano de strings)
atomics:
  - label: "Vista calendario semanal"
    added_in_story: vitalia-fase2-valeria-agenda
    added_date: 2026-05-27
  - label: "Drag-to-reschedule"
    added_in_story: vitalia-fase2-valeria-agenda
    added_date: 2026-05-27
  # futuro: cuando llegue extend, agrega aquí más con added_in_story distinto

# Append-only ledger (v2)
change_log:
  - story_id: vitalia-fase2-valeria-agenda
    date: 2026-05-27
    type: new                              # new | fix | extend | derive
    summary: "Implementación inicial · vista calendario + drag-to-reschedule + advisory lock"
    atomics_added: ["Vista calendario semanal", "Drag-to-reschedule"]
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

## Sección 4 · Atomics como objects

**Antes (v1):**
```yaml
atomics: ["Vista calendario semanal", "Drag-to-reschedule"]
```

**Después (v2):**
```yaml
atomics:
  - label: "Vista calendario semanal"
    added_in_story: vitalia-fase2-valeria-agenda
    added_date: 2026-05-27
  - label: "Drag-to-reschedule"
    added_in_story: vitalia-fase2-valeria-agenda
    added_date: 2026-05-27
```

**Por qué:** queremos saber cuál story metió cada atomic. Si un cap acumula 12 atomics tras 3 stories de `extend`, el ledger nos dice cuál atomic vino de cuál story. Trazabilidad temporal completa.

**Migración:** `scripts/migrate_capability_ledger.py` (Phase 4a) convierte arrays planos → arrays de objects usando `story_introduced` + `date_introduced` del frontmatter v1.

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
1. Crear cap YAML hijo con schema v2 + `parent_cap: {origen_slug}`
2. `change_log[0]` con `type: derive` + `summary` referenciando el cap padre
3. Update cap padre: append `derives_capabilities: [hijo_slug]`
4. Update padre `last_modified` (modificación de su array `derives_capabilities`)

**Order matters:** en `derive`, primero crear cap hijo (con parent_cap declarado), luego actualizar padre. Atomic write para evitar estado inconsistente.

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

## Sección 11 · Referencias

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
