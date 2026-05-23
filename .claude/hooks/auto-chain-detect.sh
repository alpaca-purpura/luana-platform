#!/usr/bin/env bash
# auto-chain-detect — UserPromptSubmit hook
#
# Detecta el pattern "user invoca PM skill + nombra skill secundaria"
# (ej. /pm-vitalia con args que mencionan /po-ux) y emite system-reminder
# que autoriza al modelo a encadenar via Skill tool inline, en vez de
# devolver handoff textual.
#
# Trigger pattern reconocido:
#   /pm-{brand}  + args con /po-ux | /po | /ux-agentico | /architect |
#                              /dev-team | /auditor
#
# Origen: caso F1-S4 vitalia 2026-05-23 — estancamiento por handoff textual.
# SSoT: .claude/rules/pm-skill-chaining.md
#
# El hook recibe el prompt del usuario via stdin (JSON con campo "prompt"),
# escribe a stdout un objeto JSON con "additionalContext" cuando detecta el
# pattern. Si no detecta, exit 0 sin output (no-op).
#
# Falla suave: exit 0 siempre (nunca bloquea el prompt del usuario).

set -uo pipefail

# Leer stdin JSON
INPUT=$(cat 2>/dev/null || true)
if [[ -z "${INPUT}" ]]; then
  exit 0
fi

# Extraer prompt — tolerante a jq ausente
PROMPT=""
if command -v jq >/dev/null 2>&1; then
  PROMPT=$(echo "${INPUT}" | jq -r '.prompt // empty' 2>/dev/null || true)
else
  # fallback grep+sed (lossy si prompt contiene comillas escapadas)
  PROMPT=$(echo "${INPUT}" | sed -nE 's/.*"prompt"[[:space:]]*:[[:space:]]*"([^"]*)".*/\1/p' | head -1)
fi

if [[ -z "${PROMPT}" ]]; then
  exit 0
fi

# Pattern 1: /pm-{brand} + skill secundaria nombrada
PM_RE='/pm-(vitalia|nicolify|comunify|lupulo|luana|saasora|inmoflow|retailly|fixia|guestly|fitflow)\b'
SEC_RE='/(po-ux|po|ux-agentico|architect|dev-team|auditor)\b'

if echo "${PROMPT}" | grep -qE "${PM_RE}" && echo "${PROMPT}" | grep -qE "${SEC_RE}"; then
  PM_HIT=$(echo "${PROMPT}" | grep -oE "${PM_RE}" | head -1)
  SEC_HIT=$(echo "${PROMPT}" | grep -oE "${SEC_RE}" | head -1)
  SEC_NAME="${SEC_HIT#/}"

  REMINDER="auto-chain authorized — el usuario invocó ${PM_HIT} y nombró explícitamente ${SEC_HIT} en el mismo prompt. Per .claude/rules/pm-skill-chaining.md § Trigger 1: después de Step 0 GREEN + Step 1 contexto cargado + validación WIP caps/deps/scope, encadená via Skill tool inline con { skill: \"${SEC_NAME}\", args: \"<brand> <story-id>\" }. NO devuelvas handoff textual pidiendo a Chris que tipee ${SEC_HIT} manualmente."

  if command -v jq >/dev/null 2>&1; then
    jq -nc --arg ctx "${REMINDER}" \
      '{hookSpecificOutput: {hookEventName: "UserPromptSubmit", additionalContext: $ctx}}'
  else
    # fallback JSON literal (escape mínimo: comillas dobles + backslashes)
    CTX_ESC=$(echo "${REMINDER}" | sed 's/\\/\\\\/g; s/"/\\"/g')
    echo "{\"hookSpecificOutput\":{\"hookEventName\":\"UserPromptSubmit\",\"additionalContext\":\"${CTX_ESC}\"}}"
  fi
fi

exit 0
