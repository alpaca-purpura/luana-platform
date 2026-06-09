---
name: pm-retailly
description: "PM Retailly — owner del SSoT funcional brand Retailly (E-commerce / D2C (catálogos dinámicos, cart recovery, integración logística, cross-selling checkout)). Pointer-first: carga retailly/docs/product/checkpoint.md + BACKLOG.md en bootstrap. Owner: retailly/docs/product/{releases,stories,capabilities,modules}/, retailly/docs/learnings/, retailly/docs/architecture/, retailly/docs/domains/. Hereda paradigm v4 (10 estados macro) de Luana core. Activa: '/pm-retailly', 'estado retailly', 'retailly backlog', 'retailly story', 'retailly release', 'retailly capability', 'retailly learning', 'ecommerce', 'D2C', 'carrito', 'cart recovery', 'Shopify', 'WooCommerce', 'cross-selling', 'logística', 'envío', 'checkout abandonado'."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent
model: opus
disable-model-invocation: true   # marca sin bootstrapear: user-invocable (/pm-retailly) pero sin auto-trigger
---

# /pm-retailly — Brand PM Retailly (PRE-BOOTSTRAP · placeholder depopulado)

> **Esta marca NO está bootstrapeada** (0 stories · solo scaffold físico). Este SKILL.md es un **placeholder depopulado** (W2 harness-refactor 2026-06-08): el cuerpo operativo **NO se duplica acá hasta el bootstrap**, para no arrastrar un cuerpo de 200+ líneas que rota sin uso (LSP drift). `disable-model-invocation: true` → `/pm-retailly` es user-invocable pero no auto-triggerea.

## Para bootstrapear Retailly

Seguí `.claude/skills/_pm-brand-template/SKILL.md`:

```bash
cp -r .claude/skills/_pm-brand-template .claude/skills/pm-retailly
# reemplazar placeholders {{SLUG}}/{{NAME_CAP}}/{{VERTICAL}}/{{TRIGGERS_EXTRA}}
# crear retailly/docs/product/{releases,stories,capabilities,modules}/ + checkpoint + BACKLOG
make portfolio
```

El cuerpo completo (Step 0 closure-gate · **Intake-handshake** W0.5-bis · Auto-chain · Vocabulary 10 estados · capability promotion · Fase F.3 · DoD #37 · chris-input) se materializa AHÍ, idéntico a los 4 `pm-{brand}` activos. La descripción (vertical + triggers) ya vive en el frontmatter para descubribilidad.

## Referencias

- `.claude/skills/_pm-brand-template/SKILL.md` — scaffold de bootstrap (SSoT del cuerpo)
- `.claude/skills/pm-vitalia/SKILL.md` — instancia activa de referencia
- `CLAUDE.md` § 10 Brand verticals — catálogo + estado de bootstrap
