# Lifecycle — SSoT del ciclo de vida de producto (Luana platform)

**Cement-date:** 2026-05-28. **Owner:** Chris + `/pm-luana`. **Estado:** canónico.

Este doc es la **fuente única de verdad** del modelo de producto y su ciclo de vida. **Supersede** los fragmentos contradictorios de `pm-redesign-2026-05.md`, `release-protocol.md`, `capability-protocol.md` y los skills `/pm-*` donde difieran. Si otro doc contradice a este → este gana, y el otro se corrige.

Nació de la consolidación 2026-05-28 (análisis profundo del proceso SDD: el modelo tenía 9 ejes solapados, atomics fantasma en 1120 archivos, validators verdes-por-vacío, outcome/release coexistiendo). Ver `docs/process/learnings.md` § 2026-05-28.

---

## 1. El modelo: 4 ejes (+ código auto-mapeado)

Antes había 9 ejes solapados (outcome · phase · release · capability · atomic · scenario · tech_module · module · story). Quedan **4**, lineales, cada uno con un dueño claro:

```
Release  (¿cuándo shippeó?)        — contenedor temporal, agrupa stories
  └─ Story  (¿qué trabajo?)         — unidad de trabajo, 10 estados, transitoria
       └─ Capability  (¿qué SABE hacer el producto?) — unidad PERMANENTE, tiene salud
            └─ Scenario  (¿qué hace, concretamente?)  — unidad atómica de comportamiento (Gherkin)
                 ↳ Code files  — auto-mapeados vía header `# cap:` (NO se mantienen a mano)
                 ↳ Tests       — e2e_test por scenario (la prueba)
```

| Eje | Qué es | Vive en | Dueño |
|---|---|---|---|
| **Release** | Agrupación temporal "se shippeó junto" (F0..FN) | `{brand}/docs/product/releases/{id}.yaml` | `/pm-{brand}` |
| **Story** | Unidad de trabajo. Nace `idea`, muere `done`→archive | `{brand}/docs/product/stories/{id}/` | `/pm-{brand}` (estados) |
| **Capability** | Unidad **permanente** de producto. Lo que el producto puede hacer | `{brand}/docs/product/capabilities/{module}/{cap}.yaml` | `/pm-{brand}` (ledger) |
| **Scenario** | Unidad atómica de comportamiento. Gherkin Given/When/Then | autorado en `01-spec.md`, linkeado al cap | `/po-ux`/`/po` autora, `/pm` linkea |

**Agrupación humana:** la capability se agrupa por `agent_owner` (lisa/valeria/adrián/lucas/camila/config/infra) + `functional_area` (`<agent>.<area>`). Eso alimenta el **Mapa Implementado** del cockpit. Se conserva — es el lenguaje humano del producto.

---

## 2. Lo que se MATÓ (decisiones 2026-05-28, ratificadas Chris)

| Concepto muerto | Por qué | Reemplazo | Migración |
|---|---|---|---|
| **`atomic`** (+ header `# atomics:`) | Fantasma total: los 1120 archivos tenían `# atomics: TBD`, 71/72 caps con `atomics: []`. Nunca se instanció una vez. Redundante con `scenario` | **`scenario`** es la unidad atómica | Fase 1: borrar header de 1120 archivos + quitar del protocolo |
| **`outcome`** | Coexistía "reemplazado por release" + "épica canónica" según el doc. 6 outcomes vivos + releases con `maps_legacy_*` | **`release`** único contenedor temporal | Fase 1: borrar 6 archivos + quitar `maps_legacy_*` |
| **`phase`** | Legacy pre-release, se solapaba con outcome y release | **`release`** | Fase 1: gone con outcome |
| **`module`** (alias) | Alias deprecado de `tech_module` | **`tech_module`** | Fase 1: drop alias |

**Regla cardinal post-consolidación:** no se agregan ejes nuevos al modelo sin matar uno. Shrink-only.

---

## 3. Ciclo de vida — Story (10 estados macro)

Heredado de paradigm v4. WIP caps **≤1** por worktree para developing/developed/reviewing (gana la hard rule de `story-closure-gate.md`; cualquier doc que diga ≤2/≤3 está obsoleto).

| # | Estado | Significado | Owner | WIP cap |
|---|---|---|---|---|
| 1 | `idea` | Spark + research opcional | Chris + `/pm-{brand}` | ∞ |
| 2 | `refining` | Decompose + draft spec/UX | `/pm` + `/po-ux`/`/po`/`/ux-agentico` | ≤ 3 |
| 3 | `refined` | Spec + diseño ratificados | `/pm` cierra | ≤ 5 |
| 4 | `ready` | Paquete completo (03-arch + 04-validators + 05-guidelines + 06-tickets) | `/architect` | ≤ 5 |
| 5 | `developing` | Build autónomo | `/dev-team` | **≤ 1** |
| 6 | `developed` | Validators GREEN | `/dev-team` | **≤ 1** |
| 7 | `reviewing` | Auditor QA | `/auditor` | **≤ 1** |
| 8 | `done` | APPROVED + merge + cap promovida + archive | `/pm-{brand}` | rolling 90d |
| 9 | `parked` | De-prioritized | Chris | ∞ |
| 10 | `dropped` | Won't do (terminal) | Chris | ∞ |

Transiciones de Chris (cockpit): solo `idea↔refining`, `→parked`, `→dropped`. El resto las hace una skill. Ver `cockpit-permissions.md`.

---

## 4. Ciclo de vida — Capability (salud del producto)

La capability tiene un `status` declarado + un `computed_status` derivado por `scripts/compute_capability_status.py`. El **computed** es la verdad de salud:

```
stub → wip → partial → declared-live → verified-live
                 ↘ drift (deriva detectada) ↘ deprecated → sunset
```

| computed_status | Significado |
|---|---|
| `stub` | Sin scenarios. No describe nada todavía |
| `wip` | Scenarios declarados, sin verificación pasando |
| `partial` | Algunos scenarios verificados |
| `declared-live` | Marcada live, sin evidencia de tests |
| `verified-live` | Live + todos los e2e_test de sus scenarios pasan |
| `drift` | El código/tests/acceso contradicen lo declarado |
| `deprecated`/`sunset` | En retiro |

**Definición de DONE (cement 2026-05-28):** una capability **no puede ser `live`** sin **≥1 scenario + e2e_test pasando**. `live` con scenarios vacíos = inválido (enforce HARD en Fase 5). Esto mata el "verde por vacío".

---

## 5. Ciclo de vida — Release

State machine auto-recomputada desde los estados de las stories miembro:

```
backlog → planning → in_progress → ready_to_merge → shipped
```

`release.yaml.stories[]` es denormalizado (vista); el SSoT por story sigue siendo su `checkpoint.md::release:`. El merge de una story ya squashea por-story; el release agrupa para release-notes + deploy. Ver `release-protocol.md` (corregido: outcome+phase ya no existen).

---

## 6. Trazabilidad — la cadena que se VE en el cockpit

Para cualquier capability, una sola traza conectada:

```
Release (cuándo) → Story-origin (por qué) → Scenarios (qué hace, humano)
   → Code files (dónde · auto vía # cap:) → Tests (prueba) → Status/Health (¿vive?)
```

**Cross-checks que sobreviven** (`validate_code_cap_bidirectional.py`):
- ❌ **cross_check_1** (atomics↔headers) — MUERTO (atomics killed)
- ❌ **cross_check_2** (headers↔atomics) — MUERTO
- ✅ **cross_check_3** (scenario→e2e_test existe) — **HARD** pre-push
- ✅ **cross_check_4** (access roles ↔ `@require_phi_access`) — **HARD para vitalia** (es salud; el control de acceso a PHI no puede ser advisory)

---

## 7. División de labor: Cockpit (bosque) vs Claude Code (ejecución)

| | **Luana Cockpit** (ver el bosque + decidir) | **Claude Code** (ejecutar lo que está hecho) |
|---|---|---|
| Rol | Monitoreo en lenguaje humano, decisiones | Ejecución del pipeline SDD |
| Hace | Ver salud de producto, priorizar, planificar releases, mover `idea↔refining`, autorar intent (notas/refs/scenarios draft en chris-input), disparar "extender cap"/"nueva story" | `/pm-{brand}` → `/po-ux`/`/architect` → `/dev-team` → `/auditor` → merge |
| NO hace | Ejecutar git, avanzar estados de skill, editar código BE/FE | Decisiones de priorización de bosque (eso es de Chris en el cockpit) |
| El puente | `chris-input.md` + `checkpoint.md::state` + APIs `transition`/`extend-cap`/`from-done` que **crean trabajo** | Levanta el trabajo creado, refleja en vivo (SSE) |

**El loop diario:**
1. Chris abre el cockpit → ve salud, decide qué sigue, ajusta prioridad/release, mueve `idea→refining`, deja notas/scenarios draft en chris-input.
2. Chris abre Claude Code → `/pm-vitalia` levanta la story, encadena `/po-ux`/`/architect`/`/dev-team`/`/auditor`, ejecuta.
3. El cockpit refleja en vivo. Al merge, la cap se actualiza y la traza se completa.

---

## 8. Roadmap de consolidación (7 fases)

Plan de migración del estado actual al modelo de este doc. Estado en tiempo real abajo.

| Fase | Qué logra | Estado |
|---|---|---|
| **0 — Doctrina** | Este `lifecycle.md` + resolver incoherencias de skills. No destruye nada | ✅ DONE 2026-05-28 (commit c930a333) |
| **1 — Colapsar modelo** | Matar atomics/outcome/phase/module-alias. cross_check_3 HARD | ✅ DONE 2026-05-28 (1a bb988b2a + 1b 7ab119c6) |
| **2 — Backfill trazabilidad** | Generar scenarios de ~55 caps stub desde 01-spec.md archivado. Triage 97 huérfanos. Arreglar **8 caps sin frontmatter YAML** (reconcile los saltea → 64/72) | ⏳ próximo |
| **3 — Cockpit** | Vista Traza unificada + Salud de Producto + merge ejecutable + autoría scenarios. Sanear README + body atomics table de shell-vitalia + tooltips.ts | ⏳ |
| **4 — Skills** | Alinear pm-vitalia/pm-luana/architect/dev-team/auditor al modelo 4-ejes. Def. de done HARD. Quitar "outcome nuevo" del menú pm-vitalia | ⏳ |
| **5 — Enforcement** | Gate capabilities en wip/* (o advisory honesto). `live⟹evidencia` HARD. **Resolver 6 drifts cc4 PHI access → flipear cc4 a HARD vitalia.** Validators fallan ruidoso ante refs no resueltas | ⏳ |
| **6 — Manual diario** | Doc operativo 1-página (cockpit vs Claude Code) | ⏳ (este doc § 7 es el borrador) |

**Estado post-Fase 1 (2026-05-28):** atomics MUERTO (header en 1120 archivos + campo en 72 caps + scripts + cockpit). outcome+phase ELIMINADOS. Status honesto: 55 stub / 7 declared-live / 1 verified-live / 1 partial (era "verde por vacío"). 45 tests scripts + 66 tests cockpit GREEN.

---

## 9. Punch-list de incoherencias (detectadas 2026-05-28)

| # | Incoherencia | Resolución | Estado |
|---|---|---|---|
| 1 | WIP caps `≤2` en pm-vitalia vs `≤1` hard rule | Corregido a ≤1 | ✅ Fase 0 |
| 2 | nicolify "fuente prior-art principal ~80% prod" (es snapshot frozen) | Corregido: vitalia/comunify live, nicolify archivo | ✅ Fase 0 |
| 3 | Conteo cap stale "16 caps" (son 72) | Corregido | ✅ Fase 0 |
| 4 | outcome "reemplazado" vs "canónico" | Release único (decisión #2) | ✅ Fase 1 (6 outcomes borrados + maps_legacy_* quitados) |
| 5 | F2.yaml referencia stories ausentes (valeria-agenda, lisa-marca) | Reconciliar | ⏳ Fase 2 |
| 12 | 8 caps sin frontmatter YAML (reconcile saltea → 64/72 cargados) | Backfill frontmatter | ⏳ Fase 2 |
| 13 | cc4 (PHI access) tiene 6 drifts → no se pudo flipear a HARD aún | Resolver drifts → flip HARD | ⏳ Fase 5 |
| 6 | Hooks: docs dicen "Section 14", real es Section 16 | Actualizar refs en docs | ⏳ Fase 4 |
| 7 | `/functionality` tab citado pero es Cap Drawer | Actualizar MEMORY + reglas | ⏳ Fase 3 |
| 8 | README cockpit stale (14 rutas/4 vistas/6 tests) → real 19/6/53 | Sanear README | ⏳ Fase 3 |
| 9 | `generate_release_notes.py` + `validate_chris_input.py` no existen | Crear o quitar refs | ⏳ Fase 3/5 |
| 10 | ADR path doble en pm-luana (`ADR/` vs `luana-platform/`) | Unificado | ✅ Fase 0 |
| 11 | Validators saltean ~10 caps en silencio | Fallar ruidoso | ⏳ Fase 5 |

---

## 10. Referencias

- `docs/process/learnings.md` § 2026-05-28 — análisis origen + decisiones
- `docs/process/capability-protocol.md` — schema cap (a corregir: quitar atomics en Fase 1)
- `docs/process/release-protocol.md` — release (a corregir: outcome muerto)
- `docs/process/cockpit-permissions.md` — whitelist Chris vs Claude
- `tools/luana-cockpit/README.md` — la tool (a sanear en Fase 3)
- `.claude/rules/story-closure-gate.md` — WIP caps ≤1 (SSoT)
