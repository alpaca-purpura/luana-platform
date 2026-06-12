# comunify/frontend/Dockerfile
# Build context: monorepo root
# Target dev: hot-reload con bind mount
# Target final: Next.js standalone produccion
#
# S-DOCKER-DEV-MULTIBRAND T-4 — 2026-05-15
# Port: 3003 (D6 port allocation)

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# ── dev target ──
FROM base AS dev

WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY comunify/frontend/package.json ./comunify/frontend/package.json
# Workspace packages @luana/* — sin sus package.json el install --filter no ve sus
# deps → store de imagen incompleto → "Module not found" runtime (fix 2026-06-11,
# learning fe-dev-image-frozen-pnpm-store; "..." incluye workspace deps)
COPY core/@luana ./core/@luana

RUN --mount=type=cache,id=pnpm-comunify,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@luana/comunify-web..."

WORKDIR /app/comunify/frontend
EXPOSE 3003
CMD ["pnpm", "dev", "--port", "3003"]

# ── builder target ──
FROM base AS builder

WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY comunify/frontend/package.json ./comunify/frontend/package.json
# @luana/* completos (manifests + src TS): build transpila ui-kit/format desde source
COPY core/@luana ./core/@luana

RUN --mount=type=cache,id=pnpm-comunify,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@luana/comunify-web..."

COPY comunify/frontend/ ./comunify/frontend/

WORKDIR /app/comunify/frontend
RUN pnpm build

# ── final target ──
FROM node:20-alpine AS final

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /app/comunify/frontend/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/comunify/frontend/.next/static ./.next/static
COPY --from=builder --chown=appuser:appgroup /app/comunify/frontend/public ./public 2>/dev/null || true

USER appuser
EXPOSE 3003
ENV PORT=3003
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3003/', (r) => r.statusCode < 500 ? process.exit(0) : process.exit(1))"
CMD ["node", "server.js"]
