# Releases — Luana Platform

## Estado actual

**Publishing pipeline: DEFERRED to Story 9 (`luana-v0-1-0-publish`).**

El monorepo está actualmente en fase de bootstrap (Story 1 — foundation).
No hay releases publicados todavía.

## Pipeline de releases (placeholder)

La implementación completa del pipeline de releases está definida en Story 9:
- Versioning: semantic-release con Conventional Commits
- Registry: GitHub Packages (GH Packages)
- Scope: `@luana/core`, `@luana/nicolify`, `@luana/vitalia`, `@luana/comunify`, `@luana/lupulo`

## Cuando Story 9 aterrice

Story 9 (`luana-v0-1-0-publish`) implementará:
- `.releaserc.json` con semantic-release config
- `.github/workflows/release.yml`
- `.npmrc` con `publishConfig` apuntando a GH Packages
- `GITHUB_TOKEN` con scope `packages:write`
- Smoke test cross-repo de install

Ver el outcome doc de referencia:
[luana-platform-migration](https://github.com/alpacapurpura/luana-platform/tree/main/docs)

## Política de versiones (cuando Story 9 aterrice)

- Versiones públicas: SemVer (`MAJOR.MINOR.PATCH`)
- Pre-release: `-alpha.N` durante development activo
- Bump automático: basado en Conventional Commits (feat → MINOR, fix → PATCH, breaking → MAJOR)
- Todos los packages del workspace versionan en sync (monorepo release)
