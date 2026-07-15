# T-KIT-ALIGN — Auditor re-pass (kit-alignment)

**Date:** 2026-06-24 · **Auditor:** `/auditor` (responsible v5, Carril R) · **Story:** `reviewing` · **Verdict:** APPROVED (kit-atom alignment) + finding on the 14 layout-divs.

## Re-pass of the changed delta (commit d3c91f93)

| Check | Result |
|---|---|
| Native `<select>`→kit Select (BuyerLeafForm) | ✅ correct — controlled `value`+`onValueChange`, RHF `setValue` wiring preserved, option set intact |
| Native `<textarea>`/`<button>`→kit Textarea/Button | ✅ correct (BuyerLeafForm, IcpDatosForm) |
| `Badge` `@/components/ui`→`@luana/ui-kit` (IcpCard) | ✅ clean import, no barrel break |
| Arbitrary-values→tokens (`min-h-[28px]`, `sm:max-w-[560px]`) | ✅ eslint no-arbitrary clean |
| BuyerLeafForm.test decision-power assertion | ✅ adapted to Radix Select (open→assert option); happy-dom verified |
| Gates | tsc 0 abel-err · eslint 0 err · vitest 344/344 · 4 DS ratchets GREEN |
| a11y Radix Select | tablist/option roles present; keyboard handled by Radix (kit primitive) — superior to native `<select>` for the canon |

**Kit-ATOM alignment (the substance) = APPROVED.** abel now consumes the kit atoms (Select/Textarea/Button/Badge) instead of native HTML / local primitives.

## Carril R — the 14 remaining layout-divs: FINDING (do NOT force-migrate)

Chris ratified "auditor finishes the 14 divs to make abel 100% canon-clean." Doing the work surfaced that **these are not cleanly migratable, and forcing them would teach the wrong pattern** to the 5 leaves that copy abel:

- **8 flex-col micro-stacks** (`IcpCard:132` card label group `min-w-0` · `IcpIntakeOverlay:250` dialog empty-state `items-center` · FieldRow label+control stacks · `BuyerLeafForm:305` skeleton · field-group footers). These live *inside* cards/forms/dialogs — **component-internal micro-layout**, not page structure. `PageContentStack` ("espaciado vertical entre bloques de una hoja", page.tsx) is a PAGE primitive; `cn`/tailwind-merge makes the swap visually zero-change, but `<PageContentStack className="gap-1 min-w-0">` inside an `EntityInfoCard` is semantic misuse. abel is the golden reference → it must model the RIGHT pattern, not cargo-cult to satisfy a coarse scanner.
- **4 field grids** (`grid grid-cols-2 gap-3` ×3 · `grid grid-cols-3 gap-3` ×1): `FormLayout paired` = `grid-cols-1 md:grid-cols-2 gap-6` → changes responsive behavior + gap (regression on a live-verified leaf). `grid-cols-3` has **no** kit primitive at all.

**Root cause (upstream / kit gap):** the kit lacks a generic component-internal layout primitive (a `Stack`/`Flex` for micro gaps + a generic `Grid`), and the **HB-106 scanner over-matches** any `flex-col gap` / `grid-cols` regardless of altitude (page vs component-internal). Both are the **design-system-adoption story's** domain (it owns `@luana/ui-kit` primitives + the scanner policy + cross-nicolify migration).

## Decision routed to Chris (see chris-input)

Recommendation: **APPROVE kit-atom alignment + route the 14 micro-layout divs to `nicolify-r0-design-system-adoption`** (add micro-layout/grid kit primitives + refine the HB-106 scanner to be altitude-aware, then migrate systematically). Do NOT force PageContentStack-stuffing into abel. Baseline stays 32 (the 7 genuine migrations from the FE pass already locked in). → demo gate #37 → merge.

## Upstream deficiency (auto-hardening reflex)

- **Artefacto:** `nicolify/frontend/src/__tests__/architecture/test-no-div-layout.test.ts` — the HB-106 scanner (`_ds-lock-scanner::countLayoutDivs`) flags ALL `flex-col gap` / `grid-cols` as "layout divs" without distinguishing page-level layout from component-internal micro-layout → it pressures cargo-cult migration of micro-stacks into page-primitives.
- **Impacto:** "100% div-clean" is unachievable without semantic misuse or new kit primitives; the ratchet baseline reads as a debt that can't be honestly paid down at the leaf level.
- **Acción sugerida:** (1) add a generic micro-layout primitive (`Stack`/`Flex`) + a `Grid` to `@luana/ui-kit`; (2) make the scanner altitude-aware (exempt component-internal micro-layout, or count it separately); (3) do the systematic migration in `nicolify-r0-design-system-adoption`. → harness-backlog HB entry + (design-system-adoption story note).

## Verdict

**APPROVED** — kit-atom alignment correct + gates GREEN. The 14 micro-layout divs are NOT a finding against abel; they're a kit/scanner gap routed to the adoption story. No `core/` edits. Pre-existing engine tsc error (`core/@luana/hooks`) untouched → `/pm-luana`. → demo gate #37 (Chris live) → `/pm-nicolify` merge.
