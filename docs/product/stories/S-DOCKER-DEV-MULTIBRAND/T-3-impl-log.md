---
ticket: T-3
story: S-DOCKER-DEV-MULTIBRAND
state: done
started_at: 2026-05-15
completed_at: 2026-05-15
---

# T-3 impl log — infra: section to brand.yaml × 4

## Deliverables completados

1. **MODIFY `vitalia/config/brand.yaml`** — agregada seccion `infra:` al final preservando todo el contenido previo (brand_slug, features, booking, brand_studio, etc.).

2. **MODIFY `comunify/config/brand.yaml`** — idem, seccion `infra:` agregada al final.

3. **NEW `nicolify/config/brand.yaml`** — no existia. Creado con contenido minimo funcional + seccion `infra:` completa.

4. **NEW `lupulo/config/brand.yaml`** — no existia. Creado con contenido placeholder + seccion `infra:` completa.

## Schema infra: (por brand)

| Brand | backend_port | frontend_port | database_name | redis_db | qdrant_prefix |
|---|---|---|---|---|---|
| nicolify | 8001 | 3001 | nicolify_dev | 0 | nicolify_ |
| vitalia | 8002 | 3002 | vitalia_dev | 1 | vitalia_ |
| comunify | 8003 | 3003 | comunify_dev | 2 | comunify_ |
| lupulo | 8004 | 3004 | lupulo_dev | 3 | lupulo_ |

## Acceptance criteria

- A1: vitalia backend_port == 8002 (Python assert compatible)
- A2: comunify database_name == 'comunify_dev' (Python assert compatible)
- A3: Las 4 brands tienen todos los campos requeridos (backend_port, frontend_port, database_name, redis_db, qdrant_collection_prefix, domain)
- A4: vitalia brand_slug == 'vitalia' y 'features' in d (preservado)
