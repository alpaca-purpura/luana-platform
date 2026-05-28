# Release Protocol — Entity SSoT (v3 cement 2026-05-28)

**v3 (cement 2026-05-28):** outcome+phase ELIMINADOS. Release es el único contenedor temporal. Ver `docs/process/lifecycle.md`.

**Cement-date v3:** 2026-05-28.
**Cement-date v2:** 2026-05-27.

> **Release** es THE contenedor temporal del modelo: no hay outcome por encima. Agrupa stories que se mergean juntas a main. State machine: `backlog → planning → in_progress → ready_to_merge → shipped`.

---

## Sección 1 · Release como entidad SSoT

Un **Release** es una agrupación temporal de stories que se mergean juntas a main + se despliegan juntas. Es el **único contenedor temporal** del modelo: no existe ningún concepto por encima del release (outcome y phase fueron eliminados · ver `docs/process/lifecycle.md`).

**Cuándo crear un release:** Chris define un bloque de trabajo coherente (~2 semanas típico) con un objetivo claro y un set de stories que entregan ese objetivo. Ejemplo: F2 "Migración progresiva · primer valor Valeria + Lisa" agrupa 5 stories que materializan el primer valor end-to-end.

**Path canónico:** `{brand}/docs/product/releases/{release_id}.yaml`.

**Por qué NO base de datos:** mantenemos filesystem-as-DB. El cockpit lee + escribe estos YAMLs directo. `/pm-{brand}` y `/pm-luana` también.

---

## Sección 2 · State machine

| Estado | Significado | Transition trigger |
|---|---|---|
| `backlog` | Release identificado pero no priorizado | Chris crea con "+ Nuevo release" en cockpit |
| `planning` | Stories asignadas, sin desarrollo activo | Chris asigna ≥1 story |
| `in_progress` | ≥1 story de la release en state ∈ {refining, refined, ready, developing, developed, reviewing} | recompute auto al asignar story refining+ |
| `ready_to_merge` | TODAS las stories del release en state=done O dropped | recompute auto post Fase F MERGE de la última story |
| `shipped` | Merge ejecutado a main + deployed a staging | `/pm-{brand}` cierra release explícitamente |

**Recompute logic:** WIP por release se calcula leyendo el state actual de cada story del release. Una story en `idea` NO cuenta como in_progress (es backlog del release). Una story en `refining/refined/ready/developing/developed/reviewing` SÍ cuenta como in_progress.

---

## Sección 3 · Schema release YAML

```yaml
---
release_id: F2
brand: vitalia
name: "Migración progresiva · primer valor Valeria + Lisa"
description: "Sub-tabs valeria-agenda + lisa-marca con ADR-vitalia-004 cementado · primer valor real shipped."
status: in_progress                    # planning | in_progress | ready_to_merge | shipped | backlog
target_date: null                       # ISO date · null hasta que Chris la llene
shipped_date: null                       # ISO date · solo cuando status=shipped
order: 2                                  # int para ordenamiento Roadmap (menor = primero)
created_at: 2026-05-15T10:00:00-05:00
created_by: chris

# Lista de stories asignadas (denormalizada para cockpit · source-of-truth sigue siendo checkpoint.md de cada story)
stories:
  - vitalia-fase2-valeria-agenda          # state: done
  - vitalia-fase2-lisa-marca              # state: done
  - vitalia-fase2-valeria-pacientes       # state: idea
  - vitalia-fase2-lisa-marca-v2           # state: refining
  - vitalia-fase1-shell-layout-5050-race-fix  # state: idea
---

# Resumen markdown opcional
```

**Campos editables Chris:** `name, description, target_date, order, stories[]` (drag entre releases).
**Campos auto-calc:** `status` (recompute from story states), `shipped_date` (solo al cerrar).
**Campos read-only:** `release_id` (no se renombra), `brand, created_at, created_by`.

---

## Sección 4 · WIP caps + recompute logic

WIP cap del release es la suma de stories en `refining/refined/ready/developing/developed/reviewing`. Caps del paradigm v4 aplican (refining ≤3, refined ≤5, etc.) — el release NO impone un cap propio, lo hereda del state-machine cross-platform.

**Recompute trigger:**
- Story transition state change → recompute status de su release.
- Story moved entre releases (drag en cockpit) → recompute ambos releases (origen + destino).
- Story creada/dropped → recompute release del que se quitó/agregó.

**Algorítmo:**
```python
def recompute_release_status(release: Release) -> str:
    states = [s.state for s in release.stories]
    if all(s in {'done', 'dropped'} for s in states):
        return 'ready_to_merge'
    if any(s in {'refining', 'refined', 'ready', 'developing', 'developed', 'reviewing'} for s in states):
        return 'in_progress'
    if all(s == 'idea' for s in states):
        return 'planning'
    return release.status  # no-op si estado intermedio raro
```

---

## Sección 5 · Merge release a main (5 operaciones)

Cuando release.status = `ready_to_merge` y Chris da OK en cockpit (botón "🚀 merge release a main"), `/pm-{brand}` (o el cockpit endpoint `merge-release`) ejecuta:

### Operación 1 — Squash-merge git
Por cada story `done` del release, su branch ya fue squash-merged en su propio Fase F MERGE individual. El "merge release" es una sub-operation que consolida la entrega: NO es un git merge nuevo (eso ya pasó por story).

### Operación 2 — Archive stories
```bash
YEAR=$(date +%Y)
for STORY in $(grep '^- ' release.yaml | awk '{print $2}'); do
  git mv {brand}/docs/product/stories/${STORY} {brand}/docs/archive/${YEAR}/stories/${STORY}
done
```

### Operación 3 — Cap YAML ledger update (ya hecho en Fase F.3 individual)
Verificación: cada cap target de las stories del release tiene `change_log[]` actualizado con la story correspondiente.

### Operación 4 — Release YAML status
```yaml
status: shipped
shipped_date: 2026-MM-DDTHH:MM:SS-05:00
```

### Operación 5 — Generate release notes
`scripts/generate_release_notes.py --release F2 --brand vitalia` (futuro) o copy-paste manual a `{brand}/docs/product/releases/release-notes/F2.md` listando:
- Capabilities new/extended/fixed/derived
- Stories shipped (con merge SHA)
- Breaking changes (si los hay)
- Migration notes

---

## Sección 6 · Anti-patterns prohibidos

- ❌ Release con stories de brands distintas (cada release es brand-specific)
- ❌ `target_date` poblado sin owner asignado (Chris lo llena cuando hay compromiso)
- ❌ Merge release a main sin todas las stories en state ∈ {done, dropped}
- ❌ Editar `release_id` después de creación (es PK funcional)
- ❌ Stories del release con `release: F2` en checkpoint pero NO listadas en `release.yaml.stories[]` (inconsistencia)
- ❌ Status `shipped` sin `shipped_date` (hook bloquea)
- ❌ Status `planning` con stories en state ≥ refining (debe ser in_progress)
- ❌ Release sin descripción (Chris pone razón del bloque de trabajo)

---

## Sección 7 · Referencias

- `docs/process/lifecycle.md` — SSoT del modelo 4-ejes · Release es el único contenedor temporal (outcome+phase muertos)
- `docs/process/capability-protocol.md` — caps que las stories del release tocan
- `docs/specs/templates/release-template.yaml` — template para nuevos releases
- `docs/process/checkpoint-protocol.md` — campo `release` en checkpoint.md de cada story
- `scripts/migrate_to_release_schema.py` — migration legacy → release
- `scripts/generate_backlog.py --brand {b}` — agrupa BACKLOG por release
- `tools/luana-cockpit/app/api/releases/route.ts` — CRUD endpoint
- `tools/luana-cockpit/app/roadmap/page.tsx` — vista Roadmap con drag entre releases
