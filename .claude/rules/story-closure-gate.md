# Story Closure Gate

> **Slim stub (context-rot pass 2026-05-30).** Detalle completo (07-merge schema verbatim · gherkin_coverage · F.3 cap ledger · v3.1/v3.2 enforce tables · WIP cap v2 · defer_audit schema · 7 enforcement layers · caso origen) en `docs/rules-detail/story-closure-gate.md` — load on-demand. **Origen:** caso vitalia 2026-05-18.

## Regla cardinal

Story en `state: developed` o `reviewing` **NO puede abandonarse** para arrancar otra story (mismo módulo). Ciclo único:

```
ready → developing → developed → reviewing → done
                         └─ AUTO→/auditor    └─ APPROVED→/pm-{brand} merge
```

`/dev-team` cierra `developed` → AUTO-HANDOFF `/auditor`. APPROVED → AUTO-HANDOFF `/pm-{brand}` merge. Sin Chris-trigger manual. Sin `defer_audit: true` el gate es ABSOLUTO.

## 6 fases (resumen)

| Fase | Owner | Transition |
|---|---|---|
| A — DEV | `/dev-team` | `ready → developing → developed` |
| B — AUDIT | `/auditor` (auto-handoff) | `developed → reviewing` |
| C — FIX-LOOP | `/dev-team` si CHANGES_REQUESTED | cap 2 iter |
| D — GHERKIN | `/auditor` Phase D (embedded en B) | gherkin-matrix.md |
| E — DOCS | `/pm-{brand}` | cap YAML + modules MD |
| F — MERGE | `/pm-{brand}` | `reviewing → done` · 07-merge.md 5 secciones · archive story R2 |

**WIP cap v2 (module-scoped):** ≤ 1 story en `developing/developed/reviewing` por `code:{module}` bucket. Módulos distintos paralelos = OK. `defer_audit: true` (ratificado Chris) = única excepción.

## Cuándo carga el detalle

- `/pm-{brand}` Fase F.3 (cap_change_type: new/fix/extend/derive → lógica + v3.1/v3.2 enforce tables)
- Necesitás el schema verbatim de `07-merge.md` 5 secciones o `defer_audit` en checkpoint.md
- Troubleshoot enforcement layers (hooks · cleanup-session · templates)

## Anti-patterns (top 3 — lista completa en el detalle)

- ❌ `/dev-team` cierra `developed` + arranca ticket de otra story sin defer_audit (bug origen)
- ❌ `/pm-{brand}` ofrece "nueva story" con story pendiente audit sin defer_audit
- ❌ `/auditor` cierra APPROVED sin handoff explícito a `/pm-{brand}` merge

## Referencias

- `docs/rules-detail/story-closure-gate.md` — **detalle completo**
- `docs/process/story-closure-gate.md` — rationale + case study
- `docs/architecture/luana-platform/ADR-006-story-closure-gate.md` — decisión
- `.claude/rules/brand-docs-schema.md` § R2 — archive path canónico
