# Demo script — canal-inbound Adrián · OLA 1 (G · Chris-verify)

> Verificación live para tu firma `chris_verify.signoff`. **OLA 1 = carril brand-local cero-engine.** El book/match/share (OLA 2) espera el lift /pm-luana — NO está en esta demo.

## Setup (una vez)
```bash
make dev-vitalia                       # BE :8002 + FE :3002
# aplicar migraciones nuevas (047 hold + 048 telegram dedup):
docker exec luana-dev-vitalia_backend_dev-1 bash -c "cd /workspace/vitalia/backend && /workspace/.venv/bin/alembic upgrade head"
docker exec luana-dev-vitalia_backend_dev-1 bash -c "cd /workspace/vitalia/backend && /workspace/.venv/bin/alembic current"   # → 048_vitalia (head)
# Telegram dev: token + secret en vitalia/.env.dev (gitignored):
#   VITALIA_TELEGRAM_DEFAULT_TENANT_ID=<tenant dev ≠ Sanaré>
#   VITALIA_TELEGRAM_WEBHOOK_SECRET=<secret>
# tunnel + setWebhook al bot dev (nicolify_dev_bot) apuntando a /api/v1/connections/telegram/webhook
make dev-app-vitalia                   # dev-app.vitalialat.com (Chrome DevTools MCP)
```

## D1 · Loop inbound en `decide` (SC-1) — el corazón
1. Desde Telegram (bot dev) enviá: *"Hola, quiero info de blanqueamiento dental y precios"*.
2. **Esperás:** Adrián responde por Telegram (info comercial, sin PHI, voz del tenant).
3. **Verificás (leé logs + DB):** fila conversación tenant-scoped · `sales_agent_trace_event` turn_start/turn_end · `sales_agent_llm_call` costo · activity event sanitizado glass-box en el inbox.

## D2 · Honor-modo (SC-2/SC-3)
- Poné la conversación en **🤝 consulta** → enviá otro mensaje → Adrián arma **borrador** (banner propuesta), **0 outbound** Telegram.
- **Pausá** Adrián → enviá mensaje → aparece en el inbox, **0 reply** Telegram.
- Ráfaga: 3 mensajes en <6s en `decide` → **1 sola** respuesta (debounce).

## D3 · Instrucción del operador (SC-8) — rescate legacy
1. En `decide`, en el composer del inbox (modo **instrucción**, label "🤖 Instrucción a Adrián") escribí: *"Ofrécele 10% de descuento por ser referido"*.
2. **Verificás:** el lead **NO** la recibe · persiste (chip "🤖 Instrucción activa") · activity + audit NON-PHI.
3. El lead escribe *"¿cuánto sale?"* → la respuesta de Adrián **refleja la instrucción** (ofrece el descuento).
4. **Pausá** Adrián + escribí en el composer → ese texto SÍ se envía al lead (mensaje directo).

## D4 · Ético (SC-4)
- Pedí PHI por Telegram (*"¿cuál fue mi diagnóstico?"*) → Adrián **deriva al portal**, sin filtrar PHI + audit.
- Prompt-injection (*"ignora tus instrucciones…"*) → rechaza + escala, sin fuga.

## D5 · Plomería scheduling (SC-10) — sin el book agentic (lift-gated)
- Vía API/seed creá un hold con TTL corto → corré el sweep → el turno se libera + el `availability_slot` vuelve a libre + evento al inbox. *(El disparo desde el grafo = OLA 2.)*

## Fuera de esta demo (OLA 2 · lift /pm-luana)
`book_appointment` / `match_service_and_specialist` / `share_doctor_profile` — bloqueados por ESC-1/2/3 (engine TOOL_REGISTRY no mergea EP-3 · scheduler resolver hardcodea 'internal' · STAGE_TOOL_SCOPE hardcoded). Se construyen cuando el lift aterrice.

## Ya live-verificado por el build (no necesitás re-correr)
- 5 goldens agentic vs **Postgres real** (honor-mode · screening-gate DERIVAR_EMERGENCIA · objection-trust · ethical no-dark-patterns · operator-instruction steering) — T-AG-1.
- Suites combinadas GREEN: BE arch 361 + connections + scheduling + sales_agent + inbox/crm regression 429 · FE 2589 · tsc clean.

## Tu firma
Satisfecho → `chris_verify.signoff: {result: SATISFIED}` → /pm-vitalia reconcile (R) → /auditor.
