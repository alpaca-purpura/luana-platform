# HANDOFF · reanudar nicolify-r1-abel-icp-buyer (sesión nueva 2026-06-04)

> Pegá el bloque "PROMPT" de abajo en la conversación nueva. El resto es contexto por si lo necesitás.

## Estado en una línea

Story `nicolify-r1-abel-icp-buyer` en `developing` (autonomous). Pipeline corrió hasta `/dev-team`; T-BE-1 quedó **construido pero a medias** (builder se aisló en worktree + se cortó). Harness fixeado (isolation removido) → en sesión NUEVA los builders escriben al hub. Falta: finalizar T-BE-1 + construir 7 tickets + auditar + demo sign-off + merge.

## PROMPT (copiá/pegá esto)

```
Retomá la story nicolify-r1-abel-icp-buyer (brand nicolify, branch wip/nicolify, hub ~/Proyectos/luana-nicolify). Está en state=developing, autonomous_mode=true.

LEE PRIMERO (SSoT del estado): nicolify/docs/product/stories/nicolify-r1-abel-icp-buyer/checkpoint.md
  → mirá build_status_2026_06_03 + oq_resolved_2026_06_03 + decisions_ratified_2026_06_03 + next_action.
Ready package en esa misma carpeta: 03-arch.md (+ be/fe/agentic) · 04-validators.yaml · 05-guidelines.md · 06-tickets.yaml · dispatch-plan.md (DAG) · CONTEXT-BRIEF.md · 01-spec.md · mockups/icp-buyer.html (G1 ratificado).

CONTEXTO DEL CORTE (sesión previa):
- El pipeline corrió idea→refining→refined→ready→developing autónomo. T-BE-1 (builder-backend) construyó el módulo `abel` BE COMPLETO pero el builder corrió en worktree aislado (bug HB-31, ya fixeado) y se cortó en cleanup lint ERA001 sin commitear.
- Recuperé el trabajo: el módulo `abel` (26 .py: domain icp/buyer/exceptions · infrastructure/repositories icp/buyer · infrastructure/models icp/buyer/growth_studio_event · api/router · application/dtos + telemetry) + alembic/versions/002_abel_icp_buyer.py + tests/modules/nicolify/abel/ + tests/architecture/test_growth_studio_event_no_pii.py + src/main.py (include_router) ya están COPIADOS al hub wip/nicolify, UNCOMMITTED.
- Fix harness HB-31 (sesión previa, UNCOMMITTED): removí `isolation: worktree` de .claude/agents/builder-{backend,frontend,agentic}.md + agregué la fila HB-31 a docs/process/harness-backlog.md. AHORA (sesión nueva) los builders ya NO se aíslan → escriben in-place en el hub.

TAREAS PENDIENTES (en orden):
1. Commitea el fix harness HB-31 por pathspec (NO git add .): los 3 builder defs + docs/process/harness-backlog.md. Mensaje tipo "fix(harness): remove isolation:worktree de builders (HB-31 · reconcilia M9 v2 + ADR-009)".
2. Finalizá T-BE-1: spawneá builder-backend (sonnet, ahora in-place) para que TOME el partial ya consolidado del módulo `abel` en el hub → termine cleanup ERA001 + corra los validators de T-BE-1 (04-validators.yaml acceptance.validator_ids) hasta GREEN + escriba gate-output.json + T-BE-1-result.md + commitee por pathspec en wip/nicolify. (Es continuación-from-tree: el código ya existe, falta lint+gates+commit.)
3. Limpiá el worktree aislado huérfano: `git worktree remove --force /home/chalreme/Proyectos/luana-platform/.claude/worktrees/agent-a2dcc99f56154fd50` (ya copié todo su contenido al hub; verificá antes con git -C <ese path> status que no quede nada nuevo sin copiar).
4. Seguí el DAG (dispatch-plan.md) con /dev-team: T-BE-2 → T-AG-1 (builder-agentic OPUS, R23 HARD) → T-FE-1 (∥) → T-FE-2 → T-FE-3 → T-FE-4 → T-E2E-1. Cada builder ahora escribe al hub (sin consolidación manual).
5. Al cerrar todos los tickets GREEN: state developing→developed + AUTO-HANDOFF /auditor (auditor-backend + auditor-agentic + auditor-frontend según surface · dispatch-plan §auditor routing). Phase D gherkin-matrix sin MISSING.
6. GATE DoD #37 (HARD): la story es demo_required:true → ANTES de merge `reviewing→done`, live-verify contra dev-app (make dev-nicolify → localhost:3001 / dev-app.nicolify.com) con dod_evidence (writes ejercidos: extract→borrador, patch→persist, mark-listo→422 sin mínimo, cross-tenant→404) + demo-script.md + tu sign-off (demo_signoff APPROVED). /pm-nicolify REFUSE merge sin eso. PARÁ y avisame para la demo.

GUARDRAILS:
- Diseño cementado (NO re-litigar): 1 ICP→N buyers · nav N3-dynamic EntitySubNavBar (SHELL-DESIGN-CONTRACT §5.1, port re-temizado de vitalia, leaves=buyers+ "+buyer", leaf inicial "Datos del ICP") · draft-first (arranque→intake→extract→borrador→ratificar) · sin barra de completitud · chips "¿para qué sirve?" · intake modo "Conectar fuente" deshabilitado con CTA (dep Config→conexiones) · enrichment automático DIFERIDO.
- Engine boundary: buyer consume core/luana-core-brand-studio por ESQUEMA/patrón + replica brand-local async con icp_id (Open Question #1 resuelta). ICP = net-new brand-local. Extracción consume copilot template/persister PATRÓN. NUNCA editar core/luana-core-*/src/.
- Lock: el lock code:abel de la sesión previa (PID muerto) auto-libera en el próximo session-lock.sh acquire — /dev-team Step 0.4 lo re-toma.
- Git: commit por pathspec (NUNCA git add .), push a wip/nicolify (NUNCA origin development). Hub único ADR-009.
- NO toques (uncommitted PRE-sesión, no son de esta story): Makefile, tools/luana-cockpit/* (ArchitectureView/MapView/types.ts), docs/archive/.../nicolify-r0-sitemap-completo/checkpoint.md. Verificá con Chris antes de commitearlos.
- nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md (uncommitted) = parte del diseño de ESTA story (patrón EntitySubNavBar §5.1) → commitealo con la story.

Arrancá: leé el checkpoint + 06-tickets.yaml + dispatch-plan.md, hacé la tarea 1 (commit harness), y seguí. Sos /dev-team.
```

## Pendientes globales (resumen para vos)

| # | Pendiente | Dónde |
|---|---|---|
| 1 | Commit harness HB-31 (3 builder defs + backlog) | `.claude/agents/builder-*.md` + `docs/process/harness-backlog.md` |
| 2 | Finalizar T-BE-1 (lint ERA001 + gates + commit) | módulo `abel` ya en hub uncommitted |
| 3 | Cleanup worktree aislado | `luana-platform/.claude/worktrees/agent-a2dcc99f56154fd50` |
| 4 | Construir T-BE-2 → T-AG-1 → T-FE-1..4 → T-E2E-1 | DAG en `dispatch-plan.md` |
| 5 | Audit (be/fe/agentic) + gherkin-matrix | `/auditor` auto-handoff |
| 6 | Live-verify dev-app + demo-script + tu sign-off (#37) | gate merge `reviewing→done` |
| 7 | Merge + capability YAML + SYSTEM-MAP `abel.icp: built` + flags lift `/pm-luana` | `/pm-nicolify` Fase F |

## Ratificaciones pendientes tuyas
- HB-31 (revertir el isolation hint de HB-16 — M9 gana). Ya aplicado; ratificá al commitear.
- Lift candidates a `/pm-luana` (post-merge): `ICP` entity + `EntitySubNavBar` (N=2) + async-ificación engine `buyer_personas`.
