# Test Design Doctrine (bases sólidas de desarrollo — qué probar según la naturaleza del ticket)

<!-- voseo-allowed: doc interno de doctrina de maquinaria agéntica (no user-facing) -->


**Origen:** sesión 2026-05-28 — Chris pidió que el dev tenga, además de TDD, una **base sólida propia** para diseñar QUÉ probar y CÓMO según la naturaleza del ticket (unitarios, comportamiento/E2E, y todas las pruebas que correspondan), de forma inteligente pero no improvisada. Refuerzo: seguimos usando el stack de calidad de nicolify (ruff, vitest, eslint, mypy, jscpd, etc.) — esta doctrina lo trata como base obligatoria de autoverificación.

**Cement-date:** 2026-05-28. **Aplica a:** `builder-{backend,frontend,agentic}` (diseñan tests), `/architect` (declara el plan en `04-validators.yaml`), `/auditor` (verifica cobertura). **Complementa:** `tdd-mandatory.md` (orden RED→GREEN) + `architectural-fitness.md` + `backend-quality.md` + `frontend-quality.md`.

## Regla cardinal

El builder NO improvisa los tests. Diseña la **batería de tests apropiada a la naturaleza del ticket** (matriz abajo) ANTES de implementar (fase `technical_design`), siguiendo TDD (RED→GREEN→REFACTOR, primera entrada del bitácora = RED). El `04-validators.yaml § test_construction_plan` del architect manda; esta doctrina es el **fallback independiente** cuando el plan es delgado o falta un tipo de test que la naturaleza exige.

## Matriz: naturaleza del ticket → tests requeridos

| Naturaleza del ticket | Tests obligatorios (RED primero, por capa) |
|---|---|
| **BE endpoint** (API) | unit (domain/service) + **integration API** (happy + **cross-tenant 403** + validación 422) + migration idempotency (si toca schema) + `response_model` PII check |
| **BE service / use-case** | unit por capa: domain (lógica pura) → infra (repo con tenant_id) → application (orquestación). RED por capa antes de implementarla |
| **BE repository** | integration con DB de test: get_by_id filtra tenant_id · soft-delete respetado · no cross-tenant leak |
| **BE migration** | idempotencia (re-run = no-op) · upgrade/downgrade · `IF NOT EXISTS`/`IF EXISTS` |
| **FE component** | Vitest component: render + props + estados (default/empty/loading/error/success) + interacción (click/submit) |
| **FE hook (data)** | Vitest: success + error + loading · React Query keys/invalidation correctas |
| **FE form** | RHF + Zod: validación happy + cada regla de error + submit · estados disabled/pending |
| **FE route/page nueva** | **E2E Playwright smoke** (la ruta carga + elemento clave visible) + visual fidelity scoped (`frontend-visual-fidelity.md`) |
| **Flujo crítico FE modificado** | E2E regression del flujo (no solo smoke) |
| **Agentic tool** | unit del tool (input/output schema + tenant_id) + graph integration (RED) + **≥3 eval goldens** + voice fidelity grader (si toca voz) |
| **Agentic prompt slot / persona** | eval goldens del comportamiento + no-hallucination + no-overpromise + voice fidelity |
| **Bug fix / hot-fix** | **regression test PRIMERO** (RED reproduce el bug) → fix → GREEN. Sin repro test, no hay fix (ver `hotfix-repro-mandatory.md`) |
| **Refactor (sin cambio de comportamiento)** | los tests existentes pasan ANTES y DESPUÉS (no se escriben tests nuevos; si hacen falta, no era refactor) |
| **Config / docs / tooling puro** | TDD NO aplica (ver `tdd-mandatory.md`); igual corre lint/format |

> Regla de inteligencia: si la naturaleza del ticket exige un tipo de test que el `04-validators.yaml` NO incluye → el builder lo agrega y lo nota en `T-{n}-impl-log.md § Test design`. Si el architect lo declaró de más (test irrelevante a la naturaleza) → el builder lo cuestiona, no lo cumple ciegamente.

## Bases de calidad de test (cómo, no solo qué)

- **Comportamiento, no implementación** — testear la conducta observable (entrada→salida, efecto), no detalles internos que romperían en cada refactor.
- **AAA** (Arrange-Act-Assert) · un concepto por test · nombre que describe el comportamiento (`test_create_rejects_cross_tenant`).
- **Determinista** — sin dependencias de orden, reloj real (usar `utc_now()` mockeable), red real, ni estado compartido entre tests. Fixtures tenant-scoped.
- **Sin interdependencia** — cada test corre aislado (un test no prepara estado para otro).
- **Negativos + bordes** — no solo happy path: cross-tenant, input inválido, empty, límites, concurrencia donde aplique.

## Toolchain de calidad = base obligatoria de autoverificación

El builder corre (vía gate-runner) y deja verde ANTES de cerrar — esto es la "base sólida" heredada de nicolify, ahora innegociable:

| Gate | Qué protege | Nota Chris |
|---|---|---|
| **ruff** (70+) + `ruff format` | lint + estilo BE | — |
| **mypy --strict** | tipos BE | — |
| **tsc --noEmit** strict + **eslint** (60+) | tipos + lint FE | — |
| **pytest** + **vitest** + cobertura (BE ≥43% / FE ≥20%) | comportamiento + no bajar cobertura | — |
| **jscpd** | **detección de duplicación** | ★ clave para "cero duplicación" — bloquea copy-paste |
| **arch-fitness** (ratchet shrink-only) | DDD/FSD boundaries, tenant isolation, no cross-brand mirror | ★ estructura senior |
| **interrogate** | docstring coverage BE | — |
| **knip** + **madge** | dead code + ciclos de deps FE | — |
| **pip-audit** / **npm audit** | vulnerabilidades deps | — |

jscpd + arch-fitness son **first-class**: un fix que pasa tests pero duplica código (jscpd) o rompe boundaries (arch-fitness) NO está verde.

## Anti-patterns prohibidos

- ❌ Implementar sin diseñar la batería de tests (improvisar al final)
- ❌ Solo happy path (sin cross-tenant / negativos / bordes)
- ❌ Testear implementación interna (test frágil que rompe en cada refactor)
- ❌ Saltar el tipo de test que la naturaleza exige porque "el validators no lo pidió"
- ❌ Cerrar con jscpd o arch-fitness en rojo (duplicación / boundary roto = NO verde)
- ❌ Bug fix sin regression test que reproduzca el bug primero (RED)
- ❌ Tests con orden/estado compartido (no deterministas)

## Enforcement layers

| Layer | Mecanismo | Status |
|---|---|---|
| 1 | `/architect` `04-validators § test_construction_plan` deriva de esta matriz | ✅ schema existe |
| 2 | `builder-*` fase `technical_design` diseña la batería según matriz (antes de codear) | ⏳ builder update (Fase 3) |
| 3 | gate-runner corre el toolchain completo (jscpd + arch-fitness incluidos) | ✅ existe |
| 4 | `/auditor` verifica cobertura por naturaleza + jscpd/arch-fitness verde | ✅ parcial |

## Referencias

- `.claude/rules/tdd-mandatory.md` — orden RED→GREEN→REFACTOR
- `.claude/rules/architectural-fitness.md` — arch gates
- `.claude/rules/backend-quality.md` · `.claude/rules/frontend-quality.md` — gates por surface
- `.claude/rules/hotfix-repro-mandatory.md` — repro test primero
- `.claude/rules/frontend-visual-fidelity.md` — visual como parte del test FE
- `docs/specs/templates/04-validators-template.yaml` — test_construction_plan
