# nicolify/frontend/Dockerfile
# Auditado en T-5 (S-DOCKER-DEV-MULTIBRAND).
# CAMBIOS vs Dockerfile legacy:
# - Node 22 → 20 (alineado con pnpm-workspace pattern de vitalia/comunify)
# - npm → pnpm 9.15.9 (alineado con pnpm-workspace.yaml raiz)
# - Puerto 3000 → 3001 (D6 port allocation nicolify)
# - Target dev alineado con patron vitalia/comunify
# - Target final (runner) mantenido con output:standalone
#
# Build context: raiz del monorepo
# S-DOCKER-DEV-MULTIBRAND T-5 — 2026-05-15

FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
RUN apk add --no-cache libc6-compat

# ── dev target ──
FROM base AS dev

ENV NODE_ENV=development
WORKDIR /app

# .npmrc root (node-linker=hoisted) PRIMERO: el `pnpm install` lo lee para aplanar
# node_modules (turbopack/dev:turbo lo necesita; sin él el image queda isolated → 500).
COPY .npmrc pnpm-workspace.yaml package.json pnpm-lock.yaml ./
# patches/ — pnpm aplica el patch de zustand (self-refs → relativos, fix turbopack HB-78)
# durante el install; sin este COPY el `pnpm install` falla (patch declarado en package.json).
COPY patches ./patches
COPY nicolify/frontend/package.json ./nicolify/frontend/package.json
# Workspace packages @luana/* — sin sus package.json el install --filter no ve sus
# deps → store de imagen incompleto → "Module not found" runtime (fix 2026-06-11,
# learning fe-dev-image-frozen-pnpm-store; "..." incluye workspace deps)
COPY core/@luana ./core/@luana

RUN --mount=type=cache,id=pnpm-nicolify,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@luana/nicolify-web..." 2>/dev/null || \
    pnpm install --filter "@luana/nicolify-web..." 2>/dev/null || \
    pnpm install

WORKDIR /app/nicolify/frontend
EXPOSE 3001
CMD ["pnpm", "dev", "--port", "3001"]

# ── test target ──
FROM dev AS test
ENV NODE_ENV=test
CMD ["pnpm", "test"]

# ── e2e target ──
FROM mcr.microsoft.com/playwright:v1.59.1-noble AS e2e
WORKDIR /app
ENV NODE_ENV=test
COPY package.json package-lock.json ./
RUN npm ci --include=dev 2>/dev/null || true
COPY . .
CMD ["npx", "playwright", "test"]

# ── build target ──
FROM base AS build

WORKDIR /app
COPY .npmrc pnpm-workspace.yaml package.json pnpm-lock.yaml ./
# patches/ — pnpm aplica el patch de zustand (self-refs → relativos, fix turbopack HB-78)
# durante el install; sin este COPY el `pnpm install` falla (patch declarado en package.json).
COPY patches ./patches
COPY nicolify/frontend/package.json ./nicolify/frontend/package.json
# @luana/* completos (manifests + src TS): build transpila ui-kit/format desde source
COPY core/@luana ./core/@luana

RUN --mount=type=cache,id=pnpm-nicolify,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter "@luana/nicolify-web..." 2>/dev/null || \
    pnpm install

COPY nicolify/frontend/ ./nicolify/frontend/

ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG INTERNAL_API_URL
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV INTERNAL_API_URL=$INTERNAL_API_URL
ENV NODE_ENV=production
ENV NODE_OPTIONS=--max-old-space-size=1536

WORKDIR /app/nicolify/frontend
RUN pnpm build

# ── final target (runner) ──
FROM node:20-alpine AS final
WORKDIR /app
ENV NODE_ENV=production

RUN apk upgrade --no-cache && apk add --no-cache libc6-compat
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/nicolify/frontend/public ./public 2>/dev/null || true
RUN mkdir .next
RUN chown nextjs:nodejs .next
COPY --from=build --chown=nextjs:nodejs /app/nicolify/frontend/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/nicolify/frontend/.next/static ./.next/static

USER nextjs
EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/', (r) => r.statusCode < 500 ? process.exit(0) : process.exit(1))"
CMD ["node", "server.js"]
