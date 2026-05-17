---
story_id: vitalia-dev-stack-functional
outcome: dev-environment-multibrand
state: refining
phase: PO_SPEC
last_artifact: 01-spec.md
last_modified: 2026-05-17T01:50:00Z
next_action: "Chris ratifica spec + responde preguntas open → invocar /architect"
ratified_by_chris: false
spawned_at: 2026-05-17T01:50:00Z
spawned_by: claude-direct
parallel_safe: true
blocked_reason: null
audit_iterations: 0
hotfix_metadata:
  repro_verified: true
  repro_command: "make dev-vitalia-tunnel && docker logs luana-dev-vitalia_frontend_dev-1"
  diagnosis_validates_handoff: true
---

# vitalia-dev-stack-functional — checkpoint

## Goal

Dejar la stack `vitalia` levantable end-to-end vía `make dev-vitalia-tunnel` con dominio público `https://dev-app.vitalialat.com/` sirviendo:
- Frontend Next.js renderizando home + login Clerk
- Backend FastAPI respondiendo `/api/v1/health` + endpoints vitalia montados
- Postgres `luana_postgres_dev` saludable + DB `vitalia_dev` con migrations aplicadas
- Tunnel Cloudflare conectando 4 edges sin reconnect loops

## Contexto

Story 11 (`luana-vitalia-bootstrap`, shipped 2026-05-15) entregó código vitalia completo (86 BE tests + 22 FE + 24 E2E pasando), pero la **stack de dev local NUNCA se validó end-to-end**. Commit `e7dc4a0` (2026-05-17, feat(dev-tunnels)) montó el tunnel Cloudflare → validado capa transporte (chain CF→cloudflared→docker network probado vía 530→502→ingressRule logs), pero al levantar la stack completa con `make dev-vitalia-tunnel` los containers FE+BE quedan en restart loop por bugs de bootstrap del image.

**Repro confirmado:**
```
docker logs luana-dev-vitalia_frontend_dev-1
  → sh: next: not found / ELIFECYCLE Command failed
docker logs luana-dev-vitalia_backend_dev-1
  → uv error: Project virtual environment directory `/workspace/vitalia/backend/.venv`
    cannot be used because it is not a compatible environment
```

## Issues identificados

| # | Issue | Causa raíz | Surface fix |
|---|---|---|---|
| 1 | FE `next: not found` | Named volume `vitalia_frontend_node_modules` shadowea `/app/node_modules` del bind mount, queda vacío en first creation | `vitalia/frontend/Dockerfile` o `vitalia/docker-compose.dev.yml` |
| 2 | BE `.venv` incompatible | Named volume `vitalia_backend_venv` corrupto entre rebuilds (uv no recrea sobre directorio existente) | `vitalia/backend/Dockerfile` o compose |
| 3 | DB `vitalia_dev` no se crea automáticamente | Root `docker-compose.dev.yml` levanta postgres pero no crea DBs per brand (no init.sql) | `docker-compose.dev.yml` raíz o entrypoint backend |
| 4 | Migrations no aplicadas en first start | Backend no corre `alembic upgrade head` al startup | `vitalia/backend/Dockerfile` o entrypoint |
| 5 | Clerk authorized origin | `dev-app.vitalialat.com` no está en allowed list del tenant Clerk vitalia | Manual dashboard Clerk |
| 6 | `.env.dev` placeholders | `pk_test_REPLACE_ME`, `sk_test_REPLACE_ME`, `OPENAI_API_KEY=sk-REPLACE_ME` | Manual user (gitignored, no commit) |

## Out of scope (no tocar este story)

- HIPAA-hardening (diferido a Story 11.bis per `vitalia/config/brand.yaml`)
- Multi-site UI (Q2=B D13, diferido)
- Voice cloning (D8 ratificado)
- Production deploy (cloudflared prod tunnel + K8s deploy)
- Cualquier feature funcional vitalia nueva (este story solo fix bootstrap)

## Bitácora

- 2026-05-17 01:50: story creada por chalreme + claude directo post smoke-test tunnel
- 2026-05-17 01:50: spec en `01-spec.md`, state=refining → esperar ratificación Chris
