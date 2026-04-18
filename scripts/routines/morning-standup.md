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
