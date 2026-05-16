# fixia/docs/product/modules/README.md
# Módulos de dominio — Fixia (Servicios Hogar + Oficios)
# bootstrap brand topology — 2026-05-15

Módulos = unidades de dominio DDD registradas en la vertical.
Cada módulo consume paquetes del engine (`luana-core-*`) y registra extensiones via Extension SDK EP-1..EP-18.

## Módulos planificados

| Módulo | Estado | Core package | Extension points |
|---|---|---|---|
| `field_technician_dispatch` | TBD | `luana-core-platform` (scheduling) | EP-TBD |
| `on_site_quotation` | TBD | `luana-core-offer-studio` | EP-2 |
| `local_seo_reviews` | TBD | `luana-core-channels` | EP-TBD |
| `brand` | TBD | `luana-core-brand-studio` | EP-1 |

## Módulos activos

_(ninguno — bootstrap pendiente)_

Ver `core/luana-core-extension-sdk/src/luana_core_extension_sdk/extension_points.py` para EP-1..EP-18 registry.
