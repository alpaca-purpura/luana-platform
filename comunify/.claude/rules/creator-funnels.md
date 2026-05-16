# Comunify — Creator Funnels + Community + Voice Cloning

**Overlay:** extiende `.claude/rules/` raíz Luana platform (refuerza `tenant-isolation.md` + `sales-agent-brand-voice.md`).
**Brand:** comunify (Creator Economy + Educación — coaches, creators, infoproductores, cohort-based)
**Scope:** integridad de funnel ladder, motor de comunidad multi-cohort, voice cloning sales_agent, authority vault.

## Regla cardinal

Comunify opera con DOS dimensiones de aislamiento simultáneas: `tenant_id` (creator) + `cohort_id` (cohort within creator). Toda query sobre data community/cohort MUST aplicar el dual filter. Voice cloning requiere consent stored + voice_profile_id válido o fallback default — NUNCA voz raw sin consent.

## Funnel ladder canónico

Stages SSoT (validados por OfferTypePreset comunify): `lead_magnet | tripwire | core_offer | upsell | continuity`.

Reglas integridad ladder enforced por validator en `core/luana-core-offer-studio/` con flag `comunify_ladder_strict: true`:

- `continuity` requiere `core_offer` activo previo (no podés vender membership sin curso base).
- `upsell` requiere `core_offer` o `tripwire` precedente (upsell huérfano = error).
- `tripwire` debe price <= 30% del `core_offer` lowest price (definición tripwire).
- `lead_magnet` price MUST == 0 (validator hard).
- Stage transition `tripwire → core_offer` y `core_offer → continuity` trackeada en `funnel_journey_events` (analítica).

## Authority Vault

- Brand-config `comunify/config/brand.yaml::vault_enabled: true` activa módulo vault.
- `authority_vault_items` table: `(tenant_id, item_type, attribution_name, attribution_consent_url, consent_timestamp, content, ...)`.
- Item types: `testimonial | case_study | press_mention | credential | award | guest_appearance`.
- **Attribution + consent fields obligatorios** — vault item sin `attribution_name` + `consent_timestamp` no se publica (validator hard, arch test enforces).
- Items expirables: `consent_expires_at` opcional; cron despublica expirados.

## Community engine

Brand-extension `comunify/backend/src/modules/comunify/community/` (cohorts, members, posts, gamification).

### Dual filter obligatorio
- TODA query community MUST aplicar `.where(Model.tenant_id == tenant_id, Model.cohort_id == cohort_id)`.
- Arch fitness test `comunify/backend/tests/architecture/test_community_dual_filter.py` enforces.
- Cross-cohort data leak (member de cohort A ve post cohort B) = CRITICAL bug → revert + post-mortem.

### Cohort lifecycle
Stages canónicos: `pre_launch | open | running | closed | replay`.

Acciones permitidas por stage (validator strict en `cohort_state_machine.py`):

| Stage | Membership purchase | New posts | Live calls | Replay access |
|---|---|---|---|---|
| `pre_launch` | early-bird only | NO | NO | NO |
| `open` | YES (priced full) | NO | NO | NO |
| `running` | YES (late-join discount) | YES | YES | NO |
| `closed` | NO | members only | YES | NO |
| `replay` | replay-only tier | NO | NO | YES |

Transition `running → closed → replay` event-driven (no time-driven), trigger manual creator o cron schedule.

### Community moderation
- Posts pasan por `moderation_pipeline` en brand-extension (NSFW + spam + off-topic + PII leak).
- Pipeline async: post created → `moderation_pending` status → result `approved | flagged | rejected`.
- Channel `community_alerts` (Slack/email creator) notifica posts flagged.
- Members con N posts rejected → escalación admin.

## Voice cloning sales_agent

Comunify es PRIMERA brand que adoptó voice cloning (Story 12).

### Patrón persona + voice
- `sales_agent.personas` per-tenant carga campo `voice_profile_id` apuntando a ElevenLabs voice ID.
- Si `voice_profile_id` missing o ElevenLabs API falla → fallback default `voice_id: comunify_default_neutral_es_latam`.
- Tests obligatorios: (a) persona con voice_profile_id válido genera audio con ese voice, (b) persona sin voice_profile_id usa fallback (no raise), (c) ElevenLabs 5xx → fallback (no raise).

### Consent voice cloning
- Tabla `voice_profile_consents` registra `(tenant_id, voice_profile_id, consent_doc_url, signed_at, signer_name, signer_role)`.
- Crear `voice_profile_id` sin row consent = error. Validator en `voice_profile_service.py`.
- Voice profile revocable: `revoked_at` → sales_agent fallback inmediato a default.

## Tests requeridos

PR comunify tocando `community/`, `cohort/`, `vault/`, `voice_profile/`, `funnel/` MUST incluir tests:

1. **RBAC by role:** member-only endpoint con creator role → 403; creator endpoint con member → 403; admin tenant role → permitted.
2. **Tenant+cohort dual filter:** request `tenant_A + cohort_X` siendo user de `tenant_A + cohort_Y` → 404 (no leak data ni hint existe).
3. **Attribution preservation:** vault item creation sin `attribution_name` → 400; con valid → row inserted con consent_timestamp.
4. **Ladder integrity:** offer `continuity` sin `core_offer` activo → validator raise; con valid ladder → permitted.
5. **Cohort state machine:** intento `new_post` en cohort stage `open` → 409 conflict.
6. **Voice fallback:** persona sin voice_profile_id → audio generado con voice default sin error.
7. **Voice consent enforcement:** crear voice_profile sin consent row → validator raise.

## Anti-patterns prohibidos

- Cross-cohort data leak (single filter `tenant_id` sin `cohort_id`). CRITICAL bug.
- Vault items sin `attribution_name` o sin `consent_timestamp` published.
- Voice clone usage sin consent row stored.
- Ladder skip: vender `continuity` sin `core_offer` previo activo.
- Hardcodear voice IDs ElevenLabs en código (siempre via `voice_profile_id` lookup).
- Moderation pipeline bypass (post creado con `status: approved` directo sin pasar pipeline).
- Cohort stage transition forzada sin pasar state machine (`cohort.stage = "closed"` directo prohibido).
- Replay tier access a cohorts sin `replay` stage activo.
- Member-to-member DM sin tenant+cohort dual filter (privacy leak cross-cohort).

## Referencias

- Raíz: `.claude/rules/tenant-isolation.md`, `.claude/rules/sales-agent-brand-voice.md`, `.claude/rules/auditor-downstream-regression.md`
- Brand config: `comunify/config/brand.yaml` (vault_enabled, comunify_ladder_strict, voice_cloning_enabled)
- Brand module home: `comunify/backend/src/modules/comunify/`
- Offer ladder validator: `core/luana-core-offer-studio/src/luana_core_offer_studio/validators/ladder_integrity.py`
- Voice profile service: `comunify/backend/src/modules/comunify/voice_profile/`
- ElevenLabs adapter: `core/luana-core-connections/src/luana_core_connections/elevenlabs/`
