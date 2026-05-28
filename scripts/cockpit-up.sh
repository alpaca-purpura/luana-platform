#!/usr/bin/env bash
# Levanta el Luana Cockpit (tool operativa cross-brand · SDD visualizer + editor).
# Standalone Next.js 16 · puerto 4000 · NO Docker · NO DB.
# Doc: tools/luana-cockpit/README.md · CLAUDE.md § Tools operativas.

set -euo pipefail

WS="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"
if [[ -z "$WS" ]]; then
  echo "❌ No estás dentro de un repo git. Cloná luana-platform primero." >&2
  exit 1
fi

COCKPIT="$WS/tools/luana-cockpit"
if [[ ! -d "$COCKPIT" ]]; then
  echo "❌ No existe $COCKPIT . ¿Branch correcto? (necesitás main o wip/protocol-cockpit-v0-6)" >&2
  exit 1
fi

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

# 2. Install si node_modules no existe
if [[ ! -d node_modules ]]; then
  echo "📦 Primera vez · instalando deps (~2 min · 678 MB)..."
  pnpm install
fi

# 3. Verificar puerto 4000
PORT="${PORT:-4000}"
if lsof -i ":$PORT" -t >/dev/null 2>&1; then
  EXISTING_PID="$(lsof -ti ":$PORT")"
  echo "⚠️  Puerto $PORT ya ocupado por PID $EXISTING_PID."
  echo "   Verificá si es el cockpit anterior: ps -p $EXISTING_PID -o cmd="
  echo "   Para matarlo: kill $EXISTING_PID"
  echo "   O usá otro puerto: PORT=4001 bash scripts/cockpit-up.sh"
  exit 1
fi

# 4. Arrancar
echo "🚀 Levantando cockpit en http://localhost:$PORT"
echo "   Ctrl+C para detener · logs abajo:"
echo ""
exec pnpm dev --port "$PORT"
