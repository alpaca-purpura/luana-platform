# chris-input — vitalia-bugfix-shell-valeria-responsive

> Protocolo `docs/process/chris-input-protocol.md`: input verbatim de Chris + verdicts que cada skill appendea al cierre de su turno.

---

## Input inicial (Chris · 2026-06-04 · creación de la story)

> crea un story para mejorar el responsive de valeria que toca el shell, agrega estas cosas:
> 1. Por default el rail del historial debe estar collapsed
> 2. el 50-50 de valeria y lo demás se reduce a 30 Valeria - 70 los demás (por default), pero de igual forma se sostiene que es resizable
> 3. Revisar y proponer como trabajar para tamaños como tablet.

### Contexto / origen (de dónde sale)

Durante el cierre de `vitalia-fase2-adrian-inbox` (2026-06-04), la inspección live (Chrome DevTools MCP) destapó que **Valeria 'full' (~50%) exprime el contenido del agente**: en viewport 1280 con Valeria 'full', el `inbox-desktop` queda en 696px → el thread del inbox (`flex-1 min-w-0`) se exprime a **56px** (0px en sesión Playwright fresca) → ilegible. Esto bloquea la verificación live de AC-4/5/7 del inbox + afecta TODAS las sub-tabs de agente (Lisa/Mateo/Adrián/Lucas/Camila), no solo el inbox.

Chris confirmó el diagnóstico y fijó la dirección: **mejorar el responsive del shell para que Valeria reduzca su tamaño / colapse cuando se llega a estos anchos**. Esta story implementa esa dirección con sus 3 puntos.

**Repro + causa raíz + opciones de fix:** `vitalia/docs/observed-bugs/2026-06-04-shell-valeria-squeeze-plus-darkmode.md` (BUG #1).

### Alcance (qué SÍ / qué NO)

- **SÍ** (esta story): responsive de Valeria — (1) rail del historial collapsed por default, (2) default 30/70 (Valeria/agente) en vez de 50/50, conservando resizable, (3) propuesta de comportamiento tablet.
- **NO** (sibling, story aparte): el **dark mode half-applied** (inbox `vt-*` sin variante `[data-theme="dark"]`) — BUG #2 del mismo observed-bug. Es token-audit, concern separado. Tracকear como story hermana.
- **NO**: ContactSidebar colapsable — ya existe (`ContactSidebarToggle` en ThreadHeader). BUG #3, no es trabajo nuevo.

### Restricción de coordinación

Hub compartido con sesión(es) concurrente(s). Esta story toca el shell-organism (`src/components/shared/shell-organism/` + `src/stores/shell-store.ts` + `useViewportGuard.ts`) → cross-tab. Coordinar bucket lock `code:shell` (o similar) al construir. NO arrancar build con otra story del shell en `developing`.
