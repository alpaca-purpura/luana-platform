# Brand Docs Schema — R1+R2+R3+R4

> **Slim stub (context-rot pass 2026-05-30).** Detalle completo (schema ASCII TARGET · R1/R2/R3/R4 how-to-apply · gitignored files SSoT 12 paths · enforcement layers · anti-patterns · ejemplos) en `docs/rules-detail/brand-docs-schema.md` — load on-demand. **Origen:** purga docs/ Fase C 2026-05-19.

## Regla cardinal — 4 reglas hard (aplica a `{brand}/docs/`, 4 brands activas + 6 bootstrap)

**R1 — No MDs sueltos:** `{brand}/docs/` raíz = SOLO sub-directorios (`product/`, `archive/`, `learnings/`, `architecture/`, `domains/`). Ningún `.md` suelto.

**R2 — Stories `done` → archive:** al mergear (`reviewing → done`), `/pm-{brand}` ejecuta `git mv {brand}/docs/product/stories/{id} {brand}/docs/archive/$(date +%Y)/stories/{id}` en el MISMO commit del 07-merge (incluye chris-input.md).

**R3 — Auto-gen = gitignored:** `BACKLOG.{md,yaml,-TLDR.md}`, `docs/portfolio/*.md`, `docs/promotion-protocol/scan-*.yaml` son OUTPUT gitignored. NO editar manual — modificar la SOURCE y regen via `make {target}` o `scripts/generate_*.py`.

**R4 — chris-input.md nace con la idea:** toda story creada (`state: idea`) MUST tener `chris-input.md` + `checkpoint.md` juntos desde el inicio. Skills appendean verdict al cierre de cada turn. Pre-commit hook (Section 16) bloquea si ausente (override: `# chris-input-skip: razón`).

## Schema canónico (1-liner)

```
{brand}/docs/
├── product/stories/{id}/{checkpoint.md, chris-input.md, 01-spec.md…07-merge.md, mockups/}
├── product/capabilities/{module}/{cap}.yaml  · modules/{module}.md  · releases/{F0..FN}.yaml
├── archive/{year}/stories/{story-id}/        # done (immutable)
├── learnings/{date}-{slug}.md
├── architecture/ADR-{brand}-{NNN}-{slug}.md
└── domains/{ep}/{component}.md
```

## Cuándo carga el detalle

- Bootstrap brand nueva (schema ASCII completo + sub-dirs `product/` detail)
- Cleanup de violations R1/R2 (tabla how-to-apply + anti-patterns con ejemplos)
- Agregar un auto-gen file al inventario R3 o consultar qué es gitignored vs tracked

## Anti-patterns (top 3 — lista completa en el detalle)

- ❌ `{brand}/docs/ROADMAP.md` o cualquier `.md` suelto en raíz (R1)
- ❌ Mergear story `done` sin `git mv` a archive en mismo commit (R2)
- ❌ Editar `BACKLOG.md` directamente — modificar la source (checkpoint / outcomes) (R3)

## Referencias

- `docs/rules-detail/brand-docs-schema.md` — **detalle completo**
- `.claude/rules/story-closure-gate.md` § Fase F — R2 concreta como parte del merge
- `docs/process/chris-input-protocol.md` — R4 SSoT
- `CLAUDE.md` § SDD Level 3 — schema cross-brand (para `docs/` raíz)
