# vitalia/frontend/Dockerfile
# Build context: monorepo root
# Target dev: hot-reload con bind mount
# Target final: Next.js standalone produccion
#
# S-DOCKER-DEV-MULTIBRAND T-4 — 2026-05-15
# Port: 3002 (D6 port allocation)

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# ── dev target ──
FROM base AS dev

WORKDIR /app

# Pre-instalar dependencias (package.json viene via bind mount en dev, pero pre-instalamos)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY vitalia/frontend/package.json ./vitalia/frontend/package.json

RUN --mount=type=cache,id=pnpm-vitalia,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@luana/vitalia-web"

WORKDIR /app/vitalia/frontend
EXPOSE 3002
CMD ["pnpm", "dev", "--port", "3002"]

# ── builder target ──
FROM base AS builder

WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY vitalia/frontend/package.json ./vitalia/frontend/package.json

RUN --mount=type=cache,id=pnpm-vitalia,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@luana/vitalia-web"

COPY vitalia/frontend/ ./vitalia/frontend/

WORKDIR /app/vitalia/frontend
RUN pnpm build

# ── final target ──
FROM node:20-alpine AS final

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /app/vitalia/frontend/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/vitalia/frontend/.next/static ./.next/static
COPY --from=builder --chown=appuser:appgroup /app/vitalia/frontend/public ./public 2>/dev/null || true

USER appuser
EXPOSE 3002
ENV PORT=3002
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/', (r) => r.statusCode < 500 ? process.exit(0) : process.exit(1))"
CMD ["node", "server.js"]
