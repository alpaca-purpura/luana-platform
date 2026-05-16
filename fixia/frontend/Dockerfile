# fixia/frontend/Dockerfile
# Placeholder minimo — Fixia (Servicios Hogar + Oficios vertical)
# La implementacion real llega en S-FIXIA-BOOTSTRAP (Story TBD, pendiente).
#
# Build context: monorepo root
# Port: 3008 (D6 port allocation)
#
# bootstrap brand topology — 2026-05-15
# Per guidelines F5: target dev MUST ser funcional.
# Per guidelines F8: no referencias a codigo inexistente.

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# ── dev target ──
FROM base AS dev

WORKDIR /app

COPY fixia/frontend/package.json ./fixia/frontend/package.json

WORKDIR /app/fixia/frontend

RUN --mount=type=cache,id=pnpm-fixia,target=/pnpm/store \
    pnpm install

EXPOSE 3008
CMD ["pnpm", "dev", "--port", "3008"]

# ── builder target ──
FROM base AS builder

WORKDIR /app

COPY fixia/frontend/package.json ./fixia/frontend/package.json

WORKDIR /app/fixia/frontend
RUN --mount=type=cache,id=pnpm-fixia,target=/pnpm/store \
    pnpm install

COPY fixia/frontend/ ./

RUN pnpm build

# ── final target ──
FROM node:20-alpine AS final

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /app/fixia/frontend/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/fixia/frontend/.next/static ./.next/static

USER appuser
EXPOSE 3008
ENV PORT=3008
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3008/', (r) => r.statusCode < 500 ? process.exit(0) : process.exit(1))"
CMD ["node", "server.js"]
