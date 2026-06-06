# HANDOFF — Construir el enforcement determinístico de cap-format (HB-51, solución máxima)

> **Para una conversación NUEVA.** Tarea de **harness** (no de producto): construir el sistema de 8 capas que hace **imposible** entregar una capability en formato/estado incorrecto. Resuelve "de una vez por todas" el proceso flaky (Chris, 2026-06-05).
>
> **SSoT del diseño (leer PRIMERO, es la autoridad):** `docs/process/cap-deterministic-enforcement.md`. Este handoff NO lo repite — agrega el **mapa de impacto real**, el **mandato verify-first**, los **matices de secuencia** y el **protocolo de ejecución**.
>
> **Origen del incidente (la regresión a reproducir):** la cap canónica del inbox (`inbox.adrian-inbox`) NO existía aunque 6+ archivos BE tenían `# cap: inbox.adrian-inbox` (headers huérfanos); se editó la cap slice-1 equivocada; la caja "Inbox de Conversaciones" salía vacía en el cockpit. **Nada falló — el error fue silencioso.** Detalle: `docs/process/harness-backlog.md` § HB-51 + HB-43.

## 0 · MANDATO (leer antes de tocar nada)

1. **Verify-first, anti-hallucination.** Esto MISMO combate el problema de inventar. NO asumas ninguna interfaz/path: abrí cada script + cada consumidor y verificá su firma real antes de cambiarlo. Cada claim del diseño se VERIFICA contra el código, no se cree.
2. **NO mid-feature.** No hay feature de producto en curso (la story del inbox está `done`). Es una tanda de harness limpia. Igual: **NO toques código de producto** (`{brand}/backend/src`, `{brand}/frontend/src`) salvo el backfill de headers, que el alias hace innecesario (ver Capa 1).
3. **Gate con dientes o no cuenta.** Cada gate (G1-G6) DEBE tener un negative test que lo prueba en ROJO. Sin eso, el gate es decorativo. + el test que reproduce el incidente origen (borrar la cap → G1+G2 RED).
4. **No prendas un gate HARD con fallas conocidas.** Patrón ya usado en este repo (`validate_code_cap_bidirectional.py` líneas ~475-478): primero backfill la deriva existente, DESPUÉS flipeás el gate a HARD. Si prendés G1-G6 en HARD con deriva pre-existente, bloqueás todos los commits de todos.

## 1 · Impacto REAL — todo lo que resuelve caps (revisar + actualizar cada uno)

El cambio central es **un resolver único two-way** (`cap_id ↔ functional_area`). Hoy hay **lógica de resolución duplicada y divergente** — esa es la causa raíz. Hay que hacer que TODOS consuman el mismo resolver y verificar que ninguno rompe. Inventario verificado 2026-06-05:

### Scripts Python (SSoT de resolución + consumidores)
- `scripts/resolve_cap.py` — **el resolver. Hoy es one-way (cap_target→files) por TIERS.** Volverlo **two-way** + exponer función importable `resolve(brand, target) -> [caps]` + `cap_id_of(cap) -> "{module}.{slug}"` + `functional_area_of`. ⚠️ Ojo: `capability_id` en el YAML es `{brand}.{module}.{slug}` (ej. `vitalia.scheduling.valeria-agenda`) PERO la llave que usa el validador/índice es `{module}.{slug}` — **el resolver debe normalizar ambas formas + la functional_area** y devolver SIEMPRE el mismo cap_id canónico.
- `scripts/validate_code_cap_bidirectional.py` — cross_check_3 (e2e_test, HARD) + cross_check_4 (roles, soft). **Acá se agregan G1-G6.** `main()` ya tiene `--strict` (exit 1 si HARD drift). Reusar ese mecanismo.
- `scripts/generate_code_to_cap_index.py` — genera `_code-index.json` (`code_to_cap` + `cap_to_files`). **Hoy mapea el header literal a cap_id sin resolver el alias.** Debe consumir `resolve_cap.py` para que `// cap: adrian.inbox` y `# cap: inbox.adrian-inbox` apunten al MISMO cap_id.
- `scripts/generate_capability_index.py` — genera `areas/{agent}.md` (filtra `superseded_by`, agrupa por `functional_area`). Verificar que sigue coherente con el resolver.
- `scripts/reconcile_capabilities.py` — R32 status freshness (corre en pre-commit sección 5). No romper.
- `scripts/validate_system_map.py` — valida SYSTEM-MAP (fuente de G2/G3/G6). Cruzar áreas↔caps.
- `scripts/validate_machinery_consistency.py` — CHECK N que asegura que las superficies referencian el resolver (patrón HB-43 CHECK 10). **Agregar un CHECK que asegure que los 6 gates existen + tienen negative test.**
- `scripts/build_live_reconciliation_matrix.py`, `scripts/generate_actions_index.py` — consumidores; verificar.
- Tests existentes a extender: `scripts/tests/test_resolve_cap.py`, `test_validate_code_cap_bidirectional.py`, `test_generate_code_to_cap_index.py`, `test_map_zones_migration.py`.

### Cockpit (tools/luana-cockpit) — el mapa + las vistas de caps
- `lib/map-zones.ts` (línea ~39: `${box.id}.${area.id}` matchea `functional_area`) — consumidor del resolver del lado TS. Si se centraliza en Python, el cockpit necesita el mismo contrato (puede leer un `_resolved-index.json` generado, para no duplicar lógica de resolución en TS).
- `components/map/MapView.tsx` (línea ~126 filtra `deprecated/sunset`; ~135 skip `superseded`) — la lógica de visibilidad. G6 (map-coverage) debe reflejar exactamente esto.
- `app/api/capabilities/route.ts` (glob `*/*.yaml` live), `code-index/route.ts`, `[module]/[cap]/route.ts`, `extend-cap/route.ts` — verificar que siguen resolviendo igual.
- `lib/{cap-ledger,drift-helpers,tooltips,types,workspace}.ts` + sus `__tests__` — consumidores; correr `npx vitest` del cockpit tras los cambios.
- **Capa 8 (`cap-doctor`):** lo natural es un endpoint `app/api/capabilities/doctor/route.ts` + un panel, además del `make cap-doctor` CLI. Ambos consumen el mismo reporte de los 6 gates.

### Harness (skills/agents que DESCRIBEN el formato → Capa 6, repoint a generator)
- `docs/process/capability-protocol.md` — **el schema SSoT.** Acá vive la descripción del YAML. Capa 6: agregar "NUNCA hand-author; corré `make new-cap`" + el schema se vuelve la fuente del `validate_caps_schema.py` (Capa 3).
- `.claude/skills/pm-luana/SKILL.md`, `.claude/skills/pm-vitalia/SKILL.md` (+ los otros pm-{brand}) § "Capability promotion / Fase F.3" — repoint a `make new-cap`.
- `.claude/skills/architect/SKILL.md` + `.claude/agents/{architect-orchestrator,builder-backend,builder-frontend,context-builder}.md` — consumen el resolver (HB-43); verificar que apuntan al two-way.
- `vitalia/CLAUDE.md` § "Bidirectional code↔cap mapping" + cada `{brand}/CLAUDE.md` — actualizar el comando si cambia.

## 2 · Orden de construcción (del diseño § "Orden", incremental verify-first)

Empezar por **el slice que mata ESTE bug**, después expandir:

1. **`resolve_cap.py` two-way** + función importable + `test_resolve_cap.py` (incl. `resolve("adrian.inbox").cap_id == "inbox.adrian-inbox"` y viceversa). ← base.
2. **Schema pydantic** (`scripts/validate_caps_schema.py`, derivado de `capability-protocol.md`) + wire pre-commit + tests.
3. **G1 (header-resuelve) + G2 (área-viva-tiene-cap)** en `validate_code_cap_bidirectional.py` + negative tests + **test de reproducción del origen** (borrar `capabilities/inbox/adrian-inbox.yaml` → G1+G2 RED). ← cierra el agujero exacto.
4. **`new_cap.py` generator** + `make new-cap` + template canónico schema-valid + test (output pasa schema + los gates sin edición).
5. **G3-G6** + negative tests c/u.
6. **Capa 6** (repoint skills/agents/protocol al generator) + **Capa 8** (`cap-doctor` CLI + cockpit panel).
7. **Backfill + flip a HARD:** correr `cap-doctor` sobre vitalia + nicolify + comunify + lupulo, arreglar la deriva pre-existente (las ~168 headers forma-`functional_area` quedan VÁLIDAS por el alias — NO se tocan), DESPUÉS flipear G1-G6 a HARD en pre-commit/pre-push. Wire en `scripts/git-hooks/pre-commit` secciones 5c/5d (hoy ADVISORY → volver blocking las HARD).

## 3 · Acceptance (done = todo esto verde)

- [ ] `resolve_cap.py` two-way + test (ambas formas → mismo cap_id).
- [ ] `make new-cap MODULE=x SLUG=y` produce un YAML que pasa schema + los 6 gates sin tocar nada a mano + REFUSE si el cap_id existe.
- [ ] G1-G6 implementados, cada uno con **negative test en rojo** + el **test de reproducción del incidente** (inbox) en rojo al borrar la cap.
- [ ] Resolver único: el índice (`generate_code_to_cap_index.py`) y el mapa (cockpit) resuelven `adrian.inbox` y `inbox.adrian-inbox` al MISMO cap. Cero lógica de resolución duplicada.
- [ ] `make cap-doctor` (+ panel cockpit) reporta 0 deriva en las 4 marcas tras backfill.
- [ ] G1-G6 flipeados a HARD en pre-commit/pre-push (después del backfill). Probado: commit con un header huérfano → BLOQUEADO.
- [ ] Capa 6: `capability-protocol.md` + pm skills + CLAUDE.md repointados a `make new-cap` (skills dejan de describir el formato).
- [ ] `validate_machinery_consistency.py` CHECK nuevo: los 6 gates + sus negative tests existen (anti-rot, con dientes — quitar un gate → CHECK RED).
- [ ] Suites verdes: `python3 -m pytest scripts/tests/ -q` + cockpit `npx vitest` + el bidirectional validator `--strict` clean en las 4 marcas.

## 4 · Protocolo de ejecución (hub compartido)

- Worktree hub `~/Proyectos/luana-platform` (main) o `~/Proyectos/luana-vitalia` (wip/vitalia) — esto es **cross-cutting harness** (`scripts/`, `tools/`, `.claude/`, `docs/process/`), NO de una marca. Idealmente correr desde main o un worktree `luana-protocol-*` con `SCOPE_GATE_SKIP=1` (es el caso permitido para cross-cutting).
- **Commit por pathspec SIEMPRE** (hub con sesiones concurrentes). NUNCA `git add .`/`-A`/`-u`. Delegá commit+push a Haiku si >2 archivos.
- **Apply-pipeline** (`docs/process/harness-lifecycle.md`): Sonnet edita / Opus sintetiza+ratifica / Haiku commitea. Verify-first: la auditoría sobreestima — verificá cada claim contra el código.
- Si tocás `tools/luana-cockpit`, corré su suite (`cd tools/luana-cockpit && npx vitest run`) antes de commitear.

## 5 · Por dónde NO irse al pasto (scope guard)

- El alias (Capa 1) hace innecesario tocar las ~168 headers FE. **No las normalices** (opción (a) fue descartada por Chris — churn + riesgo). El resolver las cubre.
- No reabras la cap `inbox.adrian-inbox` ni la story (está `done`/archivada). Solo se usa como **fixture de regresión** (el test que la borra y espera G1+G2 RED — usar una copia temporal, no la real).
- No conviertas esto en "rehacer todo el sistema de caps". Es: resolver único + generator + schema + 6 gates + doctor + repoint. Nada más.

## Referencias
- `docs/process/cap-deterministic-enforcement.md` — **diseño SSoT (8 capas, autoridad)**
- `docs/process/harness-backlog.md` § HB-51 (🔴) + HB-43 (resolver origen) + HB-50 (advisory≠enforcement)
- `docs/process/capability-protocol.md` — schema cap (fuente de Capa 3 + Capa 6)
- `docs/process/harness-lifecycle.md` — apply-pipeline + verify-first
- Scripts: `resolve_cap.py` · `validate_code_cap_bidirectional.py` · `generate_code_to_cap_index.py` · `validate_machinery_consistency.py`
- Cockpit: `tools/luana-cockpit/lib/map-zones.ts` · `components/map/MapView.tsx` · `app/api/capabilities/`
