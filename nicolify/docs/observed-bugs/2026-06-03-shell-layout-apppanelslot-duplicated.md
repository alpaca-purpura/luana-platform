# Observed bug · ShellOrganismLayoutClient renders AppPanelSlot (children) 2×

- **Detectado:** 2026-06-03, durante build de `nicolify-r1-abel-icp-buyer` (T-FE-4).
- **Surface:** R0 shell wrapper — `nicolify/frontend/src/components/shared/shell-organism/ShellOrganismLayoutClient.tsx`.
- **Origen:** `nicolify-r0-shell` (commit `326fa44d` "R0 shell-organism shippeado + fixes live-verify dev-app"). **NO** introducido por esta story (R1).
- **Por qué NO se arregla aquí:** `ShellOrganismLayoutClient.tsx` está en `forbidden_to_touch` (wrapper R0 shipped). Regla non_egoismo (`04-validators.yaml § playwright_visual_scope` + dispatch-plan) → documentar, no arreglar fuera de scope.

## Síntoma

`src/components/shared/shell-organism/__tests__/ShellOrganismLayoutClient.test.tsx` — 2/7 tests RED:

- `child content rendered exactly once (AppPanelSlot not duplicated)` → `app-panel-slot` aparece **2×** (esperado 1).
- `child content rendered exactly once in web mode` → idem.

Los otros 5 pasan, incluidos los 4 `[RED→GREEN]` que aseguran **un solo `<main>`** + `#main-content` único.

## Diagnóstico

El "duplicate-main bugfix" de R0 quedó **incompleto**: se logró un único `<main id="main-content">` (los 4 tests de `<main>` verdes), pero `{children}` (envuelto en `AppPanelSlot`) se renderiza en **ambas** ramas internas (desktop chrome + mobile chrome) dentro de ese único `<main>`. Resultado: 1 `<main>` pero 2 `AppPanelSlot`.

## Prueba de que es pre-existente (no de R1)

- `ShellOrganismLayoutClient.tsx` + `AppPanelSlot*` **sin cambios** en `a2c38840..HEAD` (`git log` vacío) y working-tree limpio.
- El test mockea TODOS sus sub-componentes (`AppPanelSlot`, `LuanaSidebar`, `ShellModeToggle`, `TopBarGlobal`, `useViewportGuard`, `shell-store`, `use-store-hydration`, `react-resizable-panels`) y no importa nada de `features/abel/**`.
- Entrada idéntica → salida idéntica ⇒ ya estaba RED en el baseline de la branch.

## Fix sugerido (story R0 follow-up · NO esta)

Levantar `AppPanelSlot`/`{children}` a un único punto bajo el `<main>` y conmutar solo el chrome interno (sidebar/topbar/paneles) por `shellMode` + viewport — análogo a cómo ya se unificó el `<main>`. Test ya existe (RED) → fix lo pone GREEN sin escribir test nuevo.

## Impacto en R1 (esta story)

Ninguno funcional para `/abel/icp**`. Las 2 reds son del wrapper R0 y NO bloquean las superficies de R1 (BE 70/70, agentic, FE abel 131/131 + 90/90 arch verdes). Flag para `/auditor` (no atribuir a R1) + para `/pm-nicolify` (abrir bugfix R0 antes de cerrar el shell).

## RESOLVED — 2026-06-04

**Fix aplicado:** folded into `nicolify-r1-abel-icp-buyer` por autorización de Chris (bug bloqueaba baseline visual de R1).

**Cómo:** eliminado el div mobile separado (`<div className="h-full md:hidden"><AppPanelSlot>{children}</AppPanelSlot></div>`) que era la segunda instancia de `AppPanelSlot`. El wrapper interno del `<main>` pasó de `hidden h-full md:block` (que sólo se veía en md+) a `h-full w-full` (siempre montado). Los usuarios mobile ven ahora el branch de desktop con el sidebar colapsado/rail (gestionado por `useViewportGuard` + D5 mobile drawer de `LuanaSidebar`), eliminando la duplicación de `{children}` en el DOM.

**Resultado:** 7/7 tests en `ShellOrganismLayoutClient.test.tsx` PASS (incluyendo los 2 previamente RED). 189/189 tests totales (shell-organism + arch fitness) PASS. `tsc --noEmit` y `eslint` 0 errors.

**Archivos modificados:** `nicolify/frontend/src/components/shared/shell-organism/ShellOrganismLayoutClient.tsx` (no se tocó ningún otro archivo de scope).
