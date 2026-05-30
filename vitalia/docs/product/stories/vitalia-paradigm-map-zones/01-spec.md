<!-- voseo-allowed: spec interno de migración, no user-facing -->
---
story_id: vitalia-paradigm-map-zones
brand: vitalia
type: service-story
subtype: infra-migration
state: refining
po_version: 1
architecture_pattern: ADR-010-orquestacion-agentica + ADR-vitalia-005 (extend → 5ª dim zona)
cap_target: platform.product-map-zonas
cap_change_type: new
ratified_by_chris: false
---

# 01-spec — Migración del mapa a 3 zonas (paradigma)

## Context

Materializa `PARADIGM.md` + `ADR-010` (cementados 2026-05-30) en el mapa del producto vitalia: migra de los pseudo-agentes `config`/`infra` a **3 zonas** (Agentes · Plataforma · Infraestructura), reorganiza el backlog Fase 2 y prepara el cockpit para render por zona. Plan + 5 decisiones ratificadas: `00-research.md` + `checkpoint.md::ratified_decisions`. **No** construye el motor agéntico real — solo la **taxonomía/mapa**.

**Prior art:** `ADR-vitalia-005` define las 4 dims actuales (esta story agrega la 5ª: zona, derivada). `SYSTEM-MAP.yaml::zones` ya tiene el draft. **Decisión:** extend ADR-vitalia-005 + new cap infra `platform.product-map-zonas`. Cero engine touch.

## Scope (frentes)

| Frente | Qué | Owner-scope |
|---|---|---|
| **F0** | Re-mapear/renombrar ~20 stories Fase 2 (`idea`) a su caja/zona nueva | vitalia product |
| **F1** | Re-tag ~71 caps `agent_owner` config/infra → caja nueva (mapping `absorbs`) · zona+`user_visible` derivados | vitalia product |
| **F2** | `SYSTEM-MAP.yaml`: promover `target_boxes` a boxes de 1er nivel · Valeria→supervisora · Mateo→Operar · deprecar `config`/`infra` · bump ADR | vitalia product |
| **F3** | Cockpit `MapView.tsx`: render por zona + 2 lentes + Valeria sidebar supervisor | ⚠️ tool cross-brand (`tools/luana-cockpit/`) |
| **F4** | Índice de acciones (Plano 2) generado del service layer | candidato a story propia (puede quedar fuera) |

> **Scope boundary:** F3 vive en `tools/luana-cockpit/` (tool operativa cross-brand, NO producto vitalia). Se ejecuta en la misma tanda (fase solo-bootstrap) pero se trackea como tool-scope. La cap de producto vitalia es **F0+F1+F2**.

## Taxonomía objetivo (resumen — detalle en 00-research § 3)

- **Agentes** (core, `user_visible:true`): 🏥 lisa · 🗓 **mateo (Operar/Mi Día)** · 💼 adrian · 📣 lucas · 🌟 camila. **Valeria = supervisora** (chat sidebar, NO caja de valor).
- **Plataforma** (supporting, `user_visible:true`): 🔐 acceso (auth+iam) · 🚀 onboarding · ⚙️ configuracion.
- **Infraestructura** (enabling, `user_visible:false`): 🛡️ seguridad-cumplimiento · 📊 observabilidad · 🔧 plataforma-tecnica · 🤖 motor-agentico.

## Acceptance criteria

1. Cero caps con `agent_owner ∈ {config, infra}` tras F1; cada cap tiene un `map_box` del registro y su zona deriva correctamente.
2. `SYSTEM-MAP.yaml` valida (`validate_system_map.py`) con boxes de 1er nivel por zona; `config`/`infra` marcados `deprecated`.
3. `reconcile_capabilities.py --brand vitalia` verde (cero huérfanos, ledger coherente).
4. Valeria NO aparece como caja en zona Agentes; agenda/bookings pertenecen a `mateo`.
5. Las stories `config-*` quedan renombradas a su caja; ningún story `idea` queda con caja inválida.
6. El cockpit muestra las 3 zonas; una cap sin zona cae en "huérfanas" **visible** (no silent).
7. Cero cambios a `core/luana-core-*` y cero caps de otras brands tocadas.

## Scenarios (Gherkin AI-resistant)

### SC-1 · happy · F1 re-tag de caps + F2 SYSTEM-MAP
```gherkin
Given los ~71 caps de vitalia con agent_owner ∈ {config, infra}
  And el mapping SYSTEM-MAP.yaml::zones.target_boxes[*].absorbs (ej. config.auth+config.iam → acceso)
When se corre el script de migración de caps + la promoción de SYSTEM-MAP
Then cada cap migrado tiene map_box ∈ {lisa,mateo,adrian,lucas,camila, acceso,onboarding,configuracion, seguridad-cumplimiento,observabilidad,plataforma-tecnica,motor-agentico}
  And su zona se deriva del registro (Agentes/Plataforma → user_visible:true · Infraestructura → false)
  And cero caps conservan agent_owner config/infra
  And SYSTEM-MAP tiene boxes de 1er nivel por zona con config/infra status:deprecated
  And validate_system_map.py + reconcile_capabilities.py --brand vitalia salen 0
```
**graders:**
- `{ type: state_check, target: shell, cmd: "grep -rlE 'agent_owner:\\s*(config|infra)\\b' vitalia/docs/product/capabilities/ | wc -l", expect: "0" }`
- `{ type: state_check, target: shell, cmd: ".venv/bin/python scripts/reconcile_capabilities.py --brand vitalia; echo $?", expect: "0" }`
- `{ type: state_check, target: shell, cmd: ".venv/bin/python scripts/validate_system_map.py; echo $?", expect: "0" }`

### SC-2 · happy · F2 Valeria→supervisora / Mateo→Operar
```gherkin
Given valeria.agenda, valeria.bookings, valeria.shell en SYSTEM-MAP + caps asociadas
When se aplica la reasignación ratificada (d1)
Then agenda y bookings pertenecen al box "mateo" (Operar/Mi Día)
  And "valeria" NO figura en zones.agentes.boxes (es la supervisora transversal)
  And el box motor-agentico documenta el supervisor graph (Valeria) como runtime
  And las caps re-tag de valeria.* → mateo.* o (shell) → plataforma-tecnica según corresponda
```
**graders:**
- `{ type: state_check, target: shell, cmd: "python -c \"import yaml;d=yaml.safe_load(open('vitalia/docs/architecture/SYSTEM-MAP.yaml'));print('valeria' in d['zones'][0]['boxes'])\"", expect: "False" }`
- `{ type: state_check, target: shell, cmd: "grep -rlE 'agent_owner:\\s*valeria' vitalia/docs/product/capabilities/booking vitalia/docs/product/capabilities/scheduling | wc -l", expect: "0" }`

### SC-3 · negative · cap/story sin caja válida → STOP, no silent
```gherkin
Given un cap cuyo functional_area no aparece en ningún target_boxes[*].absorbs
When se corre la migración
Then la migración SE DETIENE y reporta el cap sin mapeo (lista explícita)
  And NO asigna una caja por defecto ni lo deja con config/infra silenciosamente
  And NO continúa hasta que el mapeo se resuelva (manual o agregando absorbs)
```
**graders:**
- `{ type: contract_test, path: "scripts/tests/test_map_zones_migration.py::test_unmapped_cap_halts" }`

### SC-4 · edge · idempotencia + user_visible derivado
```gherkin
Given la migración ya aplicada una vez (caps con map_box + zona)
When se vuelve a correr el script de migración
Then es no-op (cero diffs)
  And si un cap tenía user_visible manual contradiciendo su zona, queda alineado a la zona derivada (Infra→false)
  And re-correr reconcile_capabilities.py sigue verde
```
**graders:**
- `{ type: state_check, target: shell, cmd: "git diff --quiet vitalia/docs/product/capabilities/ && echo clean", expect: "clean" }`
- `{ type: contract_test, path: "scripts/tests/test_map_zones_migration.py::test_rerun_is_noop" }`

### SC-5 · adversarial · box inventado + cross-brand + render no-rompe
```gherkin
Given un cap con map_box: "inventado-x" fuera del registro SYSTEM-MAP
  And caps de comunify/otras brands presentes
When corre el validador + el cockpit renderiza
Then el validador FALLA para "inventado-x" (no se cuela una caja fantasma)
  And la migración NO toca ningún cap de comunify ni de otras brands (scope vitalia)
  And el cockpit MapView NO rompe: un cap sin zona cae en sección "huérfanas" VISIBLE
```
**graders:**
- `{ type: contract_test, path: "scripts/tests/test_map_zones_migration.py::test_invalid_box_rejected" }`
- `{ type: state_check, target: shell, cmd: "git diff --name-only | grep -E '^(comunify|nicolify|lupulo)/' | wc -l", expect: "0" }`
- `{ type: integration, path: "tools/luana-cockpit/lib/__tests__/map-zones.test.ts" }`

### SC-6 · happy · F0 backlog Fase 2 re-mapeado
```gherkin
Given las ~20 stories Fase 2 en state=idea nombradas config-* y por agente
When se aplica el re-mapeo ratificado (00-research § 4, d4 renombrar)
Then config-onboarding-clinica → caja onboarding (zona Plataforma)
  And config-{cuenta,conexiones,avanzado} → caja configuracion
  And valeria-pacientes split: "pacientes del día"→mateo · "historial médico"→configuracion (d2)
  And lisa-compliance: vista cliente→configuracion · enforcement→seguridad (d3)
  And cada story Fase 2 tiene map_zone + map_box válidos en su checkpoint
  And ninguna story idea queda con caja inválida
```
**graders:**
- `{ type: state_check, target: shell, cmd: "grep -L 'map_box:' vitalia/docs/product/stories/vitalia-fase2-*/checkpoint.md | wc -l", expect: "0" }`

## Out of scope (no-objetivos)

- Construir el supervisor LangGraph real / tools / engine (otra epopeya).
- F4 índice de acciones (Plano 2) — puede ser story propia.
- Migrar caps/SYSTEM-MAP de otras brands (comunify) — vitalia-only.
- Tocar `core/luana-core-*` (sería `/pm-luana` lift).

## Open questions (para Chris)

- **Q1 · ADR:** ¿bump `ADR-vitalia-005` a v2 (agrega 5ª dim zona) o nuevo `ADR-vitalia-006-product-map-zones`? (recomiendo bump v2 — es la misma decisión de capability model evolucionando).
- **Q2 · F4:** ¿el índice de acciones queda **fuera** de esta story (story propia) o lo incluimos como diseño-only? (recomiendo fuera — esta story es taxonomía/mapa, F4 es Plano 2).
- **Q3 · F3 alcance:** ¿el render del cockpit incluye ya los **2 lentes** (trabajadores/proceso) o MVP solo "por zona" y los lentes después? (recomiendo MVP por zona + lente trabajadores; lente proceso = iteración 2).
