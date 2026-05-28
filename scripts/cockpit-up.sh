#!/usr/bin/env bash
# Levanta el Luana Cockpit (tool operativa per-worktree · SDD visualizer + editor).
# Standalone Next.js 16 · puerto convencional por brand (Paradigma A).
# Doc: tools/luana-cockpit/README.md · CLAUDE.md § Tools operativas.
#
# Paradigma A (cement 2026-05-28): cockpit per-worktree. Cada worktree levanta su propio
# cockpit en puerto convencional según el brand inferido del path:
#   ~/Proyectos/luana-platform/   → :4000 (cross-brand · vista consolidada from main)
#   ~/Proyectos/luana-nicolify/   → :4001
#   ~/Proyectos/luana-vitalia/    → :4002
#   ~/Proyectos/luana-comunify/   → :4003
#   ~/Proyectos/luana-lupulo/     → :4004
#   ~/Proyectos/luana-protocol-*/ → :4000 (efímero · cross-brand)
#
# Esto permite que múltiples cockpits coexistan (uno por worktree activo) sin colisión.
# Override puerto manual: PORT=4099 bash scripts/cockpit-up.sh

set -euo pipefail

WS="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"
if [[ -z "$WS" ]]; then
  echo "❌ No estás dentro de un repo git. Cloná luana-platform primero." >&2
  exit 1
fi

COCKPIT="$WS/tools/luana-cockpit"
if [[ ! -d "$COCKPIT" ]]; then
  echo "❌ No existe $COCKPIT" >&2
  echo "   Si estás en un worktree wip/{brand} desactualizado, sync con main primero:" >&2
  echo "     cd $WS && git fetch origin && git merge origin/main" >&2
  exit 1
fi

# Brand detection from worktree path (basename)
WORKTREE_NAME="$(basename "$WS")"
case "$WORKTREE_NAME" in
  luana-platform)
    BRAND="cross-brand"
    DEFAULT_PORT=4000
    ;;
  luana-vitalia|luana-vitalia-*)
    BRAND="vitalia"
    DEFAULT_PORT=4002
    ;;
  luana-nicolify|luana-nicolify-*)
    BRAND="nicolify"
    DEFAULT_PORT=4001
    ;;
  luana-comunify|luana-comunify-*)
    BRAND="comunify"
    DEFAULT_PORT=4003
    ;;
  luana-lupulo|luana-lupulo-*)
    BRAND="lupulo"
    DEFAULT_PORT=4004
    ;;
  luana-protocol-*|luana-core-*)
    BRAND="cross-brand"
    DEFAULT_PORT=4000
    ;;
  *)
    BRAND="cross-brand"
    DEFAULT_PORT=4000
    ;;
esac

cd "$COCKPIT"

# 1. Toolchain check
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Falta Node 20. Instalá vía nvm:" >&2
  echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && nvm install 20" >&2
  exit 1
fi
NODE_MAJOR="$(node -v | sed -E 's/^v([0-9]+).*/\1/')"
if [[ "$NODE_MAJOR" -lt 20 ]]; then
  echo "❌ Necesitás Node 20+. Tenés $(node -v)." >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "❌ Falta pnpm. Habilitá vía corepack:" >&2
  echo "   corepack enable && corepack prepare pnpm@9.15.9 --activate" >&2
  exit 1
fi

# 2. Install si node_modules no existe (cada worktree tiene sus propios node_modules)
# --ignore-workspace flag explícito (defensivo · .npmrc local también lo declara, pero pnpm
# a veces honra workspace ancestor antes que .npmrc local).
if [[ ! -d node_modules ]]; then
  echo "📦 Primera vez en este worktree · instalando deps (~2 min · 678 MB)..."
  pnpm install --ignore-workspace
fi

# 3. Verificar puerto libre
PORT="${PORT:-$DEFAULT_PORT}"
if lsof -i ":$PORT" -t >/dev/null 2>&1; then
  EXISTING_PID="$(lsof -ti ":$PORT")"
  echo "⚠️  Puerto $PORT ya ocupado por PID $EXISTING_PID."
  echo "   Verificá si es el cockpit anterior: ps -p $EXISTING_PID -o cmd="
  echo "   Para matarlo: kill $EXISTING_PID"
  echo "   O usá otro puerto: PORT=4099 bash scripts/cockpit-up.sh"
  exit 1
fi

# 4. Arrancar
echo ""
echo "🚀 Luana Cockpit · worktree: $WORKTREE_NAME"
echo "   Brand inferido: $BRAND"
echo "   Workspace root: $WS"
echo "   URL: http://localhost:$PORT"
echo "   Ctrl+C para detener · logs abajo:"
echo ""
export WORKSPACE_ROOT="$WS"
export DEFAULT_BRAND="$BRAND"
exec pnpm dev --port "$PORT"
