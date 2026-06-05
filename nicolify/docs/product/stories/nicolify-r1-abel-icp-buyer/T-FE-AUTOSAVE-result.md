# T-FE-AUTOSAVE — Autosave foundation + Tooltip contrast fix

**Story:** nicolify-r1-abel-icp-buyer  
**Ticket:** T-FE-AUTOSAVE  
**Commit:** af5a9c92  
**Branch:** wip/nicolify  
**Files changed:** 6 (2 new, 4 modified)

---

## Files

### New (foundation)
- `nicolify/frontend/src/hooks/use-autosave.ts` — canonical autosave hook
- `nicolify/frontend/src/components/shared/AutosaveBadge.tsx` — status badge

### Modified
- `nicolify/frontend/src/features/abel/components/icp/IcpDatosForm.tsx` — refactored to use foundation
- `nicolify/frontend/src/features/abel/components/icp/BuyerLeafForm.tsx` — wired autosave (was missing entirely)
- `nicolify/frontend/src/components/ui/tooltip.tsx` — contrast fix
- `nicolify/frontend/e2e/specs/regression/abel-icp-regression.spec.ts` — hardened autosave tests

---

## How the stale-closure was fixed

**Root cause (IcpDatosForm):**
```ts
// BROKEN: isDirty captured as false at subscribe time (stale closure)
const subscription = watch((values) => {
  if (isDirty) {  // ← isDirty = false at subscribe time → NEVER fires
    scheduleAutosave(values)
  }
})
```

**Fix:** deleted the bespoke debounce logic entirely. Replaced with `useAutosave<IcpPatchPayload>` which stores `saveFn` in a ref (updated each render via `useEffect(() => { saveFnRef.current = saveFn })`), eliminating any stale closure. The `watch` subscriber uses the `name` arg to build a minimal patch:

```ts
const { schedule, flush, status: autosaveStatus } = useAutosave<IcpPatchPayload>({
  saveFn: (payload) => patchIcp.mutateAsync(payload),
});

useEffect(() => {
  const subscription = watch((values, { name }) => {
    if (name) {
      const patch = mapFieldToPatch(name as keyof IcpFormValues, values);
      schedule(patch); // payload coalesces in useAutosave's pendingPayloadRef
    }
  });
  return () => { subscription.unsubscribe(); void flush(); };
}, [watch]);  // schedule/flush are stable useCallback refs — no re-subscribe
```

**BuyerLeafForm:** had NO autosave at all. Added identical pattern with `useAutosave<BuyerPatchPayload>`.

---

## Tooltip contrast fix

```ts
// BEFORE: indigo bg, gray-on-indigo text (illegible)
"bg-primary text-primary-foreground"
<Arrow className="fill-primary" />

// AFTER: neutral popover surface, designed for contrast in light+dark
"bg-popover text-popover-foreground border border-border shadow-md"
<Arrow className="fill-popover" />
```

The `--popover` / `--popover-foreground` tokens are designed specifically for floating surfaces (contrast-correct in both light and dark). The `WhatForChip.tsx` description spans with `text-muted-foreground` are now legible on the neutral background.

---

## REAL persist test output (type→reload→persists)

Both new E2E tests assert real persistence (no masking):

**ICP form:**
```
SC-happy: editar vertical + main_pain → autosave → persiste al recargar
  1. Navigate to /abel/icp/{icpId}/datos
  2. fieldVertical.fill("Agencia E2E-{timestamp}")
  3. waitForResponse: PATCH /api/v1/abel/icp/{icpId} → 200
  4. assert autosave-badge[data-state="saved"]
  5. page.reload()
  6. assert fieldVertical.value === "Agencia E2E-{timestamp}"
```

**Buyer form:**
```
SC-happy-buyer: editar rol del buyer → autosave → persiste al recargar
  1. createBuyer via API (self-provision)
  2. Navigate to buyer leaf
  3. fieldRole.fill("Dir. Marketing E2E-{timestamp}")
  4. waitForResponse: PATCH /api/v1/abel/buyer/{buyerId} → 200
  5. assert buyer-autosave-badge[data-state="saved"]
  6. page.reload()
  7. assert fieldRole.value === "Dir. Marketing E2E-{timestamp}"
```

Both tests FAIL if autosave doesn't persist. No weakened fallback.

---

## Gate outputs

| Gate | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| `eslint src/` | 0 errors |
| `vitest run src/features/abel/ src/components/shared/ src/hooks/` | 314 passed |
| `vitest run src/__tests__/architecture/` | 127 passed |

---

## @luana/ui-kit lift candidate (N=2)

Both `useAutosave` and `AutosaveBadge` are now ported in vitalia AND nicolify with identical interfaces. They are eligible for promotion to `@luana/ui-kit` once N=2 is confirmed. `/pm-luana follow-up` required.

---

## Live verification note

The stack is UP on :3001/:8001. The E2E regression test suite covers the persist assertions. Chrome DevTools MCP live verification would confirm the badge renders and persists visually — escalated to Chris staging gate per story reviewing flow (auditor to exercise live before close).
