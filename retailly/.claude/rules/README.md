# Retailly brand overlay — rules

Extiende `.claude/rules/` raíz Luana con rules brand-specific retailly (E-commerce / D2C — tiendas online, marcas productos físicos).

**Patrón overlay:**
- Cardinales (tenant-isolation, DDD, TDD, git-safety, anti-duplication, spanish-text universal, parallel-safety) viven en `.claude/rules/` raíz y aplican a todos los brands.
- Brand-specific viven aquí y se cargan cuando trabajés en `retailly/` workdir.
- Ambos sets aplican simultáneamente cuando edites archivos bajo `retailly/`.

| Rule | Descripción |
|---|---|
| `ecommerce-cart-and-logistics.md` | Sync Shopify/WooCommerce con platform-wins, cart recovery con consent legal, cross-selling sin auto-add, logistics carriers via outbox |

**Naming:** `{topic}.md` (ej. `ecommerce-cart-and-logistics.md`).
