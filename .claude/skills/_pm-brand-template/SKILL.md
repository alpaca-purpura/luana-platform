---
name: _pm-brand-template
description: "Template scaffold para crear /pm-{brand} skill nuevo cuando se hace bootstrap de una brand pendiente (saasora, inmoflow, retailly, fixia, guestly, fitflow). NO ES UN SKILL EJECUTABLE — es scaffold copy-paste. Para usar: cp -r .claude/skills/_pm-brand-template .claude/skills/pm-{brand} y reemplazar placeholders. Activa SOLO cuando user pide 'bootstrap brand {slug}'."
allowed-tools: Read, Write, Edit, Bash
model: opus
---

# _pm-brand-template — scaffold

> **NO INVOCAR DIRECTO.** Este skill es solo scaffold para bootstrap brand nueva.

## Bootstrap workflow brand nueva

Cuando Chris pide "bootstrap brand {slug}" (ej. saasora, inmoflow, retailly, fixia, guestly, fitflow):

```bash
SLUG="<lowercase-slug>"
NAME_CAP="<Capitalized name>"
VERTICAL="<vertical short description>"
TRIGGERS_EXTRA="<comma-separated extra triggers in quotes>"

# 1. Crear estructura física brand
mkdir -p ${SLUG}/{backend,frontend,config,deploy/{k8s,cloudflared}}
mkdir -p ${SLUG}/docs/{product/{outcomes,stories,capabilities,modules},domains,learnings,architecture}
mkdir -p ${SLUG}/.claude/{rules,skills}

# 2. Copiar templates docs (heredan de Luana core paradigm v4)
# (usar mismos templates que generamos en F1 reorg multimarca)

# 3. Crear /pm-{slug} skill
cp -r .claude/skills/_pm-brand-template .claude/skills/pm-${SLUG}
# Reemplazar placeholders {{SLUG}}, {{NAME_CAP}}, {{VERTICAL}}, {{TRIGGERS_EXTRA}} en SKILL.md

# 4. Crear ${SLUG}/config/brand.yaml inicial
cat > ${SLUG}/config/brand.yaml << YAML
brand: ${SLUG}
vertical: "${VERTICAL}"
compliance_level: standard            # standard | hipaa-lite | pci | etc.
enabled_sections: []                  # brand opt-in para brand-studio sections
preset_pack: ""                       # offer-studio preset pack vertical
enabled_metrics: []                   # analytics opt-in
extension_points_enabled: []          # EP-1..EP-18 opt-in
core_packages_pinned:                 # versiones luana-core-* opt-in
  luana-core-platform: "^0.1"
  luana-core-iam: "^0.1"
YAML

# 5. Crear 1-pager portfolio entry
# (auto-gen via make portfolio cuando se ejecute después)

# 6. Bootstrap initial docs
# - ${SLUG}/docs/product/checkpoint.md (state global brand)
# - ${SLUG}/docs/product/BACKLOG.md (vacío, auto-gen target)
# - READMEs por subdir (heredados patrón F1 reorg multimarca)

# 7. Verificar
ls ${SLUG}/
ls ${SLUG}/docs/
ls .claude/skills/pm-${SLUG}/
```

## Template SKILL.md para /pm-{slug}

> **Reemplazar placeholders {{...}} antes de mover a `.claude/skills/pm-{slug}/SKILL.md`.**

```markdown
---
name: pm-{{SLUG}}
description: "PM {{NAME_CAP}} — owner del SSoT funcional brand {{NAME_CAP}} ({{VERTICAL}}). Pointer-first: carga {{SLUG}}/docs/product/checkpoint.md + BACKLOG.md en bootstrap. Owner: {{SLUG}}/docs/product/{outcomes,stories,capabilities,modules}/, {{SLUG}}/docs/learnings/, {{SLUG}}/docs/architecture/, {{SLUG}}/docs/domains/. Hereda paradigm v4 (10 estados macro) de Luana core. Activa: '/pm-{{SLUG}}', 'estado {{SLUG}}', '{{SLUG}} backlog', '{{SLUG}} story', '{{SLUG}} outcome', '{{SLUG}} capability', '{{SLUG}} learning'{{TRIGGERS_EXTRA}}."
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent
model: opus
---

# /pm-{{SLUG}} — Brand PM {{NAME_CAP}}

> Owner del SSoT funcional brand. Hereda paradigm v4 de Luana core.

## Vertical

{{VERTICAL}}

(...heredar resto del template idéntico a /pm-nicolify, /pm-vitalia, /pm-comunify, /pm-lupulo
con placeholders reemplazados...)
```

## Checklist post-bootstrap

- [ ] Estructura física `{slug}/` creada
- [ ] `{slug}/config/brand.yaml` con frontmatter inicial
- [ ] `{slug}/docs/` con templates iniciales heredados (BACKLOG, checkpoint, READMEs)
- [ ] `.claude/skills/pm-{slug}/SKILL.md` creado con placeholders reemplazados
- [ ] `make portfolio` regenerado para incluir nuevo brand en `docs/portfolio/PORTFOLIO.md`
- [ ] Commit + push (Conventional Commits: `feat({slug}): bootstrap brand topology`)
- [ ] Update `docs/portfolio/{slug}.md` 1-pager (auto-gen via make portfolio)
- [ ] Update CLAUDE.md raíz portfolio table si aplica
- [ ] Probar en sesión nueva: `/pm-{slug}` → bootstrap protocol

## Próximas acciones post-bootstrap

1. Brand owner (Chris) define primer outcome en `{slug}/docs/product/outcomes/`
2. Decompose en stories
3. /po-ux o /po o /ux-agentico drafts spec
4. /architect cierra ready package
5. /dev-team autonomous build
6. /auditor + /pm-{slug} merge

## Referencias

- `.claude/skills/pm-nicolify/SKILL.md` — ejemplo concreto template aplicado
- `.claude/skills/pm-luana/SKILL.md` — PM Luana unificado (Modo Portfolio reconoce el brand nuevo después bootstrap + Modo Core recibe futuras promotion candidates del brand). Alias `/pm` apunta acá.
- `docs/architecture/luana-platform/01-core-audit.md` — plan multibrand original con catálogo 10 brands
