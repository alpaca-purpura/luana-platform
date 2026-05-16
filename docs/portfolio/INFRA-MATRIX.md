<!-- AUTO-GENERATED via make infra-matrix — DO NOT EDIT MANUALLY -->

# INFRA-MATRIX — Puertos, dominios y databases por brand

> Generado automaticamente por `make infra-matrix`. SSoT: `{brand}/config/brand.yaml::infra`. NO editar manualmente.

## Entorno dev local

| Brand | Backend port | Frontend port | DB name | Redis DB | Qdrant prefix | Dev domain |
|---|---|---|---|---|---|---|
| nicolify | 8001 | 3001 | nicolify_dev | 0 | nicolify_ | nicolify-dev.nicolify.com |
| vitalia | 8002 | 3002 | vitalia_dev | 1 | vitalia_ | vitalia-dev.nicolify.com |
| comunify | 8003 | 3003 | comunify_dev | 2 | comunify_ | comunify-dev.nicolify.com |
| lupulo | 8004 | 3004 | lupulo_dev | 3 | lupulo_ | lupulo-dev.nicolify.com |

## Entorno produccion

| Brand | Prod domain | Servidor |
|---|---|---|
| nicolify | app.nicolify.com | tbd |
| vitalia | app.vitalialat.com | tbd |
| comunify | app.comunify.com | tbd |
| lupulo | app.lupulo.com | tbd |

## Puertos compartidos (shared infra)

| Servicio | Host port | Container port | Notas |
|---|---|---|---|
| postgres | 5435 | 5432 | Shared — 1 instancia, N databases (D1) |
| qdrant | 6333/6334 | 6333/6334 | Opt-in profile `vector` (D3) |
| redis | 6379 | 6379 | Opt-in profile `cache` (D3) |
