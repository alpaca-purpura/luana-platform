---
story_id: vitalia-shell-core-hardening
created_at: 2026-06-10T00:00:00-05:00
last_modified: 2026-06-10T00:00:00-05:00
notes_count: 0
refs_count: 5
conversation_count: 1
---

# chris-input.md · vitalia-shell-core-hardening

> **Qué es este archivo:** acá Chris escribe notas + referencias + Claude responde con verdicts. Cocina de la story (la conversación) — separada del spec/design/arch.
>
> Doc canónico: `docs/process/chris-input-protocol.md`.

## 💭 Notas

### 2026-06-10
Sin notas adicionales todavía · Chris escribe aquí.

## 📎 Referencias

- **📖 story-ref** · `vitalia-bugfix-shell-valeria-responsive` (refined, folded — backbone del spec: 01-spec v3 + mockup firmado + baseline build)
- **📖 story-ref** · `vitalia-fase1-shell-layout-5050-race-fix` (parked, folded — race hydration SC-3)
- **📖 story-ref** · `vitalia-ds-showcase` (demostrador R-FID, NO folded)
- **📄 doc** · `docs/architecture/luana-platform/ADR-014-design-system-homologation.md` (programa cross-brand)
- **📚 learning-ref** · `2026-06-06-n3-entity-workspace-layout-from-nicolify` + `2026-06-03-next16-softnav-redirect-rendered-more-hooks`

## 💬 Conversación

> Append-only · turn-by-turn cronológico. Verdict labels: ✓ APLICADO · ⚠️ DUDA · ❌ REFUTADO · 💡 PROPONE.

### 2026-06-10 · 👤 Chris · input de creación (consolidación shell + lift a core)
> quiero que revises todas las historias de usuario que actualmente estan en ejecución o en planificación relacionados al organism shell, incluyendo bugfixes, quiero agrupar todas en uno sola para hacer solo una revisión y luego, cuando todo esté muy bien tanto funcional como técnicamente (excelente arquitectura y estructura de archivos, etc.) lo promovemos al core de acuerdo a lo que me recomendaste (o no, aquí tu me indicas que hacer)

### 2026-06-10 · 🤖 claude · `/pm-vitalia` · 💡 PROPONE → ✓ APLICADO
Revisé todas las stories del shell. Distinguí **chrome del shell** (el wrapper que se buildea) de **features que VIVEN en el route group `(shell-organism)`** (lo consumen, no lo construyen). Hallazgos: baseline ya shipped (9 stories archived) · `core/@luana/ui-kit` v0.3.0 ya existe (lift parcial) · nicolify espejea el shell (mirror cross-brand) · proposals del lift FE/shell ya `accepted` (2026-06-06).

**Empujé contra "una sola story" literal**: una mega-story SDD cruzaría `[shell,clinics,crm]`, violaría WIP cap y mezclaría madureces. Propuse **umbrella de hardening + enchufe al programa design-system-homologation**.

Chris ratificó (AskUserQuestion):
- **Forma** → "Hardening story + programa (Rec)": umbrella `vitalia-shell-core-hardening` absorbe responsive + race-fix + 2 bugs latentes; ds-showcase = demostrador; agent-features fuera.
- **Lift timing** → "Lift-durante (Rec)": /architect buildea el hardening apuntando a `@luana/ui-kit`; brands consumen. Sequencing final lo cierra /architect en `ready`; gate brand→core es de /pm-luana.

Story creada en `state=idea`, `phase=CONSOLIDATION_INTAKE`. Folded: responsive (refined→parked) + race-fix. Linked: ds-showcase. Excluidos documentados (caps-bug, doctores keystone, agent-features).

**Próximo paso (gate antes de refinar/buildear):** cerrar las 2 stories OPEN que comparten bucket — `vitalia-fase2-adrian-embudo` (developed → /auditor o defer) + `vitalia-fase2-lisa-doctores` (developing → resolver keystone regresión o pausar) — + liberar un slot de refining. Recién ahí /po-ux reconcilia el spec único y /architect produce el ready package con el lift.

### 2026-06-10 · 👤 Chris · ratificación gate
> a, arranca el gate y commitea por pathspec

### 2026-06-10 · 🤖 claude · `/pm-vitalia` · ✓ APLICADO
Gate ejecutado: **embudo** → `defer_audit: true` (developed + dod_live_verified preservados; auditar post-hardening evita re-audit por rebase del chrome crm) · **doctores** → `parked` (⚠️ keystone regresión `/lisa/staff` queda VIVA — bug de feature Lisa, no chrome; primer trabajo post-hardening) · **lisa-servicios** → `parked` (su N3 depende del contrato `EntityWorkspaceLayout` que el hardening cambia; firma 1 preservada — al reanudar retoma RONDA 2 contra contrato nuevo). Config-cuenta queda refining (no acoplada al N3). Slot refining libre para la umbrella.

Commit por pathspec (delegado Haiku). **Siguiente:** `/po-ux vitalia vitalia-shell-core-hardening` — reconciliar spec único del chrome.
