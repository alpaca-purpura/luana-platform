# Migrate scripts archive (2026)

> Read-only archive — preservación histórica de scripts one-shot ya ejecutados.

## Origen

Estos scripts vivían en `nicolify/backend/src/scripts/` (legacy single-brand monolito). Movidos aquí 2026-05-16 como parte de la proposal `2026-05-16-nicolify-layout-multibrand-purge` (cierre layout multibrand nicolify, post Wave 4 carve-out).

## Contenido

| Script | Propósito | Estado |
|---|---|---|
| `migrate_local_to_r2.py` | Migración assets local → Cloudflare R2 storage | Ya ejecutado |
| `migrate_assets.py` | Migración tabla assets a nuevo schema | Ya ejecutado |

## Política

- **NO ejecutar** — operaciones one-shot ya completadas
- **Preservar** — histórico para auditoría / arqueología del repo
- Si volvés a necesitar lógica similar (otra brand), inspirate aquí pero implementá nuevo script bajo `{brand}/backend/scripts/` o lift a `core/luana-core-platform/migrate/` via promotion gate

## Referencias

- Proposal: `docs/promotion-protocol/proposals/2026-05-16-nicolify-layout-multibrand-purge.md`
- Carve-out audit: `docs/architecture/luana-platform/03-nicolify-carve-out-audit.md`
