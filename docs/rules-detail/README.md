# docs/rules-detail/ — Detail mirror de `.claude/rules/`

**Cement-date:** 2026-05-23.

**Por qué existe:** Claude Code auto-carga `.claude/rules/*.md` y `.claude/rules/references/*.md` como project memory en cada sesión (~28 archivos, ~85KB total pre-slim). El detalle exhaustivo (workflows verbatim, ejemplos casos origen, anti-patterns completos, layers enforcement detail) NO necesita estar en context siempre — solo cuando un auditor o builder lo pide.

**Cómo funciona:**

```
.claude/rules/foo.md           # SUMMARY (auto-loaded ~2-5KB)
  ↓ punteros explícitos
docs/rules-detail/foo.md       # DETAIL (load on-demand vía Read tool, ~10-20KB)
```

Cada `.claude/rules/X.md` post-slim contiene:
1. Header + 1-liner cardinal rule
2. Pointer absoluto al detail doc en línea 3-5
3. Tablas/diagramas críticos para operación inline
4. Top 3-5 anti-patterns inline (lista completa en detail)
5. Sección "Referencias" con detail doc + cross-references

## Cómo cargar el detail (per agent type)

**Auditores (`auditor-{backend,frontend,agentic}`)**:
```
Si tocás surface listada en .claude/rules/auditor-downstream-regression.md,
leé docs/rules-detail/auditor-downstream-targets.md (tabla SSoT 9 secciones)
para downstream test paths cross-engine + cross-brand.
```

**Builders (`builder-*`)**:
```
Si paradigm v4 / story-closure-gate / repro-mandatory aplica al ticket,
leé docs/rules-detail/{story-closure-gate,hotfix-repro-mandatory}.md
ANTES de spawn.
```

**PMs (`/pm-luana`, `/pm-{brand}`)**:
```
Si hay duda sobre flujo merge / capability promotion / archive pattern,
leé docs/rules-detail/{story-closure-gate,brand-docs-schema}.md.
```

## Inventario actual

| Slim rule | Detail doc | Notas |
|---|---|---|
| `auditor-downstream-regression.md` | `docs/rules-detail/auditor-downstream-regression.md` + `auditor-downstream-targets.md` | Tabla SSoT 9 secciones (A-I) en target doc |
| `story-closure-gate.md` | `docs/rules-detail/story-closure-gate.md` | 07-merge schema verbatim + gherkin_coverage examples |
| `parallel-safety.md` | `docs/rules-detail/parallel-safety.md` | Sub-agent worktree ban v2 + N sesiones bucket lock |
| `auditor-self-fix-policy.md` | `docs/rules-detail/auditor-self-fix-policy.md` | Whitelist 17 + NEVER 16 + spawn templates verbatim |
| `brand-docs-schema.md` | `docs/rules-detail/brand-docs-schema.md` | R1+R2+R3 cement detail + 12 paths auto-gen SSoT |
| `step-0-worktree.md` | `docs/rules-detail/step-0-worktree.md` | 12 pasos logic v2 verbatim + output examples |
| `hotfix-repro-mandatory.md` | `docs/rules-detail/hotfix-repro-mandatory.md` | Caso origen verbatim + 4 steps workflow |
| `anti-default-flip-audit.md` | `docs/rules-detail/anti-default-flip-audit.md` | Ejemplos CORRECTO/INCORRECTO commit body |
| `_CLAUDE-original-backup.md` | `docs/rules-detail/_CLAUDE-original-backup.md` | CLAUDE.md pre-slim (31KB) — federate docs schema, paradigm v4 full, 10 brands catalog detail, cost-routing, bootstrap completo |
| `_AGENTS-original-backup.md` | `docs/rules-detail/_AGENTS-original-backup.md` | AGENTS.md pre-slim (8.5KB) — skills SSoT, modules detail, defaults legacy single-brand |

## Mantenimiento

Cuando cambia una regla:
1. Update SLIM (`.claude/rules/X.md`) si cambió el cardinal o las tablas críticas
2. Update DETAIL (`docs/rules-detail/X.md`) siempre — fuente de verdad histórica + examples completos
3. NO duplicar contenido — slim referencia detail, detail expande

Cuando agregás nueva rule grande (>5KB):
1. Crear `.claude/rules/X.md` con summary (~2-3KB)
2. Crear `docs/rules-detail/X.md` con contenido completo
3. Agregar row a tabla inventario en este README

## Savings totales (2026-05-23)

| Métrica | Antes | Después | Δ |
|---|---|---|---|
| CLAUDE.md + AGENTS.md + 8 rules + references/ deleted | 142.4 KB | 56.3 KB | **-86.1 KB** |
| Tokens auto-loaded | ~40k tokens | ~16k tokens | **-24k tokens (~60% reducción)** |

Sin pérdida de información: detalle preservado al 100% en `docs/rules-detail/` + skills `worktree-protocol` / `auditor` / `dev-team` saben dónde buscar.
