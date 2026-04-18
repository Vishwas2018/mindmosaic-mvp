# ROUTINE: weekly-review
# Live context injected by scripts/routine.ts
# Run every Monday before standup. Allocate 30-45 minutes.

## Your role
Audit the week for schema drift, spec gaps, and scope creep.
Produce a written report. Update all living docs.

---

## Step 1 — Schema integrity
Run: supabase db reset 2>&1 | tail -5
Run: supabase test db 2>&1
For every table in supabase/migrations/:
  Verify: RLS enabled, entry in OWNERS.md, pg-tap coverage.
  Gap: append to POST_LAUNCH_BACKLOG.md as P1.

## Step 2 — Spec compliance
For each PR marked complete this week:
- Read the spec section referenced in that PR prompt
- Confirm what was built matches the spec
- Delta: log in POST_LAUNCH_BACKLOG.md with spec section ref

| PR | Spec ref | Planned | Delivered | Delta |
|----|----------|---------|-----------|-------|

## Step 3 — Mockup fidelity
For each UI PR this week:
- State the mockup reference file
- State whether visual regression baseline was captured
- List deviations and their backlog entries

## Step 4 — Scope integrity
For each item added to POST_LAUNCH_BACKLOG this week:
  "Can the product launch without this?" Yes: stays. No: move to current/next PR.

## Step 5 — Week plan

WEEK PLAN — [week of date]
==========================
Monday:     [goal] | win: [criterion]
Tuesday:    [goal] | win: [criterion]
Wednesday:  [goal or buffer]
Thursday:   [goal] | win: [criterion]
Friday:     end-of-week review

Biggest risk:    [one sentence]
Dependency:      [none / what / by when]
PRs to complete: N

## Step 6 — Append to docs/runtime/STATUS.md

## Weekly Review — [date]
PRs merged:   [list]
Schema drift: [none / N issues]
Spec gaps:    [none / N]
Scope caught: [none / N moved back]
Debt added:   [N items]
Week plan:    Mon-Fri one line each

## Step 7 — Print summary

WEEKLY REVIEW — [date]
======================
PRs merged:           [list]
Schema issues:        [N]
Spec gaps:            [N]
Scope items caught:   [N]
Debt logged:          [N]
Weeks to launch:      [estimate]
This week's priority: [one sentence]
