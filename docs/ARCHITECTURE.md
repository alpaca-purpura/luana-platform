# Arquitectura — Luana Platform

## Visión general

`luana-platform` es un monorepo privado que contiene el motor de automatización
AI para ventas y marketing (`core`) y las aplicaciones SaaS de cada brand vertical.

## Topología del monorepo

```
luana-platform/                          ← monorepo raíz
├── core/                                ← Motor SSoT (engine)
│   ├── copilot/                         ← Módulo AI Copilot (Story 2)
│   ├── sales-agent/                     ← Agente AI de ventas (Story 3)
│   └── shared/                          ← Abstracciones compartidas (Story 2)
├── nicolify/                            ← Brand: SaaS marketing (flagship)
├── vitalia/                             ← Brand: salud/medical (Story 11)
├── comunify/                            ← Brand: creator economy (Story 12)
├── lupulo/                              ← Brand: gastronomía (Story 13)
├── .claude-shared/                      ← Reglas + skills Claude Code (de AISALESHT)
├── .claude/                             ← Copia de .claude-shared (Windows-compat)
├── .github/
│   ├── CODEOWNERS                       ← Anti-island gate: paths críticos protegidos
│   ├── PULL_REQUEST_TEMPLATE.md         ← Template PR obligatorio
│   └── workflows/
│       └── ci.yml                       ← CI: python-lint + python-test + ts-lint + ts-test
├── docs/
│   ├── ARCHITECTURE.md                  ← Este archivo
│   ├── CONTRIBUTING.md                  ← Guía de contribución
│   ├── RELEASES.md                      ← Pipeline de releases (Story 9)
│   └── architecture/
│       └── ADR/                         ← Architecture Decision Records
├── pyproject.toml                       ← uv workspace root
├── package.json                         ← pnpm workspace root + turbo
├── pnpm-workspace.yaml                  ← workspace packages
└── turbo.json                           ← pipeline de tareas
```

## Workspace members

### Python (uv)

Declarados en `pyproject.toml`:
```toml
[tool.uv.workspace]
members = ["core", "nicolify", "vitalia", "comunify", "lupulo"]
```

### TypeScript (pnpm)

Declarados en `pnpm-workspace.yaml`:
```yaml
packages:
  - core
  - nicolify
  - vitalia
  - comunify
  - lupulo
```

## Subfolders en detalle

### `core/`

Motor SSoT de la plataforma. Contiene todo el código compartido entre brands:
- **copilot/**: Módulo AI de asistencia al vendedor humano
- **sales-agent/**: Agente autónomo de ventas (SDR + closer)
- **shared/**: Observabilidad, billing, compliance, eventos de dominio

Poblado en Stories 2-9. Toda abstracción cross-brand nace aquí.

**Governance:** CODEOWNERS protege `core/**` — requiere review de Chris.
Cambios arquitectónicos requieren ADR (ver `docs/architecture/ADR/`).

### `nicolify/`

Aplicación SaaS de marketing y ventas para el brand Nicolify.
Es la implementación de referencia (flagship) sobre el motor `core`.

Story 10 levanta el codebase completo de AISALESHT aquí, preservando la
estructura DDD modular monolith (FastAPI BE + Next.js FE).

### `vitalia/`

Brand vertical: salud y medicina. Placeholder hasta Story 11.
Hereda todas las capacidades AI de `core/`.

### `comunify/`

Brand vertical: creator economy. Placeholder hasta Story 12.
Hereda todas las capacidades AI de `core/`.

### `lupulo/`

Brand vertical: gastronomía. Placeholder hasta Story 13.
Hereda todas las capacidades AI de `core/`.

## Stack tecnológico

| Capa | Elección | Razón |
|---|---|---|
| Python package manager | **uv** (Astral) | Workspaces nativos, 2026 standard |
| TS package manager | **pnpm** | Workspaces + `workspace:*` protocol |
| Monorepo orchestrator | **Turborepo 2.x** | Task pipeline + caching |
| CI | **GitHub Actions** | Native GitHub, 2000min/mo free |
| Versionado | **manual SemVer** (Story 1) | Pre-publish era |
| Registro packages | **none Story 1** | Story 9 introduce GH Packages |

## ADR de referencia

| ADR | Decisión | Link |
|---|---|---|
| 001 | Topología monorepo (monorepo vs multi-repo) | [ADR-001](architecture/ADR/001-luana-platform-monorepo-topology.md) |

Ver [docs/architecture/ADR/README.md](architecture/ADR/README.md) para el índice completo
y el template para nuevos ADRs.

## Outcome doc de referencia

[luana-platform-migration](../../../AISALESHT/docs/product/outcomes/luana-platform-migration.md)
