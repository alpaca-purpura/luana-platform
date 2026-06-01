# Hot-fix Repro Mandatory

> **Slim stub (context-rot pass 2026-05-30).** Detalle operativo completo (workflow 4 steps verbatim, caso origen detallado T-1.bis, schema `repro_evidence` completo, enforcement layers, multibrand awareness) en `docs/rules-detail/hotfix-repro-mandatory.md` — load on-demand. **Origen:** PI-12 S1 T-1.bis (2026-05-05). Handoff doc misdiagnosed bug → ~$8 USD wasted en builder Opus wrong scope.

## Regla cardinal

ANTES de spawn `builder-{backend|agentic|frontend}` para hot-fix ticket originado en handoff/incident/escalation, `/dev-team` o `/po` MUST reproducir la falla localmente y validar el diagnóstico de scope. Si `repro_verified: false` o ausente → `/dev-team` REFUSE spawn.

**Señales hot-fix** (AL MENOS UNA): título contiene `bug/hot-fix/regression/incident/bis/revert/fix forward` · origin menciona `handoff doc/pase-producción-failed/auditor-escalation` · sub-número `T-N.bis`.

**4 steps obligatorios:** (1) reproducir localmente + capturar output, (2) validar diagnosis handoff vs symptom real (match/mismatch/no-repro), (3) citar `repro_evidence` en `04-tickets.yaml`, (4) spawn builder citando `repro_verified: true`.

## Cuándo carga el detalle

- Commands verbatim de reproducción (brand-specific vs engine `core/luana-core-*/`)
- Schema completo `repro_evidence` con todos los fields (`diagnosis_correction`, etc.)
- Caso origen verbatim (T-1.bis: provider fallback ya funcionaba, bug real era fixture `litellm_call_id`)

## Anti-patterns (top 3 — lista completa en el detalle)

- ❌ Builder spawn con scope tomado de handoff doc sin reproducción local
- ❌ Repro reportado pero `diagnosis_correction` omitida cuando symptom y handoff divergen
- ❌ Hot-fix ticket sin `repro_verified` field

## Referencias

- `docs/rules-detail/hotfix-repro-mandatory.md` — **detalle completo** (caso origen verbatim, workflow 4 steps, schema)
- `docs/process/process-improvement-handoff-2026-05-05.md` — handoff misdiagnosis case
- `.claude/skills/{dev-team,po}/SKILL.md` — enforcement points
- `docs/specs/templates/04-tickets-template.yaml` § repro_verified
