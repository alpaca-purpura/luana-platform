# Luana Cockpit

Visualizador del Spec-Driven Development workflow para Luana platform (multibrand). Lee directo del filesystem (no requiere DB) y permite editar metadata vía forms que escriben los `.md` correspondientes.

## Status: mockup v0.1 (exploratorio, no ejecutable aún)

`mockup-v0.1.html` = mockup HTML standalone con datos reales de Vitalia. Abrir directo en browser:

```bash
xdg-open tools/luana-cockpit/mockup-v0.1.html
# o simplemente doble-click desde el file manager
```

## Las 3 vistas

| # | Vista | Propósito |
|---|---|---|
| 1 | **Backlog Board** | Kanban por estado (10 estados macro) · click → drawer con metadata form + checkpoint render |
| 2 | **Mapa Implementado** | Story map agente × módulo × capability · click capability → reglas neg + funcionalidades + mockup-vs-actual + E2E + código BE/FE/Agentic |
| 3 | **Learnings** | Timeline cronológico + categorías · click → markdown render con cross-refs auto |

## Fuente de datos (sin DB)

Todo se lee directo de:

- `vitalia/docs/product/stories/{id}/checkpoint.md` (front-matter YAML)
- `vitalia/docs/archive/{year}/stories/{id}/` (stories done)
- `vitalia/docs/product/capabilities/{module}/{cap}.yaml`
- `vitalia/docs/product/modules/{m}.md`
- `vitalia/docs/learnings/{date}-{slug}.md`

Edit en cockpit → escribe el archivo correspondiente → próxima invocación `/pm-vitalia` lee actualizado. **Cero impacto en consumo de tokens de Claude.**

## Roadmap evolución

| Versión | Forma | Stack |
|---|---|---|
| v0.1 (actual) | Single HTML standalone con datos hardcoded | Tailwind CDN + vanilla JS |
| v0.2 | Next.js 16 app `app/` + API routes leen filesystem real | Next.js + gray-matter + react-markdown |
| v0.3 | Edit funcional (forms → PUT `/api/file`) + watch chokidar hot-reload | + chokidar + monaco-editor opcional |
| v0.4 | Brand switcher (4 brands activas) + cross-brand portfolio view | + estado global brand |
| v0.5 | Mockup-vs-actual con screenshots Playwright auto + diff visual | + integración Playwright reports |

## Por qué dentro de `tools/` y no en una brand

El cockpit sirve a **todas** las brands (vitalia + nicolify + comunify + lupulo + futuras). No es código de producto. Pertenece al tooling del workspace, junto con `scripts/`.

## Scope gate y commit

`wip/{brand}` branches (e.g. `wip/vitalia`) tienen scope-gate pre-commit que bloquea archivos fuera de `{brand}/**`. Este directorio es cross-cutting, requiere uno de:

1. **Worktree dedicado** `wip/protocol-cockpit-mockup` (recomendado para iteraciones largas)
2. **Override puntual** `SCOPE_GATE_SKIP=1 git commit ...` con razón documentada
3. **Mantener untracked** hasta v0.2 cuando se cementa la arquitectura

Por ahora el archivo queda untracked hasta ratificación Chris.
