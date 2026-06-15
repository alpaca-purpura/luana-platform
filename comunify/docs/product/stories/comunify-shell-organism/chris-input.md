---
story_id: comunify-shell-organism
created_at: 2026-06-15T14:48:21-05:00
last_modified: 2026-06-15T14:48:21-05:00
notes_count: 0
refs_count: 0
conversation_count: 1
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
