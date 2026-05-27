# Capability Protocol — Story ↔ Capability Doctrine (v2 cement 2026-05-27)

**Cement-date:** 2026-05-27.
**Origen:** plan `/home/chalreme/.claude/plans/ok-lo-apruebo-realiza-cheeky-harbor.md` § Phase 1.1.A.
**SSoT capability YAML schema v2.**

> Doctrina cementada: **Story** es transitoria (idea→done→archive), **Capability** es permanente (append-only ledger). Cada story declara `cap_target` + `cap_change_type` para mantener trazabilidad qué tocó qué.

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

---

## Sección 7 · Migración stories legacy → schema v2

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

## Sección 8 · Referencias

- `docs/process/release-protocol.md` — entity Release agrupa stories que tocan caps
- `docs/process/chris-input-protocol.md` — chris-input.md donde Chris ratifica `cap_change_type`
- `docs/process/cockpit-permissions.md` — qué fields del cap son read-only desde cockpit
- `.claude/rules/anti-duplication-refining.md` — prior-art scan detect cap existente antes `cap_change_type: new`
- `.claude/rules/story-closure-gate.md` § Fase F.3 — capability ledger update step
- `.claude/rules/brand-docs-schema.md` — schema canónico `{brand}/docs/product/capabilities/`
- `scripts/migrate_capability_ledger.py` — migration script
- `scripts/reconcile_capabilities.py --validate-ledger` — validation
- `tools/luana-cockpit/lib/cap-ledger.ts` — implementación 4 ramas (new/fix/extend/derive)
