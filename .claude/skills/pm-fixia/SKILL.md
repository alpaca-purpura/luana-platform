---
name: pm-fixia
description: "PM Fixia — owner del SSoT funcional brand Fixia (Servicios Hogar + Oficios (técnicos en campo, cotización on-site mobile, reseñas locales SEO)). Pointer-first: carga fixia/docs/product/checkpoint.md + BACKLOG.md en bootstrap. Owner: fixia/docs/product/{releases,stories,capabilities,modules}/, fixia/docs/learnings/, fixia/docs/architecture/, fixia/docs/domains/. Hereda paradigm v4 (10 estados macro) de Luana core. Activa: '/pm-fixia', 'estado fixia', 'fixia backlog', 'fixia story', 'fixia release', 'fixia capability', 'fixia learning', 'técnico', 'despacho', 'cotización on-site', 'reseña local', 'campo', 'hogar', 'oficio', 'plomero', 'electricista'."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent
model: opus
disable-model-invocation: true   # marca sin bootstrapear: user-invocable (/pm-fixia) pero sin auto-trigger
---

# /pm-fixia — Brand PM Fixia (PRE-BOOTSTRAP · placeholder depopulado)

> **Esta marca NO está bootstrapeada** (0 stories · solo scaffold físico). Este SKILL.md es un **placeholder depopulado** (W2 harness-refactor 2026-06-08): el cuerpo operativo **NO se duplica acá hasta el bootstrap**, para no arrastrar un cuerpo de 200+ líneas que rota sin uso (LSP drift). `disable-model-invocation: true` → `/pm-fixia` es user-invocable pero no auto-triggerea.

## Para bootstrapear Fixia

Seguí `.claude/skills/_pm-sistema-template/SKILL.md`:

```bash
cp -r .claude/skills/_pm-sistema-template .claude/skills/pm-fixia
# reemplazar placeholders {{SLUG}}/{{NAME_CAP}}/{{VERTICAL}}/{{TRIGGERS_EXTRA}}
# crear fixia/docs/product/{releases,stories,capabilities,modules}/ + checkpoint + BACKLOG
make portfolio
```

El cuerpo completo (Step 0 closure-gate · **Intake-handshake** W0.5-bis · Auto-chain · Vocabulary 10 estados · capability promotion · Fase F.3 · DoD #37 · chris-input) se materializa AHÍ, idéntico a los 4 `pm-{brand}` activos. La descripción (vertical + triggers) ya vive en el frontmatter para descubribilidad.

## Referencias

- `.claude/skills/_pm-sistema-template/SKILL.md` — scaffold de bootstrap (SSoT del cuerpo)
- `.claude/skills/pm-vitalia/SKILL.md` — instancia activa de referencia
- `CLAUDE.md` § 10 Brand verticals — catálogo + estado de bootstrap
