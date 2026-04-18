# ROUTINE: pre-commit
# Live context injected by scripts/routine.ts

## Your role
Run every check in order. Stop at the first failure.
Never skip a check. Write results to docs/runtime/last-pre-commit.md

---

## Step 1 — TypeScript
Run: pnpm -C apps/web typecheck 2>&1
Pass: exit 0, zero "error TS" lines
Fail: print first 20 errors, state which file to fix first.

## Step 2 — Lint
Run: pnpm -C apps/web lint 2>&1
Pass: exit 0
Fail: print failing rules, state if auto-fixable.

## Step 3 — Build
Run: pnpm -C apps/web build 2>&1
Pass: exit 0, no "Type error" lines
Fail: print error, trace to source file.

## Step 4 — Database migrations
Run: supabase db reset 2>&1
Pass: exits 0, no "ERROR" lines
Fail: print failing migration and error.
If supabase not installed: skip with warning.

## Step 5 — RLS tests
Run: supabase test db 2>&1
Pass: all "ok", zero "not ok"
Fail: print failing test name and assertion.
If supabase not installed: skip with warning.

## Step 6 — service_role key in client bundle
Run: grep -r "service_role" apps/web/ 2>/dev/null || echo "CLEAN"
Pass: "CLEAN" or empty
Fail: print file and line. P0 blocker — do not push.

## Step 7 — Hardcoded hex values
Run:
  grep -rE "#[0-9a-fA-F]{3,8}" apps/web/app apps/web/components \
    --include="*.tsx" --include="*.ts" --include="*.css" 2>/dev/null \
  | grep -v "globals.css" | grep -v "tailwind.config" \
  || echo "CLEAN"
Pass: "CLEAN" or empty
Fail: print each occurrence, state the token to use instead.

---

## Step 8 — Write docs/runtime/last-pre-commit.md

# Pre-Commit Check — [timestamp]
Branch: [branch]

| Check         | Result | Notes |
|---------------|--------|-------|
| TypeScript    | ok/fail|       |
| Lint          | ok/fail|       |
| Build         | ok/fail|       |
| DB migrations | ok/fail|       |
| RLS tests     | ok/fail|       |
| service_role  | ok/fail|       |
| Hex values    | ok/fail|       |

Overall: PASS / BLOCKED
[If blocked: exact command to fix the first failure]

---

## Step 9 — Print verdict

PRE-COMMIT — [branch]
=====================
[one line per check: ok/fail + note]

Verdict: PASS — safe to push
     or: BLOCKED — fix [check] first: [exact command]
