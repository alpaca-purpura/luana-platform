# 00-research · Data-collection UX (ICP & buyer) — recomendación

> Addendum de research pedido por Chris (2026-06-03): *"investiga cómo lo hacen los sistemas actuales — para el usuario es un martirio llenar info que no sabe si le sirve, pero a nosotros nos sirve siempre que nutra al agente de ventas y al de marketing. Dame una recomendación. Plantea los campos. Veamos formas de adjuntar info/links para extraer y proponer. Pensá esta hoja como la primera que sienta las bases de las demás en fondo y forma."*

Complementa `00-research.md` (prior-art + ICP-vs-Buyer). Esto es **materia prima para `/po-ux`**, no spec ratificada.

---

## 1. La tensión (bien planteada por Chris)

- **Usuario:** llenar formularios largos de "marketing" es un martirio. No sabe qué es un "psicográfico", no sabe si le sirve, abandona.
- **Nosotros:** SÍ necesitamos esa data — pero **solo tiene valor si nutre a Christian (ventas/outbound) y a Brenda (marketing)**. Data que no alimenta a un agente = fricción sin retorno.

Conclusión del research: **la industria ya resolvió esta tensión invirtiendo el flujo.** Nadie serio en 2025-26 arranca con un form en blanco.

## 2. Qué hacen los sistemas actuales (hallazgos)

### A. Draft-first: el AI llena, el usuario corrige (NO al revés)
Las herramientas líderes parten de una **semilla** que el usuario YA tiene y generan un **borrador** que el usuario solo edita/ratifica:
- **lemlist / M1-Project (Elsa) / Delve AI / waalaxy:** pegás la **URL de tu web** → la IA analiza el sitio + datos públicos → genera 1-3 ICP/buyer personas completas. *"De horas a minutos."*
- **HubSpot "Make My Persona":** describís tu cliente ideal en lenguaje natural → IA arma la persona.
- **Miro / Delve AI:** **subís documentos** (transcripts de entrevistas, encuestas, reportes de mercado, export de CRM) → la IA extrae patrones → persona research-backed.
- **Delve AI** combina first-party (CRM, Analytics) + 40+ fuentes públicas para inferir atributos demográficos/psicográficos/comportamiento.

→ **Patrón:** *seed → extract → draft → human edit/confirm*. El form existe, pero como **superficie de edición de algo ya prellenado**, nunca como muro en blanco.

### B. Progressive profiling: no pedir todo de una
- Pedir lo mínimo primero, enriquecer en el tiempo, sumar campos solo cuando hacen falta (contextual). **78% de marketers** (Marketo) reportan mejor calidad de lead con progressive profiling.
- Aplica al ICP: arrancar con industria + 1 dolor + 1 buyer → Abel propone el resto progresivamente. Una barra de **completitud** (el engine ya tiene `completeness_score`) muestra avance sin bloquear.

### C. Enrichment / waterfall: autocompletar desde el dominio
- **Clay / Apollo / ZoomInfo:** desde el **dominio de una empresa** autocompletan firmográficos/technográficos (tamaño, industria, stack, geo) probando proveedor tras proveedor hasta llenar el campo. Clay conecta 100+ fuentes.
- Implicación: muchos campos del ICP **no los debería tipear el usuario** — se infieren de la web/LinkedIn que él pega.

### D. Qué data realmente mueve la aguja para ventas/marketing (lo "útil para nosotros")
Apollo ("What data does an AI SDR need") + research outbound 2025-26 coinciden en **3 capas**:
1. **Firmográfico (ICP fit)** — industria, tamaño, geo, ingresos, modelo. *Confirma a qué empresa.*
2. **Persona-level** — rol, poder de decisión, dolores, objeciones, qué le importa. *Confirma a quién.*
3. **Triggers tiempo-real** — financiamiento, contrataciones, nueva faena/licitación, cambios de cargo. *Confirma cuándo.*
- **El cuello de botella es la calidad del dato, no el modelo**: campos incompletos/stale → mensajes genéricos por más bueno que sea el LLM.
- Impacto medido: personalización con buena data sube reply rates de **~9% a ~21%** (2-3×).

## 3. Recomendación para Nicolify (la hoja fundacional)

**Principio rector: "Mostrá valor antes de pedir. El usuario ratifica, no redacta."** Abel nunca le entrega al dueño un form vacío.

### R1 — Flujo invertido seed→extract→propose→ratify (★ el patrón que copian las demás hojas)
1. **Semillas que el dueño YA tiene** (sin escribir nada de marketing): URL de su web, LinkedIn (empresa + perfil del fundador), un PDF/deck/brief, una lista de clientes actuales (CSV/pegar), o texto libre ("vendemos X a Y"). + lo que Abel capturó en **onboarding** (visión del CEO).
2. **Abel extrae y propone** un borrador de ICP(s) + buyer(s) — vía el extractor del engine (`core/luana-core-copilot/buyer_persona_extraction_template` + persister). Conversacional por el chat de Luana o con botón "generar borrador".
3. **El dueño edita/ratifica** en la hoja (master-detail). Cada cambio se guarda (autosave).
4. **Enrichment automático** de firmográficos/technográficos desde el dominio que pegó (engine channels/enrichment) — el usuario NO los tipea.

### R2 — Cada campo carga su "¿para qué sirve?" (mata el "no sé si me sirve")
La UI muestra, por campo o grupo, **qué agente lo consume**: *"Esto lo usa Christian para prospectar"* · *"Esto lo usa Brenda para el ángulo de contenido"*. Transparencia = el campo justifica su existencia. Si un campo no alimenta a ningún agente → **no se pide** (regla de diseño).

### R3 — Progressive + completitud, nunca muro
Mínimo viable primero (industria + dolor + ángulo + 1 buyer con rol). Barra de completitud que **sugiere** el siguiente campo de mayor impacto (no obliga). Abel propone enriquecer con el tiempo ("detecté que te falta X, ¿lo armo?").

### R4 — Adjuntar cualquier cosa (intake universal · base para todas las hojas)
Una zona de **intake** reutilizable: pegar URL · subir archivo (PDF/deck/CSV/doc) · pegar texto · conectar fuente (LinkedIn/CRM vía Config→conexiones). Todo entra al extractor → propone → ratifica. **Este componente de intake es fondo-y-forma reusable** por Oferta, Marca, y las hojas de los otros agentes.

### Sobre ICP vs Buyer (cierra §6 de `00-research.md`)
El research **refuerza la opción A**: las 3 capas de Apollo son exactamente **ICP (cuenta) + buyer (persona) + triggers**. Mantenerlos separados pero en una hoja. ICP net-new (candidato lift core para brands B2B futuras), buyer reusa el engine.

## 4. Campos propuestos (para que `/po-ux` los aterrice con Chris)

> Regla: cada campo dice **(fuente)** = cómo se llena por defecto → `auto` (enrichment/extract), `draft` (Abel propone, dueño edita), `manual` (dueño escribe). Y **→ consumidor** = qué agente lo usa.

### 4.1 ICP — nivel CUENTA (net-new) · "a qué empresas apuntamos"
| Campo | Fuente | → Consumidor |
|---|---|---|
| Nombre/etiqueta del ICP (ej. "Agencias marketing 10-40p Perú") | draft | navegación interna |
| Vertical / industria (de nichos Tier 1-3) | auto/draft | Christian (targeting) · Brenda (segmento) |
| Tamaño (empleados / facturación) | auto | Christian (targeting) |
| Geografía (Perú base + LatAm) | auto/draft | Christian · Brenda (pauta geo) |
| Modelo de negocio + ticket promedio + ciclo de venta | draft | Norvil (expansión) · pricing fit |
| **Dolor principal** (qué problema le resolvemos) | draft/manual | **Brenda (ángulo contenido) · Christian (mensaje)** |
| **Ángulo de venta** (cómo nos posicionamos ante ese dolor) ← absorbe "ángulos" | draft/manual | **Brenda · Christian** (materia prima discursiva) |
| Señales/triggers de buena oportunidad (ronda, contratación, nueva faena, licitación) | auto/draft | **Christian (timing outbound)** |
| Stack/contexto técnico (si aplica) | auto | Christian (relevancia) |
| Anti-patrón / red flags (a quién NO apuntar) | draft/manual | Christian (filtro) · ahorro de tokens |

### 4.2 Buyer persona — nivel PERSONA (reusa engine `BuyerPersona`) · "quién decide"
| Campo | Engine | → Consumidor |
|---|---|---|
| Nombre + tagline + `is_primary` + `scope` | ✅ existe | navegación |
| Rol / cargo | (demographics) | Christian (a quién escribir) |
| **Poder de decisión** (champion / decisor económico / usuario / bloqueador) | ★ extender (CRM Stakeholder lo tiene) | Christian (estrategia) · Norvil |
| Demographics (seniority, depto) | ✅ `demographics` | Christian |
| Psychographics (qué le importa, cómo mide éxito) | ✅ `psychographics` | Brenda (resonancia) · Christian |
| `pain_points[]` / `desires[]` | ✅ existe | Brenda · Christian |
| Objeciones / `anti_patterns[]` | ✅ existe | Christian (manejo objeción) |
| `buyer_journey` / `purchase_triggers[]` | ✅ existe | Brenda (nurturing) · Christian (timing) |
| Canales preferidos (LinkedIn / email / WhatsApp) | ★ extender | Christian (canal) · Brenda |

→ **N buyers por ICP** (un ICP = empresa; sus champions/decisores/usuarios = personas).

## 5. Fondo y forma reusable (qué "siembra" esta hoja para las demás)

| Dimensión | Lo que esta hoja establece | Lo reusan |
|---|---|---|
| **Fondo (modelo)** | Loop seed→extract→propose→ratify + completitud + cada campo con consumidor | Oferta, Marca, y toda hoja agéntica con captura de data |
| **Forma (UI)** | Master-detail (lista→detalle) + zona de **intake universal** (URL/archivo/texto/conexión) + chips "¿para qué sirve?" + autosave + barra de completitud | Componentes compartidos `nicolify-design-system` (shell ADR-nicolify-001) |
| **Agéntico** | Abel propone / el dueño ratifica (guardrail `agent-revenue-engine.md`); el chat de Luana puede operar la misma acción (Plano 2) | Todos los agentes |

→ Recomendación: tratar el **componente de intake universal** + el **patrón "draft-first con consumidor por campo"** como **deliverables fundacionales** de esta story (no solo la hoja ICP). `/po-ux` debe scopearlos como reusables.

## 6. Decisiones — RATIFICADAS por Chris (2026-06-03)

1. ✅ **A — ICP+Buyer separados, una hoja.** ICP = entidad net-new nivel-cuenta (candidato lift core) + Buyer = `BuyerPersona` del engine, N buyers por ICP.
2. ✅ **Draft-first invertido.** Abel propone desde semillas, el dueño ratifica. Nunca form en blanco. = patrón fundacional reusable.
3. ✅ **Intake universal FULL day-1** — URL + subir archivo (PDF/deck/CSV) + pegar texto + **conectar fuente**. ⚠️ Matiz: "conectar fuente" = *traer tus datos para extraer*, NO es el enrichment automático (ver #4). Si "conectar fuente" necesita Config→conexiones aún no construido, `/architect` declara el dep (puede arrancar con URL+archivo+texto y la conexión llega cuando conexiones esté).
4. ✅ **Enrichment automático DIFERIDO.** Esta story extrae de lo que el dueño pega/sube/conecta. El enrichment waterfall (autocompletar firmográficos desde el dominio sin pedir, tipo Clay/Apollo) = story posterior (depende de Config→conexiones).
5. **"¿Para qué sirve?" por campo** (mostrar el agente consumidor) — confirmado como principio (R2). Modo de display (siempre/hover/toggle) → `/po-ux` mockea opciones para Chris.

> **Para `/po-ux`:** modelar ICP (net-new) + Buyer (engine) en 1 hoja master-detail · flujo draft-first (seed→extract→propose→ratify) · intake universal full (con dep flag en conexión) · cada campo con chip de consumidor-agente · progressive + completitud · enrichment fuera de scope. Gate G1 (ADR-nicolify-001): mockup HTML ratificado antes de `refined`.

## Fuentes
- [lemlist — ICP/buyer persona generator](https://www.lemlist.com/free-tools/buyer-persona-generator) · [M1-Project ICP AI](https://www.m1-project.com/blog/how-to-build-an-ideal-customer-profile-with-ai) · [Delve AI ICP](https://www.delve.ai/solutions/ideal-customer-profile) · [HubSpot Make My Persona](https://www.hubspot.com/make-my-persona)
- [Hushly — progressive profiling](https://www.hushly.com/blog/progressive-profiling/) · [involve.me progressive profiling](https://www.involve.me/blog/progressive-profiling-101-collect-more-data-without-friction) · [Brixon — progressive profiling B2B](https://brixongroup.com/en/progressive-profiling-data-rich-customer-profiles-without-conversion-losses-in-b2b-marketing/)
- [Miro — AI buyer persona (doc upload)](https://miro.com/ai/ai-buyer-persona-generator/) · [Delve AI — research persona](https://www.delve.ai/blog/free-persona-generator)
- [Factors.ai — ICP marketing guide](https://www.factors.ai/blog/icp-marketing-guide) · [ZoomInfo — firmographic vs technographic](https://pipeline.zoominfo.com/marketing/the-difference-between-firmographic-and-technographic-data) · [Apollo — ICP living profile](https://www.apollo.io/insights/icp-meaning-sales)
- [Apollo — what data does an AI SDR need](https://www.apollo.io/insights/what-icp-and-persona-data-does-an-ai-sdr-need-to-personalize-outreach-effectively) · [Salesforge — AI personalization trends 2026](https://www.salesforge.ai/blog/ai-personalization-trends-in-cold-outreach) · [Clay vs Apollo waterfall enrichment](https://www.devcommx.com/blogs/waterfall-enrichment-clay-vs-zoominfo-vs-apollo)
