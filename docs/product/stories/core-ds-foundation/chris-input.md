# chris-input — core-ds-foundation

> Bitácora verbatim de decisiones con Chris. Cada entry: verdict (✓ APLICADO · ⚠️ DUDA · ❌ REFUTADO · 💡 PROPONE).

## 💬 Conversación

### 2026-06-21 · arranque (origen D11 → inventory-first)

**Contexto:** /po-ux refinando el mockup de `vitalia-fase2-mateo-nueva-cita` (D11). El audit UI mostró que
el mockup mapea a componentes reales, pero que mantener "todo del shared / mínimo local" hoy NO es sostenible:
el inventario no tiene catálogo vivo y los mockups driftean por copia de `_shared.css`.

**Chris (decisión 1) · ✓ APLICADO** — "la idea es llegar a solo reutilizar y adaptar; lo local mínimo, todo del
shared … sin demasiados local que no nos dejen crecer / rompan la uniformidad. Inventario siempre al día."
→ Confirmado: la disciplina = reusar/consolidar + promover-al-2º-consumidor; el inventario necesita maquinaria.

**Chris (decisión 2 · sequencing) · ✓ APLICADO** — eligió **"Inventory-first (arreglar la maquinaria)"**:
catálogo generado + mockup-kit + drift-lint, antes de promover nada.

**Chris (decisión 3 · vehículo) · ✓ APLICADO** — eligió **"Scaffold full core-ds-foundation"**: la maquinaria
entra como Fase 0 del programa DS completo (no story dedicada ni harness-pass suelto). D11 parkea y resume después.

**/pm-luana · 💡 PROPONE (pendiente ratificación de Chris):**
- Scaffold escrito (este checkpoint). Scope = Fase 0 machinery → Fase 1 componentes (incl. deltas D11) → Fase 2 arch-test.
- Deltas D11 a promover: `SegmentedControl` (consolida `.toggle-pill`+`.segmented`), `EntityRow`/`EntityChip`,
  `PageHeader` back-slot · REUSAR Badge para avail/dur · `AvailabilityStrip` vitalia-shared (no core aún) · `ComputedField` flag.
- **Falta tu ✓:** ratificar el scope consolidado → habilita `/architect` (ready package, empezando por Fase 0).
- Handoffs que NO hago yo (anti-creep): /pm-vitalia parkea D11 + ownea AvailabilityStrip · /harness-issue captura el hallazgo de inventario.
