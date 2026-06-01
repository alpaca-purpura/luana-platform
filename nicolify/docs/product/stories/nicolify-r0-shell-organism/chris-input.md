---
story_id: nicolify-r0-shell-organism
created_at: 2026-05-29T19:29:36-05:00
last_modified: 2026-05-29T19:29:36-05:00
notes_count: 0
refs_count: 2
conversation_count: 1
---

# chris-input.md · nicolify-r0-shell-organism

<!-- voseo-allowed: conversación interna Chris↔Claude (cocina de la story), no es string user-facing UI -->

> **Qué es este archivo:** acá Chris escribe notas + referencias + Claude responde con verdicts. Es la cocina de la story (la conversación) — separada del spec/design/arch (los outputs ratificados).
>
> **3 secciones secuenciales** (mantener el orden + emojis para que parser + cockpit funcionen):
> - 💭 Notas — Chris escribe en lenguaje natural antes/durante refinement
> - 📎 Referencias — links, imágenes, story-refs, learning-refs, doc-refs
> - 💬 Conversación — turn-by-turn cronológico Chris ↔ Claude con verdicts
>
> Doc canónico: `docs/process/chris-input-protocol.md`.

## 💭 Notas

> Chris: escribe acá tus notas en lenguaje natural. Cualquier cosa que te ayude a pensar la story.

### 2026-05-29
(Chris escribe aquí · podés responder las Q1-Q5 de la conversación de abajo directamente, o agregar tus ideas del shell.)

## 📎 Referencias

> Tipos: 🔗 link · 🖼 img · 💬 text · 📖 story-ref · 📚 learning-ref · 📄 doc.

- **📖 story-ref** · `vitalia-shell-organism` (design-story fuente del paradigma shell-organism)
  > Pattern a reusar: dual-mode shell + Ribbon de agentes + chat orquestador. Mockup: `vitalia/docs/archive/2026/stories/vitalia-shell-organism/mockups/dual-mode-shell.html`
- **📄 doc** · `nicolify/docs/product/vision.md` § 1 (ecosistema de agentes) + § 0 (Luana único rostro)

## 💬 Conversación

> Append-only · turn-by-turn cronológico. Verdict labels: ✓ APLICADO · ⚠️ DUDA · ❌ REFUTADO · 💡 PROPONE.

### 2026-05-29 19:29 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
Story creada en `state=idea → refining` (design-story, release R0, planning-only). Prior-art scan hecho (ver checkpoint.md): **reuse del patrón shell de Vitalia, adaptado a los 5 agentes de Nicolify** — cero mirror. Esta story produce el contrato de diseño + nav-tree + mockup, NO código.

### 2026-05-29 19:29 · 🤖 claude · `/pm-nicolify` · 💡 PROPONE
**Baseline propuesto del shell de Nicolify** (apalancado en Vitalia, adaptado al modelo Agent-as-a-Service):

```
┌────────────────────────────────────────────────────────────┐
│ TopBar:  [logo Nicolify]   [tenant/agencia switcher]   ⚙ ⏣ │
├──────────────────────┬─────────────────────────────────────┤
│  LUANA (orquestadora) │  Ribbon: [Abel][Brenda][Christian]  │
│  chat persistente     │          [Norvil]  · [Configurar]   │
│  — único rostro —     ├─────────────────────────────────────┤
│  "conseguime 10       │  sub-tabs del agente activo         │
│   reuniones con CTOs"  │  [.....] [.....] [.....]            │
│                       │                                     │
│  (reportes digeridos) │  panel-content (la superficie       │
│                       │   que opera el agente)              │
└──────────────────────┴─────────────────────────────────────┘
```

Diferencia clave vs Vitalia: en Vitalia el chat era de **Valeria** (una agente más). En Nicolify, **Luana es el orquestador** (le hablás a ella, ella delega) → ocupa el rol del chat persistente, y el Ribbon muestra a los **4 agentes expertos** (Abel/Brenda/Christian/Norvil) + Configurar, cuyas superficies navegás.

Sub-tabs propuestas por agente (a refinar):
- **Abel** (estrategia/oferta): Oferta · Ángulos · Escalera de valor · Marca
- **Brenda** (growth/presupuesto): Pauta · Contenido · Presupuesto (CAC/ROAS)
- **Christian** (SDR/outbound): Prospección · Secuencias · Pipeline · Licitaciones (minería)
- **Norvil** (account mgr): Cuentas · Salud de cuenta · Upsell/Renovación
- **Configurar**: Tenant · Agentes (autonomía/umbrales) · Tokens/Plan · IAM

### 2026-05-29 19:29 · 🤖 claude · `/pm-nicolify` · ⚠️ DUDA
**5 decisiones que necesito que ratifiques (o corrijas) para cerrar el diseño:**

1. **Rol de Luana:** ¿Luana = el chat orquestador persistente (panel izquierdo, como propongo) y NO tiene tab propio en el Ribbon? ¿O querés que Luana también tenga su propio dashboard/tab (ej. resumen ejecutivo)?
2. **Layout:** ¿mantenemos el dual-mode 50/50 de Vitalia (chat Luana izq + panel app der), con los 3 estados de splitter (chat-collapsed / narrow / 50-50)? ¿O para B2B preferís otra proporción (ej. chat más angosto por default, panel más ancho para tablas/pipeline)?
3. **Ribbon:** ¿los 4 agentes expertos + Configurar (5 tabs), con Luana fuera del ribbon? ¿O 5 agentes en el ribbon incluyendo Luana?
4. **Sub-tabs por agente:** ¿te cierran las que propongo arriba, o ajustás/agregás/quitás alguna? (esto define el nav-tree)
5. **Reuse FE:** ¿confirmás reusar los componentes del shell de Vitalia (TopBar, Ribbon, SubTabsBar, chat panel, splitter) portados verbatim y re-temizados para Nicolify? (recomendado — máxima velocidad)

Respondé en 💭 Notas arriba o acá nomás. Con eso cemento las decisiones → produzco design-contract + nav-tree + mockup HTML (reuse Vitalia) → handoff `/architect` para ADR-nicolify-001 + ready package del shell esqueleto.

### 2026-05-29 19:37 · 🧑 chris · respuesta Q1-Q3 + dirección Q4
- **Q1 Luana:** chat orquestador, **fuera del Ribbon**. ✓
- **Q2 Layout:** **dual-mode 50/50** con splitter 3 estados (como Vitalia). ✓
- **Q3 Reuse FE:** **reusar componentes de Vitalia re-temizados**. ✓
- **Q4 Sub-tabs:** NO cerrar todavía. Primero revisar a fondo la **arquitectura frontend de Vitalia + lo aprendido**, y revisarlo **con `/pm-luana`** (que tiene la parte de arquitectura FE cross-brand/core), para sacar lo mejor antes de definir el nav-tree.

### 2026-05-29 19:37 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
Cementadas Q1-Q3 en checkpoint.md (`shell_decisions`): Luana=chat-orquestador-fuera-ribbon · layout=dual-mode-50/50-splitter-3-estados · reuse-fe-vitalia-retematizado. Sub-tabs (Q4) quedan **abiertas** pendientes de la revisión FE.

### 2026-05-29 19:37 · 🤖 claude · `/pm-nicolify` · 💡 PROPONE
Próximo paso: handoff a `/pm-luana` para revisar la arquitectura FE (paquetes `core/@luana/*` + ADR-vitalia-003/004/006 + SHELL-DESIGN-CONTRACT + design-system.md + 9 learnings FE de Vitalia + skill `vitalia-design-system`) y recomendar qué adopta Nicolify para su shell. El resultado alimenta el design-contract + nav-tree (incl. sub-tabs Q4) de esta story.

### 2026-05-29 19:45 · 🧑 chris · ratificación post-revisión FE
- **Q4 sub-tabs:** ratifico el set recomendado.
- **Lift timing:** copy-now, lift-later.
- **Skill design-system:** sí, crearlo ahora.

### 2026-05-29 19:45 · 🤖 claude · `/pm-luana` → `/pm-nicolify` · ✓ APLICADO
Revisión FE completada (`/pm-luana`) + materializada:
- `00-fe-architecture-review.md` — consumir `@luana/{ui-kit,format,hooks,design-tokens,api-client,extension-sdk}` · `ADR-nicolify-001` hereda las 9 secciones de ADR-vitalia-004 (sin PHI, con guardrails agénticos) · gates ADR-003 mockup + ADR-006 SSR-safe store · 9 gotchas FE preventivos · lift candidates (copy-now-lift-later).
- `navigation-tree.md` — nav-tree ratificado: Luana sidebar + Ribbon (Abel/Brenda/Christian/Norvil/Config) + sub-tabs por agente.
- `.claude/skills/nicolify-design-system/SKILL.md` — design system cargable (5 agentes, tokens B2B, guardrails en vez de PHI). Ya registrado.
- checkpoint.md: `shell_decisions` completas (Q1-Q4 + FE arch) · `architecture_pattern: ADR-nicolify-001`.

### 2026-05-29 19:45 · 🤖 claude · `/pm-nicolify` · 💡 PROPONE
Falta para cerrar `refining → refined` (gate ADR-003 mockup): (1) `SHELL-DESIGN-CONTRACT.md` de Nicolify + `ADR-nicolify-001`, (2) **mockup HTML del shell** (reuse Vitalia re-temizado · paleta B2B) que vos ratifiques visualmente, (3) backlog de stories del shell esqueleto (dev-stack + topbar/ribbon + Luana chat + routing/empty-states). Sugiero arrancar por el **mockup HTML** para que veas el shell de Nicolify y ratifiques colores/layout antes de invertir en el contrato + ADR.

### 2026-05-29 20:10 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
**Mockup HTML del shell construido** (`mockups/shell.html`, servido en `http://localhost:8890/shell.html`): port fiel del wrapper de Vitalia re-temizado a la **marca real de Nicolify** (paleta extraída de los SVG del logo legacy `nico-assets/`: indigo `#6A62FF` firma · púrpura `#641E98` · azul `#1225AB` · rojo `#F40F12`). Incluye: TopBar con logo real (light/dark), Luana chat orquestador izq con conversación realista (delega a Christian+Abel, reporta digerido), splitter 3 estados, Ribbon (Abel/Brenda/Christian/Norvil/Config), Christian→Pipeline kanban B2B con cuentas mineras Perú (Cuenta+Stakeholder), dark+light.

### 2026-05-29 20:50 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
**Avatares de agentes agregados** (pedido Chris): 5 SVG placeholder generados (gradiente marca + cara amistosa + glifo de rol) en `public/agents/{slug}/avatar.svg` (ruta canónica FE) + `mockups/assets/agents/{slug}.svg`. Cableados en el mockup: ribbon (Abel/Brenda/Christian/Norvil) + Luana chat header + sus mensajes. **Temporales — Chris entrega finales en semanas, reemplazo 1:1.** Registrado en skill `nicolify-design-system` §5 + memoria `nicolify-agents-catalog`.

### 2026-05-29 20:50 · 🤖 claude · `/pm-nicolify` · ⚠️ DUDA
Mockup actualizado con avatares — **refrescá `http://localhost:8890/shell.html`** y decime si va bien o qué ajusto (avatares, colores, layout, contenido). Al ratificarlo (gate ADR-003) cierro `SHELL-DESIGN-CONTRACT` + `ADR-nicolify-001` + backlog de R0.

### 2026-05-29 21:30 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
**(1) Splitter arrastrable** (pedido Chris · paridad Vitalia): handle drag entre Luana y el ribbon, con clamp (rail/min 28%/max 72%), snap a colapsado, doble-click→50/50, atajos C/R/F, resalte índigo. **(2) Colores actualizados desde `nicolify.com`** (mi criterio): primario indigo `#635BFF` + púrpura `#A855F7`; agentes Luana `#635BFF` · Abel `#A855F7` · Brenda `#22C55E` · Christian `#3B82F6` · Norvil `#EC4899` (todos del palette del sitio). Fuentes **League Spartan + Bree Serif** (del sitio). Dark mode pasó a deep-indigo-slate (cohesivo). Avatares regenerados con los nuevos colores. Sincronizado en cockpit `agent-meta.ts` + skill `nicolify-design-system` §5 + memoria. **0 colores viejos restantes.**

### 2026-05-29 21:30 · 🤖 claude · `/pm-nicolify` · ⚠️ DUDA
**Refrescá `http://localhost:8890/shell.html`** (probá el drag de la barra + el toggle dark/light). ¿Va la paleta + fuentes del sitio? Si va bien, cierro el design-contract + ADR + backlog R0.

### 2026-05-29 22:00 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
TopBar: switcher de agencia movido a la **derecha** + botón ⚙ standalone **eliminado** (Configurar vive en el Ribbon). Dropdown abre alineado a la derecha.

### 2026-05-29 22:05 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
**`nicolify/docs/architecture/SYSTEM-MAP.yaml` generado** (faltaba → el tab Map del cockpit erroraba). Schema v1.0 de Vitalia: 7 agentes (Luana+Abel+Brenda+Christian+Norvil+Config+Infra) con 25 áreas funcionales mapeadas al nav-tree (todo `planned` + `target_release` R0..R4), 6 cross_agent_flows del ciclo Atracción→Cierre→Retención, 11 entidades data_ownership (PHI=false), comentado para editar a futuro. API del cockpit lo sirve OK — refrescar el tab Map.

### 2026-05-29 22:30 · 🧑 chris · ratificación
Ratifico el mockup. Cerremos design-contract + ADR + backlog R0.

### 2026-05-29 22:30 · 🤖 claude · `/pm-nicolify` · ✓ APLICADO
**Paquete de diseño R0 CERRADO** (mockup ratificado · gate ADR-003 ✓). Producidos:
- `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` — atomic design SSoT (organismos, tokens nicolify.com, nav-model, catálogo agentes).
- `nicolify/docs/architecture/ADR-nicolify-001-shell-feature-architecture.md` — 9 secciones (hereda ADR-vitalia-004, sin PHI + guardrails agénticos) + gates G1 mockup / G2 SSR-safe store / G3 JIT-safe.
- `nicolify/.claude/rules/shell-feature-architecture.md` — overlay rule (gate: `/architect` REFUSE sin `architecture_pattern: ADR-nicolify-001`).
- **Backlog R0 = 7 stories** (state idea): dev-stack [blocker] → design-system-tokens → topbar → shell-layout-splitter → luana-chat → ribbon-subtabs → routing-empty-states. Ligadas en `releases/R0.yaml` con dependencias.
- **Design-story `nicolify-r0-shell-organism` → state=done** (planning completo · archive deferred mientras las 7 stories la referencian).

### 2026-05-29 22:30 · 🤖 claude · `/pm-nicolify` · 💡 PROPONE
R0 listo para construir. Próximo paso natural: refinar la **story [1] `nicolify-r0-dev-stack`** (blocker infra) → `/po` (service) → `/architect` → `/dev-team`. ¿Arrancamos esa, o querés revisar el backlog R0 en el cockpit (Roadmap/Board) primero?
