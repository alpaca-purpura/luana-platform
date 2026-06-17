# Comunify — Navigation Tree (shell-organism) · v2 RECOMENDADO

> `/po-ux` v2 2026-06-15 (research-informed + autocrítica). **Pendiente ratificación Chris.** SSoT del árbol de nav del shell.
> Patrón: reuse vitalia/nicolify (ADR-vitalia-004) + cast comunify (ADR-comunify-001).
> Leyenda: **✱ existe** (área dashboard actual → port R-shell+1..N) · **△ net-new**.
> MVP: todas las hojas = "Próximamente" (navegable) salvo Luana (chat live).

## Estructura macro

```
┌────────────────────────────────────────────────────────────────┐
│ TopBar: LogoMark comunify · (tenant) · ⚙ · theme                 │
├──────────────────────────┬─────────────────────────────────────┤
│  LUANA (orquestadora)     │  N1 Ribbon: Nina·Tomás·Sofía·Bruno·  │
│  chat lateral persistente │             Lucía · Plataforma       │
│  conversa + anuncia (MVP) ├─────────────────────────────────────┤
│  + digiere "tu semana"    │  N2 SubTabsBar (del agente activo)  │
│  (analytics cross-cutting)├─────────────────────────────────────┤
│  (NO es tab del Ribbon)   │  N3 SubSubTabsBar (≥3 vistas)       │
└──────────────────────────┴─────────────────────────────────────┘
```

## N1 — Ribbon (cast ADR-comunify-001)

| # | tab | slug | rol |
|---|---|---|---|
| 1 | Nina | `nina` | Estratega · Marca & Producto |
| 2 | Tomás | `tomas` | Atraer · Marketing & Contenido |
| 3 | Sofía | `sofia` | Vender · Closer |
| 4 | Bruno | `bruno` | Operar · Comunidad & Delivery |
| 5 | Lucía | `lucia` | Retener · Fidelización & CRM |
| 6 | Plataforma | `plataforma` | Acceso · Onboarding · Configuración |

Luana NO está en el Ribbon (sidebar orquestador + digest analytics).

## N2 — Sub-tabs por agente (v2)

```yaml
AGENT_SUBTABS:
  nina:                       # Estratega · Marca & Producto  (era 6 → 3)
    - marca                   # ✱ brand-studio + voz(cloning) + autoridad(vault) + narrativa  → N3
    - ofertas                 # ✱ offer studio + escalera(ladder)                              → N3
    - cohorts                 # ✱ diseño del cohort = producto (delivery vive en Bruno)
  tomas:                      # Atraer · Marketing & Contenido
    - referentes              # △ influencers ref + recomendados + tendencias (Apify) → ideas. content-hunter UI. Story comunify-tomas-referentes
    - contenido               # △ calendario + ideas + producción (usa la voz de Nina + lo de referentes)
    - audiencia               # △ lead magnets + captación + nurture/email
    - pauta                   # △ ads / paid (Meta·IG·TikTok)
  sofia:                      # Vender · Closer
    - conversaciones          # △ inbox de ventas multicanal (sales_agent)
    - pipeline                # △ leads / deals por etapa
    - recuperacion            # △ recuperación de leads + follow-up
  bruno:                      # Operar · Comunidad & Delivery
    - comunidad               # ✱ community (feed + miembros + engagement)
    - eventos                 # △ sesiones en vivo / delivery de cohorts (era "cohorts-en-curso")
    - moderacion              # ✱ community-audit (rails: spam/nsfw/doxxing/injection)
  lucia:                      # Retener · Fidelización & CRM
    - suscripciones           # ✱ subscriptions + dunning/cobranza
    - clientes                # △ CRM: segmentos · LTV · ciclo de vida
    - fidelizacion            # △ loyalty + win-back + email de ciclo
  plataforma:                 # Plataforma  (era 4 → 3)
    - conexiones              # IG·TikTok·WhatsApp·ElevenLabs·pago·Apify-scraping
    - cuenta                  # preferencias + plan/tier/tokens  → N3
    - onboarding              # link al wizard 4-step existente (intacto)
```

## N3 — Sub-sub-tabs (≥3 vistas discretas · a pulir en mockup)

```yaml
AGENT_SUBSUBTABS:
  nina:
    marca: [identidad, voz, autoridad, narrativa]   # ✱ brand-studio ya tiene [section]
    ofertas: [catalogo, escalera]                    # escalera = vista del catálogo
  bruno:
    comunidad: [feed, miembros, moderacion]          # candidato
  plataforma:
    cuenta: [preferencias, plan, tokens]
```

## Transversales (NO son tabs · decisión paradigma)

- **Analytics / "tu semana":** Luana digiere cross-cutting (orquestadora reporta) + cada agente muestra sus KPIs en su hoja. NO hay tab dashboard-isla (anti-paradigma trabajadores).
- **Email:** vive donde se usa — nurture/broadcast en `tomas/audiencia`, ciclo de vida/win-back en `lucia/fidelizacion`. NO tab propio.

## Notas

- **Luana (sidebar):** estados `collapsed(rail)/history/full`. Landing = `full` (saluda). Ribbon default = `nina`.
- **MVP:** hojas "Próximamente" navegables salvo Luana. ✱ se portan en stories siguientes; △ se construyen después.
- **Routing:** `app/[tenantId]/(shell-organism)/[agent]/[subtab]/[subsubtab]/page.tsx` · SSR.
- **Catálogo SSoT:** `comunify/frontend/src/lib/routing/shell-routes.ts` (a crear).

## Cambios v2 vs v1 (autocrítica + research)

- Nina 6→3: `voz`+`autoridad` → N3 de `marca`; `escalera` → N3 de `ofertas`.
- Bruno: `cohorts-en-curso` → `eventos` (sesiones vivo/delivery) — más claro.
- Tomás: `audiencia` ahora incluye nurture/email.
- Plataforma 4→3: `plan` → N3 de `cuenta`.
- Analytics + email = transversales, no tabs (paradigma + research 2026: agentes especializados + Luana digest).
- Cohorts/comunidad jerarquizados (research 2026: interactivo > curso estático).

## Research basis (2026)

- Creator economy → interactivo (cohorts/comunidad) > curso estático. khaby.ai · communipass.com.
- Agentes IA por etapa (research/contenido/campañas/analytics) + research-agent escanea tendencias diario. averi.ai · adobe · eesel.ai.
- Funnel retención: secuencias post-compra + loyalty + LTV + email de ciclo. omnisend · salesforce.

## Decisiones (resueltas en v2 · Chris ratifica)

1. `voz`+`autoridad` → **Nina** (N3 de `marca`). Tomás los consume.
2. `cohorts` → diseño en **Nina**, delivery en **Bruno/`eventos`** (no dos tabs "cohorts").
3. Nombres pulidos (`eventos`, `referentes`).
