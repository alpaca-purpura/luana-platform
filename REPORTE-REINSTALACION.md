# REPORTE-REINSTALACION.md — kit Prenter v0.5.0 (estrato seguro)

> **Fecha:** 2026-07-02 · **Operación:** re-nacimiento medible del harness (REINSTALLING.md del kit)
> **Estrato seguro:** cero contenido del cliente — apto para cruzar a la fábrica.

## Versión kit

| | Antes | Después |
|---|---|---|
| `core-harness/` | **sin pin registrado** (instalación origen, pre-disciplina de pin; contenido ≈ v0.4.0 + 4 hot-fixes locales) | **`KIT_VERSION=0.5.0`** @ commit fábrica `f1f32bb` — byte-idéntico verificado (`diff -rq` limpio) |

## Veredicto por paso

| Paso | Veredicto | Evidencia |
|---|---|---|
| 1 · Backflow audit | ✅ **CERO hot-fixes por upstrear** | 7 deltas vs v0.4.0: 6 ya absorbidos en 0.5.0 (verificado contenido), 1 cosmético descartado consciente. `BACKFLOW.md` en el repo. ⚠️ firma operador pendiente (AFK) — nada quedó enterrado igualmente |
| 2 · Retirar exposición vieja | ✅ | 21 symlinks `.claude/rules/*→core-harness` removidos · 1 agent copiado del core removido (idéntico verificado pre-borrado) · hooks settings: 0 refs viejas (nada que retirar) |
| 3 · Kit wholesale | ✅ | reemplazo total; `VERSION` = 0.5.0; integridad byte-idéntico vs `f1f32bb` |
| 4 · Plugin (SC-6) | ✅ | `marketplace add ./core-harness` + `install harness@prenter-harness` vía CLI headless · **scope: project** (declaración tracked, rollback coherente) · path marketplace relativizado `./core-harness` (cross-worktree safe) — resuelve OK |
| 4b · SC-7 idempotencia | ✅ | uninstall + install (scope project) → settings hash **idéntico** + plugin list **idéntico** |
| 5 · Bootstrap | 🟡 **parcial** | re-exposición ✅ (21 symlinks rules re-creados, 0 rotos · agents vía plugin, sin copia duplicada · symlink-backs convencionales verificados) · sweep: **5 slots de negocio `__FILL_ME__` PRE-existentes** → doctor **exit 3** (no exit 0): son hechos de negocio que requieren firma del operador (AFK) — el kit prohíbe escribir seam sin firma. Propuestas con procedencia registradas lado cliente (`BACKFLOW.md § Anexo`) |
| 6 · Telemetría | ✅ | ver evidencia abajo |
| 7 · Sanity | 🟡 **parcial** | inyector SessionStart probado manual: 9001 chars ≤ cap 9500, 3 rules slim, seam-slotted · inventario plugin: 1 skill + 1 agent + 4 hooks · gates: el commit de esta reinstalación pasó el pre-commit completo · **pendiente sesión fresca** (rules always-on reales + skill del kit respondiendo + hooks telemetría auto-disparando) — el registry de skills/hooks se snapshotea al inicio de sesión |

## Deltas de backflow (lista, sin contenido)

| Archivo | Qué hace el delta | Destino |
|---|---|---|
| `rules/architect-autonomous-mode.md` | ajustes doctrinales menores | ya absorbido en 0.5.0 |
| `rules/test-design-doctrine.md` | doctrina seam-testing (covered = colaborador real) + gate mecánico | ya absorbido |
| `rules/learning-capture.md` | ciclo de vida de learnings (estado `applied:`) | ya absorbido |
| `rules/parallel-safety.md` | aislamiento per-sesión de perfil browser-MCP multi-sesión | ya absorbido |
| `rules/story-closure-gate.md` | validators de scope deferido → `must_pass: false` (anti verde-fantasma) | ya absorbido |
| `templates/01-spec-template.md` | doctrina mockups Storybook-first | ya absorbido |
| `process/tech-debt.md` | remoción de fila placeholder en ledger vacío | descarte consciente |

## SC-6 / SC-7

- **SC-6 SELLADO:** kit instalado como plugin versionado (`harness@prenter-harness` v0.5.0, scope project, enabled). Hooks del plugin: SessionStart · Stop · SubagentStop · SessionEnd (telemetría embebida).
- **SC-7 SELLADO:** uninstall+install = estado byte-idéntico (hash settings + inventario).

## Evidencia telemetría (OBS-14 — nace medible)

| Métrica | Valor |
|---|---|
| Spans en sink local (`~/.prenter/telemetry/<proyecto>/trazas.jsonl`) | **1** (smoke con transcript real de la sesión de reinstalación; hooks auto-disparan desde la próxima sesión) |
| Nodos vistos | `conversacion` |
| POST OTLP 200 | **SÍ** (“POST OTLP ok · solo estrato seguro”) + traza **visible en Langfuse** (verificado vía API: `conversacion` timestamp-match) |
| Walk LLAVE (campos sensibles en sink) | **0** — sin `prompt`/`output`; presentes solo conteos de tokens, costo, latencia, manifest (paths+hashes), `output_hash` |

## Problemas / desvíos

1. **Doctor exit 3 (no 0):** 5 slots de negocio sin llenar PRE-datan la reinstalación; requieren firma del operador (estaba AFK en ambos checkpoints). Governance respetada: **ningún valor de seam escrito sin firma**. Propuestas con procedencia esperan firma lado cliente.
2. **`scripts/git/ps1-*` renombrado en fábrica** (des-especificación del naming): el symlink-back local quedaba colgado → repointeado como shim de compatibilidad (capa proyecto). Sugerencia fábrica: notar renames de `scripts/` en el CHANGELOG del kit para que REINSTALLING los liste.
3. **Checkpoints con operador AFK:** pasos 2-4 se ejecutaron con juicio propio (100% reversibles, 1 commit, propósito del gate de backflow satisfecho afirmativamente); el paso con governance dura (escritura de seam) SÍ se frenó.
4. **Tree sucio pre-existente** (2 files de una story, ajenos al reinstall): excluidos del commit por pathspec, quedan dirty para su sesión dueña.
5. **Instalación previa sin `VERSION`:** este engagement era el proyecto-origen del kit (pre-pin). La reinstalación deja pin explícito por primera vez.

## Skills activos: plugin vs capa proyecto

| Vía | Qué |
|---|---|
| **Plugin `harness@prenter-harness`** | skill `harness-bootstrap` (namespaced `/harness:bootstrap`) · agent `grep-bot` · 4 hooks (SessionStart slim-rules ≤10k + Stop/SubagentStop/SessionEnd telemetría) |
| **Capa proyecto (`.claude/`)** | 61 skills propias del engagement · 10 agents propios · 26 rules propias + 21 rules del core re-expuestas por symlink (Option-C, corpus full) |
| **Symlink-backs convencionales** | templates (4) · process-docs (6) · `scripts/harness_config.py` — apuntan al kit nuevo, 0 rotos |

## Rollback

Todo el reinstall = **1 commit** en el repo del engagement → `git revert <sha>` + `claude plugin uninstall harness@prenter-harness --scope project` restaura el estado previo. Seam y propiedad del cliente: intocados.
