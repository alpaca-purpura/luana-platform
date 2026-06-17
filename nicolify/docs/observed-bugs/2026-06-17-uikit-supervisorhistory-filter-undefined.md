# Observed bug — @luana/ui-kit SupervisorHistory `filter of undefined`

**Fecha:** 2026-06-17 · **Visto desde:** nicolify (live-verify round-3 ds-adoption, Chrome DevTools MCP) · **Owner del fix:** `/pm-luana` (engine — NO editable desde worktree de marca, M13).

## Síntoma

`[browser] Uncaught TypeError: Cannot read properties of undefined (reading 'filter')`

```
at SupervisorHistory.useMemo[filtered]  (core/@luana/ui-kit/src/organism/shell/SupervisorHistory.tsx:106:21)
at SupervisorHistory                     (.../SupervisorHistory.tsx:104:27)
at SupervisorSidebar                     (.../SupervisorSidebar.tsx:302:9)
at ShellLayoutClient                     (.../ShellLayoutClient.tsx:433:15)
```

Aparece navegando entre hojas del shell (christian/inbox → contactos → abel/icp → brenda/* → config). El `useMemo[filtered]` de `SupervisorHistory` filtra una colección `undefined` (probable: el historial de la supervisora Luana llega `undefined` en algún estado/tenant en vez de `[]`).

## Scope

- **Engine/kit compartido** `core/@luana/ui-kit` — afecta a TODAS las marcas que montan el shell-organism (vitalia/nicolify/comunify). NO es brand-local de nicolify.
- **NO es regresión** de `nicolify-r0-design-system-adoption` round-3 (esa story toca theme + auth redirect, no el kit). Pre-existente.
- No bloqueó la live-verify del shell (render OK), pero ensucia consola + puede romper la sidebar de Luana en el estado vacío.

## Fix sugerido (para /pm-luana)

Guard de default en `SupervisorHistory.tsx:106` — `(items ?? []).filter(...)` o validar la prop antes del `useMemo`. Agregar test del estado vacío/undefined del historial. Lift gate normal del engine.

> Registrado vía non-egoísmo clause (`worktree-dual-strategy.md`): bug visto en superficie compartida desde el worktree de nicolify, documentado para que `/pm-luana` lo agende — no se arregla desde acá.
