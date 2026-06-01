#!/usr/bin/env bash
# claude-md-overlay-check — SessionStart hook
#
# Advisory hook que verifica:
#  - Si cwd cae dentro `{brand}/` o `~/Proyectos/luana-{brand}*/` PERO
#    `{brand}/CLAUDE.md` overlay no existe → emite advisory.
#
# NO carga el overlay (Claude Code lo hace built-in via walking ancestors).
# Solo valida existencia + sugiere bootstrap si missing.
#
# Falla suave: exit 0 siempre (nunca bloquea SessionStart).
#
# Origen: conversación 2026-05-27 — Chris pidió hierarchy CLAUDE.md.
# SSoT: .claude/rules/claude-md-overlay.md

set -uo pipefail

# Leer stdin JSON (SessionStart hook recibe { sessionId, cwd, ... })
INPUT=$(cat 2>/dev/null || true)
if [[ -z "${INPUT}" ]]; then
  exit 0
fi

# Extraer cwd
CWD=""
if command -v jq >/dev/null 2>&1; then
  CWD=$(echo "${INPUT}" | jq -r '.cwd // empty' 2>/dev/null || true)
fi

# Fallback: usar pwd actual del proceso
if [[ -z "${CWD}" ]]; then
  CWD=$(pwd)
fi

# Detectar brand desde cwd path
# Pattern 1: cwd dentro de un worktree luana-{brand}*  (ej: ~/Proyectos/luana-vitalia)
# Pattern 2: cwd dentro de una brand dir en root (ej: /path/to/luana-platform/vitalia/...)
BRAND=""
for B in vitalia nicolify comunify lupulo saasora inmoflow retailly fixia guestly fitflow; do
  if echo "${CWD}" | grep -qE "(luana-${B}([-/]|$)|/${B}([-/]|$))"; then
    BRAND="${B}"
    break
  fi
done

# Si no se detectó brand → cwd es PRINCIPAL o protocol o core — no overlay needed
if [[ -z "${BRAND}" ]]; then
  exit 0
fi

# Buscar workspace root (debe contener .git)
WS=""
CHECK="${CWD}"
while [[ "${CHECK}" != "/" && "${CHECK}" != "" ]]; do
  if [[ -d "${CHECK}/.git" || -f "${CHECK}/.git" ]]; then
    WS="${CHECK}"
    break
  fi
  CHECK=$(dirname "${CHECK}")
done

if [[ -z "${WS}" ]]; then
  exit 0
fi

# Verificar overlay exists
OVERLAY="${WS}/${BRAND}/CLAUDE.md"

if [[ ! -f "${OVERLAY}" ]]; then
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "advisory CLAUDE.md overlay missing — cwd cae dentro brand ${BRAND} pero ${OVERLAY} no existe. Per .claude/rules/claude-md-overlay.md, cada brand activa debería tener su overlay. Para bootstrap brand nueva: cp _pm-brand-template/_OVERLAY-template.md ${WS}/${BRAND}/CLAUDE.md (cuando template exista). Mientras tanto: sesión continúa pero sin contexto brand-specific auto-cargado."
  }
}
EOF
  exit 0
fi

# Overlay exists — sanity check size (cap 150 líneas per rule)
LINE_COUNT=$(wc -l < "${OVERLAY}" 2>/dev/null || echo 0)
if [[ "${LINE_COUNT}" -gt 200 ]]; then
  cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "advisory ${BRAND}/CLAUDE.md exceeds soft cap (${LINE_COUNT} líneas > 150). Per .claude/rules/claude-md-overlay.md, brand overlay debería ser ≤150 líneas. Considerá mover detalle a ${WS}/${BRAND}/docs/domains/ con pointer."
  }
}
EOF
  exit 0
fi

# All OK — silent (no advisory needed)
exit 0
