---
story_id: vitalia-crm-phi-base-tables-migration
created_at: 2026-05-30T00:33:24-05:00
last_modified: 2026-05-30T00:33:24-05:00
notes_count: 0
refs_count: 0
conversation_count: 2
---

# chris-input.md · vitalia-crm-phi-base-tables-migration

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

### 2026-05-30 00:33
Chris: "arranca la story de migración dev de las tablas" — cerrar el gap que el anti-teatro de Slice 2 PHI expuso: tablas base PHI faltan en dev, los endpoints /crm/leads + /crm/patients/{id} dan 500, y el audit-on-patient no se pudo verificar live.

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

### 2026-05-30T00:33:24-05:00 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
Story creada (service-story, module=crm, cap_change_type=fix). Diagnostiqué la causa raíz ANTES de crearla (anti-hallucination): **2 problemas distintos** — (1) **drift stamp-vs-apply**: dev DB en alembic head 034 pero `vitalia_patients` no existe (016 tiene CREATE TABLE IF NOT EXISTS pero la DB fue stampeada sin aplicar DDL; `upgrade head` NO la recrea por el guard IF NOT EXISTS); (2) **migración faltante**: `vitalia_leads` no se crea en ningún árbol de migración (el repo lee columnas id/tenant_id/name/email/phone/source/status/notes/deleted_at/created_at/updated_at de una tabla inexistente). Prior-art: net-new migración brand-local idempotente reusando pattern `CREATE TABLE IF NOT EXISTS` (no engine — tablas PHI brand-local). Scope propuesto: migración `035` forward-only (crea vitalia_leads + reconcile vitalia_patients) + verificación live re-god-matrix /leads /patients → 200 + audit row. State → refining. Encadeno a /po para el spec.

### 2026-05-30T00:33:24-05:00 · 🤖 claude · `/pm-vitalia` · 💡 PROPONE
2 decisiones a ratificar en el refining (con /po): (a) ¿el reconcile de vitalia_patients va en la misma migración 035 que crea vitalia_leads, o las separamos? (propongo: misma 035, ambas IF NOT EXISTS, atómica). (b) ¿qué hacemos con las 5 migraciones legacy huérfanas en `src/modules/vitalia/persistence/migrations/` (no corridas por el alembic.ini activo)? (propongo: documentar como arqueológicas en este story, limpieza real = sub-scope/follow-up). ¿Las ratificás o preferís otro approach?

### 2026-05-30T00:35 · 🤖 claude · `/po` · ⚠️ DUDA
01-spec.md v1 escrito (service-story migración). 4 scenarios: SC-1 happy (doctor JWT real → /crm/patients/{id} 200 + audit row), SC-2 negative (marketing 403), SC-3 edge (migración idempotente re-run no-op), SC-4 adversarial (cross-tenant 404 / forjado 401). **Hallazgo nuevo en el refining:** 016 solo crea el esqueleto de vitalia_patients — el repo lee columnas PHI (name/dni/dob/phone/email/address/marketing_opt_out_at) que ninguna migración activa crea. Así que la 035 debe reconstruir el **schema canónico completo**, derivado de lo que los repos SELECTean (el architect lo deriva exacto). 3 decisiones a ratificar (todas con default sensato): **OQ-1** pgcrypto en columnas PHI ahora o follow-up (default: schema plano ahora, pgcrypto follow-up — no bloquea el unblock). **OQ-2** las 5 migraciones legacy huérfanas en src/: documentar arqueológicas (default) o limpiar acá. **OQ-3** seed: extender seed_test_users_link.py con 1 paciente Sanaré (default) o seed dedicado. ¿Ratificás el spec con esos defaults, o ajustás algo?
