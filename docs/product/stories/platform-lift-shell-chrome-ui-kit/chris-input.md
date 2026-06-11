---
story_id: platform-lift-shell-chrome-ui-kit
created_at: 2026-06-11T00:00:00-05:00
last_modified: 2026-06-11T00:00:00-05:00
notes_count: 0
refs_count: 4
conversation_count: 1
---

# chris-input.md · platform-lift-shell-chrome-ui-kit

> **Qué es este archivo:** acá Chris escribe notas + referencias + Claude responde con verdicts. Cocina de la story (la conversación) — separada del spec/design/arch.
>
> Doc canónico: `docs/process/chris-input-protocol.md`.

## 💭 Notas

### 2026-06-11
Sin notas adicionales todavía · Chris escribe aquí.

## 📎 Referencias

- **📄 doc** · `docs/promotion-protocol/proposals/2026-06-01-lift-shell-organism-to-core.md` (accepted 2026-06-06 · § Estado post hardening = handoff de entrada)
- **📖 story-ref** · `vitalia-shell-core-hardening` (done 2026-06-11 — chrome hardened, predecesora directa)
- **📄 doc** · `vitalia/docs/architecture/SHELL-DESIGN-CONTRACT.md` v1.4 + `ADR-vitalia-006` (SSR-safe store)
- **📚 learning-ref** · memoria `shell-core-hardening-done-lift-pending` + `2026-06-06-n3-entity-workspace-layout-from-nicolify`

## 💬 Conversación

> Append-only · turn-by-turn cronológico. Verdict labels: ✓ APLICADO · ⚠️ DUDA · ❌ REFUTADO · 💡 PROPONE.

### 2026-06-11 · 👤 Chris · input de creación (lift autónomo end-to-end)
> /pm-luana ejecuta el LIFT del shell-chrome a @luana/ui-kit — sesión autónoma completa (RATIFICO autonomous_mode: true verbatim para toda la cadena: refinar→arch→build→audit→merge; trabajá hasta el done sin pausas. Yo estoy descansando — escalá SOLO si encontrás un breaking-change imposible de decidir solo, y aun así documentá+parqueá esa pieza y seguí con el resto, dejando HANDOFF-next-session.md). [+ contexto fuentes en orden, objetivo chrome brand-agnostic props+CSS vars, criterios de éxito verbatim (68/68 + 7/7 contra kit, nicolify converge, grep tokens = 0, SEMVER documentado, allowlists shrink mismo commit, live-verify #37, proposal migrated), aprendizajes obligatorios del hardening, workspace hub vitalia + SCOPE_GATE_SKIP sancionado, subagents heredan Fable 5]

### 2026-06-11 · 🤖 claude · `/pm-luana` · ✓ APLICADO
Step 0 GREEN (hub canónico vitalia, wip/vitalia sync con origin/main, lock `code:shell` adquirido). Closure-gate: embudo DEFERRED (ok) · `nicolify-r1-abel-icp-buyer` en reviewing = jurisdicción /pm-nicolify, módulo ≠ shell → no bloquea (WIP cap module-scoped). Fuentes leídas en el orden pedido (memoria → proposal accepted → archive hardening 07-merge/T-5/03-arch § Decisión B). Story platform creada en `docs/product/stories/platform-lift-shell-chrome-ui-kit/` (checkpoint + chris-input juntos, R4) — `state: refining`, autonomous_mode true verbatim, aprendizajes del hardening pre-cargados en el checkpoint para que builders no los redescubran. Proposal queda `accepted` hasta el merge (→ `migrated`). Próximo: /po spec → /architect → /dev-team → /auditor → merge.

### 2026-06-11 · 🤖 claude · `/po` · ✓ APLICADO
01-spec.md v1 escrito (`refining → refined`). 9 scenarios: SC-1/2/3 happy (vitalia full verde contra kit · nicolify converge · kit brand-agnostic versionado) + SC-4 negative (mirror residual/cross-import) + SC-5/6/9 edge (máquina v4 props-capture · localStorage legacy · escape-valve pieza imposible Bif-1) + SC-7 adversarial (fuga brand al kit: grep + defaults props neutros) + SC-8 live-verify #37. RN-1..9 formalizan los criterios verbatim de Chris (conducta-no-cambia con suite 68+7 como contrato · brand-agnostic estricto · un-solo-origen · fixes v4 sagrados · ratchet shrink · SEMVER+proposal · convergencia nicolify sancionada · store SSR-safe de @luana/hooks · live-verify). Sin loop de ratificación: criterios YA dictados verbatim (autonomous). Corte file-by-file → /architect.
