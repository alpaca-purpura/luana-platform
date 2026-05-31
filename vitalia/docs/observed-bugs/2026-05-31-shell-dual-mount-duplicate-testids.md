# Observed bug — shell-organism monta el panel-content 2× → testids duplicados

**Fecha:** 2026-05-31
**Origen:** live-verify de `vitalia-fase2-lisa-doctores` (Playwright contra backend real, stack dev-app)
**Severidad:** media (no rompe UX visible; rompe E2E browser por strict-mode + huele a a11y/perf)
**Estado:** observado, no parcheado

## Síntoma

Al correr los specs E2E de doctores contra el stack real (sesión Clerk + storageState),
cada `getByTestId(...)` del contenido del panel resuelve a **2 elementos** → Playwright
strict-mode violation. Ejemplo verbatim:

```
strict mode violation: getByTestId('btn-nuevo-integrante') resolved to 2 elements:
  1) ... aka getByTestId('app-panel').getByTestId('btn-nuevo-integrante')
  2) ... aka getByTestId('btn-nuevo-integrante').nth(1)
```

Lo mismo aplicaría a `staff-directory`, `staff-card-*`, `staff-pagination`, etc.

## Causa raíz (hipótesis fuerte)

`ShellOrganismLayout` renderiza el `children` (el contenido de la sub-tab) en **dos ramas**:
una para layout mobile y otra para desktop. Ambas quedan en el DOM; una se oculta por CSS
(la otra es la visible según viewport). Evidencia: `ShellOrganismLayout.test.tsx` usa
`getAllByTestId("app-panel-slot")` (plural) en la rama mobile + `AppPanelSlot.tsx` testid
`app-panel-slot`.

Consecuencia: todo `data-testid` dentro del panel existe 2× en el DOM. Para el usuario es
invisible (solo ve la rama visible), pero:
- Rompe E2E con strict-mode (hay que `.filter({ visible: true })` o scopear al panel visible).
- Es un smell de a11y (elementos interactivos duplicados en el árbol) y de perf (doble montaje
  + posible doble fetch de los hooks de datos de cada rama).

## Impacto

- **E2E doctores:** los 10 specs (~38 tests) no pueden ir verde sin scopear los POMs
  (`StaffDirectoryPage`, `DoctorWorkspacePage`, `AvailabilityCalendarPage`) al panel visible.
- **No es bug de producto** funcional: la UI renderiza y funciona (verificado live: directorio
  con 3 doctores seed reales + botón "Nuevo integrante" + búsqueda + lista).

## Fix sugerido (decidir en story dedicada)

Dos caminos, decidir con arquitectura:
1. **Producción:** que el shell NO monte ambas ramas a la vez (render condicional por
   breakpoint en vez de CSS-hide), eliminando los testids duplicados de raíz. Beneficia a11y+perf.
2. **Harness:** POMs scopean al panel visible (`.filter({ visible: true })` / contenedor visible).
   Más barato, no resuelve el smell de a11y/perf.

Recomendado: combinar — harness scoping para destrabar E2E ya, + evaluar (1) como mejora.

## Relacionado

- `vitalia/docs/observed-bugs/2026-05-31-zustand-workspace-resolution-luana-hooks.md`
- Story harness mirror: `estabilizar-harness-e2e-lisa-marca` (mismo patrón para marca)
- `vitalia/docs/product/stories/vitalia-fase2-lisa-doctores/06-audit/CHECKPOINTS.md` (C2: browser-E2E pendiente)
