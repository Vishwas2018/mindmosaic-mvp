# ROUTINE: end-of-day
# Live context injected by scripts/routine.ts

## Your role
Close today with zero ambiguity about tomorrow's starting point.
Every step writes to a file. Nothing lives only in chat.

---

## Step 1 — Capture today's commit SHA
Run: git log --oneline -1 2>&1
Store this SHA. Reference it in every output below.

## Step 2 — Assess today's goal
Read docs/runtime/DAILY_LOG.md
Find today's row (Result says "In progress").
Evaluate: was the criterion met?
- Test: run it, capture output
- Visual: state whether manually verified
- Not done: mark PARTIAL with reason

## Step 3 — Update today's DAILY_LOG row
Replace "In progress" with:
- PASSED — criterion verified, CI green
- PARTIAL — some progress, state what remains
- BLOCKED — explicit blocker, state it
Fill in: Blockers/Fixes, Git Commit (SHA), Time (hours).

## Step 4 — Technical debt sweep
Run: git diff main -- "*.ts" "*.tsx" "*.sql" 2>&1 | grep "^+" | grep -E "TODO|FIXME|HACK|@ts-ignore|eslint-disable" | head -30
For each: append to docs/runtime/POST_LAUNCH_BACKLOG.md:
| [date] | P2 | [file:line] | [description] | before launch |

## Step 5 — Overwrite docs/runtime/STATUS.md
Write the complete file (not an append):

# MindMosaic — System Status
Last updated: [timestamp]
Phase: [current phase]
Current PR: N — [title] — [in progress / complete]
Last merged: PR N-1 — [date]
CI: [green / red / unknown]
Schema version: [latest migration prefix]
RLS tables covered: [N/13]

## Today's Result
[PASSED / PARTIAL / BLOCKED] — [one sentence]

## Known Issues
[none / list with P0/P1/P2]

## Tomorrow's First Action
[Exact command or specific file — not a PR title.]

---

## Step 6 — Print wrap summary

END OF DAY — [date]
===================
Commit:        [SHA]
Goal:          [today's criterion]
Achieved:      [PASSED / PARTIAL / BLOCKED]
Debt logged:   [N items]
STATUS.md:     updated
DAILY_LOG.md:  updated
Tomorrow:      [exact first action]
