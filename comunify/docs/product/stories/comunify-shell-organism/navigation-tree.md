# Comunify — Navigation Tree (shell-organism) · RECOMENDACIÓN

> Propuesto por `/po-ux` 2026-06-15. **Pendiente ratificación Chris.** SSoT del árbol de navegación del shell de Comunify.
> Patrón: reuse de vitalia/nicolify (ADR-vitalia-004) adaptado al cast comunify (ADR-comunify-001).
> Leyenda: **✱ existe** (área dashboard actual → port en R-shell+1..N) · **△ net-new** (se construye después).
> MVP: todas las sub-tabs renderizan "Próximamente" (empty-state navegable) salvo Luana (chat live).

## Estructura macro

```
┌────────────────────────────────────────────────────────────────┐
│ TopBar: LogoMark comunify · (tenant) · ⚙ · theme                 │
├──────────────────────────┬─────────────────────────────────────┤
│  LUANA (orquestadora)     │  N1 Ribbon: Nina·Tomás·Sofía·Bruno·  │
│  chat lateral persistente │             Lucía · Plataforma       │
│  3 estados:               ├─────────────────────────────────────┤
│   collapsed(rail) /       │  N2 SubTabsBar (del agente activo)  │
│   history / full-chat     ├─────────────────────────────────────┤
│  conversa + anuncia       │  N3 SubSubTabsBar (opcional, 3+)    │
│  delegación (MVP)         ├─────────────────────────────────────┤
│  (NO es tab del Ribbon)   │  Hoja (page.tsx) — sin tabs internas│
└──────────────────────────┴─────────────────────────────────────┘
   dual-mode 50/50 · splitter resizable
```

## N1 — Ribbon (cast ADR-comunify-001)

| # | Ribbon tab | slug | rol |
|---|---|---|---|
| 1 | Nina | `nina` | Estratega · Marca & Producto |
| 2 | Tomás | `tomas` | Atraer · Marketing (orgánico + paid) |
| 3 | Sofía | `sofia` | Vender · Closer (todos los canales) |
| 4 | Bruno | `bruno` | Operar · Comunidad & Delivery |
| 5 | Lucía | `lucia` | Retener · Fidelización & CRM |
| 6 | Plataforma | `plataforma` | Acceso · Onboarding · Configuración |

Luana NO está en el Ribbon (sidebar orquestador).

## N2 — Sub-tabs por agente (recomendado)

```yaml
AGENT_SUBTABS:
  nina:                       # Estratega · Marca & Producto
    - marca                   # ✱ brand-studio (identidad/posicionamiento/narrativa)
    - voz                     # ✱ voice cloning (voz compilada del creator)
    - autoridad               # ✱ authority vault (credibilidad / casos)
    - ofertas                 # ✱ offer studio (catálogo)
    - escalera                # ✱ offer ladder (lead-magnet → tripwire → core → premium)
    - cohorts                 # ✱ cohorts (diseño del cohort = producto)
  tomas:                      # Atraer · Marketing
    - contenido               # △ calendario + ideas (usa la voz de Nina)
    - pauta                   # △ ads / paid (Meta·IG·TikTok)
    - audiencia               # △ lead magnets + captación de audiencia
  sofia:                      # Vender · Closer
    - conversaciones          # △ canales de venta (inbox de ventas / sales_agent)
    - pipeline                # △ leads / deals por etapa
    - recuperacion            # △ recuperación de leads + follow-up
  bruno:                      # Operar · Comunidad & Delivery
    - comunidad               # ✱ community (feed / miembros / engagement)
    - moderacion              # ✱ community-audit (rails: spam/nsfw/doxxing/injection)
    - cohorts-en-curso        # ✱~ delivery de cohorts activos (deriva de cohorts)
  lucia:                      # Retener · Fidelización & CRM
    - suscripciones           # ✱ subscriptions + dunning (cobranza)
    - clientes                # △ CRM / cartera de miembros
    - fidelizacion            # △ acciones de retención / win-back
  plataforma:                 # Plataforma
    - conexiones              # integraciones (IG·TikTok·WhatsApp·ElevenLabs·pago)
    - cuenta                  # preferencias del creator/tenant
    - plan                    # tier (creator/pro/agency) + tokens/billing
    - onboarding              # link al wizard 4-step existente (intacto)
```

## N3 — Sub-sub-tabs (solo donde ≥3 vistas discretas · a pulir en mockup)

```yaml
AGENT_SUBSUBTABS:
  nina:
    marca: [identidad, voz-tono, narrativa]      # ✱ brand-studio ya tiene [section]
    cohorts: [catalogo, nuevo, plantillas]        # candidato
  bruno:
    comunidad: [feed, miembros, moderacion]       # candidato
```

## Notas

- **Luana (sidebar):** 3 estados `collapsed(rail)/history/full`. Default landing = `full` (saluda). Ribbon default = `nina`.
- **MVP:** todas las hojas = "Próximamente" (navegable) salvo Luana. Las ✱ se portan en stories siguientes; las △ se construyen después.
- **Routing:** `app/[tenantId]/(shell-organism)/[agent]/[subtab]/[subsubtab]/page.tsx` · Server Component default · SSR initial.
- **Catálogo declarativo SSoT:** `comunify/frontend/src/lib/routing/shell-routes.ts` (a crear).
- **Decisiones abiertas (Chris ratifica):**
  - `voz` y `autoridad` → ¿Nina (activo de marca) o Tomás (los consume para contenido)? Propongo Nina; Tomás los usa.
  - `cohorts` → diseño en Nina, delivery en Bruno (`cohorts-en-curso`). ¿Te cierra el split o lo dejamos todo en uno?
  - Nombres de sub-tabs = pulibles en el mockup.
```
