# PM Skill Chaining — handoff programático

**Origen:** caso F1-S4 vitalia 2026-05-23 — `/pm-vitalia` corrió Step 0 + cargó contexto + emitió "Chris, invocá `/po-ux ...`" en lugar de invocar `Skill` tool inline → estancamiento. Chris asumió disparo automático del handoff, Claude esperaba tipeo manual.

**Cement-date:** 2026-05-23.

**Scope:** aplica a TODOS los `/pm-{brand}` (×4 activas + 6 futuras) y al `/pm-luana` master. NO aplica a skills no-PM (`/architect`, `/dev-team`, `/auditor` son DESTINOS válidos del chain, no orígenes).

**SSoT:** este file. Replicado en `_pm-brand-template/SKILL.md` § Auto-chain rule + cada `/pm-{brand}/SKILL.md` § Auto-chain rule.

## Regla cardinal

Cuando un PM (`/pm-vitalia`, `/pm-luana`, etc.) determina que la acción siguiente es invocar una skill secundaria (`/po-ux`, `/po`, `/ux-agentico`, `/architect`, `/dev-team`, `/auditor`), el modelo MUST invocar `Skill` tool inline al final del turno actual — NO devolver mensaje textual pidiendo al usuario que tipee la slash-command manualmente.

## Triggers (cuándo encadenar)

| # | Condición | Acción |
|---|---|---|
| 1 | Chris escribió literal `/po-ux` (o `/po`, `/architect`, `/dev-team`, `/auditor`, `/ux-agentico`) en args del PM | Encadenar |
| 2 | Chris escribió "invocá /skill-X" / "spawnea /skill-X" / "arranca /skill-X" / "continúa con /skill-X" | Encadenar |
| 3 | Step 0 GREEN + state-machine permite una sola transición (ej. story state=refined → único next = `/architect`) | Encadenar |
| 4 | next_action del checkpoint cita literal una skill ("`/po-ux vitalia-fase1-shell-layout-5050`") + Chris confirma | Encadenar |

## Excepciones (cuándo NO encadenar)

| # | Condición | Acción correcta |
|---|---|---|
| 1 | WIP cap del estado destino agotado (`refining ≥ 3`, `developing ≥ 3`, etc.) | Escalar Chris con lista de stories ocupando slots |
| 2 | Deps hard faltantes en la story (otras stories blockers en state ∉ {done}) | Citar deps + opciones (esperar / mover dep a parked) |
| 3 | Story OPEN sin `defer_audit: true` detectada en Step 0 closure gate | REUSE THAT FIRST per `story-closure-gate.md` |
| 4 | Scope gate (`.claude/rules/parallel-safety.md` M13) bloquea — skill destino tocaría paths fuera del worktree actual | Proponer worktree dedicado o override explícito |
| 5 | State-machine de la transición no permite la skill pedida (ej. Chris pide `/auditor` pero story está `state=refining`) | Corregir Chris + sugerir skill correcta |
| 6 | Brand del worktree ≠ brand del PM invocado (HARD REFUSE per `step-0-worktree.md`) | Redirect path correcto |
| 7 | Falta input obligatorio del skill destino (ej. `/po-ux` necesita `<brand>` y Chris no lo proveyó) | Pedir input antes de encadenar |

## Cómo encadenar (verbatim)

```
1. Bootstrap PM normal:
   - Step 0 closure gate scan (REQUIRED)
   - Step 1 carga checkpoint brand + story específica
2. Validar:
   - WIP caps del estado destino
   - Deps hard cumplidas
   - State-machine válida para la transición
   - Scope gate OK
3. Resumir contexto en 2-4 bullets COMPACTOS:
   - Story ID + state actual
   - next_action del checkpoint
   - Gate visual o pre-condition relevante (ej. mockups bloqueantes)
4. Invocar Skill tool inline:
   { skill: "<name>", args: "<brand> <story-id>" }
5. NO escribir "Chris, invocá /...".
```

## Anti-patterns

- ❌ Devolver "Chris, invocá `/po-ux vitalia-fase1-shell-layout-5050`" después de Step 0 GREEN cuando Chris ya pidió explícitamente la chain (caso origen F1-S4)
- ❌ Hacer el handoff via Agent tool con subagent_type — `/po-ux`, `/architect`, `/dev-team`, `/auditor` son SKILLS, no AGENTS. Solo builders/auditors/gate-runner son agents.
- ❌ Encadenar sin Step 0 (rompe story-closure-gate)
- ❌ Encadenar sin validar WIP caps (puede exceder cap del estado destino)
- ❌ Encadenar a una skill que NO existe en `.claude/skills/` (silent failure)
- ❌ Encadenar cuando scope gate prohíbe (worktree wip/vitalia + skill destino que tocaría `.claude/skills/` raíz)
- ❌ Encadenar sin pasar el `<brand>` como primer arg al skill destino — `/po-ux` y otros lo requieren (pedirían y volverían a estancar)

## Aplicación por skill

| PM origin | Skill destino | Chain trigger común |
|---|---|---|
| `/pm-{brand}` | `/po-ux` | "refinemos {story-ui}" o args con `/po-ux` literal |
| `/pm-{brand}` | `/po` | "refinemos {story-service}" |
| `/pm-{brand}` | `/ux-agentico` | "refinemos {story-agentic}" (después de `/po`) |
| `/pm-{brand}` | `/architect` | "spec ratificada" / "diseño ratificado" / state refining→refined |
| `/pm-{brand}` | `/dev-team` | "build" / "arranca dev" / state ready→developing |
| `/pm-{brand}` | `/auditor` | "audita" / "QA" / state developed→reviewing |
| `/pm-luana` | `/architect` | Promotion lift accepted → arrancar engine carve-out |

## Enforcement layers

| Layer | Mecanismo | Status |
|---|---|---|
| 1 — SKILL.md `/pm-{brand}` | Sección "Auto-chain rule" verbatim + tabla "Comandos típicos" reformulada con "Invocá `Skill(...)`" explícito | ✅ active vitalia |
| 2 — `_pm-brand-template` SKILL.md | Sección "Auto-chain rule" en plantilla + nota MANDATORIO al bootstrap | ✅ active template |
| 3 — Memory file `pm-skill-chaining.md` | Tipo feedback en `~/.claude/projects/.../memory/` para que el modelo lo recuerde cross-session | ✅ active |
| 4 — Hook `UserPromptSubmit` `auto-chain-detect.sh` | Detecta pattern "/pm-X + /skill-Y" en mismo prompt y agrega system-reminder al turn | ✅ active |
| 5 — Auditor Cat 11 (cross-cutting) | Audit revisa session transcript si PM emitió handoff textual cuando debió ser programático | ⏳ TBD |

## Referencias

- `.claude/skills/pm-vitalia/SKILL.md` § Auto-chain rule (cementado 2026-05-23)
- `.claude/skills/_pm-brand-template/SKILL.md` § Auto-chain rule (template)
- `.claude/hooks/auto-chain-detect.sh` — hook UserPromptSubmit detection
- `.claude/rules/story-closure-gate.md` — gate Step 0 que precede el chain
- `.claude/rules/parallel-safety.md` M13 — scope gate (excepción 4)
- `.claude/rules/step-0-worktree.md` — enforcement matrix brand-mismatch (excepción 6)
- Memory file `pm-skill-chaining.md` (auto-memory user dir)
