#!/usr/bin/env bash
# ps1-luana.sh — PS1 customizado para worktrees Luana (mec. I)
# SSoT: docs/process/parallel-sessions-protocol.md § D7
#
# Source this file in ~/.bashrc:
#   if [[ -f ~/Proyectos/luana-platform/scripts/git/ps1-luana.sh ]]; then
#     source ~/Proyectos/luana-platform/scripts/git/ps1-luana.sh
#   fi
#
# Format: [luana-{suffix} {branch} {dirty}]$
# Ejemplo: [luana-{brand}-{slug} wip/{brand}-{slug} ✗]$

__luana_ps1() {
  local cwd_basename branch dirty
  cwd_basename="$(basename "$PWD" 2>/dev/null)"

  # Only show if inside a luana-* worktree
  if [[ ! "$cwd_basename" =~ ^luana ]]; then
    return 0
  fi

  branch="$(git branch --show-current 2>/dev/null || echo '<detached>')"

  # Dirty marker
  if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
    dirty=' \[\033[31m\]✗\[\033[0m\]'
  else
    dirty=' \[\033[32m\]✓\[\033[0m\]'
  fi

  echo -n "\[\033[36m\][${cwd_basename}\[\033[0m\] \[\033[33m\]${branch}\[\033[0m\]${dirty}\[\033[36m\]]\[\033[0m\]"
}

# Backup original PS1 (idempotent)
[[ -z "${LUANA_PS1_ORIG:-}" ]] && export LUANA_PS1_ORIG="$PS1"

# Set PS1 to include luana context when in luana-* worktree
export PS1='$(__luana_ps1)\$ '
