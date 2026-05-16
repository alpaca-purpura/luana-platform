---
name: dev-team
description: "Developer team router v4 (Conv 2 — autonomous build, post pm-redesign 2026-05 Punto 4). Reads ready package (01-spec.md + 03-arch.md + 04-validators.yaml + 05-guidelines.md + 06-tickets.yaml) en {brand}/docs/product/stories/{story-id}/ state=ready. Itera ticket-por-ticket: implement → run validators (4 categorías: non_functional/functional/visual/agentic_eval) → fix targeted file → repeat hasta GREEN o cap_reached. Decide owner según owner_eligibility + production_code flag (R23). qwen-opencode/Sonnet preferido para BE/FE no-agentic + tests/docs sobre agentic. Opus 4.7 obligatorio para AGENTIC production code. Mantiene T-{n}-impl-log.md vivo. TDD obligatorio. On pickup: state=ready→developing. On all GREEN all tickets: state=developing→developed. On cap reached: state=developing→blocked, escalate. Activa cuando user dice: '/dev-team', 'toma ticket T-N', 'implementa T-N', 'arranca build', 'autonomous build'."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent
model: opus
---

# /dev-team — Developer Team Router (Conv 2 autonomous build)

> Owner: `T-{n}-impl-log.md` + `T-{n}-result.md` en `{brand}/docs/product/stories/{story-id}/`. Toma 1 ticket → ejecuta TDD + iteración contra `04-validators.yaml` → push. On pickup: state=ready→developing. On GREEN all tickets → state=developing→developed (awaiting QA, NO automatic transition a reviewing — Chris triggers /auditor manualmente para controlar gasto Opus).

## REQUIRED first input: `<brand>`

`<brand>` ∈ `vitalia | nicolify | comunify | lupulo | platform`. Si Chris no lo provee, **PREGUNTAR antes de proceder**. `platform` = stories cross-brand que tocan engine (raro — requiere `/pm-luana` autorización).

Si invocado vía `/pm-{brand}` o `/architect` handoff, el brand viene en el handoff. Si invocado directo por Chris → preguntar primero.

## Inputs obligatorios (ready package)

1. `<brand>` (REQUIRED, ver sección arriba)
2. `{brand}/docs/product/stories/{story-id}/06-tickets.yaml` — pila tickets del story
3. `{brand}/docs/product/stories/{story-id}/04-validators.yaml` — ★ comandos shell ejecutables, must_pass:true ★
4. `{brand}/docs/product/stories/{story-id}/05-guidelines.md` — patterns required/forbidden + files in scope
5. `{brand}/docs/product/stories/{story-id}/03-arch.md` (+ `03-arch-{be,fe,agentic}.md`)
6. `{brand}/docs/product/stories/{story-id}/01-spec.md` (+ `02-design-agentic.md` si aplica)
7. Ticket específico que tomas (`T-{n}` con `state: ready`)
8. `{brand}/docs/product/stories/{story-id}/checkpoint.md` — state=ready requerido

## Step 0 — Bootstrap + state transition

```bash
WS=$(git rev-parse --show-toplevel)
BRAND={brand}                                                # vitalia | nicolify | comunify | lupulo | platform
STORY_DIR=${WS}/${BRAND}/docs/product/stories/{story-id}
cat ${STORY_DIR}/checkpoint.md      # verify state=ready (o state=developing si retomas)
cat ${STORY_DIR}/06-tickets.yaml    # pila tickets
cat ${STORY_DIR}/04-validators.yaml # ★ corazón autonomous loop ★
cat ${STORY_DIR}/05-guidelines.md   # patterns + files in scope
```

Si state=ready → transition a building (primera vez):
```yaml
# checkpoint.md
state: developing   # ★ TRANSITION ready → developing ★
phase: BUILD_T1
```

WIP cap check: `building` ≤ 3. Si excedido → escala Chris antes proceder.

## Step 0.5 — Phase 0: Context pre-flight (MANDATORY antes Step 1)

> Origen: process-improvement 2026-05-05 R1. Sin context-builder cada subagent
> re-lee 30-50k tokens spec+arch+rules. Brief Haiku 5-8k tokens amortiza.

Antes de tomar ticket, asegurás `CONTEXT-BRIEF.md` fresco existe en story-folder.

```bash
BRIEF=$STORY_DIR/CONTEXT-BRIEF.md
LATEST_COMMIT=$(git log -1 --format=%H -- $STORY_DIR)
```

Decidir si spawn context-builder:
- `CONTEXT-BRIEF.md` no existe → SPAWN
- `CONTEXT-BRIEF.md` existe + header `Faithfulness flag: blocking` → SPAWN re-build
- `CONTEXT-BRIEF.md` más viejo que último commit story → SPAWN refresh
- Fresco + `clean|partial` → SKIP

Si SPAWN:
```
Agent({
  description: "Build context brief for ticket T-{n} brand={brand}",
  subagent_type: "context-builder",
  model: "haiku",
  prompt: "<brand>: {brand}                          # ★ REQUIRED — multibrand scope
           <pr_folder>: <STORY_DIR absolute>;
           <modules>: <comma list from story spec>;
           <phase>: builder;
           <subsystem_keywords>: <comma list>;
           <frameworks>: <fastapi, langgraph, anthropic, sqlalchemy, pydantic, etc.>"
})
```

Espera context-builder + context-validator. Lee header. Si flag `blocking` → STOP, escalate Chris.

**Pasás `CONTEXT-BRIEF.md` path + `<brand>: {brand}` en TODO prompt subagent downstream.**

## Step 0.6 — Hot-fix repro gate (R26 2026-05-05)

> SSoT: `.claude/rules/hotfix-repro-mandatory.md`.

Si ticket es hot-fix (señales: title contiene `bug|hot-fix|regression|incident|bis|revert`, origin `handoff doc|incident|escalation`, sub-num `T-N.bis`, scope quirúrgico ≤2h), ANTES de spawn builder, reproducir bug local + validar diagnóstico (paths brand-scoped, e.g. `cd ${WS}/{brand}/backend && ${WS}/.venv/bin/pytest ...`). Cita `repro_evidence` en ticket entry de `06-tickets.yaml`.

Si `repro_verified: false` o ausente en hot-fix ticket → REFUSE spawn:
```
ERROR — hot-fix ticket missing repro_verified per
.claude/rules/hotfix-repro-mandatory.md.
Run repro command first, document evidence, then proceed.
```

Detalle workflow Step 1-3 (reproduce → diagnóstico → cite evidence) en rule SSoT.

## Step 1 — Tomar ticket + decidir owner

Filtrar tickets con `state: ready` (deps cumplidas). Decidir owner según `owner_eligibility` + `production_code` flag (R23):

| Surface | production_code | Owner preferido | Razón |
|---|---|---|---|
| BE no-agentic | true | qwen-opencode | costo, qwen capable |
| BE no-agentic | false (tests/docs/tooling) | qwen-opencode o claude-sonnet | trivial test/doc work |
| FE no-agentic | true | qwen-opencode | costo, qwen capable |
| FE no-agentic | false | qwen-opencode | trivial |
| AGENTIC | true | claude-opus (MISMA sesión, NO opencode) | brand voice + protected surfaces + Opus prompt eng |
| **AGENTIC** | **false (tests/docs only)** | **claude-sonnet** | **R23 — test-only/doc-only sobre módulo agentic NO requiere Opus** |
| Migration aislada | true | qwen-opencode | trivial DDL |
| Cross-module shared | true | claude-sonnet o opus | complexity |

**Reglas hard:**
- AGENTIC ticket + `production_code: true` → SIEMPRE Opus 4.7. Esto se ejecuta en MISMA sesión Claude Code (tú como `/dev-team` con Opus).
- AGENTIC ticket + `production_code: false` → Sonnet OK. Tests/docs/tooling
  sobre `modules/{copilot,sales_agent}/` no requieren Opus reasoning.
- Si no estás en Opus y ticket=AGENTIC + production_code=true → STOP, escala
  Chris: "necesito Opus 4.7 para este ticket. Cambiame de modelo."

Update `06-tickets.yaml` ticket `T-{n}`:
```yaml
state: assigned
assigned_to: qwen-opencode | claude-opus | claude-sonnet
assigned_at: 2026-05-06T...
transitions:
  - { state: assigned, at: ..., by: "/dev-team", to: "<owner>" }
```

Crear `{brand}/docs/product/stories/{story-id}/T-{n}-impl-log.md` con plan inicial + iteration_log empty.

## Step 2 — Spawn builder (model-specific)

### ★ Pre-commit smoke gate (G5 — origen report.html 2026-05-09: 17 buggy_code incidents)

Antes de cualquier `git commit` por el builder, MUST cumplir gate hard:

1. Run validators asociados al ticket (`acceptance.validator_ids` en `06-tickets.yaml`)
2. ALL validators GREEN antes commit. RED → bloquea commit, fix file, re-run.
3. Lint + format clean (`ruff check src/ + ruff format --check src/` BE; `eslint + tsc --noEmit` FE).
4. Si validator es env-gated (ej. `EVAL_GOLDENS_COST_BUCKET_VERIFY=1`) → builder MUST run con env real, NO skip.
5. Si validator requiere case-sensitivity check (enum/string-literal) → builder verifica match exacto antes commit.

**HARD rule:** builder commitea SOLO con todos los gates GREEN. Auditor catch-bugs-pre-existing era cost-leak Opus 2-3x. Pre-commit gate cierra esto.

Builder prompts en Step 2A/2B/2C citan este gate verbatim. Si builder pushea con RED → /dev-team rebota a `state: tests-failing` ANTES Step 4 verify.

### Step 2A — Owner = qwen-opencode (BE/FE no-agentic)

Construir prompt para qwen invocando opencode CLI. **Paths brand-scoped + workspace root parametrizado** (`${WS}` resuelto via `git rev-parse --show-toplevel`):

```bash
WS=$(git rev-parse --show-toplevel)
BRAND={brand}                                                # vitalia | nicolify | comunify | lupulo | platform
STORY_DIR=${WS}/${BRAND}/docs/product/stories/{story-id}

cat > /tmp/T-{n}-qwen-prompt.md <<EOF
Eres developer Luana ({brand} brand) ejecutando T-{n} de story {story-id}.
Brand scope: ${BRAND} — TODO edit debe respetar paths bajo ${BRAND}/. NO editar ${WS}/core/luana-core-*/src/ (engine, requires /pm-luana promotion gate). NO editar {other_brand}/... (cross-brand).

PRIORITY READ — CONTEXT-BRIEF (Haiku-built, 5-8k tokens, contiene spec+arch+rules+anti-dup+canonical docs):
- ${STORY_DIR}/CONTEXT-BRIEF.md

Lee TAMBIÉN estos archivos del READY PACKAGE (si brief insuficiente):
- ${STORY_DIR}/01-spec.md — Gherkin scenarios + (si UI std) wireframes
- ${STORY_DIR}/03-arch.md — technical decisions
- ${STORY_DIR}/04-validators.yaml — ★ comandos must_pass para iterar contra ★
- ${STORY_DIR}/05-guidelines.md — patterns required/forbidden + files in scope
- ${STORY_DIR}/06-tickets.yaml — find your ticket entry T-{n}

AUTONOMOUS LOOP:
1. Read 04-validators.yaml. Run validators ASOCIADOS al ticket T-{n} (acceptance.validator_ids list).
2. RED: tests fallarán (no implementation yet).
3. Implementá MÍNIMO para que validators GREEN — solo files dentro 05-guidelines.md "Files in scope" (TODOS brand-scoped bajo ${BRAND}/).
4. Re-run validators. Si fallan: fix targeted file por error trace, re-run failing validator only.
5. Repeat hasta TODOS validators GREEN o iteration cap reached (default 10).
6. Update T-{n}-impl-log.md con iteration_log VIVO mientras trabajás (cada iter: timestamp + validator + result + fix applied).

Reglas TDD obligatorias:
1. RED: validators fallan primero (sin implementation)
2. GREEN: implementa mínimo
3. REFACTOR: limpiar

Convenciones (.claude/rules/* — citados también en 05-guidelines.md):
- backend-ddd.md o frontend-fsd.md
- tenant-isolation.md
- spanish-text.md (Spanish neutro, no voseo)
- backend-migrations.md (idempotente)
- anti-duplication.md (cross-brand mirror ban)
- tdd-mandatory.md
- git-safety.md (triple-branch: wip/* | main | release/*; NO 'origin development')

Quality gates antes push (★ HARD — G5 pre-commit smoke gate):
- TODOS validators de 04-validators.yaml asociados al ticket → GREEN antes commit
- Lint + format clean (cd ${BRAND}/backend && ../../.venv/bin/ruff check + ruff format --check; cd ${BRAND}/frontend && npx eslint + tsc --noEmit)
- Env-gated validators corridos con env real (NO skip si validator dice EVAL_*=1)
- Case-sensitivity check si validator compara enum/string-literal
- 05-guidelines.md "Files in scope" respected (no escape; SOLO ${BRAND}/ paths)
- RED bloquea commit. Fix file → re-run validator → repeat hasta GREEN.

Push destination (triple-branch policy):
- git push origin "\$(git branch --show-current)"   # wip/{slug} autosave, main post squash, release/{brand}-vX.Y.Z
- NUNCA 'git push origin development' (branch eliminado en reorg 2026-05-15)

Output al terminar:
- T-{n}-result.md con diff resumen + validator gates output literal + commit SHA
- Estado ticket: pushed (en 06-tickets.yaml)
- Last line del response: "done -> T-{n}-result.md"

Si cap_reached (10 iter sin GREEN):
- T-{n}-impl-log.md sección "Cap reached — escalating"
- Estado ticket: blocked
- Last line: "blocked -> T-{n}-impl-log.md (see iteration_log)"
EOF

cd ${WS}
opencode run \
  --prompt-file /tmp/T-{n}-qwen-prompt.md \
  --workspace ${WS} \
  --model qwen-coder \
  --max-iterations 50

# Si opencode falla / API no disponible → fallback: copiá prompt + Chris ejecuta manual:
# echo "Pegá esto en opencode CLI: $(cat /tmp/T-{n}-qwen-prompt.md)"
```

Mientras qwen trabaja → tú NO interfieres. Cuando termina:
1. Verificás `T-{n}-result.md` existe y dice `state: pushed` (o blocked)
2. Verificás commit SHA en git log
3. Actualizás `06-tickets.yaml` ticket → state: pushed o blocked
4. Si pushed → continúa Step 4 (next ticket). Si blocked → escalate.

### Step 2B — Owner = claude-opus (AGENTIC production code)

Spawnás agent `builder-agentic` (Opus 4.7) via Agent tool. REQUIRED: pasá `<brand>: {brand}` en prompt.

```
Agent({
  description: "Build agentic ticket T-{n} brand={brand}",
  subagent_type: "builder-agentic",
  prompt: "<brand>: {brand}                          # ★ REQUIRED — multibrand scope
           <pr_folder>: {brand}/docs/product/stories/{story-id}/
           PRIORITY READ: {brand}/docs/product/stories/{story-id}/CONTEXT-BRIEF.md (Haiku-built, 5-8k tokens compresses spec+arch+rules+anti-dup+canonical docs)
           READY PACKAGE (todos bajo {brand}/docs/product/stories/{story-id}/): 01-spec.md + 02-design-agentic.md + 03-arch.md + 03-arch-agentic.md + 04-validators.yaml + 05-guidelines.md + 06-tickets.yaml
           Skill consultados obligatorio: copilot-expert/sales-agent-expert + tessl__langgraph + claude-api + graceful-degradation
           Surface scope: SOLO {brand}/backend/src/modules/{brand}/{copilot,sales_agent}/{tools,extractors,workflows,personas,goldens,kb}/ (brand-extension). NUNCA core/luana-core-*/src/ (engine — requires /pm-luana lift).
           AUTONOMOUS LOOP: implement → run validators (04-validators.yaml acceptance.validator_ids) → fix → repeat hasta GREEN o cap_reached
           TDD: eval goldens RED first, integration tests, tools tests, etc
           ★ G5 PRE-COMMIT SMOKE GATE: validators GREEN + lint + format + env-gated tests con env real + case-sensitivity match — TODO antes commit. RED bloquea commit, fix file, re-run.
           Push destination: git push origin \$(git branch --show-current) — wip/* | main | release/{brand}-vX.Y.Z. NUNCA 'origin development'.
           Output: T-{n}-result.md + commit pushed
           Last line: done -> {brand}/docs/product/stories/{story-id}/T-{n}-result.md (o blocked -> T-{n}-impl-log.md)"
})
```

`builder-agentic` corre validators + push. Devuelve `done -> T-{n}-result.md`.

### Step 2C — Owner = claude-sonnet (cross-module shared o tests/docs sobre agentic)

Spawnás agent `builder-backend` o `builder-frontend` con model=sonnet (default). Prompt SIEMPRE referencia `CONTEXT-BRIEF.md` + propaga `<brand>`:

```
Agent({
  description: "Build {surface} ticket T-{n} brand={brand}",
  subagent_type: "builder-{backend|frontend}",
  model: "sonnet",
  prompt: "<brand>: {brand}                          # ★ REQUIRED — multibrand scope
           <pr_folder>: {brand}/docs/product/stories/{story-id}/
           Read {brand}/docs/product/stories/{story-id}/CONTEXT-BRIEF.md FIRST (saves 30-50k tokens vs raw docs).
           READY PACKAGE (todos bajo {brand}/docs/product/stories/{story-id}/): 01-spec.md + 03-arch.md + 04-validators.yaml + 05-guidelines.md + 06-tickets.yaml
           Surface scope: SOLO {brand}/backend/src/ + {brand}/frontend/src/. NUNCA core/luana-core-*/src/ (engine). NUNCA {other_brand}/...
           AUTONOMOUS LOOP: implement → run validators → fix → repeat
           TDD obligatorio.
           ★ G5 PRE-COMMIT SMOKE GATE: validators GREEN + lint + format + env-gated tests con env real + case-sensitivity match — TODO antes commit. RED bloquea commit.
           Push destination: git push origin \$(git branch --show-current). NUNCA 'origin development'.
           Last line: done -> {brand}/docs/product/stories/{story-id}/T-{n}-result.md"
})
```

## Step 3 — Self-monitor durante build

Mientras el dev (qwen | builder-{be,fe,agentic}) trabaja, tú:
- Touchéas `T-{n}-impl-log.md` periodically con timestamps "still in progress"
- Si dev se cuelga > 30min sin progress visible → escala Chris
- Si dev reporta `blocked` → registrar en log + escala `/pm`

## Step 4 — Verificar result + gate-runner enforcement

Cuando dev termina, leer `T-{n}-result.md` + verificar `gate-output.json`:

- [ ] Validators de 04-validators.yaml asociados al ticket → todos ✅?
- [ ] **`gate-output.json` existe en story-folder + `overall.any_fail = false`?**
      Si missing → builder no invocó gate-runner. SPAWN gate-runner directo aquí:
      ```
      Agent({
        description: "Force gate-runner T-{n} brand={brand}",
        subagent_type: "gate-runner",
        model: "haiku",
        prompt: "<brand>: {brand};
                 <pr_folder>: {brand}/docs/product/stories/{story-id}/;
                 <command>: test-{backend|frontend|all};
                 <iter>: <N>"
      })
      ```

      **R22 post-spawn validation (origen 2026-05-05 caso T-1.bis):**
      Después del spawn, VERIFY el artifact realmente escribió a disco. Si gate-runner
      reporta "ERROR — gate-output.json write failed" en su last-line, OR si el
      file no existe post-spawn, NO confíes en stdout output del agent — re-spawn
      UNA segunda vez con mismo prompt. Si segunda invocación también falla:
      ```bash
      # Fallback manual: orchestrator escribe gate-output.json directo (paths brand-scoped + workspace root parametrizado)
      WS=$(git rev-parse --show-toplevel)
      cd ${WS}/{brand}/backend && ${WS}/.venv/bin/{ruff,pytest} ... > /tmp/gate.log 2>&1
      python3 -c "import json; ..." > ${WS}/{brand}/docs/product/stories/{story-id}/gate-output.json
      ```
      Documentar en T-{n}-impl-log.md sección "Gate-runner failover" + escalar
      backlog R22 retry.

      Read JSON. Si `any_fail=true` → ticket vuelve a `tests-failing`, hand off `/dev-team` con findings.
- [ ] Commit SHA presente + git log lo confirma?
- [ ] Push exitoso (`git push origin "$(git branch --show-current)"` — wip/* | main | release/{brand}-vX.Y.Z. NUNCA 'origin development')?

Si cualquier gap → ticket vuelve a `tests-failing` o `building`. Si dev itera ≥5x sin éxito → `blocked` + escala.

> **Origen R2 process-improvement 2026-05-05 (D2):** sin gate-runner enforcement
> orchestrator, cada subagent corre su propio pytest cycle (~10-15% tokens
> duplicados). gate-runner Haiku produce JSON estructurado consumible por auditor
> sin re-correr suite ni parsear stdout.

## Step 5 — Avanzar a siguiente ticket o cerrar story

Update `06-tickets.yaml`:
```yaml
state: pushed
push_commit_sha: abc1234
transitions:
  - { state: tests-passing, ... }
  - { state: pushed, ..., commit: "abc1234" }
```

Si quedan tickets `ready` → continuar Step 1 con next ticket.

Si TODOS tickets pushed → transition story a review:

```yaml
# {brand}/docs/product/stories/{story-id}/checkpoint.md
brand: {brand}     # ★ REQUIRED — multibrand scope
state: developed   # ★ TRANSITION developing → developed (awaiting QA — Chris triggers /auditor) ★
phase: AWAIT_AUDIT
last_artifact: T-{N}-result.md (last ticket)
next_action: "/auditor <brand>: {brand} toma story {id} para Conv 3 review+merge"
```

Output:
```
Story {brand}/{id} all tickets pushed.
- T-1 (commit abc1234) ✅
- T-2 (commit def5678) ✅
- T-3 (commit 9876abc) ✅

Quality gates: validators all GREEN.
Story state: developing → developed (awaiting QA, Chris triggers /auditor).
WIP cap check: building (was N) now N-1; review (was M) now M+1 / cap 2.

Próximo: /auditor <brand>: {brand} (Conv 3) lee T-{n}-result.md + corre tests independientes + CHECKPOINTS.md C1-C5.
```

## Step 5.5 — R12 layer 1: emit process metric

> Origen: process-improvement A1 partial (2026-05-05). Foundation para
> medir ROI cross-PI. Token-level detail viene del transcript via
> `scripts/extract_baseline_metrics_from_transcripts.py`; aquí emitimos
> orchestrator-level metadata (verdict + commit_sha + ticket + phase) que
> NO está en transcript.

Antes de cerrar Step 5, append metric row a `docs/process/metrics/runs.jsonl`:

```bash
WS=$(git rev-parse --show-toplevel)
python3 ${WS}/scripts/emit_process_metric.py \
  --brand "{brand}" \
  --story "{story-id}" \
  --ticket "T-{n}" \
  --phase build \
  --agent-type "<builder-backend|builder-agentic|builder-frontend|qwen-opencode>" \
  --verdict "<tests-passing|tests-failing|pushed|blocked>" \
  --commit-sha "$(git log -1 --format=%h)" \
  --total-tokens "<from agent tool result if visible, else omit>" \
  --tool-use-count "<from agent tool result if visible, else omit>" \
  --duration-ms "<wall-clock ms agent ran, else omit>" \
  --iter <N> \
  --note "<1-line context if relevant>"
```

`runs.jsonl` is gitignored (rolling). Periodic aggregation: post-story close,
`/pm` runs analysis script comparing `runs.jsonl` to baseline.

If `python3 scripts/emit_process_metric.py` fails (script missing, etc.) →
log warning + continue. Metrics emission is best-effort, NEVER blocks the
pipeline.

## Cap reached (autonomous loop blocked)

Si dev itera ≥10x sin GREEN (cap from `04-validators.yaml` `iteration.max_iterations`):

```yaml
# {brand}/docs/product/stories/{story-id}/checkpoint.md
brand: {brand}     # ★ REQUIRED — multibrand scope
state: blocked     # NOT review — autonomous failed
phase: BUILD_T{n}_BLOCKED
last_artifact: T-{n}-impl-log.md
next_action: "Chris reviews iteration_log to decide: refine validators / refine guidelines / split ticket / restart"
```

Output:
```
Story {brand}/{id} ticket T-{n} BLOCKED — autonomous loop cap reached (10 iter).

Last error trace (verbatim):
---
{paste last validator failure}
---

iteration_log summary:
- Iter 1-3: implementation phase, RED on validator X
- Iter 4-6: refactor approach Y, still RED
- Iter 7-10: edge case Z not handled by guidelines

Story state: developing → blocked.

Próximo: Chris reviews {brand}/docs/product/stories/{story-id}/T-{n}-impl-log.md →
decide:
- Refine 04-validators.yaml (validator was wrong)
- Refine 05-guidelines.md (missing pattern guidance)
- Split T-{n} (too large)
- Restart with different approach
```

## Multi-ticket parallel

Si 2 tickets independientes (no `depends_on`) están `ready` simultáneamente:
- Podés spawnear builders en PARALELO (single message, multiple Agent calls / multiple opencode bash)
- IMPORTANTE: ambos no deben tocar mismos archivos (conflict)
- Si overlap detectado → secuencial

## Anti-patterns

- ❌ AGENTIC ticket production_code=true asignado a qwen/Sonnet (HARD BAN — Opus only)
- ❌ Skip TDD (escribir código sin validators RED primero)
- ❌ `git add .` / `git add -A` / `git add -u` (parallel-safety)
- ❌ `git commit --no-verify`
- ❌ `git pull` antes commit (parallel-safety)
- ❌ Push falla non-fast-forward → NO `git pull`. STOP, escala.
- ❌ `git push origin development` — branch eliminado en reorg 2026-05-15. Triple-branch: wip/* | main | release/{brand}-vX.Y.Z.
- ❌ Marcar ticket pushed sin verify TODOS validators ticket-asociados → GREEN
- ❌ Self-fix más de cap_reached iter sin escalar bloqueo
- ❌ Dev tocando archivos out_of_scope (5-guidelines.md "Files in scope" hard)
- ❌ Dumpear código en chat (anti-teléfono — todo en archivos)
- ❌ Editar paths legacy `docs/archive/2026/legacy-pis/PI-N/...` o `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/` (snapshot inmutable)
- ❌ Skip 04-validators.yaml — implementar sin validators es paradigma viejo
- ❌ Cerrar story como done sin pasar por `/auditor` Conv 3
- ❌ Hardcodear paths `/home/chris/AISALESHT/...` o `/home/chalreme/Proyectos/luana-platform/...` — usar `${WS}` resuelto via `git rev-parse --show-toplevel`
- ❌ Inferir el brand del contexto si Chris no lo dijo — PREGUNTAR primero

## Anti cross-brand pollution

- ❌ NUNCA editar `{other_brand}/...` cuando trabajás en `{brand}`. Si la story necesita tocar otra brand → STOP, escalate `/pm-luana` (outcome cross-brand).
- ❌ NUNCA editar `core/luana-core-*/src/` directamente. Requiere lift via `/pm-luana` (promotion gate).
- ❌ NUNCA escribir/leer archivos en root `docs/product/stories/` — solo `<brand>: platform` (cross-brand) outcomes van ahí, y eso requiere autorización explícita `/pm-luana`.
- ❌ Spawn sub-agent sin propagar `<brand>: {brand}` en el prompt — sub-agent puede editar fuera del scope brand.

## Output format

Cada update al user/PM:
- 1 frase status ticket
- Quality gates resumen (validators ID + ✅/❌)
- Próximo paso
- NO dump de diff o tests output (cita paths)

## Referencias

- `docs/process/pm-redesign-2026-05.md` — paradigma 3 conversaciones + autonomous build
- `.claude/rules/tdd-mandatory.md` — TDD obligatorio + R31 default flag flips
- `.claude/rules/anti-duplication.md` — inventario shared abstractions
- `.claude/rules/hotfix-repro-mandatory.md` — R26 hot-fix gate
- `.claude/rules/parallel-safety.md` — M1-M8 multi-session
- `.claude/agents/builder-{backend,frontend,agentic}.md` — sub-builders specs
- `.claude/agents/gate-runner.md` — gate-output.json producer (Haiku)
- `.claude/agents/context-builder.md` — CONTEXT-BRIEF.md producer (Haiku)
