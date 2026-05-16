# lupulo/frontend/Dockerfile
# Placeholder minimo — Lupulo Labs (gastronomia vertical)
# La implementacion real llega en S-LUPULO-BOOTSTRAP (Story 13, pendiente).
#
# Build context: monorepo root
# Port: 3004 (D6 port allocation)
#
# S-DOCKER-DEV-MULTIBRAND T-4 — 2026-05-15
# Per guidelines F5: target dev MUST ser funcional.
# Per guidelines F8: no referencias a codigo inexistente.

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# ── dev target ──
FROM base AS dev

WORKDIR /app

COPY lupulo/frontend/package.json ./lupulo/frontend/package.json

WORKDIR /app/lupulo/frontend

RUN --mount=type=cache,id=pnpm-lupulo,target=/pnpm/store \
    pnpm install

EXPOSE 3004
CMD ["pnpm", "dev", "--port", "3004"]

# ── builder target ──
FROM base AS builder

WORKDIR /app

COPY lupulo/frontend/package.json ./lupulo/frontend/package.json

WORKDIR /app/lupulo/frontend
RUN --mount=type=cache,id=pnpm-lupulo,target=/pnpm/store \
    pnpm install

COPY lupulo/frontend/ ./

RUN pnpm build

# ── final target ──
FROM node:20-alpine AS final

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /app/lupulo/frontend/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/lupulo/frontend/.next/static ./.next/static

USER appuser
EXPOSE 3004
ENV PORT=3004
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3004/', (r) => r.statusCode < 500 ? process.exit(0) : process.exit(1))"
CMD ["node", "server.js"]
