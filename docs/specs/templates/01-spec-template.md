# 01-spec.md — Template (PO)

> Owner: `/po`. **Spec ejecutable Gherkin AI-resistant.** Esta es la fuente de verdad de QUÉ debe construirse.
> Los architect, dev y auditor consumen ESTE archivo + el story YAML.
> Los scenarios de aquí se reflejan 1:1 en el story YAML (`docs/product/stories/{m}/{story-id}.yaml`).

---
story_id: STORY_ID_KEBAB
type: ui-story | agentic-story | service-story
module: MODULE_NAME
capability: CAPABILITY_ID
po_version: 1                                     # bump cuando cambies post-handoff
last_modified: 2026-05-04T14:30Z
ratified_by_chris: false                          # /po pide ratificación antes pasar a UX/architect
links:
  story_yaml: "../../../../../product/stories/{module}/{story-id}.yaml"
  story_md: "00-story.md"
---

## Resumen ejecutivo

[1 párrafo: qué se construye, para quién, outcome esperado.]

## Acceptance Criteria (Gherkin AI-resistant)

> **v4.1 cement 2026-05-19:** Mínimo 4 scenarios base + sub-categorías mandatory aplicables.
> Cada scenario es testeable + tiene grader explícito + `playwright_required` flag.
> /po-ux REFUSE ratificar refined si falta cobertura de sub-categorías aplicables.

### Scenario 1 — `happy-path` (`type: happy`)

**Given:**
- [precondición concreta y verificable]

**When:**
- [acción exacta del actor]

**Then:**
- [efecto 1 medible]
- [efecto 2 medible]
- [efecto 3 medible]

**playwright_required:** true | false
**Graders:**
- [Tipo grader] — [target/path]

---

### Scenario 2 — `[id-negative]` (`type: negative`)

**Given:** ...
**When:** [input/estado inválido]
**Then:**
- [error visible/respuesta clara]
- [estado NO se modifica]
- [audit log entry si aplica]

**playwright_required:** true | false
**Graders:** ...

---

### Scenario 3 — `[id-edge]` (`type: edge`)

**Given:** [estado de borde: concurrencia, límite, race condition]
**When:** ...
**Then:** ...

**playwright_required:** true | false
**Graders:** ...

---

### Scenario 4 — `[id-adversarial]` (`type: adversarial`)

> AI-resistant: usuario hostil, tenant cross-leak, prompt injection, datos sensibles.

**Given:** ...
**When:** [acción adversarial]
**Then:**
- [security/safety check explícito]
- [no leak]
- [audit/alerting]

**playwright_required:** true | false
**Graders:** ...

---

## ★ Sub-categorías mandatory v4.1 (cement 2026-05-19)

> Cada sub-categoría aplicable a la story DEBE tener ≥1 scenario adicional o `not_applicable_reason` ratificado por Chris.
> /po-ux gate refuse refined sin cobertura.

### Scenario 5 — `race-condition` (`type: edge`, sub: race_condition)

> Aplica cuando: story incluye create/update con unique constraint (slug, key único).

**Given:** [2 actores intentan crear/modificar mismo recurso simultáneamente]
**When:** [requests A + B llegan en window <100ms]
**Then:**
- [solo uno gana — el otro recibe 409 Conflict o 422 con mensaje claro]
- [DB consistency: 1 row con el slug/key]
- [no estado intermedio leaked]

**playwright_required:** true (testear via Promise.all 2 requests)
**Graders:**
- { type: e2e, path: "{brand}/frontend/e2e/regression/{story-id}/{m}-edge.spec.ts", function: "test_concurrent_create" }
- { type: state_check, target: db, query: "SELECT count(*) FROM {table} WHERE slug='X'", expect: 1 }

`not_applicable_reason: <razón si NO aplica>`

---

### Scenario 6 — `concurrent-users` (`type: edge`, sub: concurrent_users)

> Aplica cuando: list/detail filterable consumido por 2+ tenants/users mismo momento.

**Given:** [tenant A y tenant B logged simultáneamente]
**When:** [tenant A lista resources + tenant B lista resources]
**Then:**
- [cada uno ve SOLO sus resources (tenant isolation)]
- [no cross-leak en queries]
- [performance: p95 < N ms ambos]

**playwright_required:** true (2 contextos Playwright paralelos)
**Graders:** ...

`not_applicable_reason: <razón si NO aplica>`

---

### Scenario 7 — `network-failure` (`type: edge`, sub: network_failure)

> Aplica cuando: surface FE hace fetch API.

**Given:** [usuario en pantalla X]
**When:** [API request falla con 500 / 503 / timeout / connectivity drop]
**Then:**
- [error UI visible con mensaje claro Spanish neutro ("No pudimos cargar...")]
- [retry button presente]
- [no white screen, no infinite loading]
- [data en memoria NO se pierde (form drafts)]

**playwright_required:** true (mock `page.route` con 500)
**Graders:**
- { type: e2e, function: "test_network_failure_retry" }
- { type: visual_state, screen: "error", element: "[role=alert]", expect: "visible" }

`not_applicable_reason: <razón si NO aplica>`

---

### Scenario 8 — `empty-state` (`type: edge`, sub: empty_state)

> Aplica cuando: list / dashboard / search.

**Given:** [tenant nuevo sin data, o filtro retorna 0 items]
**When:** [usuario carga pantalla]
**Then:**
- [empty state illustration + heading + CTA (no white screen)]
- [microcopy Spanish neutro ("Aún no tienes..." / "No encontramos resultados")]
- [CTA dispara create flow o clear filters]

**playwright_required:** true
**Graders:** ...

`not_applicable_reason: <razón si NO aplica>`

---

### Scenario 9 — `large-dataset` (`type: edge`, sub: large_dataset)

> Aplica cuando: list con pagination.

**Given:** [tenant con ≥1000 items en {table}]
**When:** [usuario navega list]
**Then:**
- [pagination renderiza correctamente (no carga 1000 en DOM)]
- [scroll smooth, p95 render < 200ms per page]
- [filtros funcionan vs 1000 items]
- [no memory leak después N páginas]

**playwright_required:** true (seed DB con 1000 + navigate)
**Graders:** ...

`not_applicable_reason: <razón si NO aplica>`

---

### Scenario 10 — `accessibility` (`type: edge`, sub: accessibility)

> Aplica cuando: TODO surface FE user-facing.

**Given:** [pantalla cualquier estado]
**When:** [axe-core scan + keyboard nav + screen reader]
**Then:**
- [0 violaciones critical/serious WCAG AA]
- [Tab order lógico]
- [ARIA labels en inputs/buttons sin texto visible]
- [Contrast ratio ≥ 4.5:1 (text), ≥ 3:1 (UI)]
- [Focus visible en TODOS interactivos]

**playwright_required:** true (axe-core via @axe-core/playwright)
**Graders:**
- { type: axe, ruleset: "wcag2aa", paths: ["all-screens"] }

`not_applicable_reason: <razón si NO aplica — service-only stories>`

---

### Scenario 11 — `i18n` (`type: edge`, sub: i18n)

> Aplica cuando: copy user-facing o currency display.

**Given:** [3 tenants distintos locale (AR/MX/CL/PE/CO)]
**When:** [render screens con currency, dates, microcopy]
**Then:**
- [currency tenant_locale respetada (no hardcoded 'USD')]
- [dates formato es-LATAM (DD/MM/YYYY)]
- [copy Spanish neutro (no voseo regional excepto sales_agent voice tenant)]
- [tildes, ñ, ¿ ¡ renderizan correcto]

**playwright_required:** true (3 fixtures tenants distintos)
**Graders:** ...

`not_applicable_reason: <razón si NO aplica>`

---

## Non-functional requirements

| Categoría | Requisito | Verificador |
|---|---|---|
| Latencia | p95 < N ms | métrica + load test |
| Cost | <= $X/session (agentic) | copilot_llm_call |
| Mobile | viewport >= 375px (ui) | Playwright resize |
| Accesibilidad | WCAG AA (ui) | axe-core |
| i18n | Spanish neutro (no voseo, salvo sales_agent voz tenant) | Lint regex |
| PII | Response no expone PII sin mask | response_model Pydantic |
| Tenant isolation | Tenant cross → 403/404 | adversarial scenario |

## Constraints técnicos heredados

- [De `.claude/rules/*` que aplican: backend-ddd, tenant-isolation, etc.]
- [Tessl skills relevantes a citar: tessl__fastapi, tessl__zod, ...]

## Cross-module impact

- **Lee de:** [módulos cuyas tablas/eventos consume]
- **Es leído por:** [módulos que dependen]
- **Eventos emitidos:** [event_name v1]
- **Eventos consumidos:** [event_name v1]

## Open questions (para resolver con Chris ANTES de UX/architect)

- [ ] [Pregunta 1]
- [ ] [Pregunta 2]

## Próximo paso

- Si `type=ui-story` → `/ux-ui` lee `01-spec.md` → produce `02-design-ui.md`
- Si `type=agentic-story` → `/ux-agentico` lee `01-spec.md` → produce `02-design-agentic.md`
- Si `type=service-story` → skip UX → `/architect` directo

## Changelog

- v1 2026-05-04 — /po draft inicial
- v2 2026-05-04 — Chris ratificó scenarios 2 y 3, ajusté wording scenario 4
