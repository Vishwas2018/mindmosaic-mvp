#!/usr/bin/env bash
# MindMosaic developer aliases
# Source from your shell profile:
#   echo "source $(pwd)/scripts/shell-aliases.sh" >> ~/.bashrc
#   source ~/.bashrc

export MINDMOSAIC_ROOT="C:/Users/vishw/GitHub/mindmosaic-mvp/mindmosaic"

# mm <routine-name> — assemble prompt and open in VS Code
mm() {
  local name="${1:-}"
  if [ -z "$name" ]; then
    echo "Usage: mm <routine>"
    echo "Routines: morning-standup pre-commit end-of-day weekly-review pre-merge-gate incident-triage"
    return 1
  fi
  cd "$MINDMOSAIC_ROOT" || return 1
  pnpm routine "$name" && code docs/runtime/last-routine.md
}

alias mm-start="mm morning-standup"
alias mm-check="mm pre-commit"
alias mm-end="mm end-of-day"
alias mm-week="mm weekly-review"
alias mm-merge="mm pre-merge-gate"
alias mm-911="mm incident-triage"

_mm_complete() {
  local r="morning-standup pre-commit end-of-day weekly-review pre-merge-gate incident-triage"
  COMPREPLY=( $(compgen -W "$r" -- "${COMP_WORDS[1]}") )
}
complete -F _mm_complete mm
