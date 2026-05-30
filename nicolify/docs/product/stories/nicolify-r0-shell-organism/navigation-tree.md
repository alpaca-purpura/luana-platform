# Nicolify — Navigation Tree (shell-organism)

> Ratificado por Chris 2026-05-29. SSoT del árbol de navegación del shell de Nicolify.
> Patrón: reuse de Vitalia (ADR-vitalia-004) adaptado a los 5 agentes Revenue/Ops.

## Estructura macro

```
┌────────────────────────────────────────────────────────────────┐
│ TopBar global:  LogoMark · TenantSwitcher (agencia) · ⚙ · theme  │
├──────────────────────────┬─────────────────────────────────────┤
│  LUANA (orquestadora)     │  N1 Ribbon: Abel·Brenda·Christian·   │
│  chat lateral persistente │             Norvil · Configurar      │
│  3 estados:               ├─────────────────────────────────────┤
│   collapsed(rail)/        │  N2 SubTabsBar (del agente activo)  │
│   history / full-chat     ├─────────────────────────────────────┤
│  — único rostro: traduce  │  N3 SubSubTabsBar (opcional, 3+)    │
│   intención → delega →    ├─────────────────────────────────────┤
│   reporta digerido        │  Hoja (page.tsx) — el contenido     │
│                           │  NO contiene tabs internas          │
│  (NO es tab del Ribbon)   │                                     │
└──────────────────────────┴─────────────────────────────────────┘
  Layout: dual-mode 50/50 · splitter resizable 3 estados
          (chat-collapsed / narrow / 50-50)
```

## N1 — Ribbon (agentes expertos + Config)

Luana NO está en el Ribbon (es el sidebar orquestador). El Ribbon son los 4 agentes que operan superficies + Configurar.

| # | Ribbon tab | slug | rol |
|---|---|---|---|
| 1 | Abel | `abel` | Estratega · Branding & Oferta |
| 2 | Brenda | `brenda` | Growth · Guardiana del Presupuesto |
| 3 | Christian | `christian` | Cazador · SDR/outbound |
| 4 | Norvil | `norvil` | Cultivador · Account Manager |
| 5 | Configurar | `config` | Settings |

## N2 — Sub-tabs por agente (ratificadas)

```yaml
AGENT_SUBTABS:
  abel:
    - oferta                # catálogo de servicios / paquetes
    - angulos               # ángulos de venta / discurso comercial
    - escalera-valor        # value ladder (lead-magnet → core → upsell)
    - marca                 # posicionamiento / identidad
  brenda:
    - campanas              # gestión de pauta (Meta/Google)
    - contenido             # recomendación + calendario de contenido
    - presupuesto           # CAC/ROAS + autonomía de contingencia (kill-switch)
  christian:
    - prospectos            # ICP + listas + enrichment
    - secuencias            # cold email + LinkedIn (autoridad del fundador)
    - pipeline              # deals por etapa (CRM cuenta/stakeholder)
    - propuestas            # propuestas + seguimiento + firma
    - licitaciones          # ⛏ RFI/RFQ/licitaciones (vertical minería Perú)
  norvil:
    - cuentas               # cartera de cuentas ganadas
    - salud-cuenta          # account health (Notion/Jira/Slack)
    - renovaciones          # renovación + cross/up-sell
  config:
    - conexiones            # integraciones (LinkedIn, Meta, WhatsApp, Notion...)
    - preferencias          # tenant / agencia
    - tokens                # bolsa de tokens / plan / alertas de recarga
    - agentes               # autonomía: umbrales CAC/ROAS de Brenda, consent outbound Christian
```

## N3 — Sub-sub-tabs (N3-static · solo donde ≥3 vistas discretas)

A definir por sub-tab cuando emerja la necesidad (NUNCA Shadcn Tabs internas en la hoja). Candidatos probables:

```yaml
AGENT_SUBSUBTABS:
  christian:
    propuestas: [borrador, revision, firmado]    # candidato (3 estados discretos)
    pipeline: [tablero, lista, forecast]          # candidato
  brenda:
    campanas: [activas, pausadas, biblioteca]     # candidato
```

## Notas

- **Luana (sidebar):** 3 estados `collapsed(rail) / history / full` — mismo patrón que ValeriaSidebar de Vitalia, re-creado como `LuanaSidebar`. Default visible.
- **Routing:** `app/[tenantId]/(shell-organism)/[agent]/[subtab]/[subsubtab]/page.tsx` · Server Component default · SSR initial state.
- **Default landing:** a definir en R0 (sugerido: `abel/oferta` para onboarding, o `christian/pipeline` para uso diario — ratificar en mockup).
- Catálogo declarativo SSoT: `nicolify/frontend/src/lib/routing/shell-routes.ts` (a crear en R0).
- Sujeto a refinamiento visual durante el mockup HTML (ADR-003 gate) — nombres de sub-tabs pueden pulirse al diseñar.
