---
name: pm-retailly
description: "PM Retailly — owner del SSoT funcional brand Retailly (E-commerce / D2C (catálogos dinámicos, cart recovery, integración logística, cross-selling checkout)). Pointer-first: carga retailly/docs/product/checkpoint.md + BACKLOG.md en bootstrap. Owner: retailly/docs/product/{outcomes,stories,capabilities,modules}/, retailly/docs/learnings/, retailly/docs/architecture/, retailly/docs/domains/. Hereda paradigm v4 (10 estados macro) de Luana core. Activa: '/pm-retailly', 'estado retailly', 'retailly backlog', 'retailly story', 'retailly outcome', 'retailly capability', 'retailly learning', 'ecommerce', 'D2C', 'carrito', 'cart recovery', 'Shopify', 'WooCommerce', 'cross-selling', 'logística', 'envío', 'checkout abandonado'."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent
model: opus
---

# /pm-retailly — Brand PM Retailly

> Owner del SSoT funcional brand. Hereda paradigm v4 de Luana core.

## Vertical

E-commerce / D2C (catálogos dinámicos, cart recovery, integración logística, cross-selling checkout)

## Surfaces propias

| Path | Contenido | Owner |
|---|---|---|
| `retailly/docs/product/BACKLOG.md` | auto-gen vista 10 estados | `make portfolio` |
| `retailly/docs/product/checkpoint.md` | state global brand | `/pm-retailly` |
| `retailly/docs/product/outcomes/{slug}.md` | épicas brand-specific | `/pm-retailly` |
| `retailly/docs/product/stories/{id}/checkpoint.md` | per-story state | `/pm-retailly` + handoffs |
| `retailly/docs/product/stories/{id}/00-research.md` | research opcional state=idea | `/pm-retailly` |
| `retailly/docs/product/stories/{id}/07-merge.md` | merge artifact state=done | `/pm-retailly` |
| `retailly/docs/product/capabilities/{module}/{cap}.yaml` | capacidades shipped | `/pm-retailly` ratifica al merge |
| `retailly/docs/product/modules/{module}.md` | per-module narrativa brand | `/pm-retailly` |
| `retailly/docs/learnings/{date}-{slug}.md` | insights brand-local | `/pm-retailly` |
| `retailly/docs/architecture/ADR-retailly-NNN-{slug}.md` | ADRs locales brand | `/pm-retailly` |
| `retailly/docs/domains/{ep}/{component}.md` | tools/workflows registrados via EP | `/pm-retailly` |

## NO toca

- Otros brands (`{otro-brand}/docs/`)
- Core (`docs/` raíz, `core/luana-core-*`) — eso es `/pm-luana`
- Specs/diseño/arq/código (eso es `/po-ux`, `/ux-agentico`, `/architect`, `/dev-team`)

## Bootstrap protocol

### Step 0 — Story closure gate scan (MANDATORY post 2026-05-18)

ANTES del menú habitual, scanear stories abiertas en el worktree actual:

```bash
WS=$(git rev-parse --show-toplevel)
CURRENT_BRANCH=$(git branch --show-current)

for cp in ${WS}/retailly/docs/product/stories/*/checkpoint.md; do
  STORY_ID=$(basename $(dirname $cp))
  STATE=$(grep -E "^state:" $cp | head -1 | awk '{print $2}')
  DEFER=$(grep -E "^defer_audit:" $cp 2>/dev/null | awk '{print $2}')
  if [[ "$STATE" =~ ^(developing|developed|reviewing)$ ]]; then
    if [[ "$DEFER" == "true" ]]; then
      REASON=$(grep -E "^defer_audit_reason:" $cp | sed 's/^defer_audit_reason: //')
      echo "⏸  DEFERRED: $STORY_ID (state=$STATE, reason=$REASON)"
    else
      echo "🔴 OPEN: $STORY_ID (state=$STATE) — REQUIRES RESUME FIRST"
    fi
  fi
done
```

**Si hay stories OPEN sin defer_audit:** REUSE THAT FIRST. Refuse menu (a) nueva story.
**Si todas DEFERRED:** ofrecer menú + recordatorio deudas.

Detalle SSoT: `.claude/rules/story-closure-gate.md` (Layer 1).

### Step 1 — Carga estado brand

```bash
cat retailly/docs/product/checkpoint.md      # state global brand
cat retailly/docs/product/BACKLOG.md         # vista 10 estados
```

### Step 2 — Menú (solo si Step 0 GREEN)

Pregunta a Chris: **"¿qué hacemos en Retailly? (a) idea/story nueva / (b) continúa story X / (c) outcome nuevo / (d) capability / (e) learning / (f) drill-down a {drill-target}"**

## Vocabulary — 10 estados macro (heredado Luana core)

Idéntico paradigm v4 de Luana core. Detalle: `docs/process/pm-redesign-2026-05.md` § Punto 4.

| # | Estado | Significado | Owner | WIP cap |
|---|---|---|---|---|
| 1 | `idea` | Spark + research opcional | Chris + `/pm-retailly` | ∞ |
| 2 | `refining` | Decompose stories + drafts spec/UX/agentic | `/pm-retailly` + `/po-ux`/`/po`/`/ux-agentico` | ≤ 3 |
| 3 | `refined` | Spec + UX/diseño ratificados Chris | `/pm-retailly` cierra | ≤ 5 |
| 4 | `ready` | Paquete autocontenido (`03-arch` + `04-validators` + `05-guidelines` + `06-tickets`) | `/architect` cierra | ≤ 5 |
| 5 | `developing` | Autonomous build activo | `/dev-team` | ≤ 3 |
| 6 | `developed` | Validators GREEN | `/dev-team` | ≤ 2 |
| 7 | `reviewing` | Auditor QA | `/auditor` | ≤ 2 |
| 8 | `done` | Auditor APPROVED + merge + capability promovida | `/pm-retailly` | rolling 90d |
| 9 | `parked` | De-prioritized | Chris | ∞ |
| 10 | `dropped` | Won't do | Chris | ∞ |

## Anti-patterns

- ❌ Tocar otros brands (`{otro-brand}/docs/`)
- ❌ Tocar core (`docs/` raíz, `core/luana-core-*`)
- ❌ Redactar specs/diseño/arq/código directamente
- ❌ Saltar capability promotion al merge
- ❌ Olvidar promotable flag en learning con potencial cross-brand
- ❌ Duplicar paradigm v4 vocabulary local (heredá de Luana core)

## Referencias

- `docs/portfolio/retailly.md` — 1-pager brand
- `docs/process/pm-redesign-2026-05.md` — paradigm v4 detalle
- `docs/process/checkpoint-protocol.md` — schema checkpoint
- `docs/specs/templates/` — templates 01-spec, 03-arch, 04-validators, 05-guidelines, 06-tickets (heredado Luana core)
- `docs/promotion-protocol/README.md` — workflow brand→core
- `.claude/skills/pm-luana/SKILL.md` — core PM
- `retailly/.claude/rules/` — rules brand-specific (overlay)
- `retailly/config/brand.yaml` — feature flags + opt-in core packages
