# Continuation impl-log — nicolify-r1-abel-icp-buyer (2026-06-04, sesión nueva)

> `/dev-team` retoma `state: reviewing`. Mandato: cerrar deferrals + deuda + demo_signoff.
> Decisiones de Chris esta sesión: (1) LLM gateway Chinese-first model-independent (DeepSeek+Kimi base, OpenAI excepción); (2) E2E = flujos completos en una sesión (journey/serial); (3) UI defender en el loop E2E/live-verify; (4) W1/W2 → graduar follow-up `/pm-luana`.

## Fase 0 — infra (DONE)
- Redis up (`luana_redis_dev` alias en `luana_dev_net` → 172.19.0.9, PONG). App `redis.asyncio` conecta (`redis_connected` en logs).
- Migración 002 verificada (`abel_icps` + `abel_buyers`).
- Inventario datos prueba: owner.demo 2 ICPs · Chris(e4373552) 1 "Nuevo ICP" · tenant demo#37 1 ICP.

## Fase 1 — LLM gateway Chinese-first (DONE + verificado live)
**Artefactos (tracked):** `deploy/litellm/config.dev.yaml` · `deploy/litellm/.env.example` · `scripts/litellm-proxy-up.sh` · `docs/promotion-protocol/proposals/2026-06-04-llm-gateway-chinese-first.md`.
**Gitignored:** `deploy/litellm/.env` (keys DeepSeek+Moonshot+OpenAI) · `nicolify/.env.dev` (AI_PROVIDER_*/AI_MODEL_* Chinese-first + LITELLM_BASE_URL).

**Arquitectura:** engine `ModelRole` (carga cognitiva, ya existía) + gateway OpenAI-compat (LiteLLM proxy compartido cross-brand). Model-independence: switch = cambiar `AI_MODEL_<ROLE>`/`AI_PROVIDER_<ROLE>` env o binding DB, cero cambio de código. Matriz: NANO/FAST→deepseek-v4-flash(non-thinking) · REASONING→deepseek-reasoner · AGENT/VISION→kimi-k2.5 · EMBEDDING→openai(excepción).

**Bug encontrado + fix:** engine emite `{provider}/{model}` → proxy `model_name` debe ser provider-prefixed (`deepseek/deepseek-v4-flash`, `kimi/kimi-k2`). Config + `AI_PROVIDER_*` env alineados.

**Verificado LIVE (DeepSeek V4 Flash vía proxy):**
- `POST /api/v1/abel/icp/extract` (seed text) → job done ~16s → borrador REAL: label "Agencias de marketing digital en LatAm", vertical/company_size/geo/business_model/sales_cycle/main_pain/sales_angle (Spanish neutro) + 3 signals + anti_pattern + **2 buyers propuestos** (Fundador/CEO, Director Comercial). `status=borrador origin=draft` (RN-3 draft-first respetado).
- `growth_studio_event` emitido + persistido **sin PII** (icp_id hasheado `cf48d7d7…`, token counts). Eventos: `propose_icp_draft` + `abel_icp_extraction_cost` (model=deepseek/deepseek-v4-flash, in=1171 out=1443).
- 0 traceback.

**Deferrals cerrados por esta fase:** extract→borrador happy ✅ · growth_studio_event telemetría (Redis) ✅ · propuesta baseline ahora capturable (origin=draft ICP `89d93bed` existe) ✅.
**Follow-up (no-bloqueante, en el proposal /pm-luana):** cost_usd=null (falta pricing snapshot modelos chinos) · fold proxy a root compose · default-flip Chinese-first en core config.

## Fases pendientes
- Fase 2 — E2E hardening (HB-32): journey/serial specs self-provisioning, retries:0, next build+start, cold-start, capturar baselines (incl. propuesta + arranque).
- Fase 3 — DoD #37 anti-masking (HB-33): endurecer rule.
- Fase 4 — re-verify live completo (cold + slug-as-Chris + seeded) + **UI defender** (design-system critique).
- Fase 5 — cleanup datos prueba.
- Fase 6 — STOP → demo_signoff Chris → /pm-nicolify merge.
