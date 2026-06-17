---
brand: comunify
date: 2026-06-17
slug: engine-deuda-surfaced-by-shell-organism
promotable: candidate
applies_to_other_brands_potentially: [vitalia, nicolify, lupulo]
target_core_package: core/luana-core-platform · core/luana-core-copilot
applied: pending
origin: comunify-shell-organism (1er brand que cablea el sidebar→engine /chat real)
---

# Deuda de engine que aflora al cablear el copilot /chat en una marca multibrand

**Qué aprendimos:** comunify fue la **primera marca** que monta el `/chat` del engine
(`luana_core_copilot.api.chat`) y lo ejerce con tráfico real (vitalia/nicolify escriben sus
propias rutas copilot o mockean). Eso destapó tres deudas del engine que ninguna marca había
tocado. Las tres son **engine work** → `/pm-luana` promotion gate. NO se arreglan desde el hub
de la marca (worktree core + venv-symlink footgun — ver `engine-edits-brand-worktree-invisible-to-venv`).

## 1. Settings legacy exige 16 campos a las marcas (Optional pendiente)

El fix "Settings lazy" (`e9f16d06`, proposal `2026-06-16-copilot-chat-brand-mountable` = accepted)
hizo el **import** perezoso, pero a request-time `luana_core_platform.core.config.Settings` aún
**valida 16 campos required** (`POSTGRES_*`, `WHATSAPP_*`, `QDRANT_URL`, `API_*`, `DOMAIN_NAME`,
`LOG_LEVEL`, `TRAEFIK_NETWORK`, `OPENAI_API_KEY`). comunify (config multibrand: `DATABASE_URL` +
`QDRANT_HOST/PORT` + `LITELLM_*`) los provee como **dummies en el compose** (paridad vitalia) sólo
para no 500-ear. **Correcto:** hacerlos `Optional` en `luana_core_platform` → las marcas dejan de
proveerlos. Follow-up del proposal ya aceptado.

## 2. ★ `_BASE_IDENTITY` del copilot está hardcodeado a "Nicolify" (cross-brand pollution)

`core/luana-core-copilot/.../orchestrator/system_prompt_composer.py:_BASE_IDENTITY` =
*"Eres el copiloto de **Nicolify**…"* — **literal, sin resolución por marca**. NINGUNA marca tiene
persona de copilot propia; vitalia y nicolify heredan ese hardcode. Para comunify, Nina/Luana
responde coherente (el LLM sabe de creator economy) pero su system prompt dice "Nicolify".

**Corrección del diagnóstico previo:** el checkpoint asumía que faltaba **seedear `prompt_versions`**
para la voz comunify. **Falso** — verificado en código: `prompt_versions` lo lee SOLO el
`sales_agent` (suggestions provider), **el copilot chat NUNCA lo consulta**. Materializar esa tabla
+ seedearla = **dead code** para el copilot. La persona por-marca del copilot exige hacer
`_BASE_IDENTITY` **brand-aware** (config/registry por tenant o por marca) en el engine. Es la única
palanca real. Mientras tanto la voz genérica NO bloquea "el chat funciona" (no-fatal, deferido).

## 3. copilot/llm/observability del engine no tienen migraciones

Las tablas del engine (`copilot_conversations` ×13, `model_pricing_snapshot`/`llm_role_binding`/…)
no traen migraciones Alembic; cada marca las **materializa con `create_all` idempotente** en sus
propias migraciones (comunify: `004`/`005`). Funciona pero es frágil (drift de schema silencioso).
Engine debería shippear sus migraciones o un helper de bootstrap versionado.

**Why:** el motor agéntico se diseñó/probó dentro de una sola marca-origen (nicolify); la abstracción
"montable por cualquier marca" recién se ejerce con comunify. Lo que era implícito (config legacy,
identidad hardcodeada, tablas por create_all) se vuelve deuda explícita al segundo consumer.

**How to apply:** cuando una marca consuma una nueva superficie del engine por primera vez, auditar
(a) qué config legacy exige, (b) qué literales de marca trae hardcodeados, (c) si sus tablas tienen
migración propia. Rutear a `/pm-luana` como promotion proposal — NO parchear desde el hub de marca.

**Verificación REAL que lo destapó:** el e2e autenticado `shell-chat-ok.spec.ts` (write real al
`/chat`, no mock) — el mismo que cazó el `/api` rewrite faltante (#2 abajo no, ese fue de FE).
Refuerza [[verification-real-not-200]] + [[dod-live-verify]].
