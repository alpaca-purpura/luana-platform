# Brand Docs Schema — R1+R2+R3 consolidated

**Origen:** purga docs/ Fase C 2026-05-19. **Cement-date:** 2026-05-19 (R3 v2 cement 2026-05-20). **Scope:** aplica a `{brand}/docs/` para 4 brands activas + 6 futuras bootstrap. NO aplica a `docs/` raíz.

**Detalle completo (schema TARGET ASCII full + R1/R2/R3 how-to-apply tables + R3 v2 gitignored cement detail + auto-gen files SSoT 12 paths + enforcement layers + anti-patterns examples + referencias):** `docs/rules-detail/brand-docs-schema.md`.

## Schema canónico TARGET (1-liner)

```
{brand}/docs/
├── product/
│   ├── outcomes/{slug}.md
│   ├── stories/{id}/{checkpoint.md, chris-input.md, 01-spec.md, 02-design-*.md, 03-arch.md, 04-validators.yaml, 05-guidelines.md, 06-tickets.yaml, 07-merge.md, mockups/, refs/}
│   ├── capabilities/{module}/{cap}.yaml         # schema v2 con change_log[] + atomics objects
│   ├── modules/{module}.md
│   ├── releases/{F0..FN}.yaml                  # v2 cement 2026-05-27 reemplaza outcome+phase legacy
│   └── BACKLOG.{md,yaml,-TLDR.md} + checkpoint.md
├── archive/{year}/stories/{story-id}/           # stories state=done (immutable · incluye chris-input.md)
├── learnings/{date}-{slug}.md
├── architecture/ADR-{brand}-{NNN}-{slug}.md
└── domains/{ep}/{component}.md
```

Schema completo + sub-dir product/ detail: ver detail doc.

## R1 — No MDs sueltos en `{brand}/docs/` raíz

`{brand}/docs/` raíz puede contener SOLO sub-directorios. NO archivos `.md` sueltos.

**Por qué:** purga 2026-05-19 reveló `docs/` raíz tenía `ARCHITECTURE.md`, `CONTRIBUTING.md`, etc. sueltos → confusión + duplicación. Misma deriva ocurre en `{brand}/docs/` sin enforce.

**How to apply:**

| Tipo de contenido | Ubicación canónica |
|---|---|
| Decisión arquitectónica | `{brand}/docs/architecture/ADR-{brand}-{NNN}-{slug}.md` |
| Procedimiento operacional | `{brand}/docs/domains/{component}.md` |
| Spec/diseño feature | dentro de `{brand}/docs/product/stories/{story-id}/` |
| Outcome (épica) | `{brand}/docs/product/outcomes/{slug}.md` |
| Learning histórico | `{brand}/docs/learnings/{date}-{slug}.md` |
| Roadmap/backlog | `{brand}/docs/product/BACKLOG.md` (auto-gen) |
| Handoff cross-session | dentro de la story relevante |

**Anti-pattern:** `{brand}/docs/ROADMAP.md`, `IDEAS.md`, `TODO.md` o file ad-hoc fuera del schema.

## R2 — Stories `done` auto-move a `{brand}/docs/archive/{year}/stories/`

Cuando story transitions `state: reviewing → done` (Fase F merge), directorio completo MUST moverse a archive en MISMO commit del merge.

**`/pm-{brand}` ejecuta:**

```bash
YEAR=$(date +%Y)
git mv {brand}/docs/product/stories/{story-id} {brand}/docs/archive/${YEAR}/stories/{story-id}
```

Move debe ir en commit del squash-merge a main (mismo commit que escribe `07-merge.md`).

**Anti-pattern:** mergear con state=done sin mover a archive → BACKLOG auto-gen "active" eternamente.

## R4 — chris-input.md nace con la idea (state=idea) — buzón de inputs de Chris (v3 cement 2026-05-28)

Toda story creada (desde `state: idea`) MUST tener `chris-input.md` en su directorio, **junto con `checkpoint.md`**. Nace con la idea — NO se espera a `refining`. Es el **buzón donde Chris vuelca lo que desea y/o cree que necesita** desde el minuto cero; Claude lo puede **rebatir** (verdict ❌ REFUTADO) durante el ciclo de vida de la story, y se refina en conjunto.

**Por qué:** chris-input.md es el SSoT de la conversación asíncrona Chris↔Claude a lo largo de TODA la vida de la story (idea → refinement → build). Si naciera recién en `refining`, las ideas crudas del periodo `idea` no tendrían hogar tracked → se pierden en el chat o en la cabeza de Chris. Naciendo con la idea, es el buzón único de inputs desde el día cero. Skills (po-ux, po, ux-agentico, architect, auditor, pm-{brand}, dev-team) appendean verdict al cierre de cada turn.

**How to apply:**
- `/pm-{brand}` al **CREAR** la story (`state: idea`) crea `checkpoint.md` + `chris-input.md` juntos (chris-input.md desde template `docs/specs/templates/00-chris-input-template.md`). El cockpit (`extend-cap`, `from-done`) ya lo hace vía `createNewStoryDocs`.
- `/pm-{brand}` Fase F MERGE (`reviewing → done`) ejecuta `git mv` del chris-input.md junto con resto de la story al `archive/{year}/stories/{id}/`
- Pre-commit hook (Section 16) bloquea commit de checkpoint.md con `state ∈ {idea, refining...reviewing}` si chris-input.md ausente en mismo dir (magic comment `# chris-input-skip: razón` permite override puntual — ej. idea efímera que se descarta sin refinar)

**Anti-pattern:** Chris invoca `/po-ux <story>` sin que exista chris-input.md → skill debe rechazar + pedir a `/pm-{brand}` el setup inicial. Story creada en `idea` sin chris-input.md (la idea no tiene buzón para los inputs de Chris).

Doc canónico: `docs/process/chris-input-protocol.md`.

## R3 — Auto-gen files son GITIGNORED + NO editar manual

Files OUTPUT auto-gen están **gitignored desde 2026-05-20**. Cada quien regenera localmente.

| Path | Generator | Tracked? |
|---|---|---|
| `{brand}/docs/product/BACKLOG.{md,yaml,-TLDR.md}` | `scripts/generate_backlog.py --brand {brand}` | ❌ gitignored |
| `{brand}/docs/product/modules/{module}.md` (auto-list block) | `scripts/reconcile_capabilities.py --brand {brand}` | ✅ tracked (hybrid intro + auto-block) |
| `{brand}/docs/product/stories/{id}/refs/*` (excepto `*.md` y `.gitkeep`) | upload via cockpit `/api/refs/upload` | ❌ gitignored (chris-input.md sigue tracked + cita paths) |
| `docs/portfolio/{PORTFOLIO,brand}.md` | `scripts/generate_portfolio.py` (`make portfolio`) | ❌ gitignored |
| `docs/portfolio/INFRA-MATRIX.md` | `scripts/generate_infra_matrix.py` | ❌ gitignored |
| `docs/promotion-protocol/scan-{date}.yaml` | `scripts/scan_promotables.py` | ❌ gitignored |

**Por qué gitignored (2026-05-20 cement):** semanas de merge conflicts crónicos por timestamps + ordenamientos. SSoT vive en sources (`outcomes/`, `stories/`, `capabilities/`, `brand.yaml`); estos son vistas derivadas regenerables.

**Workflow correcto:** modificar SOURCE (no output). Regen via `make {target}` o `scripts/generate_*.py` (idempotente).

**Headers explícitos:** todo auto-gen marca `<!-- AUTO-GENERATED por scripts/{generator}.py — NO editar a mano -->` líneas 1-5.

**Anti-pattern:** editar BACKLOG.md para "agregar TODO" — esos cambios viven en checkpoint.md o outcomes/stories.

## Enforcement layers

| Layer | Mecanismo | Status |
|---|---|---|
| 1 | `/pm-{brand}` skill enforce schema + bootstrap Step 0 scan stories done | ✅ active |
| 2 | Pre-commit hook (opcional) bloquea `*.md` directo en `{brand}/docs/` raíz | ⏳ TBD |
| 3 | Auditor backend/agentic/frontend Cat 12 detect stories done en `product/stories/` | ✅ |
| 4 | `scripts/reconcile_capabilities.py --check-mode` exit 1 si R1/R2 violations | ✅ |
| 5 | Headers explícitos en auto-gen (R3 prevention) | ✅ active per file |

## Multibrand awareness

Aplica a las 4 brands activas (vitalia, nicolify, comunify, lupulo) + futuras bootstrap. Template `_pm-brand-template/SKILL.md` enforce esta rule desde día 1.

## Referencias

- `docs/rules-detail/brand-docs-schema.md` — **detalle completo** (schema ASCII, R3 v2 cement detail, 12 paths auto-gen, ejemplos)
- `.claude/rules/story-closure-gate.md` — Fase F MERGE concreta R2
- `.claude/rules/anti-duplication.md` — cross-brand mirror (relacionado)
- `docs/process/pm-redesign-2026-05.md` — paradigm v4
- `CLAUDE.md` § SDD Level 3 — schema cross-brand (para `docs/` raíz)
