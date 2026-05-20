---
brand: comunify
type: promotables-queue
last_updated: 2026-05-20
ssot_owner: /pm-comunify
consumer: /pm-luana (Modo Core Engineering)
---

# Comunify — Promotables queue para `/pm-luana`

> Index pointer-first de learnings comunify con `promotable: yes` o `promotable: candidate` pendientes de evaluación cross-brand. `/pm-luana` lee este file en su próximo bootstrap (o cuando corra `make scan-promotables`) y decide si abre promotion proposal en `docs/promotion-protocol/proposals/`.

## Pending (1)

| Learning | Slug | Applies to | Target | Rationale 1-line |
|---|---|---|---|---|
| `2026-05-17-named-volume-staleness-post-pyproject-bump.md` | named-volume-staleness-post-pyproject-bump | todas las brands con stack Docker dev | addendum a `docs/process/docker-dev-multibrand.md` (no es package) | `docker compose up -d --build` NO repobla named volumes ya populados — `.venv` queda stale post `pyproject.toml` bump. Síntoma: `ModuleNotFoundError`. Workaround: `docker volume rm {brand}_backend_venv`. NO requiere promotion proposal (doc-only addendum). |

## Processed (5)

Verdicts ratificados por `/pm-luana` 2026-05-20 (autorización Chris "resolvamoslo todo de una vez"):

| Learning | Slug | Verdict | Outcome/Proposal abierto | Estado próximo |
|---|---|---|---|---|
| `2026-05-18-tailwind-v4-postcss-wiring-gap.md` | tailwind-v4-postcss-wiring-gap | ✅ **OPEN PROPOSAL** | `docs/promotion-protocol/proposals/2026-05-20-lift-tailwind-v4-postcss-scaffold.md` (state=proposed) — child de outcome `bootstrap-brand-template-hardening` | Chris ratifica APPROVED/REJECTED inline |
| `2026-05-17-playwright-runner-parity-gap.md` | playwright-runner-parity-gap | ✅ **OPEN PROPOSAL** | `docs/promotion-protocol/proposals/2026-05-20-lift-playwright-runner-scaffold.md` (state=proposed) — child de outcome `bootstrap-brand-template-hardening` | Chris ratifica APPROVED/REJECTED inline |
| `(pending physical learning write)` | camino-b-outline-button-pattern | ✅ **OPEN PROPOSAL** | `docs/promotion-protocol/proposals/2026-05-20-lift-camino-b-design-system.md` (state=proposed) — child de outcome `bootstrap-brand-template-hardening` | Chris ratifica + /pm-comunify escribe physical learning file próxima sesión |
| `(pending physical learning write)` | arch-fitness-anti-low-contrast | ⏸ **DEFERRED** | NO proposal abierto — DRY threshold no alcanzado (solo Comunify consumer hoy) | Esperar 2do consumer (Vitalia o Nicolify) antes de lift; re-evaluar cuando aplique |
| `(pending physical learning write)` | linux-live-verification-replacement | ✅ **OPEN OUTCOME** | `docs/product/outcomes/linux-live-verification-replacement.md` (state=refining) — outcome platform standalone | Chris ratifica scope outcome → handoff `/po` para Story R1 research |

## Cross-brand impact

Los 3 OPEN PROPOSALS apuntan al **mismo root cause meta:** el scaffold `_pm-brand-template/` no es exhaustivo. Brands que bootstrappean copiando vitalia/comunify pattern heredan los gaps silenciosos. Agrupados en **outcome platform `bootstrap-brand-template-hardening`** (ver `docs/product/outcomes/bootstrap-brand-template-hardening.md`) que coordina sweep vitalia + lupulo + actualización scaffold + audit cross-brand. Saves 3 incidents idénticos × 6 brands futuras = 18 incidents-evitados.

El OPEN OUTCOME `linux-live-verification-replacement` es **separate scope** — no es scaffold gap, es plataforma development workflow gap. Urgencia alta (4to ciclo consecutivo bloqueado).

## Otros learnings comunify (no promotables ahora)

- `2026-05-16-capabilities-inventory-recovery.md` (promotable: no — cross-skill override one-off para gap originado en vitalia/nicolify, ya documentado en `docs/promotion-protocol/proposals/2026-05-16-capability-inventory-enforcement.md`)

## Workflow

1. `/pm-luana` bootstrap incluye lectura de este file
2. Por cada row con `promotable: yes`, `/pm-luana` decide:
   - **Open proposal:** crear `docs/promotion-protocol/proposals/{date}-lift-{slug}.md` → mover row a Processed con link
   - **Open outcome:** crear `docs/product/outcomes/{slug}.md` (para gaps platform-level no liftable como package) → mover row a Processed con link
   - **Defer:** mark Processed con verdict DEFERRED + razón
   - **Reject:** mark Processed con verdict REJECTED + razón
3. Cuando proposal `state >= accepted`, este row queda en Processed (audit trail forever — no se elimina)
4. `/pm-comunify` solo añade nuevos rows a Pending, nunca edita Processed (jurisdicción `/pm-luana`)
