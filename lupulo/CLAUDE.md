# Lupulo Labs — Brand overlay

> **Auto-cargado** cuando cwd cae dentro `lupulo/...` o worktree `~/Proyectos/luana-lupulo*/`. Coexiste con root `CLAUDE.md`.

**Brand:** Lupulo Labs. **Vertical:** Gastronomía (KDS + reservas + delivery aggregation).

**Status:** 🟡 placeholder — bootstrap pendiente. Mientras tanto este overlay es esqueleto para reservar el slot.

## Product vision (pointer)

→ `lupulo/docs/product/vision.md` (TBD — generar via `/pm-lupulo` cuando arranque bootstrap).

**TL;DR placeholder:** SaaS para restaurantes/bares LatAm con foco en: (1) KDS (Kitchen Display System) para cocina, (2) reservas con políticas no-show, (3) integración delivery aggregators (Rappi/PedidosYa/Uber Eats), (4) inventario insumos + menu engineering.

## Verticales target (tentative)

| Vertical | Diferencial |
|---|---|
| Restaurantes sit-down | Reservas + mesas + KDS |
| Bares/coctelerías | Inventory de licores + cocktail engineering |
| Delivery-only (dark kitchens) | KDS + integración aggregators |
| Cadenas multi-local | Multi-tenant + reporting consolidado |

## Brand-specific gates (tentative)

- POS integración (Auno/Maxirest/Restpro LatAm)
- Facturación electrónica (igual nicolify)
- Compliance sanitario (HACCP — variable por país)
- Tipping policies configurable por local

## Brand-specific anti-patterns (tentative)

- ❌ KDS con latencia >500ms (cocina necesita realtime)
- ❌ Asumir 1 menú = 1 momento (breakfast/lunch/dinner pricing distinto)
- ❌ Reservas sin opción no-show fee (industria 20-30% no-show)

## Brand-specific commands (cuando bootstrap se materialice)

```bash
WS=$(git rev-parse --show-toplevel)

make dev-lupulo                                # BE :8004 + FE :3004 (TBD)
# Resto similar a otras brands
```

## Brand-specific skills

- `/pm-lupulo` — owner SSoT (cuando se bootstrap)

## Cross-brand learning sources

| Source | Cuándo |
|---|---|
| `nicolify/` | SIEMPRE — patterns CRM + facturación |
| `vitalia/` | Pattern reservas prepagadas (no-show fee análogo a clínica) |
| `core/luana-core-*/` | Engine compartido |

## Bootstrap pendiente

Cuando Chris decide arrancar Lupulo:

1. `cp -r .claude/skills/_pm-brand-template .claude/skills/pm-lupulo`
2. Reemplazar placeholders en pm-lupulo SKILL.md
3. Crear `lupulo/docs/product/vision.md` desde research (gastronomía LatAm)
4. Cementar overlay completo (expandir este file)
5. Update root CLAUDE.md tabla brands status

## Referencias

- `_pm-brand-template/` — scaffold bootstrap
- `nicolify/`, `vitalia/`, `comunify/` — prior-art
- `.claude/rules/claude-md-overlay.md`
