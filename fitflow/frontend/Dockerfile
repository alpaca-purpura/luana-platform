# fitflow/frontend/Dockerfile
# Placeholder minimo — FitFlow (Fitness + Deporte vertical)
# La implementacion real llega en S-FITFLOW-BOOTSTRAP (Story TBD, pendiente).
#
# Build context: monorepo root
# Port: 3010 (D6 port allocation)
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

COPY fitflow/frontend/package.json ./fitflow/frontend/package.json

WORKDIR /app/fitflow/frontend

RUN --mount=type=cache,id=pnpm-fitflow,target=/pnpm/store \
    pnpm install

EXPOSE 3010
CMD ["pnpm", "dev", "--port", "3010"]

# ── builder target ──
FROM base AS builder

WORKDIR /app

COPY fitflow/frontend/package.json ./fitflow/frontend/package.json

WORKDIR /app/fitflow/frontend
RUN --mount=type=cache,id=pnpm-fitflow,target=/pnpm/store \
    pnpm install

COPY fitflow/frontend/ ./

RUN pnpm build

# ── final target ──
FROM node:20-alpine AS final

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app

COPY --from=builder --chown=appuser:appgroup /app/fitflow/frontend/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/fitflow/frontend/.next/static ./.next/static

USER appuser
EXPOSE 3010
ENV PORT=3010
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3010/', (r) => r.statusCode < 500 ? process.exit(0) : process.exit(1))"
CMD ["node", "server.js"]
