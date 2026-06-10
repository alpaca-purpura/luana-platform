# INVENTORY — docs-sweep 2026-06-10 (cuarentena borrable)

**Qué es esto:** los 158 archivos de root `docs/` SIN consumidor vivo, movidos acá
por la sesión DOCS-SWEEP (grafo `scripts/scan_docs_graph.py`: inbound desde
superficies vivas + clausura transitiva). La estructura original está preservada
bajo `docs/...` — restaurar un archivo es trivial.

**Quién borra:** Chris, cuando quiera (ventana de enfriamiento). Claude NO borra.

```bash
# borrar la cuarentena completa (decisión Chris):
git rm -r legacy/2026-06-10-docs-sweep && git commit -m "chore: purge docs-sweep quarantine 2026-06-10"

# restaurar UN archivo:
git mv legacy/2026-06-10-docs-sweep/docs/<path> docs/<path>
```

## Lote 1 — archive huérfano/arqueología (130 files · commit "Lote 1")

| Qué | Por qué murió |
|---|---|
| `docs/archive/2026/outcomes/` (1) | huérfano puro (inbound 0) |
| `docs/archive/2026/stories/S-DOCKER-DEV-MULTIBRAND/` (18) | story-folder archivada sin consumidor externo vivo |
| `docs/archive/2026/stories/S-GIT-STRATEGY-CORE/` (16) | ídem (la doctrina vive en git-safety.md; la story era el andamio) |
| `docs/archive/2026/stories/S-GIT-STRATEGY-HELPERS/` (11) | ídem |
| `docs/archive/2026/stories/build-autosave-primitive-luana/` (14) | ídem |
| `docs/archive/2026/stories/core-ds-foundation/` (21) | ídem (el design-system vivo está en código + canon docs) |
| `docs/archive/2026/stories/luana-nicolify-migration/` (49) | ídem (migración ejecutada 2026-05; registro en ADRs vivos) |

**Quedaron en `docs/archive/`:** `snapshot-pre-multibrand-pm-redesign/` (corpus
prior-art grep-citado por 7 superficies) · `stories/S-CICD-DEPLOY/` (citada por
ADR-002) · `stories/empleados-ia-auto-extension/` (citada por empleados-ia-research
+ durable-flows-L2-design + outcome + proposal).

## Lote 2 — arqueología programa harness-refactor (20 files · commit "Lote 2")

RESEARCH/AS-IS/agendas served-purpose del programa W0→W10 (cerrado 2026-06-09):
`w0.5/{AS-IS-MAP, TO-BE-walk-agenda, as-is/×8}` · `w4/RESEARCH-checks` ·
`w4b/RESEARCH-batch-{A,B,C}` · `w5/RESEARCH-slot-values` ·
`w6/RESEARCH-batch-{T,P1,P2}` · `w7/GATE-ZERO-{RESEARCH,ADVERSARIAL}`.

**Rescatados por grep-gate (quedaron vivos):** `W1-phase2-execution.md` (citado
por 3 rules), `RESEARCH-loader-mechanism.md` (citado por harness_config.py),
`PLUGIN-DISTRIBUTION-RESEARCH.md` (citado por core-harness/README.md).
**Quedaron además:** todos los `W*-OUTPUT.md`, charter, PROCESS-MODEL,
REQ-TAKING-DETAIL, RATIFICATIONS, DECISIONS-PENDING, tombstone del config.

## Lote 3 — process misc (8 files · commit "Lote 3")

- `docs/process/legacy/` (5): cuarentena vieja 2026-05-04 (gap-reports + migration-plan) consolidada acá.
- `docs/process/tech-debt/` (3): arqueología Abr-2026; colisión de naming con el VIVO `docs/process/tech-debt.md` (que queda).

## Metodología / verificación

Cada lote: grep-gate por path + basename distintivo (0 refs vivas) → `git mv` →
`make machinery-check` 67/0/0 → `scan_harness_pointers.py` NEW-0 → re-scan grafo
→ commit verde por pathspec. Cockpit smoke post-barrido: tsc 0 + `/api/cil` 200.
Grafo final: 789 docs tracked vivos · 2 huérfanos retenidos por integridad de
folder (`S-CICD-DEPLOY/REVIEW.md`, `empleados-ia-auto-extension/T-flows-1-result.md`).
