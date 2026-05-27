# Anti-Duplication — Refining Phase (extends anti-duplication.md)

**Origen:** conversación 2026-05-27 — Chris pidió que `/pm-{brand}`, `/po-ux`, `/po`, `/architect` (refining phase) hereden la disciplina anti-duplication que hoy sólo enforcean builders + auditors. Sin esto, una historia nueva en vitalia puede re-pedir features ya shipped en nicolify (perdiendo el aprendizaje + duplicando trabajo).

**Cement-date:** 2026-05-27. **Complementa:** `.claude/rules/anti-duplication.md` (que cubre EJECUCIÓN — esta rule cubre REFINAMIENTO).

## Regla cardinal

ANTES de refinar/diseñar/arquitecturar una story nueva, los skills `/pm-{brand}`, `/po-ux`, `/po`, `/ux-agentico` y `/architect` MUST ejecutar **mandatory cross-brand + core grep** para detectar:

1. **Pattern ya shipped** en `nicolify/` (brand más madura, ~80% features prod) → reusable directo o como referencia
2. **Engine abstraction** en `core/luana-core-*/` → consumir vía import, NO recrear
3. **Brand activa con feature parecido** (vitalia/comunify/lupulo) → considerar lift a engine como promotion candidate
4. **Learning previo capturado** en `docs/learnings/` o `{brand}/docs/learnings/` → aplicar lecciones antes de repetir

## Workflow obligatorio (Step `prior-art-scan`)

Insertar este step al **inicio** de cada skill `/pm-*`, `/po-*`, `/ux-agentico`, `/architect` (después de Step 0 worktree + ANTES de empezar a redactar 01-spec / 02-design / 03-arch).

### Step `prior-art-scan` (verbatim ejecutable)

```bash
WS=$(git rev-parse --show-toplevel)
STORY_DOMAIN="${STORY_DOMAIN}"      # ej: "agenda", "reservas-prepagadas", "copilot-trigger"
KEYWORDS="${KEYWORDS}"               # ej: "agenda scheduling slots prepago"

echo "=== Engine packages relacionados ==="
ls ${WS}/core/ | grep -iE "$(echo $KEYWORDS | tr ' ' '|')" 2>/dev/null

echo "=== Brands shipped con módulo similar ==="
for B in nicolify vitalia comunify lupulo; do
  find ${WS}/${B}/backend/src/modules/${B}/ -maxdepth 1 -type d 2>/dev/null \
    | grep -iE "$(echo $KEYWORDS | tr ' ' '|')"
  find ${WS}/${B}/frontend/src/features/ -maxdepth 1 -type d 2>/dev/null \
    | grep -iE "$(echo $KEYWORDS | tr ' ' '|')"
done

echo "=== Capabilities ya implementadas ==="
for B in nicolify vitalia comunify lupulo; do
  grep -rln -iE "$(echo $KEYWORDS | tr ' ' '|')" ${WS}/${B}/docs/product/capabilities/ 2>/dev/null
done

echo "=== Stories archivadas relacionadas (done) ==="
for B in nicolify vitalia comunify lupulo; do
  find ${WS}/${B}/docs/archive/*/stories/ -maxdepth 1 -type d 2>/dev/null \
    | grep -iE "$(echo $KEYWORDS | tr ' ' '|')"
done

echo "=== Learnings cross-brand + per-brand ==="
grep -rln -iE "$(echo $KEYWORDS | tr ' ' '|')" ${WS}/docs/learnings/ 2>/dev/null
for B in nicolify vitalia comunify lupulo; do
  grep -rln -iE "$(echo $KEYWORDS | tr ' ' '|')" ${WS}/${B}/docs/learnings/ 2>/dev/null
done

echo "=== Anti-duplication.md inventario ==="
grep -iE "$(echo $KEYWORDS | tr ' ' '|')" ${WS}/.claude/rules/anti-duplication.md 2>/dev/null
```

### Output obligatorio en spec/design/arch

Cada skill MUST documentar el resultado del scan en el artifact que produce:

**`/pm-{brand}`** (durante refinamiento idea→refining): sección `## Prior art scan` en `00-story.md` o `checkpoint.md` con: paths encontrados + decisión (reuse / extend-from-engine / lift-candidate / net-new).

**`/po-ux`, `/po`, `/ux-agentico`** (spec/design): sección `## Prior art applied` en `01-spec.md` o `02-design-agentic.md` con: qué se reusó verbatim, qué se extendió, qué learnings se aplicaron.

**`/architect`** (ready package): sección `## Prior art audit` en `03-arch.md` confirmando: cero mirror cross-brand, engine consumed via import, lift proposals creados (si aplica).

## Decision matrix (al encontrar prior art)

| Encontrado | Acción | Skill responsable |
|---|---|---|
| Engine package `core/luana-core-X` cubre 100% | CONSUMIR via import (`from luana_core_X import ...`). Documentar en arch. | `/architect` |
| Engine cubre 60-99% | EXTEND vía herencia / composición. NUNCA mirror. | `/architect` |
| Brand `nicolify/` tiene módulo parecido + esta brand lo necesita igual | **Lift candidate** → escalate `/pm-luana` para promotion proposal | `/pm-{brand}` |
| Brand `nicolify/` tiene módulo parecido pero diferenciador clínico/vertical existe | Extension SDK EP-N en `{brand}/backend/src/modules/{brand}/X/extensions.py` consumiendo engine | `/architect` |
| Brand otra (no nicolify) tiene pattern parecido | Si feature transversal probable → escalate `/pm-luana` para core lift candidate. Si feature vertical específica → independiente OK. | `/pm-{brand}` |
| Story archivada cubre el mismo problema (state=done) | Leer 07-merge.md de esa story + replicar pattern aplicando learnings | `/po-ux` o `/po` |
| Learning capturado con tag relevante | Aplicar verbatim en spec/design (citar learning path) | TODOS |
| Net-new (nada encontrado relevante) | Proceder con design from scratch. Documentar el scan vacío en spec. | `/po-ux` o `/po` |

## Cross-brand learning extraction — fuentes prior-art REALES (corregido 2026-05-27)

> **★ Corrección 2026-05-27 (post stories sweep audit):** la asunción original "nicolify es brand más madura ~80% prod" referenciaba el estado **pre-multibrand-reorg** (2026-05-15). Post-reorg, el brand-level `nicolify/docs/product/` está **vacío** (24 stories shipped quedaron como **snapshot frozen read-only** en `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/`). Live work post-reorg está principalmente en **vitalia** (27 done + Fase 1 shell complete + Fase 2 in-progress) y **comunify** (2 done). Audit doc: `docs/process/audits/2026-05-27-stories-sweep.md` § Hallazgo CRÍTICO #0.

### Tabla de fuentes prior-art correcta (post 2026-05-27)

| Source | Path | Estado | Cuándo consultar | Skill responsable |
|---|---|---|---|---|
| **vitalia live** | `vitalia/docs/product/{capabilities,modules,outcomes,stories}/` + `vitalia/docs/archive/*/stories/` + `vitalia/docs/learnings/` | brand activa: 27 archived done + Fase 1/2 in-progress + 71 capabilities + 21 learnings | SIEMPRE en refining (brand ACTIVA mejor source LIVE) | `/pm-{brand}`, `/po-ux`, `/po` |
| **comunify live** | `comunify/docs/product/{capabilities,modules}/` + `comunify/docs/archive/*/stories/` + `comunify/docs/learnings/` | brand activa: 2 archived done + 18 capabilities + 4 learnings | SIEMPRE en refining (especialmente patterns creator economy + offer ladder) | `/pm-{brand}`, `/po-ux`, `/po` |
| **engine core** | `core/luana-core-*/src/luana_core_*/` (26 packages) | SSoT engine compartido | SIEMPRE — consumir vía import, NO recrear | `/architect` |
| **nicolify snapshot (archivo arqueológico)** | `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/` | 24 stories + 12 modules + 15 capabilities + outcomes — **FROZEN read-only 2026-05-15** | Como REFERENCIA arqueológica para patterns históricos shipped (NO live work) | `/po-ux`, `/po`, `/architect` (curiosity scan opcional) |
| **lupulo** | `lupulo/docs/product/` | 100% vacío (placeholder) | NO consultar (no hay prior-art aún) | N/A |
| **6 brands futuras** | `{saasora,inmoflow,retailly,fixia,guestly,fitflow}/` | bootstrap pendiente | NO consultar hasta bootstrap real | N/A |

### Recomendaciones prácticas grep

```bash
WS=$(git rev-parse --show-toplevel)
KW="agenda scheduling slot prepago"

# Prior-art LIVE (brands activas)
for B in vitalia comunify; do
  [ "$B" = "$BRAND" ] && continue   # skip self
  echo "=== $B archives ==="
  find ${WS}/${B}/docs/archive/*/stories/ -maxdepth 1 -type d 2>/dev/null | grep -iE "$(echo $KW | tr ' ' '|')"
  echo "=== $B capabilities ==="
  grep -rln -iE "$(echo $KW | tr ' ' '|')" ${WS}/${B}/docs/product/capabilities/ 2>/dev/null
  echo "=== $B learnings ==="
  grep -rln -iE "$(echo $KW | tr ' ' '|')" ${WS}/${B}/docs/learnings/ 2>/dev/null
done

# Engine (consumer-via-import target)
echo "=== Engine packages ==="
ls ${WS}/core/ | grep -iE "$(echo $KW | tr ' ' '|')"

# Snapshot nicolify (referencia histórica, low priority)
echo "=== Nicolify snapshot (frozen) ==="
find ${WS}/docs/archive/2026/snapshot-pre-multibrand-pm-redesign/ -type d 2>/dev/null | grep -iE "$(echo $KW | tr ' ' '|')"
```

### Caveat — nicolify snapshot uso permitido

El snapshot frozen NO está prohibido para consulta — sigue siendo prior-art shipped real. Pero:
- **NUNCA** "lift from snapshot" como first option (la fuente sale del archivo, no es código live mantenido)
- **NUNCA** asumir que pattern en snapshot sigue siendo válido sin verificar contra vitalia/comunify live (puede estar desactualizado)
- **SÍ** usar como pattern archaeology cuando vitalia/comunify no cubren el dominio (ej. CRM ciclo largo agencia B2B existe en snapshot, no en vitalia/comunify)

## Anti-patterns prohibidos

- ❌ Refinar story sin grep cross-brand (sólo grep brand propia → riesgo recrear)
- ❌ /architect produciendo 03-arch.md sin sección `## Prior art audit`
- ❌ /po-ux produciendo 01-spec.md sin mencionar referencia nicolify (si nicolify tiene módulo paralelo)
- ❌ /pm-{brand} cerrando state=refined sin scan documentado
- ❌ Recrear cualquiera de las abstracciones del inventario `anti-duplication.md` § "Inventario engine abstractions (SSoT)" sin lift gate
- ❌ Documentar "prior art scan: clean" sin haber ejecutado el grep verbatim
- ❌ Aplicar learning + no citar el path del learning en spec/arch
- ❌ Lift candidate detectado + no escalar a `/pm-luana` (pollution per-brand silenciosa)

## Enforcement layers

| Layer | Mecanismo | Status |
|---|---|---|
| 1 | `/pm-{brand}` Step 1.5 obligatorio (prior-art-scan) post Step 0 worktree | ⏳ skills updates |
| 2 | `/po-ux` Step 0.5 obligatorio antes de drafting 01-spec | ⏳ skills updates |
| 3 | `/po` Step 0.5 obligatorio antes de drafting 01-spec | ⏳ skills updates |
| 4 | `/ux-agentico` Step 0.5 obligatorio antes de 02-design-agentic | ⏳ skills updates |
| 5 | `/architect` Step 0.5 obligatorio + Step 8 expand checklist con `prior_art_audit_done: true` | ⏳ skills updates |
| 6 | Auditor Cat 12 (anti-duplication) extiende a refining: revisa que sección "Prior art" exista en spec/arch | ⏳ auditor SKILL updates |
| 7 | Pre-commit hook valida que `01-spec.md` / `03-arch.md` contengan "## Prior art" section (advisory warning) | ⏳ TBD |

## Referencias

- `.claude/rules/anti-duplication.md` — execution-phase rule (builders/auditors)
- `.claude/rules/learning-capture.md` — sistema de aprendizajes que esta rule consume
- `docs/promotion-protocol/README.md` — lift gate brand→core
- `docs/portfolio/PORTFOLIO.md` — vista master cross-brand (qué brand tiene qué)
- `nicolify/docs/learnings/` — fuente principal de aprendizajes shipped
