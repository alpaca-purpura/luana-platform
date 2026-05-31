# Observed bug — FE dev container has stale node_modules after a new dep is added

**Date:** 2026-05-30 · **Found during:** nicolify-r0-shell build (live verification) · **Severity:** medium (dev-stack only, not prod)

## Symptom
Shell route `/{tenant}/{agent}/{subtab}` returns **500** in the running FE container:
`Module not found: Can't resolve 'react-resizable-panels'` even though the package is in `package.json` + `pnpm-lock.yaml` and installed on the host.

## Root cause
`nicolify/docker-compose.dev.yml` (line ~82) uses an **anonymous volume** `- /app/nicolify/frontend/node_modules` to mask host node_modules and expose the image's node_modules (built via `pnpm install --filter "@luana/nicolify-web"` at image build). When a new dependency is added to package.json AFTER the image was built:
- `make dev-nicolify` (`docker compose up -d`) sees the container already "Running" → does NOT recreate it.
- The anonymous volume persists → the new dep is never installed inside the container.
- The container's pnpm has no network + its store predates the dep → `docker exec pnpm install` fails (`ERR_PNPM_META_FETCH_FAIL`).

## Stopgap (this session)
`docker cp` the host's real package files into the container's flat node_modules:
```bash
SRC="node_modules/.pnpm/react-resizable-panels@4.11.1_*/node_modules/react-resizable-panels"
docker cp "$SRC" luana-dev-nicolify_frontend_dev-1:/app/nicolify/frontend/node_modules/react-resizable-panels
touch nicolify/frontend/src/components/shared/shell-organism/ShellOrganismLayoutClient.tsx  # bust webpack cache
```
→ recompiled, 46/46 e2e green. EPHEMERAL — lost on container recreate.

## Durable fix (needs network)
```bash
docker compose -f docker-compose.dev.yml -f nicolify/docker-compose.dev.yml build nicolify_frontend_dev
make dev-nicolify
```

## Suggested process improvement
When a story adds an npm dep, the dev-stack boot (T-0 pattern / `make dev-{brand}`) should detect package.json drift vs the running container and rebuild the FE image, OR document "rebuild FE image after adding deps" in the brand dev runbook. Candidate for a dev-stack learning if it recurs in other brands (vitalia/comunify use the same anonymous-volume pattern).
