---
proposal_id: EXAMPLE-voice-cloning-lift
state: proposed                # EJEMPLO ILUSTRATIVO — no actuar sobre este file
opened_date: 2026-05-15
opened_by: /pm-luana (ejemplo)
ratified_by: null
ratified_date: null

# Origen
origin_learnings:
  - comunify/docs/learnings/2026-05-14-voice-cloning-pipeline.md
  # (futuro hipotético) - fitflow/docs/learnings/{date}-voice-coach-onboarding.md

origin_brands: [comunify]
# fitflow es candidato hipotético cuando bootstrappee y necesite onboarding por voz

# Target
target_package: core/luana-core-voice
target_module: src/luana_core_voice/cloning/
target_ep: EP-19  # NEW extension point: VoiceCloning.providerRegister

# Impact assessment
semver_bump: minor
breaking_change: false
brands_affected_consumers: [comunify, fitflow-future]
brands_at_risk_regression: [comunify]

# Lift plan
lift_estimated_effort: "3-5 days"
lift_owner: /dev-team
arch_test_downstream_required: true
migration_notes_required: false
---

# EJEMPLO — Voice Cloning Pipeline lift to core

> **NOTA:** Este file es ilustrativo del template. Documenta un escenario hipotético
> que podría ocurrir si después de bootstrappear FitFlow descubrimos que el patrón
> de voice cloning de Comunify aplica también para fitness coaching. NO actuar.

## 1. Patrón a promover

Pipeline completo de voice cloning con providers (Eleven Labs, OpenAI TTS),
storage de samples, fingerprinting, generación de audio cloneable. Hoy vive
en `comunify/backend/src/modules/comunify/voice/` (~60+ tests, 4 commits
recientes — ver `git log` en main).

**Origen story:**
- Comunify: T-voice-1..4 + T-voice-handlers (commits 48588de + d41d117)
- Capability: voice-cloning-pipeline (shipped Story 12)

## 2. Por qué cross-brand

| Brand | Aplicabilidad | Razón |
|---|---|---|
| Comunify | ya implementa | origen — creator clones own voice for content scaling |
| FitFlow (futuro) | candidato fuerte | coach clones voice for personalized workout audio guidance |
| Vitalia | candidato medio | doctor voice clone para mensajes de seguimiento (compliance HIPAA-lite issue, evaluar) |
| Lupulo | no aplica | vertical no usa audio personalizado |
| Nicolify | no aplica | agencias delegan content, no producen voz |

**Aún NO califica para promotion en realidad** — solo 1 brand consumidor activo
(Comunify). Esperar a que aparezca segundo brand consumidor (FitFlow bootstrap)
antes de abrir proposal real. Este ejemplo muestra cómo **debería redactarse**
cuando llegue el momento.

## 3. Análisis técnico

### Signature comparison

```python
# Comunify actual (comunify/backend/src/modules/comunify/voice/cloning_service.py)
class VoiceCloningService:
    def clone_voice(
        self, tenant_id: UUID, sample_audio: bytes,
        voice_metadata: ComunifyVoiceMetadata
    ) -> ComunifyVoiceClone: ...

# Propuesta core (core/luana-core-voice/src/luana_core_voice/cloning/service.py)
class VoiceCloningService:
    def clone_voice(
        self, tenant_id: UUID, sample_audio: bytes,
        metadata: VoiceMetadata,            # generic, sin "Comunify"
        provider: VoiceProvider             # injection (EP-19 candidate)
    ) -> VoiceClone: ...                    # generic
```

### Risk assessment

| Riesgo | Severidad | Mitigación |
|---|---|---|
| Comunify-specific business rules en service (ej. authority-vault link) | Alta | Extract via callback hook o evento dominio. Service core no conoce authority |
| Provider lock-in (Eleven Labs hardcoded) | Media | EP-19 nuevo: `VoiceCloning.providerRegister(provider: VoiceProviderDef)` |
| Storage R2 vs Vitalia HIPAA-lite quizás necesita storage encriptado | Alta | EP-19 incluye `storage_strategy` parametrizable |
| Pricing (cost per minute audio generado) cross-brand → billing implication | Media | `core/luana-core-billing` ya tiene `BudgetGuard` — integrar |

## 4. Lift plan

### Pre-lift checklist (HIPOTÉTICO)

- [ ] Generalizar interface — quitar refs `ComunifyVoiceMetadata`
- [ ] Definir EP-19 contract en `core/luana-core-extension-sdk/`
- [ ] Tests unitarios en `core/luana-core-voice/tests/`
- [ ] Documentación en `docs/core-modules/voice.md`
- [ ] CHANGELOG entry
- [ ] FitFlow bootstrap completo + outcome adopt-voice-cloning iniciado

### Lift execution (HIPOTÉTICO)

1. Crear `core/luana-core-voice/` package skeleton
2. `git mv` archivos comunify/backend/src/modules/comunify/voice/* → core
3. Generalizar interfaces (parametrizar Comunify-specific bits)
4. Definir EP-19 + registrar en extension SDK
5. Bump `core/luana-core-voice/pyproject.toml` v0.1.0 → v0.2.0 (o partir de v0.1.0 si nuevo package)
6. R3 arch test downstream:
   - `cd comunify/backend && pytest tests/modules/comunify/voice/ -v` (debe pass post-lift)
   - `cd fitflow/backend && pytest tests/modules/fitflow/voice/ -v` (cuando exista)
7. Update Comunify para consumir `luana-core-voice` package via `comunify/config/brand.yaml::enabled_features.voice_cloning: true`

### Post-lift

- Comunify (origen): refactor consumer
- FitFlow (target): outcome `adopt-voice-cloning` iniciado por `/pm-fitflow`
- Otras brands: opt-in en futuro si emerge necesidad

## 5. Decisión

**Recomendación `/pm-luana`:** _N/A — este file es ejemplo ilustrativo, no proposal real_

**Razón:** Solo 1 brand consumidor (Comunify). No califica como cross-brand pattern aún.
Esperar a que FitFlow esté bootstrappeado y demuestre necesidad concreta antes de abrir
proposal real.

## 6. Bitácora

- 2026-05-15: file creado como ejemplo durante reorg multibrand F3

## 7. Cross-references

- Origin learning (real): `comunify/docs/learnings/voice-cloning-pipeline.md` (futuro)
- Capability shipped: `comunify/docs/product/capabilities/voice/voice-cloning-pipeline.yaml` (legacy: `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/capabilities/comunify/voice-cloning-pipeline.yaml`)
- Process docs: `docs/promotion-protocol/README.md`
- Template: `docs/promotion-protocol/template-proposal.md`
