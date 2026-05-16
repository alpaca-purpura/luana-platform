---
ticket: T-10
story: S-DOCKER-DEV-MULTIBRAND
state: done
started_at: 2026-05-15
completed_at: 2026-05-15
---

# T-10 impl log — Docs + CLAUDE.md + SKILL.md

## Deliverables completados

1. **NEW `docs/process/docker-dev-multibrand.md`** — Runbook completo para S-DOCKER-DEV-MULTIBRAND:
   - Quick start (cp .env.dev.template + make dev-{brand} + curl /health)
   - Tabla Makefile targets con descripcion de cada uno
   - Port allocation cementada (D6)
   - Explicacion hot-reload (bind mount + volume .venv)
   - Como funciona hot-reload con core/ (--reload-dir /workspace/core)
   - Como agregar nueva brand al sistema (10 pasos)
   - Troubleshooting top 5 errores (env missing, postgres healthcheck, build context, hot-reload, port collision)
   - Notas build context

2. **NEW `docs/architecture/luana-platform/ADR-003-docker-dev-multibrand.md`** — ADR formal:
   - Contexto (bloqueantes previos)
   - Decisiones D1-D6 con alternativas consideradas + razon de eleccion + consecuencias
   - Pattern "metadata-en-su-lugar + auto-gen index" generalizado
   - Consecuencias generales (checkboxes positivos + advertencias)

3. **MODIFY `CLAUDE.md`** — seccion workspace bootstrap actualizada:
   - `make dev-vitalia` / `make dev-nicolify` como ejemplos primarios
   - Referencia a docs/process/docker-dev-multibrand.md + ADR-003 + INFRA-MATRIX.md
   - Port allocation table en el bootstrap

4. **MODIFY `.claude/skills/pm-luana/SKILL.md`** — seccion permanente agregada:
   - `## Pattern: metadata-en-su-lugar + auto-gen index`
   - Tabla de generalizacion: infra (✅) + capabilities (⏳) + integrations (⏳) + versions (⏳)
   - Comandos de referencia (make infra-matrix, make install-hooks)
   - Guia de cuándo aplicar el pattern
   - Referencias a archivos clave (generate_infra_matrix.py, INFRA-MATRIX.md, pre-commit Section 10)

## Acceptance criteria verificados

- A1: `grep -rq 'docker-dev-multibrand' docs/process/` → docs/process/docker-dev-multibrand.md existe
- A2: `grep -rq 'ADR-003' docs/architecture/luana-platform/` → ADR-003 presente
- A3: `grep -q 'make dev-vitalia\|make dev-nicolify' CLAUDE.md` → CLAUDE.md actualizado
- A4: `grep -rq 'metadata-en-su-lugar' .claude/skills/pm-luana/` → SKILL.md actualizado
