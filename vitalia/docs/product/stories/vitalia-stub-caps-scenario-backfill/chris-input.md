---
story_id: vitalia-stub-caps-scenario-backfill
created_at: 2026-05-29T17:53:16-05:00
last_modified: 2026-05-29T17:53:16-05:00
notes_count: 1
refs_count: 2
conversation_count: 1
---

# chris-input.md · vitalia-stub-caps-scenario-backfill

<!-- voseo-allowed: buzón de conversación interna Chris↔Claude (no es string user-facing de UI) -->

> Buzón Chris ↔ Claude. Notas + referencias + conversación con verdicts.

## 💭 Notas

### 2026-05-29 17:53
(Chris) Crear la historia con todo lo aprendido para los stub: aclararlas + agregarles el escenario real de lo que hace su código, para que dejen de aparecer como drift y suban a verified-live en el cockpit.

## 📎 Referencias

- **📖 story-ref** · `vitalia-cockpit-live-reconciliation` (done 2026-05-29) — story madre; produjo la matriz + reveló estos 20 stub.
- **📄 doc** · `vitalia/docs/domains/ops/live-reconciliation.md` — matriz cap↔realidad (input directo de esta story).

## 💬 Conversación

> Append-only · turn-by-turn. Verdicts: ✓ APLICADO · ⚠️ DUDA · ❌ REFUTADO · 💡 PROPONE.

### 2026-05-29 17:53 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
Story creada en `state=idea`. Scope: 20 caps declarados `live` que computan `stub`/`declared-live` (código existe + claim live, pero sin scenario+e2e formal). Objetivo: scenario real + test → `verified-live` (cross_check_3). Worklist agrupada en 3 baterías por naturaleza del test: A) UI/foundation (mayormente cablear e2e existente), B) admin Streamlit (e2e admin ya existe, cablear scenario), C) infra/BE (integration test, no UI e2e). Excluí 8 `planned` (futuros sin código = Fase 2) + las 33 `deprecated` (slice-1, se reconstruyen). cap_change_type: extend. Listo para refinar en sesión nueva.
