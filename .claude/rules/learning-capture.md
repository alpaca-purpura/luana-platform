# Learning Capture System

> **Slim stub (context-rot pass 2026-05-30).** Detalle completo en `docs/rules-detail/learning-capture.md` — load on-demand vía Read. **Origen:** conversación 2026-05-27 — cement-date 2026-05-27.

## Regla cardinal

Cada aprendizaje vive en un archivo `.md` dedicado bajo un path canónico. **MEMORY.md sólo guarda pointer + 1-line hook** — nunca el contenido.

| Tipo | Path canónico |
|---|---|
| Técnico transversal (≥2 brands) | `docs/learnings/{date}-{slug}.md` |
| Negocio per-brand | `{brand}/docs/learnings/{date}-{slug}.md` |
| Process/paradigm | `docs/process/learnings.md` (append) |
| Tooling/workspace | `docs/learnings/tooling/{slug}.md` |

**Naming:** `YYYY-MM-DD-{kebab-slug}.md`.

## Cuándo carga el detalle

- Chris dice "aprendamos de esto" / "capturá esto" / "/aprende" o equivalentes → **Trigger 1 mandatory**: STOP flujo actual, clasificar, proponer slug, escribir archivo, agregar pointer MEMORY.md.
- Hook `.claude/hooks/learning-detect.sh` sugiere post-Edit/Bash → **Trigger 2 advisory** (nunca captura sin ratificación Chris).
- Auditor identifica pattern recurrente (≥2 stories) → **Trigger 3**: sección "Suggested learning capture" en `T-{n}-review.md`.

## Anti-patterns (top 3 — lista completa en el detalle)

- ❌ Escribir contenido del aprendizaje DENTRO de `MEMORY.md` (rompe pointer-first)
- ❌ Capturar aprendizaje sin ratificación Chris (especialmente hook auto-trigger)
- ❌ Learning técnico capturado en `{brand}/docs/learnings/` cuando aplica cross-brand

## Referencias

- `docs/rules-detail/learning-capture.md` — **detalle completo** (template canónico, pointer schema MEMORY.md, promotion path learning→rule, cleanup periódico, enforcement layers)
- `docs/process/learnings.md` — process-level learnings
- `MEMORY.md` — índice pointer-first
- `CLAUDE.md` § Critical Rules — tabla rules cementadas
