---
story_id: nicolify-r0-storybook-inventory
brand: nicolify
type: ui-story                         # design-system cross-cutting · NATURALEZA TÉCNICA (no es pantalla)
state: refining
verification_nature: técnica          # render-sanity + a11y + completitud del contrato + clasificación correcta. SIN demo funcional de usuario.
architecture_pattern: ADR-014-design-system-homologation   # design-system (NO ADR-nicolify-001 — no construye sub-tab). Espeja a ds-adoption.
po_ux_version: 1
cap_target: design-system/nicolify-ui-homologation   # extiende la homologación existente (Chris 2026-06-24 OQ-2)
cap_change_type: extend               # extend de nicolify-ui-homologation (Chris ratificó OQ-2) — /architect confirma al ready
ratified_by_chris: false              # → true al firmar (story técnica: 1 sola firma sobre el spec, sin mockup)
demo_required: true                   # demo = storybook navegable (kit brand=nicolify + brand-storybook poblado) + contrato 1:1 legible
---

# 01-spec · nicolify-r0-storybook-inventory — Inventario 1:1 de la UI en Storybook

> **Naturaleza TÉCNICA (design-system).** NO es una pantalla de usuario: es un catálogo. Por eso este spec NO trae Gherkin de flujo de usuario (happy/negative/adversarial sobre una acción de negocio) ni microcopy/responsive por escenario — no aplican. La verificación es **técnica**: que cada story nueva renderice (render-sanity) + a11y addon + que el contrato sea un mapa 1:1 completo + que la clasificación por balde sea correcta. Mapeo a la doctrina: `frontend-visual-fidelity.md § Storybook` + `design-system-canon.md §5`.
>
> **Una sola firma** (técnica, sin mockup creativo): Chris ratifica este spec → `refined`. No hay flujo de 2 firmas (input-spec + mockup-final) porque no hay diseño visual nuevo — el look ya está cementado por los tokens de marca.

## § Context

- **Release:** R0 (Fundación — inventario completo ANTES de crecer hoja por hoja).
- **Módulo / bucket:** `design-system` · `code:design-system`.
- **Zona/caja (paradigma):** Infraestructura → plataforma-tecnica → design-system (atributo de calidad: inventario navegable de la UI). Derivada de `SYSTEM-MAP.yaml::zones`. `user_visible: false`.
- **Dónde vive:** NO es una ruta del shell. Vive en (a) `nicolify/frontend/.storybook` (las `.stories.tsx` brand-local) y (b) `nicolify/docs/architecture/SHELL-DESIGN-CONTRACT.md` (el mapa 1:1).
- **Consumidores (el "rol"):** `/architect` (citar el átomo/molécula exacto en `03-arch § FE`), `/dev-team` (construir desde la story citada), y **Chris** ("¿qué componentes de mi solución toco ante un cambio de UI?"). No hay usuario final.
- **Esta story = Fase 1** del plan "todo lo de UI sale del Storybook" (`00-research.md § Plan de 4 fases`).
- **Out of scope:** Fase 0 (doctrina, ya commiteada `891306d8`) · Fase 2 (loop emergente) · Fase 3 (manifiesto machine-readable consultable → `/pm-luana` core) · la convergencia local→kit de los ports (eso es `ds-adoption`, no esta story).

## § Prior art applied

> Scan completo en `00-research.md` (3 subagentes: vitalia · kit · nicolify). Resumen:

- **Engine/kit consumido:** `@luana/ui-kit` **0.6.0** (82 stories: átomos + layout + moléculas + **shell** + archetypes + EntityWorkspaceLayout) + `@luana/design-tokens` 0.2.0 (name-contract de tokens) + `@luana/eslint-config` 0.1.0 (`no-arbitrary-value`). Nicolify ya consume (15 archivos importan `@luana/ui-kit`).
- **Modelo replicado de vitalia (NO copia de componentes):** la **estructura del `SHELL-DESIGN-CONTRACT`** (sus § 1-8: decisiones · capas atómicas · inventario exhaustivo mockup→componentes · tokens · stores · routing), la **convención CSF3 de `.stories.tsx`**, y el **modelo de 2 capas** (átomos/moléculas/shell en el storybook del **kit** con brand-toggle · componentes únicos de marca en el storybook de la marca). Vitalia tiene **44 stories** = casi todas de SUS features (marketing/Lucas 17 · fidelización/Camila 14 · moléculas 13). NO son copiables 1:1 a nicolify (las features difieren — nicolify hoy solo tiene Abel ICP). Vitalia NO storió su plomería de shell.
- **Brand-toggle ya existe (kit):** `core/@luana/ui-kit/.storybook/preview.ts` tiene `globalTypes.brand` (vitalia/nicolify) → `[data-brand]` en `<html>` → `preview.css` trae 1 bloque de tokens por marca → **mismo componente, skin de marca**. Cubre exactamente la divergencia por-marca (ver § Modelo de divergencia).
- **Learnings aplicados:** `vitalia/docs/learnings/2026-06-06-n3-entity-workspace-layout-from-nicolify.md` (comparar cross-brand antes de rediseñar shell = adoptar la mejor versión, no solo anti-dup) · `00-research § Huecos que ni vitalia cerró` (inventario en texto, sin consulta machine-readable → Fase 3 lo cierra).
- **Lift candidates detectados:** la plomería de shell genérica de nicolify (TenantSwitcher/ThemeToggle/TenantBadge si resultan no-brand-specific) = candidatos a consumir del kit / lift → `ds-adoption` + `/pm-luana`. Se **marcan** en el contrato, NO se resuelven acá.
- **Net-new justificado:** las stories de Abel ICP + moléculas nicolify-only (no existen en kit ni en vitalia) = el gap real (balde 3).

## § Mapa funcional (capa humana — adaptada a técnica)

### Flujo (el trabajo de inventariar, narrado)

1. **Clasificar** cada componente brand-local de nicolify en uno de **3 baldes** (grep cross-kit) → escribir la clasificación en el contrato.
2. Para el **balde (3)** (único de nicolify), **escribir su `.stories.tsx`** (CSF3, decorators, a11y) en `nicolify/frontend/.storybook`.
3. **Poblar `SHELL-DESIGN-CONTRACT.md`** a inventario 1:1: cada componente → path + props + estado + link-a-story (si tiene) + balde + token-overrides de nicolify (si es átomo compartido).
4. **Verificar** técnica: storybook de nicolify levanta + cada story nueva renderiza + a11y verde + el contrato no deja componente sin clasificar.

### Bifurcaciones (la clasificación — árbol de decisión por componente)

```
¿El componente ya existe en el storybook del KIT (@luana/ui-kit)?
├─ SÍ → ¿nicolify tiene una COPIA LOCAL de él?
│        ├─ SÍ (port local) → BALDE (2): listar en contrato como "port de kit X · deuda consumir-kit (ds-adoption)". NO story.   [Bif-2]
│        └─ NO (lo consume directo) → BALDE (1): listar citando la story del kit + brand-toggle. NO story.                       [Bif-1]
└─ NO (no hay twin en el kit) → BALDE (3): ÚNICO de nicolify → escribir su .stories.tsx + listar en contrato.                    [Bif-3]
```

### Reglas de negocio (design-system)

- **RN-1** — Átomo/molécula/shell compartido se **consume del kit**, NO se re-storia en la marca (balde 1). El kit + brand-toggle es su SSoT visual.
- **RN-2** — Port local de una pieza del kit (balde 2) = **deuda**, se **lista marcado** en el contrato, NO se le escribe story propia (duplicaría la del kit). Su convergencia es de `ds-adoption`, no de esta story.
- **RN-3** — Componente único de nicolify (balde 3) **debe** tener `.stories.tsx` + entrada en el contrato. Sin story → componente invisible al inventario (= el gap que esta story cierra).
- **RN-4** — Divergencia visual de un átomo compartido entre marcas se resuelve por **token** (`[data-brand]` en `globals.css`), NUNCA forkeando el componente (ver § Modelo de divergencia). El contrato registra los token-overrides de nicolify por átomo compartido.
- **RN-5** — Cero `arbitrary-value`, cero hex/px nuevo en las stories (canon §0 · `no-arbitrary-value`). Las stories componen del kit + tokens nicolify.
- **RN-6** — Pieza net-new que aparezca durante el inventario y sea genuinamente compartible → se **PROPONE PROMOTE** al kit + story (`/pm-luana`), NO queda local sin promover (canon §5 · ⚠️ sin gate mecánico aún — HB-107).
- **RN-7** — El contrato es un **mapa 1:1 COMPLETO**: ningún componente brand-local de nicolify queda sin una fila + balde asignado. Un componente sin clasificar = hueco.
- **RN-8** — El **roster de agentes** (eje ortogonal a los baldes) lista TODOS los agentes (Luana + Abel + Brenda + Christian + Sara + Norvil) con `status: construido | pendiente`. Un agente `pendiente` se representa con status explícito + superficies anticipadas, **NUNCA con una story falsa de un componente inexistente**. El mapa no miente: muestra todo, etiquetando qué está construido y qué no.

### Criterios de aceptación (feature-done)

- **AC-1** — Todo componente del **balde (3)** tiene una `.stories.tsx` que renderiza (render-sanity verde) en el storybook de nicolify.
- **AC-2** — El a11y addon corre verde (o con excepciones documentadas) sobre cada story nueva.
- **AC-3** — `SHELL-DESIGN-CONTRACT.md` lista **todos** los componentes brand-local clasificados en su balde (1/2/3), con path + props + estado + link-a-story (balde 3) + token-overrides nicolify (átomos compartidos).
- **AC-4** — `make storybook` (o el script equivalente) de nicolify buildea sin error con las stories nuevas.
- **AC-5** — Cero pieza del balde (2) re-storiada · cero pieza del balde (3) sin story (clasificación correcta, RN-1/RN-3).
- **AC-6** — El **roster de agentes** está en el contrato (los 6, con `status`) Y existe una story-doc "Agentes / Roster" en el storybook de nicolify que renderiza los 6 con avatar + color + pill de status. Cero story de componente para un agente `pendiente` (RN-8).

## § Modelo de divergencia por-marca (documentado — RN-4)

> Capturado de la conversación de refinamiento (2026-06-24). Es **doctrina**, no trabajo nuevo: el mecanismo ya está cableado (RN-7 de `globals.css` · brand-toggle del kit). El contrato lo documenta.

Para hacer que un átomo compartido se vea distinto en una marca (ej. textbox pill en nicolify, recto en marca futura), **3 niveles, en orden de preferencia**:

| Nivel | Cuándo | Cómo | Fork |
|---|---|---|---|
| **1 · Token** (default) | color, radio, espaciado, tipografía, sombra | el átomo del kit usa una clase-token (`rounded-control`, `bg-primary`); cada marca setea el **valor** en su `globals.css` por `[data-brand]`. El **nombre** del token es compartido (`@luana/design-tokens`), el **valor** es brand-owned | **NO** |
| **2 · Variante/prop** | diferencia estructural parametrizable | el átomo expone `variant="..."` (CVA); la marca elige | **NO** |
| **3 · Fork** (escape, raro) | algo que tokens/variantes no expresan | componente brand-local (fuera del kit) o nueva variante al kit vía promotion gate | **SÍ — evitar** |

Evidencia en código (caso textbox pill): el Input del kit usa `rounded-control`; nicolify `globals.css` → `--radius-control: var(--radius-pill)` (9999px); una marca recta setearía `--radius-control: 0`. Un solo componente, N skins. Extender la forma a algo nuevo = agregar un **nombre de token nuevo** al contrato (sigue Nivel 1).

## § Alcance — los 3 baldes

> ⚠️ La clasificación EXACTA balde (2) vs (3) de la plomería de shell la cierra el **primer ticket del build** (grep cross-kit) — abajo va la clasificación **preliminar**. Abel ICP y las moléculas nicolify-only son balde (3) **seguro**.

| Balde | Acción | Componentes (preliminar) |
|---|---|---|
| **(1) Compartido → ya en kit** | listar citando story del kit + brand-toggle · NO story | átomos consumidos (Button, Input, Select, Badge, Skeleton, Dialog, DropdownMenu, Tooltip, Alert) · layout · moléculas · shell (Ribbon, SubTabsBar, EntityWorkspaceLayout…) |
| **(2) Port local de kit → deuda** | listar marcado "consumir-kit (ds-adoption)" · NO story | `components/ui/` (8: button, input, dialog, badge, alert, dropdown-menu, skeleton, tooltip) · `shell-organism/SubSubTabsBar` · `app/(shell-organism)/_components/ShellLayoutWire` (wire de `shell.ShellLayout`) · *(otros shell-organism a confirmar)* |
| **(3) Único de nicolify → ESCRIBIR STORY** | `.stories.tsx` + entrada contrato | **Abel ICP (7):** `IcpCard` · `IcpMasterListView` · `IcpWorkspaceView` · `IcpDatosForm` · `BuyerLeafForm` · `IcpEntityLayoutClient` · `IcpIntakeOverlay`. **Moléculas/shell nicolify-only:** `AgentAvatar` (mirror de la de vitalia, re-skin) · `UniversalIntake` · `ProposalBanner` · `WhatForChip` · `DraftFirstStarter` · `AddAgencyPlaceholderModal` · `ConfigTab` · `LogoMark` · *(TenantSwitcher/TenantBadge/TenantOption/ThemeToggle/SubSubTab/SubTabContent → balde (2) o (3) según grep cross-kit)* |

**Gap real estimado:** ~15-20 stories (solo balde 3), NO 31. Lo compartido ya está (kit + brand-toggle); lo demás es deuda que se mapea.

## § Roster de agentes en el contrato (RN-8 · eje ortogonal a los baldes · OQ-1 resuelta)

> El mapa NO debe mentir: los agentes aún no construidos (Brenda/Christian/Sara/Norvil) **deben estar** en el inventario (Chris 2026-06-24). Pero no se puede storiar un componente que no existe. Solución: el roster es un **eje aparte** del de componentes, con **status explícito**.

| Agente | Audiencia | Color | Status | Componentes / superficies | Story |
|---|---|---|---|---|---|
| Luana | supervisora (sidebar) | indigo #635BFF | construido (shell) | `ShellLayoutWire` + chat (kit) | shell (kit) |
| **Abel** | interno (copilot) | *(brand.yaml)* | **construido** | `features/abel/icp/` (7) | `nicolify: abel.*` (balde 3) |
| Brenda | interno (copilot) | *(brand.yaml)* | **pendiente** | *(anticipado: growth/budget sub-tabs)* | — (sin story falsa) |
| Christian | bifronte (copilot+sales_agent) | *(brand.yaml)* | **pendiente** | *(anticipado: outbound/SDR)* | — |
| Sara | interno (copilot) | ámbar #F59E0B | **pendiente** | *(anticipado: "Mi Día"/delivery)* | — |
| Norvil | interno (copilot) | *(brand.yaml)* | **pendiente** | *(anticipado: account-health/retención)* | — |

**Mecanismo (2 lugares, cero componente fabricado):**
1. **Contrato** — esta tabla "Roster de agentes": TODOS los agentes con `status: construido | pendiente`. Construido linkea a sus stories; pendiente lleva status + superficies anticipadas (lo que tendrá cuando se construya) + su slot en el Ribbon (que ya existe). El mapa está completo y etiquetado.
2. **Storybook** — UNA story-doc **"Agentes / Roster"** en el storybook de nicolify (estilo `foundations.AgentColors` del kit): renderiza los 6 con avatar + color + **pill de status** (Construido/Pendiente). Se VE el roster completo, honesto, sin fabricar stories de componentes inexistentes.
3. El **Ribbon** (story del kit, brand=nicolify) ya muestra los tabs de los 5 agentes — verdad navegacional ya presente.

Así el inventario lista todo (componentes en sus 3 baldes + roster con status), Storybook lo hace visible, y nada finge estar construido.

## § El contrato 1:1 (`SHELL-DESIGN-CONTRACT.md` — schema)

Subir el contrato actual (normativo) a **inventario descriptivo 1:1**, espejando la estructura § de vitalia. Cada componente = una fila:

| Componente | Path | Capa | Balde | Props (clave) | Estados | Story | Token-overrides nicolify |
|---|---|---|---|---|---|---|---|
| Input | `@luana/ui-kit/.../input.tsx` | átomo | (1) kit | `type, disabled…` | idle/focus/error/disabled | `kit: atoms.Input` | `--radius-control: pill` |
| IcpCard | `nicolify/.../features/abel/components/icp/IcpCard.tsx` | molécula | (3) único | `icp, onSelect…` | idle/selected | `nicolify: abel.IcpCard` (NEW) | — |
| `ui/button` (port) | `nicolify/.../components/ui/button.tsx` | átomo | (2) port | — | — | (kit: atoms.Button) | deuda: consumir-kit |

Secciones del contrato (mirror vitalia § 1-8, rellenadas con realidad nicolify): § decisiones cementadas · § capas atómicas · § **inventario exhaustivo por balde** (la tabla ↑) · § tokens (autoridad `globals.css` + name-contract `design-tokens` + overrides nicolify) · § stores · § routing/shell · § modelo de divergencia (§ arriba).

## § Convenciones de Storybook (replicadas de vitalia · CSF3)

- **CSF3** (`Meta` + `StoryObj`), 1 archivo por componente, co-locado (`Componente.stories.tsx` junto al `.tsx`).
- **Addons ya montados** (`nicolify/.storybook/main.ts`): `@storybook/addon-themes` (light/dark via `withThemeByClassName`) + `@storybook/addon-a11y`.
- **Tokens nicolify** ya cargados en `preview.ts` (`import '../src/app/globals.css'`).
- **Decorators** para componentes con deps (organismos Abel ICP con React Query / stores / `next/navigation`): mockear vía decorator (espejar cómo el kit mockea `appDirectory:true` + hooks). El architect dicta el patrón de mock por componente en `03-arch § FE`.
- **Relación con el kit:** el storybook de nicolify storia SOLO el balde (3). Los compartidos (balde 1) se ven en el storybook del **kit** con `brand=nicolify`. Dos storybooks, dos capas (no se duplica).

## § Verificación (técnica — gates)

| Gate | Qué verifica | Cómo |
|---|---|---|
| **render-sanity** | cada story balde (3) monta sin throw | storybook test-runner / build-storybook sin error (AC-1, AC-4) |
| **a11y** | WCAG sobre cada story nueva | `@storybook/addon-a11y` verde o excepción documentada (AC-2) |
| **contrato completo** | ningún componente brand-local sin fila + balde | check de completitud: grep de componentes vs filas del contrato = 0 sin clasificar (RN-7, AC-3) |
| **clasificación correcta** | balde (2) no re-storiado · balde (3) sin story = 0 | revisión auditor: cada port sin story propia · cada único con story (RN-1/RN-3, AC-5) |
| **no-arbitrary** | cero hex/px nuevo en stories | `eslint no-arbitrary-value` (RN-5) |
| **net-new promovido** | átomo net-new no queda local sin promover | auditor por prosa (RN-6 · ⚠️ sin gate mecánico — HB-107) |

> **Verificación REAL ≠ "buildea verde":** la demo (RN-7 de la DoD) = **levantar el storybook de nicolify + navegar las stories nuevas + ver que renderizan fiel** + abrir el contrato y comprobar que el mapa 1:1 está completo. No basta `build-storybook` exit 0.

## § Matriz de cobertura (Bif/RN → verificación REAL)

| Ítem | Tipo | Cubierto por | Verificación REAL |
|---|---|---|---|
| Bif-1 (compartido directo) | branch | contrato | fila cita story del kit + se ve en kit storybook brand=nicolify |
| Bif-2 (port local) | branch | contrato | fila marcada "consumir-kit" · NO existe `.stories.tsx` para ese port |
| Bif-3 (único nicolify) | branch | story + contrato | `.stories.tsx` existe + renderiza en storybook nicolify + fila en contrato |
| RN-1 (consumir, no re-storiar) | rule | clasificación | grep: cero story brand-local para un componente que ya está en el kit |
| RN-3 (único debe tener story) | rule | clasificación | grep: cero componente balde (3) sin `.stories.tsx` |
| RN-4 (divergencia = token) | rule | contrato | el contrato lista token-overrides nicolify por átomo compartido; cero fork de átomo |
| RN-7 (mapa completo) | rule | contrato | componentes brand-local sin fila = 0 |
| AC-1..5 | accept | gates ↑ | render-sanity + a11y + completitud + clasificación |

**Huecos detectados:** ninguno. **SC huérfanos:** ninguno (story técnica — los "SC" son los gates de verificación, no Gherkin de usuario).

## § Out of scope (anti-creep)

- ❌ Convergir los ports del balde (2) al kit (eso es `ds-adoption` + `/pm-luana`).
- ❌ Storiar átomos/moléculas/shell compartidos (ya en el kit · RN-1).
- ❌ Construir componentes de Brenda/Christian/Sara/Norvil (aún no existen como código — el § Roster de agentes los lista con `status: pendiente` + superficies anticipadas, RN-8, para no mentir, pero NO se construyen acá).
- ❌ Fase 3 (manifiesto machine-readable consultable → core `/pm-luana`).
- ❌ Crear gates mecánicos de enforcement (HB-106 no-div-layout/no-native-select vapor en nicolify · HB-107 promote-gate) — son harness, no esta story (anótese para `/architect § 04-validators`: el enforcement que querríamos NO existe aún en nicolify → o se declara advisory, o se levanta un HB).

## § Componentes (resumen para /architect)

- **Stories NEW (balde 3):** Abel ICP (7) + moléculas nicolify-only (~8-13). Lista exacta = output del ticket de clasificación.
- **Reuse (balde 1):** todo `@luana/ui-kit` — citar por id de story.
- **Deuda (balde 2):** 8 `ui/` + ports de shell — listar, no storiar.
- **Doc:** `SHELL-DESIGN-CONTRACT.md` (subir a 1:1 descriptivo).

## § Notas para /architect

1. **Primer ticket = clasificación** (grep cross-kit) que cierra la lista exacta balde (2) vs (3). Todo lo demás depende de eso.
2. **`verification_nature: técnica`** → `04-validators` keyea gates técnicos (build-storybook, a11y, eslint no-arbitrary, completitud-contrato), SIN gate anti-burbuja ni e2e de flujo de usuario.
3. **HB-106/HB-107**: el enforcement mecánico del canon (no-div-layout, no-native-select, promote-gate) **no existe en nicolify**. Decidir en `04-validators`: declarar advisory + levantar HB, o no exigirlo.
4. **`architecture_pattern`**: este spec usa `ADR-014-design-system-homologation` (design-system, como ds-adoption), NO `ADR-nicolify-001` (que es para sub-tabs). El checkpoint tenía `ADR-nicolify-001` — corregir al cerrar refined.
5. **Decorators de organismos** Abel ICP (deps React Query/stores/navigation): dictar patrón de mock por componente.

## Open questions

- ✅ **OQ-1 RESUELTA (Chris 2026-06-24)** — "el mapa no debe mentir, deben estar". → § Roster de agentes (RN-8 + AC-6): los 6 con `status: construido | pendiente`, pendientes con superficies anticipadas + story-doc "Agentes / Roster" en Storybook. Cero story falsa.
- ✅ **OQ-2 RESUELTA (Chris 2026-06-24)** — `cap_change_type: extend` de `design-system/nicolify-ui-homologation`. /architect confirma al ready.

Ninguna open question pendiente → listo para ratificar.
