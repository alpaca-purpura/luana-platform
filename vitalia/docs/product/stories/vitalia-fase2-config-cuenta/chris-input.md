---
story_id: vitalia-fase2-config-cuenta
created_at: 2026-05-27T18:25:23-05:00
last_modified: 2026-05-27T18:25:23-05:00
notes_count: 0
refs_count: 0
conversation_count: 1
---

# chris-input.md · vitalia-fase2-config-cuenta

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
>
> Cada entry abre con `### YYYY-MM-DD HH:MM` (timestamp).

### 2026-05-27 18:25
Sin notas todavía · Chris escribe aquí.

## 📎 Referencias

> Chris: pega links, sube imágenes (drag-drop o botón adjuntar), cita texto de buyer personas, referencia otras stories (`F2-S1`) o learnings (`2026-MM-DD-slug`).
>
> Tipos válidos: 🔗 link · 🖼 img · 💬 text · 📖 story-ref · 📚 learning-ref · 📄 doc.
>
> Formato: `- **(emoji) (tipo)** · (valor)` + opcional `  > (comentario)` en siguiente línea.

(sin referencias todavía)

## 💬 Conversación

> Append-only · turn-by-turn cronológico.
> Chris responde a Claude editando + agregando un entry nuevo.
> Claude appendea verdict al cierre de cada turn de su skill.
>
> Verdict labels: ✓ APLICADO · ⚠️ DUDA · ❌ REFUTADO · 💡 PROPONE.

### 2026-05-27 18:25 · 🤖 claude · `scripts/migrate_to_release_schema.py` · ✓ APLICADO
Story migrada al schema v2: `release=F2`, `cap_target=config.cuenta`, `cap_change_type=new`. Legacy `outcome` + `phase` preservados durante deprecation gradual.

Cuando estés listo para refinar, llena 💭 Notas + 📎 Referencias arriba e invoca `/po-ux vitalia vitalia-fase2-config-cuenta` (o `/po` si es service story, o `/ux-agentico` si es agentic).

### 2026-06-07T00:50 · 🤖 claude · `/pm-vitalia` · ⚠️ DUDA
Auditoría pre-refinamiento (pedido: "revisá qué avanzamos / no se muestra / drifts / qué debería ir"). Hallazgos en `00-pm-analysis.md`:
- **Avance real pero no cableado:** la sub-tab Cuenta es **solo placeholder** (`CuentaPlaceholder.tsx`); el backbone existe disperso (admin Streamlit users-crud LIVE · iam users/roles · onboarding clinic profile · fiscal · audit · clinics) pero NO surface en la caja Configuración del shell. Construir casi nada en BE — falta la vista user-facing que consuma lo existente.
- **5 drifts:** (1) naming legacy `config.cuenta` vs autoridad `plataforma→configuracion→cuenta` (SYSTEM-MAP+ADR-004 v1.2); (2) migración config→plataforma declarada pendiente; (3) "Plan Luana/Stripe" premature+cross-brand+contradice pricing-deferred y modelo empleados-IA por puesto (ADR-013); (4) Equipo/RBAC triple-solapa con admin users-crud + lisa-doctores + caja Acceso; (5) Info clínica solapa onboarding-clinica (vertical read-only D3).
- **Propuesta lean:** Cuenta = datos del tenant (clínica+fiscal+preferencias regionales+sedes+DPO), consume BE existente. Fuera: billing, equipo, cambio de vertical.
- **3 decisiones bloqueantes (D1 billing · D2 equipo · D3 naming)** → planteadas a Chris. Tras ratificar → update checkpoint + handoff `/po-ux`.

### 2026-06-07T00:50 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
Chris ratificó las 3 recomendaciones: **D1** sacar billing (defer) · **D2** sacar equipo→Acceso · **D3** alinear naming a `configuracion.cuenta`. Apliqué al `checkpoint.md`:
- frontmatter: `agent_owner/module/capability=configuracion(.cuenta)`, `cap_target=configuracion.cuenta`, `cap_change_type=new`, `ratified_decisions[D1,D2,D3]`, `estimated_dev_days 3-4→2-3`, soft-dep → `onboarding-clinica`.
- scope reescrito a 4 secciones lean: Datos clínica (consume fiscal validators) · Preferencias regionales (TenantLocale) · Sedes (clinics) · Responsable/DPO. Sin billing, sin equipo. AC/Gherkin/mockups deferidos a `/po-ux`.
Próximo: handoff `/po-ux` para 01-spec + mockups (gate ADR-003). State sigue `refining` hasta ratificación visual.

### 2026-06-07T00:50 · 🤖 claude · `/po-ux` · ⚠️ DUDA
RONDA 1 (intención) arrancada. Escribí `01-spec.md` draft (Dónde vive + Prior art + Mapa funcional draft + dudas). Hallazgos que ACHICAN aún más la story:
- **El modelo de datos ya existe casi todo:** entidad `Clinic` (clinics/domain) tiene name·country·timezone·plan_tier·onboarding_completed; engine `luana-core-tenant-profile` tiene perfil + `business_types_catalog` (vertical). La vista es ~puro FE + read/update sobre lo existente. **Faltan solo** fiscal_id + dirección + idioma (net-new acotado).
- **Ruta confirmada:** `/{tenantId}/config/cuenta` (Plataforma → "Mi cuenta"), hoy placeholder.
Interrogatorio gate (5 dudas) → planteo a Chris las 4 estructurales (Q1 layout N3 vs scroll · Q2 sedes 1-vs-N · Q3 campos net-new ahora vs MVP-mínimo · Q4 DPO acá vs solo-referencia). Q5 (idioma editable o derivado del país) la dejo para el batch siguiente. Tras respuestas → mockup borrador + firma RONDA 1.

### 2026-06-07T00:50 · 🤖 claude · `/po-ux` · ✓ APLICADO
Chris ratificó Q1-Q5: **N3-static** (Datos·Preferencias·Responsable) · **1 clínica** (sin Sedes) · **fiscal+dirección ahora** · **idioma derivado** · **DPO solo-referencia**. Apliqué:
- `01-spec.md` v0.2: estructura ratificada + bifurcaciones + dudas resueltas.
- `mockups/_shared.css` (port verbatim del wrapper canónico) + `mockups/cuenta.html` (borrador: ribbon v1.2 Plataforma activa + N3 navegable + forms Datos/Preferencias/Responsable con átomos reales).
Falta para **FIRMA 1** (intención): Chris abre el mockup (`http://localhost:8888/cuenta.html`) + confirma 3 detalles menores → Q6 país read-only · Q7 razón social separada de nombre comercial · Q8 moneda editable (vs derivada como idioma). Tras firma → mockup FINAL + RONDA 2 (Gherkin + matriz).
