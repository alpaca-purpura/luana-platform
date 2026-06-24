#!/usr/bin/env bash
# Levanta el Cockpit en FOREGROUND (debug · Ctrl+C para detener).
# Para uso normal preferí el daemon (sobrevive cierre de terminal):
#     make cockpit-up      → scripts/cockpit-daemon.sh start
#
# COCKPIT = binario ALPACA desde 2026-06-11 (pivote ratificado por Chris):
# ~/Proyectos/alpaca-harness/products/cockpit-go/cockpit — Go + UI Next.js embebida
# (go:embed), proceso v5 (tab Proceso · gate G signoff · DoD · gates G1-G9).
# Los cockpits anteriores (Go-templates tools/luana-cockpit-go y Next
# tools/_legacy/luana-cockpit) fueron ELIMINADOS del repo (2026-06-11).
#
# Puerto convencional por brand (Paradigma A · per-worktree):
#   ~/Proyectos/luana-platform/   → :4000 (cross-brand · vista consolidada)
#   ~/Proyectos/luana-nicolify/   → :4001
#   ~/Proyectos/luana-vitalia/    → :4002
#   ~/Proyectos/luana-comunify/   → :4003
#   ~/Proyectos/luana-lupulo/     → :4004
# Override puerto: PORT=4099 bash scripts/cockpit-up.sh
# Override binario: ALPACA_COCKPIT_BIN=/otro/path

set -euo pipefail

WS="$(git rev-parse --show-toplevel 2>/dev/null || echo "")"
if [[ -z "$WS" ]]; then
  echo "❌ No estás dentro de un repo git. Cloná luana-platform primero." >&2
  exit 1
fi

ALPACA_BIN="${ALPACA_COCKPIT_BIN:-$HOME/Proyectos/alpaca-harness/products/cockpit-go/cockpit}"
if [[ ! -x "$ALPACA_BIN" ]]; then
  echo "❌ No existe el binario del cockpit: $ALPACA_BIN" >&2
  echo "   Build: cd ~/Proyectos/alpaca-harness/products/cockpit-go && ./build-ui.sh && go build -o cockpit ." >&2
  exit 1
fi

# Brand detection from worktree path (basename)
WORKTREE_NAME="$(basename "$WS")"
case "$WORKTREE_NAME" in
  luana-platform)                  BRAND="cross-brand"; DEFAULT_PORT=4000 ;;
  luana-vitalia|luana-vitalia-*)   BRAND="vitalia";  DEFAULT_PORT=4002 ;;
  luana-nicolify|luana-nicolify-*) BRAND="nicolify"; DEFAULT_PORT=4001 ;;
  luana-comunify|luana-comunify-*) BRAND="comunify"; DEFAULT_PORT=4003 ;;
  luana-lupulo|luana-lupulo-*)     BRAND="lupulo";   DEFAULT_PORT=4004 ;;
  luana-protocol-*|luana-core-*)   BRAND="cross-brand"; DEFAULT_PORT=4000 ;;
  *)                               BRAND="cross-brand"; DEFAULT_PORT=4000 ;;
esac

PORT="${PORT:-$DEFAULT_PORT}"
if ss -ltn "sport = :$PORT" 2>/dev/null | grep -q LISTEN; then
  echo "⚠️  Puerto $PORT ya ocupado. Detené el cockpit: make cockpit-down · o PORT=4099 ..." >&2
  exit 1
fi

echo ""
echo "🚀 Luana Cockpit (alpaca) · worktree: $WORKTREE_NAME · brand: $BRAND"
echo "   URL: http://localhost:$PORT · Ctrl+C para detener · logs abajo:"
echo ""
exec env WORKSPACE_ROOT="$WS" DEFAULT_BRAND="$BRAND" "$ALPACA_BIN" -workspace "$WS" -port "$PORT"
