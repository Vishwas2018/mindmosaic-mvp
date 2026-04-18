# ROUTINE: incident-triage
# Live context injected by scripts/routine.ts
# Run immediately when anything breaks in production or CI goes red on main.

## Your role
Structured diagnosis under pressure. No guessing. No random fixes.
Follow every step in order. Do not skip Step 1.

---

## Step 1 — Contain before diagnosing
Answer from what you can observe now:
1. Live users affected? (Yes / No / Unknown)
2. Data at risk? (Yes / No / Unknown)
3. Feature flag can mitigate?

Run: supabase db -- "SELECT key, enabled FROM feature_flag ORDER BY key;" 2>/dev/null || echo "DB unavailable"

If data is at risk: STOP.
Print: "DATA RISK DETECTED"
State last deployment SHA and rollback command.
Do not write any code until rollback decision is made.

## Step 2 — Reproduce locally
Do not touch live environments until reproduced locally.
State verbatim: exact error, numbered steps, expected vs actual.
Run: git log --oneline -10
Identify likely introducing commit. Do not proceed until confirmed.

## Step 3 — Classify
Type (one only):
  RLS_LEAK        tenant data visible to wrong tenant
  SCORING_ERROR   session score wrong
  SESSION_CORRUPT session state inconsistent
  PAYMENT_ERROR   billing state wrong
  AUTH_FAILURE    auth not working
  PERF_BREACH     p95 > SLA
  CI_FAILURE      main branch broken
  UI_REGRESSION   visual/functional breakage

Severity: P0 fix NOW | P1 before new features | P2 within 24h | P3 backlog

## Step 4 — Fix on isolated branch
  git checkout main && git pull origin main
  git checkout -b fix/[type]-[3-word-description]
Rules: minimum diff, write failing test first, reversible with git revert.
For RLS_LEAK: write + confirm failing test, write fix, confirm passing, run full suite.

## Step 5 — Run pre-commit + pre-merge gate
  pnpm -C apps/web typecheck lint build
  supabase db reset && supabase test db
Then run the pre-merge-gate routine. Not optional for hotfixes.

## Step 6 — Post-mortem (within 24h)
Write docs/runtime/incidents/YYYY-MM-DD-[type].md:

# Incident — [date] [type]
Severity: [P0/P1/P2/P3]
Duration: [detected] to [resolved]

## Timeline
## Root Cause
## Fix (commit SHA)
## Prevention (implemented or added to backlog as P0)

Append to DAILY_LOG.md:
| [date] | INCIDENT | [type] | P[N] | [root cause] | [fix] | [SHA] | [duration] |

## Step 7 — Print summary

INCIDENT — [date]
=================
Type:        [type]
Severity:    [P0/P1/P2/P3]
Reproduced:  [Yes / No]
Root cause:  [one sentence]
Fix:         [branch] -> [SHA]
Deployed:    [Yes / pending / rolled back]
Post-mortem: docs/runtime/incidents/[date]-[type].md
Prevention:  [implemented / added to backlog as P0]
