# Brand Docs Schema — R1+R2+R3 consolidated

**Origen:** Sesión 2026-05-19 — purga docs/ Fase C reveló 3 reglas implícitas no codificadas. Auditor del caos doc detectó que el schema canónico (post pm-redesign 2026-05-15) no estaba enforced contra drift orgánico.

**Cement-date:** 2026-05-19.

**Scope:** aplica a `{brand}/docs/` para `{brand}` ∈ {vitalia, nicolify, comunify, lupulo + 6 brands pendientes bootstrap}. NO aplica a `docs/` raíz (ese tiene su propio schema cross-brand en CLAUDE.md § SDD Level 3).

## Schema canónico TARGET — qué SÍ puede existir en `{brand}/docs/`

```
{brand}/docs/
├── product/
│   ├── outcomes/{slug}.md                    # épicas brand-local
│   ├── stories/{story-id}/                   # stories ACTIVAS (state ∉ {done})
│   │   ├── 01-spec.md
│   │   ├── 02-design-{ui|agentic}.md         # opcional
│   │   ├── 03-arch.md (+ 03-arch-{be,fe,agentic}.md opcionales)
│   │   ├── 04-validators.yaml
│   │   ├── 05-guidelines.md
│   │   ├── 06-tickets.yaml
│   │   ├── 06-audit/                         # opcional, post-auditor
│   │   │   ├── CHECKPOINTS.md
│   │   │   ├── gherkin-matrix.md
│   │   │   └── T-{n}-review.md (×N)
│   │   ├── 07-merge.md                       # al cerrar state=done
│   │   ├── 00-research.md                    # opcional state=idea
│   │   ├── checkpoint.md                     # state vivo
│   │   ├── T-{n}-impl-log.md (×N)
│   │   └── T-{n}-result.md (×N)
│   ├── capabilities/{module}/{cap}.yaml      # R32 inventory
│   ├── modules/{module}.md                   # auto-list R32
│   ├── BACKLOG.md                            # AUTO-GEN — DO NOT EDIT
│   ├── BACKLOG-TLDR.md                       # AUTO-GEN — DO NOT EDIT
│   ├── BACKLOG.yaml                          # AUTO-GEN — DO NOT EDIT
│   ├── checkpoint.md                         # state global brand
│   └── README.md                             # índice (opcional)
├── archive/{year}/stories/{story-id}/        # stories state=done (immutable snapshot)
├── learnings/{date}-{slug}.md                # insights brand-local
├── architecture/ADR-{brand}-{NNN}-{slug}.md  # ADRs locales brand
└── domains/{ep}/{component}.md               # tools/workflows registrados via Extension SDK
```

**Anything outside this schema** → violation. Tres reglas hard:

## R1 — No MDs sueltos en `{brand}/docs/` raíz

**Regla:** `{brand}/docs/` raíz puede contener SOLO sub-directorios (`product/`, `archive/`, `learnings/`, `architecture/`, `domains/`). NO archivos `.md` sueltos. Excepciones permitidas (whitelist exhaustivo):

- Ninguna por default. README.md raíz NO necesaria (cada subdir puede tener su propio README opcional).

**Why:** la purga 2026-05-19 reveló que `docs/` raíz tenía `ARCHITECTURE.md`, `CONTRIBUTING.md`, `RELEASES.md`, `extension-points.md`, `migration-from-nicolify.md` sueltos — todos útiles pero misplaced, generando confusión y duplicación de ubicación. La misma deriva ocurre en `{brand}/docs/` si no se enforce.

**How to apply:** cuando una brand necesita documentar algo arquitectónico o de proceso, debe ir al sub-dir apropiado:

| Tipo de contenido | Ubicación canónica |
|---|---|
| Decisión arquitectónica | `{brand}/docs/architecture/ADR-{brand}-{NNN}-{slug}.md` |
| Procedimiento operacional brand-local | `{brand}/docs/domains/{component}.md` |
| Spec/diseño de feature | dentro de `{brand}/docs/product/stories/{story-id}/` |
| Outcome (épica) | `{brand}/docs/product/outcomes/{slug}.md` |
| Learning histórico | `{brand}/docs/learnings/{date}-{slug}.md` |
| Roadmap/backlog | `{brand}/docs/product/BACKLOG.md` (auto-gen) |
| Handoff cross-session | dentro de la story relevante (`HANDOFF-next-session.md` adjunto a `checkpoint.md`) |

**Anti-pattern:** `{brand}/docs/ROADMAP.md`, `{brand}/docs/IDEAS.md`, `{brand}/docs/TODO.md` o cualquier file ad-hoc fuera del schema.

## R2 — Stories `done` auto-move a `{brand}/docs/archive/{year}/stories/`

**Regla:** cuando una story transitions `state: reviewing → done` (Fase F merge per `story-closure-gate.md`), el directorio completo `{brand}/docs/product/stories/{story-id}/` MUST moverse a `{brand}/docs/archive/{year}/stories/{story-id}/` en el MISMO commit del merge. NO viven en active stories indefinidamente.

**Why:** la purga 2026-05-19 detectó 4 platform stories + 2 vitalia stories en state=done viviendo en `product/stories/` desde semanas, contaminando vistas de "stories activas". Además detectó 1 duplicate exacto (`vitalia-slice-1-onboarding-wizard` en active + archive) — sin enforce de auto-move, los duplicates se acumulan.

**How to apply:** `/pm-{brand}` ejecuta como parte del 07-merge:

```bash
YEAR=$(date +%Y)
git mv {brand}/docs/product/stories/{story-id} {brand}/docs/archive/${YEAR}/stories/{story-id}
```

El move debe ir en el commit del squash-merge a main (mismo commit que escribe `07-merge.md`).

Esto está mencionado en cada `pm-{brand}/SKILL.md` § "Capability promotion (al merge)" paso 5, y profundamente codificado en `.claude/rules/story-closure-gate.md` § Fase F MERGE.

**Anti-pattern:** mergear story a main con state=done sin mover a archive. Resultado: story aparece en BACKLOG auto-gen como "active" eternamente. `make portfolio` overhead crece linealmente sin auto-cleanup.

**Detección:** scanner heuristic — story con `state: done` en `{brand}/docs/product/stories/` (fuera de archive) → flag para `/pm-{brand}` cleanup en próxima sesión.

## R3 — Auto-gen files NO se editan manual

**Regla:** los siguientes archivos son **OUTPUT auto-gen** de scripts. Editarlos manualmente provoca pérdida silenciosa al próximo regen.

| Path | Generator | Frecuencia regen |
|---|---|---|
| `{brand}/docs/product/BACKLOG.md` | `scripts/generate_backlog.py --brand {brand}` | post story state-change |
| `{brand}/docs/product/BACKLOG-TLDR.md` | idem | idem |
| `{brand}/docs/product/BACKLOG.yaml` | idem | idem |
| `{brand}/docs/product/modules/{module}.md` (sección auto-list) | `scripts/reconcile_capabilities.py --brand {brand}` | post capability change |
| `docs/portfolio/PORTFOLIO.md` | `scripts/generate_portfolio.py` | `make portfolio` |
| `docs/portfolio/{brand}.md` | idem | idem |
| `docs/portfolio/INFRA-MATRIX.md` | `scripts/generate_infra_matrix.py` | `make infra-matrix` |
| `docs/promotion-protocol/scan-{date}.yaml` | `scripts/scan_promotables.py` | `make scan-promotables` |
| `docs/etl/extraction-contract.md` (cuando exista) | `make extraction-contract` | post analytics provider change |

**Why:** durante la purga 2026-05-19, dos sesiones distintas regen BACKLOGs con timestamps distintos, generando conflict at merge. Si alguien editase manualmente un `BACKLOG.md` para "agregar una nota", esa edición se pierde al próximo regen. Mismo patrón aplica a portfolio + INFRA-MATRIX.

**How to apply:**

1. **Headers explícitos:** todo file auto-gen incluye en sus primeras 5 líneas el marker:
   ```markdown
   <!-- AUTO-GENERATED por scripts/{generator}.py — NO editar a mano -->
   ```
   o equivalente en frontmatter YAML.

2. **Workflow correcto cuando contenido necesita cambio:** modificar la SOURCE (no el output). Sources:
   - BACKLOG → source es `{brand}/docs/product/{outcomes,stories,capabilities}/`
   - PORTFOLIO → source es `{brand}/docs/portfolio/...` + brand 1-pagers + `{brand}/config/brand.yaml`
   - INFRA-MATRIX → source es `{brand}/config/brand.yaml::infra`
   - scan-promotables → source es `{brand}/docs/learnings/*.md` con `promotable: candidate|yes`

   Luego: regen via `make {target}` (idempotente).

3. **Si urge agregar nota:** crear archivo nuevo en el sub-dir correcto (ej. `{brand}/docs/learnings/{date}-{slug}.md`), NO inline en auto-gen output.

**Anti-pattern:** editar `BACKLOG.md` para "agregar TODO list" o cambiar prioridades manualmente — esos cambios viven en `checkpoint.md` o en outcomes/stories, no en el output consolidado.

## Enforcement layers

| Layer | Mecanismo | Status |
|---|---|---|
| 1 — `/pm-{brand}` skill | "Surfaces propias" lista enforce schema. "NO toca" anti-creep. Bootstrap Step 0 scan stories done sin archivar. | ✅ active |
| 2 — Pre-commit hook (opcional) | Section nueva: bloquea stage de `*.md` directo en `{brand}/docs/` raíz (R1) | ⏳ TBD (decisión Chris) |
| 3 — Auditor backend/agentic/frontend | Cat 12 (anti-duplication) extendida: detect stories done viviendo en `product/stories/` (R2) | ✅ already covers |
| 4 — `scripts/reconcile_capabilities.py --check-mode` | Exit 1 si detecta R1 o R2 violations | ✅ exists, ⏳ extend opcional |
| 5 — Headers explícitos en auto-gen | `<!-- AUTO-GENERATED -->` marker (R3 prevention) | ✅ active per file |

## Anti-patterns

- ❌ Crear `{brand}/docs/ROADMAP.md`, `{brand}/docs/STATUS.md`, `{brand}/docs/NOTES.md` (R1)
- ❌ Mergear story state=done sin `git mv` a archive en mismo commit (R2)
- ❌ Editar `{brand}/docs/product/BACKLOG.md` para "agregar prioridad" (R3 — modificá la source: checkpoint o outcome)
- ❌ Editar `docs/portfolio/PORTFOLIO.md` directo (R3 — `make portfolio` desde sources)
- ❌ Mantener story state=done en active stories "porque la podemos consultar" — el move a archive NO la pierde, sigue accesible via path archive

## Multibrand awareness

- Esta rule aplica a las 4 brands activas (vitalia, nicolify, comunify, lupulo) y a todas las brands futuras bootstrap (saasora, inmoflow, retailly, fixia, guestly, fitflow).
- El template `.claude/skills/_pm-brand-template/SKILL.md` debe enforce esta rule desde el día 1 de bootstrap.

## Referencias

- `.claude/rules/story-closure-gate.md` — Fase F MERGE concreta R2 (archive como parte del merge)
- `.claude/rules/anti-duplication.md` — anti-creep cross-brand mirror (relacionado pero distinto scope)
- `docs/process/pm-redesign-2026-05.md` — paradigm v4 (10 estados macro)
- `docs/process/story-closure-gate.md` — rationale ciclo `developed → reviewing → done`
- `CLAUDE.md` § SDD Level 3 — schema canónico cross-brand (relacionado, para `docs/` raíz no `{brand}/docs/`)
- Sesión 2026-05-19 purga docs/ Fase C — caso origen + ratificación Chris
