---
globs: "core/luana-core-offer-studio/src/**/*_catalog.py,**/frontend/src/features/offer-studio/**,**/frontend/src/features/marketing/**"
description: Stub — invoca offer-expert / offer-type-preset-expert
---

# Offer Catalogs SSoT

Offer Studio es **ENGINE + BRAND-CONFIG** (CLAUDE.md tabla mapping):

| Surface | Path | Owner |
|---|---|---|
| Engine catalogs (canónicos) | `core/luana-core-offer-studio/src/luana_core_offer_studio/domain/{archetype,value_level,section,variant_structure,format,offer_type_preset}_catalog.py` | `/pm-luana` |
| Brand preset packs | Registrados via Extension SDK EP-2 en `{brand}/backend/src/modules/{brand}/offer/extensions.py` | `/pm-{brand}` |
| Offer Studio FE per brand | `{brand}/frontend/src/features/offer-studio/` | `/pm-{brand}` |

6 catalogs DAG: OfferValueLevel + SectionCatalog + VariantStructure (base) → OfferArchetype (intermediate) → OfferFormat + OfferTypePreset (composites). 21 sections post-consolidación.

Detalle (DAG, BE→FE flow, hooks por axis, workflow agregar, anti-patterns) en `offer-expert` skill → `references/offer-catalogs.md`. Para presets específicamente: `offer-type-preset-expert`.

**No-skip:**
- ❌ Hardcodear archetype/value-level/format/variant/biz-type labels-icons-suitability en FE
- ❌ Nuevo `*_METADATA` map en FE (arch test bloquea)
- ❌ Bypass wizard value-level step (`is_lead_magnet` derivado, no checkbox)
- ❌ Skip arch test (corre per engine + cada brand consumer) tras catalog edit
- ❌ Hardcodear per-biz-type examples/prices/placeholders (consume `useLadderHint`)
- ❌ Brand-specific catalog mirror — registrar preset pack via EP-2

## Multibrand awareness (post reorg 2026-05-15)

- Cambios catálogos engine → bump `_CATALOG_VERSION` en `core/luana-core-offer-studio/` + `/pm-luana` promotion gate + arch test en cada brand consumer activa.
- Brand preset packs (`{brand}/backend/src/modules/{brand}/offer/extensions.py`) consumen catálogos engine vía import `luana_core_offer_studio`.
