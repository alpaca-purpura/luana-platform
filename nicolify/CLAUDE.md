# Nicolify — Brand overlay

> **Auto-cargado** cuando cwd cae dentro `nicolify/...` o worktree `~/Proyectos/luana-nicolify*/`. Coexiste con root `CLAUDE.md` (no duplica — extiende).

**Brand:** Nicolify. **Vertical:** Agent-as-a-Service para **agencias y servicios profesionales B2B LatAm**.

**Status:** 🟢 **brand activa en rebuild (2026-05-29).** Reseteada a esqueleto desde el producto monolítico original (legacy preservado en branch `legacy/nicolify-original` + worktree `~/Proyectos/luana-nicolify-legacy`). Se reconstruye desde cero con el paradigma **agentic-first** (equipo de agentes Revenue/Ops orquestados). Las 24 stories shipped pre-reorg viven como **referencia arqueológica read-only** en `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/` (NO live work). El `nicolify/docs/product/` se repuebla story-by-story vía releases R0..RN.

## Product vision (pointer)

→ `nicolify/docs/product/vision.md` (full: ecosistema de agentes, nichos Tier 1-3, competidores, diferenciadores, personas, pricing tiers+tokens, GTM, roadmap).

**TL;DR:** Nicolify NO es "otra herramienta" (CRM/pauta/email). Es **el equipo de Revenue & Operaciones que la agencia delega** — agentes IA orquestados bajo un único punto de contacto conversacional (Luana), que ejecutan **Atracción → Cierre → Retención**. Elimina la fragmentación de stack y la dependencia de personal junior. Pricing: suscripción base + tokens, con tiers que desbloquean agentes.

### Los 6 agentes (SSoT de roles · detalle en vision.md)

| Agente | Rol | Etapa | Autonomía clave |
|---|---|---|---|
| **Luana** | Orquestadora / único rostro | Transversal | Rutea/resume/prioriza · nunca ejecuta acción de negocio sin delegar |
| **Abel** | Estratega (Branding & Oferta) | Pre-atracción | Define oferta + ángulos + escalera de valor |
| **Brenda** | Guardiana del Presupuesto (Growth) | Atracción inbound | **Apaga campañas perdedoras** por umbral CAC/ROAS sin pedir permiso |
| **Christian** | Cazador (SDR / outbound) | Atracción outbound | Prospecta con el **LinkedIn real del fundador** · escala humano para cierre |
| **Sara** | Jefa de Proyectos (Operación / Delivery) | Delivery (día a día) | Opera el delivery de proyectos activos · **"Mi Día"** = landing operativo post-login |
| **Norvil** | Cultivador (Account Manager) | Retención + Expansión | Salud de cuenta + cross/up-sell + renovación |

> **Identidad agentic-first (cement 2026-05-29):** CRM/pipeline, pauta, propuestas, salud de cuenta = **superficies que los agentes operan**, NO features standalone. El framing legacy "billable-hours / time-tracking / client-portal" queda **descartado** (Nicolify es Revenue OS, no project-billing).

## Paradigma — 3 planos / 3 zonas (cement 2026-05-30)

Aterriza el modelo platform-wide (`docs/architecture/luana-platform/PARADIGM.md` + `ADR-010`, auto-load vía rule `paradigm-arquitectura.md` #36). Adaptación brand: `ADR-nicolify-002-paradigma-zonas.md`. Nicolify **nace bien** (no migra — cajas finales día 1).

- **3 planos:** ① Sistema (capacidades B2B, operables a mano) · ② Capa de acción única (service layer — web y agentes invocan la MISMA acción) · ③ Trabajadores (Luana supervisora + 5 especialistas, **un solo engine por audiencia**).
- **3 zonas** (`SYSTEM-MAP.yaml::zones` — la zona se DERIVA del registro): **Agentes** (core, visible: abel·brenda·christian·**sara**·norvil; **Luana supervisora fuera del grid**) · **Plataforma** (supporting, visible: acceso·onboarding·configuracion) · **Infraestructura** (enabling, oculta: seguridad-cumplimiento *sin PHI* · observabilidad · plataforma-tecnica · motor-agentico).
- **Sara = "Operar / Mi Día"** (Jefa de Proyectos · equivalente a Mateo de vitalia con lógica de agencia): dueña de la operación del día a día (delivery de proyectos activos). Su `mi-dia` es el landing operativo post-login. NO se confunde con Norvil (salud comercial) ni con Luana (digest cross-ciclo).
- **Audiencia:** internos (`copilot`→dueño) = Luana/Abel/Brenda/Sara/Norvil · **Christian = bifronte** (`copilot`+`sales_agent`: el dueño le pide reuniones / él contacta prospectos + recepción pasiva inbound). Toda cap declara su caja desde la **idea**.

## Verticales target (quick reference · detalle vision.md § 2)

| Tier | Verticales | Modelo | Agente protagonista |
|---|---|---|---|
| **Tier 1 (MVP)** | Agencias marketing/publicidad · Boutiques de software | Retainer / proyecto alto | Brenda + Abel / Christian + Norvil |
| **Tier 2 (6-12m)** | Consultoría estratégica · Headhunting/staffing · MSP/ciberseguridad | Consultivo / retención | Christian + Norvil |
| **Tier 3 (a validar)** | Arquitectura/ingeniería/diseño industrial · SaaS vendors · contables/fiscal · PR/comunicación · brokers seguros · capacitación corporativa · logística | Account-based largo | Christian + Norvil |

Filtro común: alto ticket + ciclo largo + separación Cuenta/Stakeholder + retención/upsell + atracción relacional/outbound. **DESCARTADOS:** B2C, retail, ciclo < 1 semana, salud (Vitalia), oficios/hogar (Fixia).

## Brand-specific gates

### Token economy + protección de margen (HARD)

Nicolify es AaaS intensivo en LLM. El margen depende de medir y acotar el uso:
1. **Metering por agente + acción** — toda llamada LLM registra costo (consume `core/luana-core-observability/` cost recording + FX resolver, NUNCA recrear).
2. **Tier gating** — un tenant Básico no puede invocar a Christian/Norvil (feature flag por tier vía `core/luana-core-billing/` BudgetGuard).
3. **Alertas de recarga** progresivas (80/95/100% de la bolsa de tokens).
4. **Funciones críticas NUNCA se cortan** aunque la bolsa se agote: soporte + recepción pasiva de leads por WhatsApp siguen activos (no se pierde un lead entrante). Las funciones proactivas/intensivas (outbound masivo, generación de creatives) sí se pausan hasta recarga.

### Autonomía de agentes con guardrails (HARD)

- **Brenda kill-switch:** apaga campañas perdedoras según umbrales CAC/ROAS **predefinidos por el dueño** — toda acción de contingencia registra audit row + se reporta vía Luana. NUNCA umbral hardcodeado.
- **Christian outbound con autoridad del fundador:** prospección usa el **perfil LinkedIn real del fundador/CEO** — requiere consentimiento explícito del dueño + respeto de límites de la plataforma (anti-spam, rate limits LinkedIn) + opt-in humano antes de escalar al cierre.
- **Norvil contacto comercial:** propone cross/up-sell pero el contacto comercial real requiere **aprobación humana** (B2B exige control del Account Manager).
- **Luana nunca ejecuta acción de negocio directamente** — siempre delega al agente owner del territorio.

### B2B contracts / multi-currency (cuando aplique)

- Propuestas/contratos con firma electrónica (eIDAS-like LatAm: AR Ley 25.506 · MX FIEL · CO Ley 527 · BR ICP-Brasil) — superficie que opera Christian/Norvil.
- Multi-currency: la cuenta (cliente de la agencia) puede tener moneda distinta del tenant — preservar `account.currency`, NUNCA convertir on-write (ver `.claude/rules/currency-handling.md`).
- Retención de docs comerciales 5-10 años per jurisdicción.

### Brand-specific anti-patterns

- ❌ Vender/diseñar Nicolify como "herramienta de features" en vez de "equipo de agentes delegable" (rompe la propuesta de valor)
- ❌ Reintroducir billable-hours / time-tracking / client-portal como core (descartado 2026-05-29)
- ❌ Hardcodear umbrales CAC/ROAS de Brenda (siempre desde config del tenant)
- ❌ Outbound de Christian sin consentimiento explícito del dueño por su LinkedIn (riesgo reputacional + ToS LinkedIn)
- ❌ Cortar recepción pasiva de leads por agotamiento de tokens (se pierde un lead = se rompe la confianza)
- ❌ Hardcodear monedas (multi-currency mandatory — B2B net-30/60/90, no contado)
- ❌ Recrear orquestación agéntica / CRM / observabilidad-costo en `nicolify/` (consumir `core/luana-core-*`)
- ❌ Voseo en UI (Nicolify es LatAm neutro — voseo OK solo en output de sales_agent si tenant AR)

## Brand-specific commands

```bash
WS=$(git rev-parse --show-toplevel)

make dev-nicolify                              # BE :8001 + FE :3001
docker logs luana-nicolify-backend-dev --tail 100
docker logs luana-nicolify-frontend-dev --tail 100
cd ${WS}/nicolify/backend && ${WS}/.venv/bin/pytest tests/modules/nicolify/{module}/ -v
cd ${WS}/nicolify/backend && ${WS}/.venv/bin/pytest tests/architecture/ -x -q
cd ${WS}/nicolify/frontend && npx tsc --noEmit
cd ${WS}/nicolify/frontend && E2E_BASE_URL=http://localhost:3001 npx playwright test --project=smoke
docker exec luana-nicolify-backend-dev alembic upgrade head
curl http://127.0.0.1:8001/health
```

## Brand-specific skills

- `/pm-nicolify` — owner SSoT funcional Nicolify (vision/releases/stories/capabilities/modules)
- `/po-ux` — refining stories UI std nicolify
- `/po` — refining stories service nicolify
- `/ux-agentico` — refining stories conversacionales (Luana orquestadora, Christian outbound, Norvil retención, Brenda growth)
- `/architect`, `/dev-team`, `/auditor` (con `<brand>: nicolify`)
- `copilot-expert` / `sales-agent-expert` — al tocar `nicolify/backend/src/modules/nicolify/{copilot,sales_agent}/`

## Cross-brand learning sources (prior-art para refining)

Nicolify arranca de cero post-reset. **Cross-brand prior-art OBLIGATORIO** (`.claude/rules/anti-duplication-refining.md`):

| Source | Path | Cuándo consultar |
|---|---|---|
| `core/luana-core-*/` engine (26 packages) | `core/luana-core-*/src/luana_core_*/` | SIEMPRE — consumir vía import (copilot, sales-agent, crm, offer-studio, observability, channels, billing) |
| `vitalia/` live | `vitalia/docs/{product/capabilities,learnings}/` + `vitalia/frontend/` | SIEMPRE — fuente del **paradigma shell-organism agéntico** + base FE madura a reusar |
| `comunify/` live | `comunify/docs/{product/capabilities,learnings}/` | SIEMPRE — patterns creator/offer ladder |
| `nicolify` snapshot (arqueológico) | `docs/archive/2026/snapshot-pre-multibrand-pm-redesign/` | Referencia histórica patterns B2B/CRM/propuestas shipped pre-reorg — **read-only frozen, NO live** |

## Brand checkpoint pointer

```bash
cat nicolify/docs/product/checkpoint.md            # State brand actual (rebuild)
cat nicolify/docs/product/vision.md                # Visión de negocio
ls  nicolify/docs/product/releases/                # R0..RN
ls  nicolify/docs/product/stories/                 # stories activas
```

## Voz nicolify

Spanish neutro LatAm (**tuteo**, sin voseo). Tono: profesional cercano, directo, de "mano derecha que ejecuta" — NUNCA jergoso, NUNCA frío corporativo. Luana habla como un Chief of Staff competente. Sales_agent (Christian/outbound): respeta voz tenant (puede ser voseo AR si tenant AR). Ver `.claude/rules/spanish-text.md`.

## Bootstrap nicolify (fresh clone)

```bash
WS=$(git rev-parse --show-toplevel)
cd ${WS}
cp nicolify/.env.dev.template nicolify/.env.dev
make dev-nicolify
docker exec luana-nicolify-backend-dev alembic upgrade head
curl http://127.0.0.1:8001/health
```

## Referencias

- `nicolify/docs/product/vision.md` — full vision (agentes + nichos + competidores + personas + pricing + GTM)
- `nicolify/docs/product/checkpoint.md` — state brand actual
- `nicolify/.claude/rules/agent-revenue-engine.md` — overlay rule (autonomía + token economy + CRM account model + outbound compliance + § 0 encaje paradigma)
- Paradigma: `docs/architecture/luana-platform/{PARADIGM.md, ADR-010}` (platform) + `nicolify/docs/architecture/ADR-nicolify-002-paradigma-zonas.md` (brand) + `SYSTEM-MAP.yaml::zones`
- `nicolify/docs/architecture/` — ADRs brand-specific (001 shell-feature · 002 paradigma-zonas)
- `nicolify/docs/learnings/` — captured learnings nicolify
- `core/luana-core-{copilot,sales-agent,crm,offer-studio,observability,channels,billing}/` — engine que Nicolify consume
- `vitalia/` — brand de referencia (paradigma shell-organism agéntico + base FE madura)
- `.claude/rules/anti-duplication-refining.md` — prior-art scan obligatorio refining
- `.claude/rules/claude-md-overlay.md` — schema de este overlay
