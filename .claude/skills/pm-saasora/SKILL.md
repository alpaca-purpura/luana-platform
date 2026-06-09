---
name: pm-saasora
description: "PM SaaSora — owner del SSoT funcional brand SaaSora (SaaS y Productos Digitales (onboarding automatizado, subscripciones Stripe, dashboards Churn/MRR, changelogs)). Pointer-first: carga saasora/docs/product/checkpoint.md + BACKLOG.md en bootstrap. Owner: saasora/docs/product/{releases,stories,capabilities,modules}/, saasora/docs/learnings/, saasora/docs/architecture/, saasora/docs/domains/. Hereda paradigm v4 (10 estados macro) de Luana core. Activa: '/pm-saasora', 'estado saasora', 'saasora backlog', 'saasora story', 'saasora release', 'saasora capability', 'saasora learning', 'SaaS', 'subscription', 'churn', 'MRR', 'Stripe', 'changelog', 'onboarding tech'."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent
model: opus
disable-model-invocation: true   # marca sin bootstrapear: user-invocable (/pm-saasora) pero sin auto-trigger
---

# /pm-saasora — Brand PM Saasora (PRE-BOOTSTRAP · placeholder depopulado)

> **Esta marca NO está bootstrapeada** (0 stories · solo scaffold físico). Este SKILL.md es un **placeholder depopulado** (W2 harness-refactor 2026-06-08): el cuerpo operativo **NO se duplica acá hasta el bootstrap**, para no arrastrar un cuerpo de 200+ líneas que rota sin uso (LSP drift). `disable-model-invocation: true` → `/pm-saasora` es user-invocable pero no auto-triggerea.

## Para bootstrapear Saasora

Seguí `.claude/skills/_pm-brand-template/SKILL.md`:

```bash
cp -r .claude/skills/_pm-brand-template .claude/skills/pm-saasora
# reemplazar placeholders {{SLUG}}/{{NAME_CAP}}/{{VERTICAL}}/{{TRIGGERS_EXTRA}}
# crear saasora/docs/product/{releases,stories,capabilities,modules}/ + checkpoint + BACKLOG
make portfolio
```

El cuerpo completo (Step 0 closure-gate · **Intake-handshake** W0.5-bis · Auto-chain · Vocabulary 10 estados · capability promotion · Fase F.3 · DoD #37 · chris-input) se materializa AHÍ, idéntico a los 4 `pm-{brand}` activos. La descripción (vertical + triggers) ya vive en el frontmatter para descubribilidad.

## Referencias

- `.claude/skills/_pm-brand-template/SKILL.md` — scaffold de bootstrap (SSoT del cuerpo)
- `.claude/skills/pm-vitalia/SKILL.md` — instancia activa de referencia
- `CLAUDE.md` § 10 Brand verticals — catálogo + estado de bootstrap
