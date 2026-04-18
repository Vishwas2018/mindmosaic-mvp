# +------------------------------------------------------------------+
# |  LIVE CONTEXT — auto-injected by scripts/routine.ts             |
# +------------------------------------------------------------------+
# Timestamp:  2026-04-18T08:53:16.282Z
# Date:       Saturday 18 April 2026
# Branch:     feat/pr-1-repo-and-ci
# CI state:   unknown (install gh CLI)
# Open PR:    no open PR on current branch
#
# Git status:
#   M docs/.claude/settings.local.json
#    D docs/governance/BUILD_CONTRACT.md.md
#    D docs/governance/GIT_WORKFLOW.md.md
#    D docs/governance/OWNERS.md.md
#    M package.json
#    M pnpm-lock.yaml
#    D supabase/migrations/.gitkeep
#   ?? .vscode/tasks.json
#   ?? docs/governance/README.md
#   ?? docs/mockups/README.md
#   ?? docs/runtime/STANDING_ORDERS.md
#   ?? docs/runtime/last-routine.md
#   ?? scripts/routine.ts
#   ?? scripts/routines/
#   ?? scripts/shell-aliases.sh
#   ?? setup.mjs
#   ?? setup.sh
#
# Recent commits:
#   5316255 CHORE(repo): scaffold Next.js 14 + Supabase + CI
#   f20a49f Initial commit
#
# STATUS.md (last 20 lines):
#   - ✅ PR 1 — Repo, Supabase, CI *(pending supabase CLI for db-tests)*
#   - [ ] PR 2 — Auth, Tenancy, RLS
#   - [ ] PR 3 — Content Schema + Seed
#   - [ ] PR 4 — Design Tokens + Child Management
#   - [ ] PR 5 — Stripe Billing
#   - [ ] PR 6 — Session Schema + Create
#   - [ ] PR 7 — Respond / Submit / Scoring
#   - [ ] PR 8 — Exam UI
#   - [ ] PR 9 — Results Page
#   - [ ] PR 10 — Dashboards
#   - [ ] PR 11 — Launch Prep
#   ## Environments
#   - Local: Next.js dev server ready (`pnpm -C apps/web dev`)
#   - Supabase local: requires `supabase start` (CLI not yet installed)
#   - Staging: not yet configured
#   - Production: not yet configured
#   ## Remaining P1 Blockers
#   - `supabase CLI` not installed — needed for `supabase start`, `db reset`, CI db-tests job
#   - `docs/mockups/00-design-system.html` is a 477-byte stub — needed before PR 4
#   - `docs/mockups/index.html` missing — needed before PR 4
#
# Last DAILY_LOG entry:
#   | 2026-04-18 | 0 / PR 1 | PR-1-Repo-CI | Next.js 14 scaffold + Supabase bootstrap + CI | ✅ PASSED — typecheck 0 errors, lint clean, build green | supabase CLI still missing: `supabase db reset` and CI `db-tests` job require manual CLI install | feat/pr-1-repo-and-ci | — |
# -------------------------------------------------------------------
# ROUTINE: morning-standup
# Live context is injected above this line by scripts/routine.ts
# Paste the full contents of docs/runtime/last-routine.md into Claude Code.

## Your role
You are the solo developer assistant for MindMosaic.
Live context has been injected in the preamble above. Do not ask me to
re-read files already present there. Work through every step in order.
Make decisions without asking clarifying questions.

---

## Step 1 — CI Gate

Check the CI state in the live context preamble.

If it contains "failure" or "failed":
  Print: "CI IS RED — today's only job is fixing CI"
  Read .github/workflows/ci.yml
  State the most likely cause from recent commits
  STOP. Do not proceed to Step 2.

Otherwise continue.

---

## Step 2 — Unresolved Blockers

Check the last DAILY_LOG entry in the preamble.

If the Result column contains "PARTIAL" or "BLOCKED":
  Print: "UNRESOLVED BLOCKER from yesterday: [what it was]"
  State the exact first action to resolve it.
  Flag as today's first priority.

---

## Step 3 — Current Position

Read docs/runtime/DEV_PLAN.md
Find the first PR not marked complete.
State: PR number, title, next step, estimated hours today.

---

## Step 4 — Today's Single Win

Define one acceptance criterion verifiable by end of day.

Format: "Today's win: [specific, testable statement]"
Good: "Today's win: pg-tap 001_tenant_isolation.sql passes with 2 tenants"
Bad:  "Today's win: make progress on auth"

---

## Step 5 — Write to docs/runtime/DAILY_LOG.md

Append exactly one row:

| YYYY-MM-DD | PR N — title | morning-standup | [today's win] | In progress | — | — | — |

---

## Step 6 — Print standup summary

STANDUP — [date]
================
CI:           [green / red / unknown]
Yesterday:    [one line from last log entry]
Blocker:      [none / description]
Today's PR:   PR N — [title]
Today's step: [specific step name from DEV_PLAN]
Today's win:  [acceptance criterion]
ETA:          [hours]
