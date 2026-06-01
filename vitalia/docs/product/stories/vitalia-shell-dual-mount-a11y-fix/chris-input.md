---
story_id: vitalia-shell-dual-mount-a11y-fix
created_at: 2026-06-01T00:00:00-05:00
last_modified: 2026-06-01T00:00:00-05:00
notes_count: 0
refs_count: 3
conversation_count: 1
---

<!-- voseo-allowed: doc interno / buzón conversacional Chris↔Claude, no user-facing -->

# chris-input.md · vitalia-shell-dual-mount-a11y-fix

> **Qué es este archivo:** acá Chris escribe notas + referencias + Claude responde con verdicts. Es la cocina de la story (la conversación) — separada del spec/design/arch (los outputs ratificados).
>
> Doc canónico: `docs/process/chris-input-protocol.md`.

## 💭 Notas

### 2026-06-01 00:00
Bugfix arquitectónico del shell-organism (dual-mount → testids duplicados + id="main-content" ×3). Sale del live-verify de doctores. Es shell compartido: un error rompe la UI de TODOS los agentes → re-verificación transversal obligatoria. NO un edit apresurado.

## 📎 Referencias

- **📄 doc** · `vitalia/docs/observed-bugs/2026-05-31-shell-dual-mount-duplicate-testids.md`
  > Root-cause confirmado (Triple-main pattern deliberado) + fix design + impacto E2E.
- **📖 story-ref** · `vitalia-fase2-lisa-doctores`
  > Story bloqueada por este bug (su harness usa workaround `.filter({visible:true})`).
- **📖 story-ref** · `nicolify-r0-shell` (commits 641dbb4c / e153f53d "isDesktop huérfano → crash")
  > Prior-art: nicolify peleó el mismo bug; el render condicional crasheó → usaron single-main + CSS.

## 💬 Conversación

> Append-only · turn-by-turn cronológico. Verdict labels: ✓ APLICADO · ⚠️ DUDA · ❌ REFUTADO · 💡 PROPONE.

### 2026-06-01 00:00 · 🤖 claude · `/pm-vitalia` · 💡 PROPONE
Story creada (`state: idea → refined`, type=bugfix ADR-011, repro_verified=true) con cap_target=`shell-vitalia`, cap_change_type=`fix`, functional_area=`plataforma-tecnica.shell` (zona Infraestructura, derivada del árbol del paradigma — el shell es quality-attribute del contenedor visual, no caja de valor).

**Prior art scan corrido (anti-duplication-refining):** hallazgo que CAMBIA el fix propuesto. Nicolify (su shell se portó DE vitalia) ya peleó este bug y el **render condicional por viewport del bug doc CRASHEA** (React "more hooks than previous render" al montar/desmontar el `<Group>` resizable detrás de `isDesktop`). Su solución: **UN solo `<main id="main-content">` + CSS** (mata el id duplicado + el crash), pero eso por sí solo NO mata los testids duplicados. → **PROPONGO** que /architect diseñe la reconciliación: single-main (patrón nicolify) **+ render del `<AppPanelSlot>`/children UNA sola vez** (mata testids). Es shell brand-local: aplicar el PATRÓN, no compartir el archivo.

Encadeno a `/architect` para cerrar el ready package (03-arch reconciliando ambos approaches + 04-validators con el plan de re-verificación transversal 5 agentes ×3 modos + axe + dev-app, + 06-tickets con la reescritura de los tests del triple-main).

⚠️ DUDA para vos Chris (no bloqueante — /architect puede arrancar): ¿confirmás que el fix es shell brand-local de vitalia (NO lift a core / NO tocar el de nicolify)? Asumo que sí.
