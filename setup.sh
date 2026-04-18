#!/usr/bin/env bash
# ==============================================================================
# MindMosaic — Developer Routine Setup (Bootstrap)
# Compatible with: Git Bash (Windows), macOS, Linux
#
# This script validates prerequisites, then delegates all file-writing work
# to setup.mjs (Node.js). This avoids bash heredoc quoting complexity and
# makes the setup logic testable and portable.
#
# USAGE:
#   ./setup.sh              full setup
#   ./setup.sh --dry-run    print what would happen, write nothing
#   ./setup.sh --verify     verify existing setup without writing
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Colour helpers (printf-based, works on Git Bash) ─────────────────────────
if [ -t 1 ]; then
  R='\033[0;31m' G='\033[0;32m' Y='\033[1;33m' B='\033[1m' X='\033[0m'
else
  R='' G='' Y='' B='' X=''
fi

ok()    { printf "  ${G}ok${X}   %s\n" "$1"; }
warn()  { printf "  ${Y}warn${X} %s\n" "$1"; }
fail()  { printf "  ${R}fail${X} %s\n" "$1" >&2; }
fatal() { printf "\n${R}${B}FATAL: %s${X}\n" "$1" >&2; printf "${R}Fix this and re-run setup.sh${X}\n" >&2; exit 1; }
header(){ printf "\n${B}=== %s ===${X}\n" "$1"; }

# ── Prerequisite validation ───────────────────────────────────────────────────

header "Validating Prerequisites"

# git
if ! command -v git &>/dev/null; then
  fatal "git not found. Install from https://git-scm.com/"
fi
GIT_VERSION="$(git --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
ok "git $GIT_VERSION"

# node (required — setup.mjs runs on node)
if ! command -v node &>/dev/null; then
  fatal "node not found. Install Node.js 20+ from https://nodejs.org/"
fi
NODE_VERSION="$(node --version)"
NODE_MAJOR="$(printf '%s' "$NODE_VERSION" | sed 's/^v//' | cut -d. -f1)"
if [ "$NODE_MAJOR" -lt 20 ] 2>/dev/null; then
  fatal "Node.js >= 20 required, found $NODE_VERSION. Use nvm: nvm install 20"
fi
ok "node $NODE_VERSION"

# pnpm
if ! command -v pnpm &>/dev/null; then
  warn "pnpm not found — installing via npm..."
  npm install -g pnpm || fatal "Failed to install pnpm. Run manually: npm install -g pnpm"
fi
PNPM_VERSION="$(pnpm --version 2>/dev/null || echo "0.0.0")"
PNPM_MAJOR="$(printf '%s' "$PNPM_VERSION" | cut -d. -f1)"
if [ "$PNPM_MAJOR" -lt 8 ] 2>/dev/null; then
  fatal "pnpm >= 8 required, found $PNPM_VERSION. Run: npm install -g pnpm"
fi
ok "pnpm $PNPM_VERSION"

# optional tools
if command -v tsx &>/dev/null; then
  ok "tsx (globally available)"
else
  warn "tsx not found globally — will be installed as devDependency"
fi

if command -v supabase &>/dev/null; then
  ok "supabase CLI $(supabase --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
else
  warn "supabase CLI not found — DB checks in routines will be skipped"
  warn "Install: https://supabase.com/docs/guides/cli"
fi

if command -v gh &>/dev/null; then
  ok "gh CLI (live CI state enabled in routines)"
else
  warn "gh CLI not found — CI state in routines will show 'unknown' (optional)"
fi

# check setup.mjs is alongside this script
SETUP_MJS="$SCRIPT_DIR/setup.mjs"
if [ ! -f "$SETUP_MJS" ]; then
  fatal "setup.mjs not found at $SETUP_MJS. Both files must be in the same directory."
fi

# ── Hand off to Node.js ───────────────────────────────────────────────────────

printf "\nPrerequisites OK. Running setup.mjs...\n\n"
exec node "$SETUP_MJS" "$@"
