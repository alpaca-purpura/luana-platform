---
ticket: T-9
story: S-DOCKER-DEV-MULTIBRAND
state: done
started_at: 2026-05-15
completed_at: 2026-05-15
---

# T-9 impl log — Pre-commit hook Section 10

## Deliverables completados

1. **MODIFY `scripts/git-hooks/pre-commit`** — agregada Section 10 al final del hook existente (antes del `exit 0` final). La nueva seccion:
   - Detecta cambios staged en `{nicolify,vitalia,comunify,lupulo}/config/brand.yaml`
   - Corre `scripts/generate_infra_matrix.py` via `.venv/bin/python`
   - Agrega `docs/portfolio/INFRA-MATRIX.md` al commit automaticamente
   - Si el script falla → bloquea el commit con mensaje accionable
   - Si venv o script no existen → WARNING (no bloquea, graceful degradation)

2. **MODIFY `tests/scripts/test_generate_infra_matrix.py`** — el test `test_pre_commit_triggers_regen` ya fue implementado en T-8 (cubre la pre-condition de T-9).

## Pattern implementado

```
Section 10: INFRA-MATRIX auto-freshness
  Trigger: {brand}/config/brand.yaml staged
  Action: generate_infra_matrix.py → git add INFRA-MATRIX.md
  Gate level: ALL branches (infra freshness siempre es valida)
  Graceful degradation: WARNING si venv o script ausente
```

## Notas

- La seccion se agrego como texto literal en el hook (EXTEND no REPLACE) respetando las Sections 1-9 existentes.
- Gate level ALL (no solo GATE_LEVEL=full) porque la generacion del indice es siempre segura y util incluso en branches wip/*.
- El test `test_pre_commit_triggers_regen` verifica la presencia de "Section 10", "brand.yaml" y "generate_infra_matrix" en el hook — no simula git staging (eso requiere git real).
