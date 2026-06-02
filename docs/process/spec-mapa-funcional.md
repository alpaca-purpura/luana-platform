# Spec · § Mapa funcional + § Matriz de cobertura (capa humana del refinamiento)

> **Cement-date:** 2026-05-31. **Owner del proceso:** `/pm-luana`. **Decisión:** Chris ratificó Opción A
> (panorama humano + Gherkin juntos en `01-spec.md`, ligados por matriz). **Aplica a:** `/po-ux`, `/po`,
> `/ux-agentico` + template `docs/specs/templates/01-spec-template.md`. **Origen:** sesión 2026-05-31 —
> Chris pidió ver, en lenguaje humano, QUÉ se va a construir (happy path + bifurcaciones + reglas + criterios)
> sin tener que reconstruirlo desde el Gherkin, y con todo verificable.

## El problema que resuelve

El `01-spec.md` era **Gherkin-first**: abría directo en `SC-1..SC-N`. El Gherkin es excelente para la máquina
(mapea 1:1 a E2E) y para forzar precisión, pero es **mala lectura para un humano** que quiere el panorama:
el happy path queda disuelto en `SC-1`, las bifurcaciones desparramadas como lista plana (hay que reconstruir
el árbol mentalmente para detectar un caso faltante), y los criterios de aceptación se confunden con los scenarios.

Faltaba la **capa de comprensión + validación de completitud** ENCIMA del Gherkin.

## La doctrina: no compiten, viven a distinta altitud

| Capa | Lector | Qué es | Para qué |
|---|---|---|---|
| **§ Mapa funcional** | Chris (humano) | Happy path narrado + árbol de bifurcaciones + RN + AC | Comprender + validar completitud ANTES de construir |
| **§ Gherkin scenarios** | máquina / dev-team | `SC-N` Given/When/Then AI-resistant | Generar los E2E (sigue siendo la fuente de tests) |
| **§ Matriz de cobertura** | ambos | tabla branch/RN/AC → SC → verificación REAL | El puente: garantiza que nada quede sin prueba |

**No se autorean dos veces.** La prosa NO genera tests (no compite con Gherkin). El Gherkin NO se lee para
entender el panorama (no compite con la prosa). La matriz los liga por IDs (`Bif-N`, `RN-N`, `AC-N`), no por
duplicación de oraciones. Una sola fuente, dos lecturas.

## Estructura canónica de `01-spec.md` (Opción A)

```
§ Resumen ejecutivo
§ Mapa funcional            ← NUEVO (capa humana — ratifica Chris)
   1. Happy path             → prosa numerada, camino dorado
   2. Bifurcaciones           → ÁRBOL: condición → resultado → [SC-N]
   3. Reglas de negocio       → RN-1..N (→ capability.business_rules)
   4. Criterios de aceptación → AC-1..N (checklist "listo cuando…")
§ Gherkin scenarios          ← cada SC con `Covers: [Bif-N, RN-N, AC-N]`
§ Matriz de cobertura        ← NUEVO: cada Bif/RN → ≥1 SC → verificación REAL
   + "Huecos detectados" + "SC huérfanos" (ambos = "ninguno" para pasar gate)
§ … (wireframes, estados, microcopy — sin cambios)
```

## Reglas duras (gate `/po-ux` y `/po`)

- **R1** — `§ Mapa funcional` presente con sus 4 sub-bloques (profundidad proporcional al tipo de story).
- **R2** — Cada `Bif-N` y cada `RN-N` mapea a ≥1 scenario en `§ Matriz de cobertura`. Hueco → STOP, NO `refined`.
- **R3** — Cada SC mapea a ≥1 ítem del mapa. SC huérfano → revisar scope creep.
- **R4** — La columna "Verificación" de la matriz es **REAL** (acción ejercida + efecto observado,
  NUNCA "GET 200"). Ver `.claude/rules/test-design-doctrine.md` § Verificación REAL.

## Proporcionalidad por tipo de story

| Tipo | Happy path | Bifurcaciones | RN | AC | Matriz |
|---|---|---|---|---|---|
| `ui-story` / `service-story` | obligatorio | obligatorio | obligatorio | obligatorio | obligatorio |
| `agentic-story` | turn-by-turn (en `02-design-agentic.md`) + branch tree en spec | obligatorio (ramas conversacionales) | obligatorio | obligatorio | obligatorio (→ evals) |
| `bugfix` (lite) | opcional | obligatorio (foco repro) | obligatorio | opcional | obligatorio (regresión) |

## Coherencia con la máquina existente (no inventa proceso nuevo)

1. **Cierra el loop idea→done.** La `§ Matriz de cobertura` es la **mitad delantera** del `gherkin-matrix.md`
   que el `/auditor` completa en Phase D (scenario → test path → status). El humano ve el mismo eje al
   principio, en lenguaje humano, antes de gastar en construir. La DoD live-verify (Critical Rule #37,
   `.claude/rules/definition-of-done-live-verify.md`) cierra el otro extremo: los scenarios declarados en
   la matriz DEBEN ser ejercidos en el stack real antes de `done` — no basta que el Gherkin esté verde en
   un entorno mockeado.
2. **Verificación REAL** (`test-design-doctrine.md`, cement 2026-05-29): la columna de verificación obliga a
   declarar la acción real + efecto, no un código HTTP.
3. **Eje Scenario** del modelo 4-ejes (`lifecycle.md`): el árbol + matriz son la vista humana de los scenarios
   que viven en la `capability`.
4. **Cockpit (filesystem-as-DB):** headers markdown + tablas se renderizan nativos → Chris ve el panorama en
   la conversación y en el cockpit, con el Gherkin un scroll abajo si lo quiere.

## Referencias

- `docs/specs/templates/01-spec-template.md` — template con las 2 secciones nuevas
- `.claude/skills/po-ux/SKILL.md` § Step 3 + Step 5 gate — owner UI std
- `.claude/skills/po/SKILL.md` § Step 3 — owner service/agentic spec
- `.claude/skills/ux-agentico/SKILL.md` § Step 2 — sincroniza turn-by-turn con el mapa
- `.claude/rules/test-design-doctrine.md` § Verificación REAL — la R4
- `.claude/skills/auditor/SKILL.md` Phase D — `gherkin-matrix.md` (mitad trasera del loop)
- `.claude/rules/definition-of-done-live-verify.md` — Critical Rule #37: los scenarios de la matriz deben ejercerse LIVE antes de `done`; la gherkin-matrix Phase D es la mitad trasera; el mapa funcional + matriz es la mitad delantera
- `.claude/rules/story-closure-gate.md` § Fase F — gate merge `reviewing → done` (exige `dod_evidence` + demo_signoff cuando `demo_required: true`)
- `docs/process/capability-protocol.md` — `business_rules` (RN) viven en la cap
- `docs/process/lifecycle.md` — modelo 4-ejes (eje Scenario)
