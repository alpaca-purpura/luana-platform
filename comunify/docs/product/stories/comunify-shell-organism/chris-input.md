---
story_id: comunify-shell-organism
created_at: 2026-06-15T14:48:21-05:00
last_modified: 2026-06-15T15:10:00-05:00
notes_count: 0
refs_count: 4
conversation_count: 3
---

# chris-input.md · comunify-shell-organism

> **Qué es este archivo:** acá Chris escribe notas + referencias + Claude responde con verdicts. Es la cocina de la story (la conversación) — separada del spec/design/arch (los outputs ratificados).

## 💭 Notas

### 2026-06-15 14:48
Sin notas todavía · Chris escribe aquí.

## 📎 Referencias

- **🔗 doc** · `core/@luana/ui-kit/src/organism/shell` — shell chrome compartido a consumir
- **📖 story-ref** · `nicolify/frontend/src/app/[tenantId]/(shell-organism)/` — referencia de port (re-skin)
- **📄 doc** · `comunify/docs/architecture/design-system.md` — tokens visuales comunify (SSoT)
- **📄 doc** · `.claude/rules/paradigm-arquitectura.md` + `docs/architecture/luana-platform/PARADIGM.md` — 3 planos / mapa 3 zonas

## 💬 Conversación

### 2026-06-15 14:48 · 🤖 claude · `/pm-luana`→`/pm-comunify` · ✓ APLICADO
**Pedido de Chris (verbatim):** "traer de main todo... el proceso /pm-luana coordina con /pm-nicolify para asegurarte que ahora comunify tiene toda la nueva base metodológica y de UI al día para revisar qué es lo que hemos hecho mal y debemos corregir para estar alineados empezando con tener el shell organism levantado."

**Hecho:**
1. **Sync con main** ✓ — `scripts/git/sync-from-main.sh`; wip/comunify quedó 0 detrás / 35 adelante de origin/main (HEAD `7501136e`). Trajo trabajo vitalia + nueva base de harness/metodología (tier-routing CLAUDE.md, learning lifecycle, parallel-safety M15, cockpit→binario alpaca, paradigm v5).
2. **Coordinación cross-brand** (/pm-luana; /pm-nicolify NO se corre desde worktree comunify por Step 0 — se leyó su SSoT). Diagnóstico: comunify es la única brand activa en dashboard viejo; nunca migró al shell-organism; consume cero `@luana/*`; sin cast de agentes; drift de lockfiles.
3. **Story creada** `comunify-shell-organism` (state=idea) de esta conversación.

**Decisiones ratificadas por Chris (AskUserQuestion):**
- **Path:** Historia SDD completa (refine→arch→build→audit→DoD live-verify).
- **Drift cleanup:** ahora → Ticket-0 hygiene (lockfiles align-a-vitalia + track next-env + deps @luana/* con install-verify, NO blind-delete).
- **Cast:** comunify-específico (personas propias, NO cast canónico Luana).
- **Scope:** MVP shell + features stub (10 áreas dashboard se portan en stories siguientes).

**Stories abiertas que NO bloquean (FYI):** `nicolify-r1-abel-icp-buyer` (nicolify, reviewing), `cockpit-go-process-coverage` (platform, developing).

💡 **PROPONE — cast comunify (a ratificar/renombrar por Chris):** el shell-organism es un Ribbon de especialistas + supervisora. Propuesta inicial mapeada a la cadena de valor creator economy (Luana orquestadora + Valeria supervisora se mantienen — canónicas platform-wide; los **especialistas** son los comunify-específicos):

| Rol (cadena de valor) | Persona propuesta | Dominio comunify | Color (tokens design-system) |
|---|---|---|---|
| Orquestadora (sidebar) | **Luana** | ruteo / supervisión global | marca |
| Supervisora | **Valeria** | coordina especialistas | — |
| Base / Setup | **Nina** (= Lisa) | perfil creator, identidad, onboarding | azul `#2D7FF9` |
| Atraer | **Tomás** (= Lucas) | audiencia + contenido + authority vault | morado `#7B2FF7` |
| Vender | **Sofía** (= Adrián) | cohorts + offer ladder + discovery calls | coral |
| Operar | **Bruno** (= Mateo) | comunidad + moderación + entrega cohort | verde |
| Retener | **Lucía** (= Camila) | suscripciones + dunning + churn | azul-deep `#1246D6` |

Nombres = placeholders; renombralos libremente. Una vez ratificado → escribo `ADR-comunify-NNN-agentes-cast` + catálogo, y recién ahí encadeno `/po-ux` (la UX del shell necesita el cast para el Ribbon fiel).

⚠️ **DUDA / próximo input de Chris:** (a) ¿ratificás/renombrás el cast de arriba?  (b) ¿avatares — Chris los provee como en nicolify/vitalia, o placeholders SVG?

### 2026-06-15 15:10 · 👤 chris
Comentarios sobre el cast:
1. Orquestadora y supervisora son lo mismo en las demás marcas y aquí también debería ser (a menos que haya razón técnica). También debería encargarse del onboarding.
2. Nina = estratega (como Lisa en Vitalia): setea el perfil del creator, ayuda a crear el offer ladder, armar cohorts. Todo lo relacionado a marca y producto.
3. Tomás = toma lo de Nina y lo promociona orgánico + paid. Equipo de marketing/publicidad digital. Setter combinado con growth marketing.
4. Sofía = vendedora estrella, atiende todos los canales de venta, closer que vende y recupera leads.
5. Bruno = día a día / operación (rol no del todo claro aún).
6. Lucía = fidelización: mantiene el CRM al día con acciones digitales para que cada cliente se sienta valorado.
Revisar cómo funciona en vitalia y nicolify y actualizar.

### 2026-06-15 15:10 · 🤖 claude · `/pm-comunify` · ✓ APLICADO
Revisé vitalia + nicolify. Hallazgos:
- **Punto 1 CONFIRMADO:** orquestadora == supervisora en AMBAS (una entidad, sidebar, fuera del Ribbon, runtime en zona Infraestructura·motor-agentico). Sin razón técnica para separarlas → unificadas. PERO el nombre diverge: vitalia=**Valeria**, nicolify=**Luana**. PARADIGM.md (SSoT) = "supervisora Valeria". **Recomiendo Valeria** para alinear.
- **Onboarding:** en ambas marcas vive en el tab **Plataforma** (zona acceso·onboarding·config), no como agente. Tu pedido calza: la supervisora es la **cara que guía** el onboarding; el surface vive en Plataforma. Nina hace perfil/marca/producto ongoing.
- **Tu mapping calza 1:1 con la cadena de valor canónica:** Nina=Estratega(=Lisa/Abel) · Tomás=Atraer(=Lucas/Brenda) · Sofía=Vender(=Adrián/Christian) · Bruno=Operar(=Mateo/Sara) · Lucía=Retener(=Camila/Norvil).

**Cast comunify corregido (ratificado salvo nombre supervisora):**

| Rol | Persona | = canónico | Dominio comunify |
|---|---|---|---|
| Supervisora+orquestadora+onboarding (sidebar) | **Valeria** (rec.) | Valeria/Luana | ruteo + supervisión + guía onboarding |
| Estratega (marca+producto) | **Nina** | Lisa/Abel | perfil creator + offer ladder + cohorts + brand-studio |
| Atraer (marketing org+paid) | **Tomás** | Lucas/Brenda | promueve lo de Nina, orgánico + paid, setter+growth |
| Vender (closer) | **Sofía** | Adrián/Christian | todos los canales de venta + recupera leads |
| Operar (día a día) | **Bruno** | Mateo/Sara | comunidad + moderación + cohort delivery (scope a confirmar) |
| Retener (fidelización) | **Lucía** | Camila/Norvil | CRM + dunning + subscripciones + fidelización digital |
| tab Plataforma | — | Plataforma/Config | acceso · onboarding · configuración |

⚠️ **DUDA abierta (cement-bound):** ¿nombre de la supervisora = **Valeria** (canónico SSoT + vitalia) o **Luana** (como nicolify)? En cuanto cierres → escribo `ADR-comunify-NNN-agentes-cast` + catálogo + encadeno `/po-ux`.
💡 **PROPONE:** avatares = placeholders SVG por ahora (como nicolify/vitalia), reemplazo 1:1 cuando los tengas.

### 2026-06-15 15:18 · 👤 chris
Supervisora = **Luana** (como nicolify).

### 2026-06-15 15:18 · 🤖 claude · `/pm-comunify` · ✓ APLICADO
Cast cementado en **`ADR-comunify-001-agentes-cast.md`** (status accepted):
- Sidebar: **Luana** (supervisora+orquestadora+onboarding).
- Ribbon: **Nina** (estratega) · **Tomás** (atraer) · **Sofía** (vender) · **Bruno** (operar) · **Lucía** (retener) + tab **Plataforma**.
- Colores mapeados a tokens comunify existentes (no hardcode); avatares = placeholders SVG.

Story `comunify-shell-organism` pasó **idea → refining** (`cast_ratified: true`). next_handoff `/po-ux`
(diseña el shell: consume `@luana/ui-kit` organism/shell, Ribbon del cast, sidebar Luana, nav 3 zonas,
Config; port re-temizado de vitalia/nicolify). Pendientes paralelos del flujo: skill
`comunify-design-system` + SHELL-DESIGN-CONTRACT comunify.
