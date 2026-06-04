# 00-research · nicolify-r1-abel-icp-buyer

> Research de la hoja **"ICP & buyer"** de Abel. Capturado por `/pm-nicolify` (2026-06-03) a pedido de Chris: extraer lo mejor del legacy (`../luana-nicolify-legacy`, donde se llamó "Buyer") + revisar la ARQ + el storymap (qué esperamos que haga Abel ahí). **No es spec ratificada** — es materia prima para `/po-ux`.

## 1. Qué pidió Chris

> *"Crea una historia de usuario para crear la 'hoja' ICP y Buyer, extrayendo lo más importante del legacy ya que hicimos cosas interesantes (ahí lo llamamos Buyer — entiendo que es lo mismo que ICP y si no tenemos que quedarnos con uno). Revisá los ARQ y en el storymap lo que esperamos que haga Abel ahí."*

Tres preguntas a resolver: (a) ¿ICP == Buyer? (b) ¿qué del legacy reusamos? (c) ¿qué hace Abel en esta hoja según la ARQ/storymap?

## 2. Storymap / ARQ — qué espera la arquitectura de Abel acá

Fuente: `nicolify/docs/architecture/SYSTEM-MAP.yaml` v2.0 + archivo `nicolify/docs/archive/2026/stories/nicolify-r0-sitemap-completo/`.

- **Abel** = *"Estratega del CEO no-marketinero: absorbe y SOSTIENE la visión/dirección del dueño y la convierte en **ICP + oferta estructurada + marca**. Traductor 'visión de CEO → estrategia comercial'. Conversacional vía el chat de Luana."*
- **Hoja `abel.icp`** (registrada en SYSTEM-MAP, status `planned`, `target_release: R1`, route `/{tenantId}/abel/icp`, label sugerido **"ICP & buyer 🎯"**):
  > *"A quiénes apuntamos: perfil de cliente ideal + buyer persona. **Cada ICP lleva su dolor + su ángulo de venta** (lo que antes era 'ángulos' ahora es propiedad del ICP, no área suelta). Materia prima que consumen Brenda y Christian."*
- Es **1 hoja directa** (regla de colapso N2≡hoja: área con 1 hoja = la hoja, sin N3).
- **Intención verbatim de Chris** (`02-agent-intent.md` línea 142): *"No vi nada sobre ICP o buyer pero debería poder definirse aquí — es útil para saber a quiénes apuntamos. No entendí los 'Ángulos de Venta por ICP'."* → resuelto: **cada ICP lleva su ángulo de venta** (los "ángulos" dejaron de ser hoja suelta, son propiedad del ICP).
- **Flujo cross-agente** (SYSTEM-MAP `cross_agent_flows`): cuando `ICP + oferta ratificados por el dueño` → Brenda arma contenido/presencia con **el ángulo del ICP** + Christian arma listas/outbound (LinkedIn del fundador) con **el ángulo del ICP**. El ICP/buyer es **materia prima discursiva** aguas abajo.
- **Principio (Chris):** cada hoja existe en **2 modos** — operable a mano (web, Plano 1) e invocable por el agente (Abel, Plano 3, misma acción Plano 2). La hoja ICP no es solo un form: Abel la puede llenar conversacionalmente (guided setup) por el dueño.

## 3. Prior-art scan (anti-duplication-refining.md — OBLIGATORIO)

```
KW: icp buyer persona ideal-customer-profile cuenta stakeholder ángulo dolor
```

### 3.1 Engine (`core/luana-core-*`) — CONSUMIR, no recrear

| Pieza engine | Path | Qué aporta |
|---|---|---|
| `BuyerPersona` (entidad rica) | `core/luana-core-brand-studio/.../domain/buyer_persona.py` | **El corazón del legacy.** Campos: `name, tagline, scope(GLOBAL/OFFER/CAMPAIGN), offer_id, is_primary, demographics{}, psychographics{}, pain_points[], desires[], buyer_journey{}, purchase_triggers[], anti_patterns[], completeness_score` + soft-delete + timestamps |
| FieldContract buyer-persona | `core/luana-core-brand-studio/.../domain/buyer_persona_field_contract.py` | Section map declarativo (path → FE section slug) + metadata copilot por campo |
| Repo + API + DTO + model | `core/luana-core-brand-studio/.../{infrastructure/repositories,api,api/dto,infrastructure/models}/buyer_persona*` | CRUD multi-persona ya construido (tenant-scoped) |
| Extraction template (copilot) | `core/luana-core-copilot/.../buyer_persona_extraction_template.py` | El "absorber info" guiado — Abel extrae persona de conversación/documento |
| Persister (copilot) | `core/luana-core-copilot/.../persisters/buyer_persona_persister.py` | `propose_field_updates` → persiste la persona desde el chat |
| API client TS | `core/@luana/api-client/src/api/buyer-persona.ts` | Cliente FE compartido |

→ **Decisión:** Buyer persona = **CONSUMIR `core/luana-core-brand-studio` vía import** + registrar extensión nicolify (Extension SDK). **PROHIBIDO** recrear la entidad en `nicolify/`.

### 3.2 ICP — NET-NEW (no existe en engine) + lift-candidate

- El legacy era **B2C/creator-céntrico**: solo modeló **Buyer persona** (la persona). **No hay entidad `ICP`** (perfil de la **cuenta/empresa**) en ningún `core/luana-core-*`.
- En B2B la **cuenta ≠ la persona** (filtro de nicho #3 de la visión: *"separación entre Cuenta (empresa) y Stakeholder/Contacto (persona)"*). El ICP es el perfil **de la empresa ideal**.
- El ICP B2B alinea 1:1 con el modelo **`Account`** del CRM (`agent-revenue-engine.md §5`: `account{company_name, industry, currency, lifecycle_stage, health_score}`) — pero el ICP es la **definición del ideal** (criterios), no una cuenta concreta. Las cuentas reales se puntúan **contra** el ICP.
- **Fuerte candidato a lift `/pm-luana`**: un "ICP definition" sirve a cualquier brand B2B futura (saasora, inmoflow). Flaguear `promotable: candidate` al refinar/cerrar.

### 3.3 Referencia FE legacy (re-temizar, no copiar)

`../luana-nicolify-legacy/nicolify/frontend/src/features/brand-studio/`:
- `pages/BuyerPersonasLandingPage.tsx` (lista multi-persona) · `pages/PersonaDetailPage.tsx` (detalle/edición) · `components/BuyerPersonaInstancePicker.tsx` · `schemas/buyer-persona.schema.ts` · `hooks/{use-buyer-persona,use-buyer-personas}.ts` · `api/personality.ts`.
- **Patrón master-detail** (lista → detalle) ya probado. **Portar la forma**, re-temizada bajo `nicolify-design-system` + shell `ADR-nicolify-001` (route-group, SSR-safe store, Tailwind JIT-safe). NO copiar verbatim el FE legacy (era pre-shell-organism).

### 3.4 Brands activas (vitalia/comunify)

- `vitalia` usa el mismo engine brand-studio (Lisa edita personality/buyer en su shell). Confirma el patrón de consumir el engine + extensión brand. Vitalia es **salud B2C** → su buyer no tiene capa "ICP cuenta"; nicolify la agrega (refuerza que ICP es B2B-específico → lift-candidate).

## 4. ICP vs Buyer — la respuesta (no son lo mismo en B2B)

| Concepto | Nivel | Responde | Mapea a (Nicolify) | Existe en legacy/engine |
|---|---|---|---|---|
| **ICP** (Ideal Customer Profile) | **Cuenta / empresa** | *"¿qué empresas atacamos?"* (industria, tamaño, geo, ticket, ciclo, dolor, **ángulo de venta**) | CRM `Account` (el ideal, no la cuenta real) | ❌ net-new |
| **Buyer persona** | **Persona / stakeholder** | *"¿quién decide / influye dentro de esa empresa?"* (rol, poder de decisión, objeciones, journey, triggers) | CRM `Stakeholder` | ✅ engine `core/luana-core-brand-studio` |

→ En B2B **conviven**: un ICP (empresa) tiene **N buyer personas** (champion, decisor económico, usuario). El legacy los fusionó en "Buyer" porque era B2C. Para agencias B2B necesitamos **los dos niveles**, y el árbol ya los junta en **una hoja "ICP & buyer"**.

## 5. Qué hace Abel en esta hoja (esperado — para que /po-ux lo aterrice)

1. **Definir ICP(s)** — el dueño (vía chat de Luana→Abel o a mano) declara a qué tipo de empresa apunta: industria/vertical (de los nichos Tier 1-3), tamaño, geo (Perú base), ticket/ciclo, **dolor principal**, **ángulo de venta** del ICP.
2. **Definir buyer persona(s)** por ICP — quién decide: rol, poder de decisión, pains, desires, objeciones, journey, triggers (reusa la entidad rica del engine).
3. **Guided setup conversacional** — Abel absorbe la visión del CEO (en onboarding R1 + edición continua) y **propone** ICP/buyer; el dueño **ratifica** (guardrail `agent-revenue-engine.md`: Abel propone, dueño ratifica).
4. **Surface como materia prima** — el ICP+ángulo queda disponible para que Brenda (contenido/pauta) y Christian (outbound) lo consuman.

## 6. ⚠️ DECISIÓN ABIERTA para Chris (ratificar antes de `refined`)

**¿Modelamos ICP y Buyer como entidades separadas, o una sola?**

- **(A · recomendado PM)** **Separadas, una sola hoja.** ICP = entidad nueva nivel-cuenta (criterios de empresa ideal + dolor + ángulo) · Buyer = `BuyerPersona` del engine (nivel-persona), ligada a su ICP. La hoja "ICP & buyer" muestra ICP → sus buyers. **Pro:** fiel al B2B (cuenta/stakeholder), alinea con el CRM, reusa el engine de buyer. **Contra:** ICP es net-new (más build) + decisión de lift.
- **(B)** **Solo Buyer (como el legacy).** Reusar tal cual `BuyerPersona`, sin entidad ICP; los atributos de "empresa ideal" entran como campos del buyer. **Pro:** mínimo build, todo el engine ya existe. **Contra:** pierde el nivel cuenta (clave en B2B multi-stakeholder) — contradice el filtro de nicho #3 de la visión.
- **(C)** **ICP = vista/derivada del CRM Account** (sin entidad propia): el ICP se expresa como criterios sobre `Account`. **Pro:** no duplica. **Contra:** el ICP es una *definición del ideal* (no una cuenta) — encajarlo como "filtro de cuentas" puede ser confuso para definirlo antes de tener cuentas.

PM recomienda **(A)**. Chris decide en `chris-input.md`.

## 7. Encaje en releases / scope

- **Release:** R1 (Abel + Brenda · Atracción inbound · 1er vendible). Área `abel.icp`.
- **Gate arquitectura:** `ADR-nicolify-001` (sub-tab del shell) — HARD. Citar en `01-spec.md` + `03-arch.md`.
- **Fuera de scope de esta hoja:** Oferta/catálogo (`abel.oferta`, story aparte), Marca (`abel.marca`, story aparte), el consumo aguas-abajo por Brenda/Christian (sus propias stories).

## 8. Próximo paso

Chris ratifica §6 + llena 💭 Notas en `chris-input.md` → `/po-ux nicolify nicolify-r1-abel-icp-buyer` (hoja UI master-detail + guided setup conversacional vía Abel). Como toca shell sub-tab → G1 exige mockup HTML ratificado antes de `refined`.
