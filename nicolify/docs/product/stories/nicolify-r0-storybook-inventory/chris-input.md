# chris-input · nicolify-r0-storybook-inventory

> Libro mayor de lo que Chris pidió. Nace con la story (R4). Claude appendea cada turn; puede rebatir durante el ciclo de vida.

## 📌 Pedido original (verbatim · 2026-06-24)

Chris: en vitalia hay un Storybook con todos los componentes mapeados 1:1 con un inventario; al generar el mockup HTML se compone usando esos componentes base, y si una idea usa algo que no está en el storybook se propone anotándolo como componente nuevo a agregar; al pasar a `/architect` manda a `/dev-team` qué token/átomo/molécula usar exacto para lograr el mockup. Funciona en vitalia. **¿Aplicado en nicolify?** + plan para llegar a: **todo lo de UI sale del Storybook**, para saber **todos los componentes de la solución que tocaría un cambio de UI**.

## 🎯 Decisiones ratificadas (2026-06-24)

- **Arranque:** doctrina-primero (Fase 0 harness antes de la story). Chris ya lanzó Fase 0 en sesión aparte.
- **Profundidad:** "mejor que vitalia" — Fase 3 agrega manifiesto machine-readable consultable (cross-brand → `/pm-luana`).
- **Hogar del handoff:** historia de usuario (ESTA), NO un ADR de arquitectura ("no contaminar arquitectura con algo pasajero que debería ser una historia de usuario").
- **Directiva CORE (standing):** lo core se hace en el hub nicolify con sync-antes + sync-después para que las 4 marcas queden iguales.

## 💬 Conversación

- **2026-06-24 · 💡 PROPONE (creación de la story):** ✓ APLICADO. Status+plan entregado (3 subagentes: vitalia model + kit + nicolify gap). Respuesta a "¿aplicado en nicolify?": **parcial** — lo compartido sí (consume `@luana/ui-kit`, 82 stories), lo brand-specific NO (0 stories vs 44 de vitalia) + doctrina interna stale. Plan de 4 fases con ownership (Fase 0 harness / Fase 1 esta story / Fase 2 emergente / Fase 3 core-pm-luana). Findings + plan completos en `00-research.md`. Story creada en `state: idea` como hogar del handoff (no ADR). Prerequisito: Fase 0 commiteada + sync hygiene para lo core. Próximo: refinar vía intake-handshake `/pm-nicolify` → `/po-ux` cuando Fase 0 cierre.
