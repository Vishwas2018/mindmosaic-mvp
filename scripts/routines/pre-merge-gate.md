# ROUTINE: pre-merge-gate
# Live context injected by scripts/routine.ts
# Run before every squash merge to main. No exceptions.

## Your role
Enforce the full Definition of Done from BUILD_CONTRACT.md section 10.
Every box must pass. A single failure blocks the merge.
State evidence — do not mark boxes without proof.

---

## Step 1 — Identify PR and acceptance criteria
From the git branch in preamble, identify which PR this is.
Read docs/runtime/DEV_PLAN.md, extract acceptance criteria verbatim.
Print as numbered list — this is your checklist for Step 6.

## Step 2 — Automated gates
  pnpm -C apps/web typecheck 2>&1 | tail -3
  pnpm -C apps/web lint 2>&1 | tail -3
  pnpm -C apps/web build 2>&1 | tail -5
  supabase db reset 2>&1 | tail -5
  supabase test db 2>&1
  grep -r "service_role" apps/web/ 2>/dev/null || echo "CLEAN"
Any failure: print it and STOP.

## Step 3 — Security gates
  grep -rE "#[0-9a-fA-F]{3,8}" apps/web/app apps/web/components \
    --include="*.tsx" --include="*.ts" \
    | grep -v globals.css | grep -v tailwind.config \
    2>/dev/null || echo "CLEAN"

  git diff main -- "*.ts" "*.tsx" | grep "^+" | grep ": any" 2>/dev/null || echo "CLEAN"

  git diff main -- "*.ts" "*.tsx" "*.sql" \
    | grep "^+" | grep -E "TODO|FIXME|HACK" 2>/dev/null || echo "CLEAN"

## Step 4 — Process gates (Yes / No / NA)
- Every new POST/PATCH/DELETE accepts Idempotency-Key
- Every new tenant-scoped table has RLS + pg-tap test
- Every new feature is behind a feature_flag (default off)
- docs/governance/OWNERS.md updated for new tables/endpoints
- docs/runtime/STATUS.md reflects post-merge state
- docs/runtime/DAILY_LOG.md complete with today's commit SHA

## Step 5 — Mockup fidelity (UI PRs only)
- State the mockup reference file
- Confirm visual regression baseline exists
- State deviations and their backlog entries

## Step 6 — PR acceptance criteria
List each criterion from Step 1.
Mark PASS (with evidence) or FAIL (with reason).

## Step 7 — Verdict

If ALL pass:
MERGE GATE: APPROVED
====================
  git checkout main && git pull origin main
  git merge --squash [branch from preamble]
  git commit && git push origin main

If ANY fail:
MERGE GATE: BLOCKED
===================
Failing: [check]
Evidence: [output]
Fix: [exact command]

## Step 8 — Write docs/runtime/last-merge-gate.md
Full results table + merge command if approved.
