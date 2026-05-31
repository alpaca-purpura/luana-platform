---
story_id: estabilizar-harness-e2e-lisa-marca
created_at: '2026-05-30T23:45:00.000Z'
last_modified: '2026-05-30T23:45:00.000Z'
notes_count: 0
refs_count: 0
conversation_count: 1
---
<!-- voseo-allowed: conversación interna Chris↔Claude (buzón de la story), no es texto user-facing -->
# chris-input.md · estabilizar-harness-e2e-lisa-marca

> Cocina de la story (Notas + Referencias + Conversación). Separada de spec/design/arch.
> Doc canónico: `docs/process/chris-input-protocol.md`.

## 💭 Notas

- Origen: follow-up de `arreglar-guardado-voz-y-tono` (Chris eligió A2 — abrir story dedicada del harness).
- El harness E2E lisa-marca estaba **mockeado + con data-testids fantasma + tenant ficticio** → nunca verde
  de verdad → razón estructural por la que shipeó el bug del guardado.

## 📎 Referencias

- Story padre: `vitalia/docs/product/stories/arreglar-guardado-voz-y-tono/` (checkpoint + 03-arch + T-3-result)
- Commits relevantes del patrón ya aplicado a voz-y-tono: `560a5f54`, `f19a21c3` (tenant correcto + testids + retry)
- Specs lisa-marca a migrar: `vitalia/frontend/e2e/regression/vitalia-fase2-lisa-marca/*`
- Fixture mockeada: `vitalia/frontend/e2e/regression/vitalia-fase2-lisa-marca/fixtures/lisa-marca.fixture.ts`

## 💬 Conversación

### 2026-05-30T23:45 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
Abrí la story dedicada `estabilizar-harness-e2e-lisa-marca` como **bugfix** (lite, ADR-011), con todo el
diagnóstico de la story padre en el checkpoint: root cause primario (race de auth-readiness de Clerk en el
GET /personality in-browser → "No se pudo cargar" sin recuperar), el alcance (toda la suite lisa-marca, no
solo voz-y-tono — los specs viejos siguen mockeados + con testids fantasma), el sub-bug de
prohibited-phrases (X-User-ID que el fetchClient no manda → 422), y 4 direcciones de fix candidatas para el
architect (Clerk-ready gate · query resiliente · de-mock + testids reales · prohibited-phrases opcional).
`repro_verified: true` (el flake está reproducido + es 100% client-side, ningún GET llega al backend).
`cap_target: lisa-marca · cap_change_type: fix` — al cerrar, mueve la cap a verified-live de verdad.
State `idea`, ratificada por vos. Próximo: cuando quieras, `/po` (o `/po-ux`) refina el spec lite de
regresión. **¿La arrancamos ahora o la dejo en backlog?**
