# guestly/frontend/Dockerfile
# Placeholder minimo — Guestly (Turismo + Hotelería vertical)
# La implementacion real llega en S-GUESTLY-BOOTSTRAP (Story TBD, pendiente).
#
# Build context: monorepo root
# Port: 3009 (D6 port allocation)
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

COPY guestly/frontend/package.json ./guestly/frontend/package.json

WORKDIR /app/guestly/frontend

RUN --mount=type=cache,id=pnpm-guestly,target=/pnpm/store \
    pnpm install

EXPOSE 3009
CMD ["pnpm", "dev", "--port", "3009"]

# ── builder target ──
FROM base AS builder

WORKDIR /app

COPY guestly/frontend/package.json ./guestly/frontend/package.json

WORKDIR /app/guestly/frontend
RUN --mount=type=cache,id=pnpm-guestly,target=/pnpm/store \
    pnpm install

COPY guestly/frontend/ ./

RUN pnpm build

# ── final target ──
FROM node:20-alpine AS final

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /app/guestly/frontend/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/guestly/frontend/.next/static ./.next/static

USER appuser
EXPOSE 3009
ENV PORT=3009
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3009/', (r) => r.statusCode < 500 ? process.exit(0) : process.exit(1))"
CMD ["node", "server.js"]
