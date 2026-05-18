#!/usr/bin/env bash
set -euo pipefail
# dev-lock-check.sh — Verify no other docker stack for the same brand is running (mec. F stub)
# SSoT: docs/process/parallel-sessions-protocol.md § D5
#
# Usage:
#   scripts/dev-lock-check.sh <brand>
#
# Behavior:
#   - Check docker ps for containers named luana-{brand}-*
#   - If found → WARN (no STOP por ahora — stub MVP)
#   - Future: STOP + escalate if multiple worktrees of same brand try `make dev-{brand}`

BRAND="${1:?Usage: dev-lock-check.sh BRAND}"

if ! command -v docker &>/dev/null; then
  echo "  (dev-lock-check: docker not available, skip)"
  exit 0
fi

containers="$(docker ps --format '{{.Names}}' 2>/dev/null | grep -E "^luana-${BRAND}-" || true)"
if [[ -n "${containers}" ]]; then
  echo "⚠ dev-lock-check: containers luana-${BRAND}-* already running:"
  echo "${containers}" | sed 's/^/    /'
  echo "  D5: max 1 stack docker por brand. Si esto es desde otro worktree → STOP + cierra el otro stack."
  echo "  (No bloquea por ahora — stub MVP. Future: STOP enforcement.)"
fi

exit 0
