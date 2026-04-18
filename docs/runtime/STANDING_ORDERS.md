# STANDING ORDERS — MindMosaic Solo Dev

# Model: claude-sonnet-4-6

1. Every PR starts by reading (in this exact order):
   - docs/runtime/STATUS.md
   - docs/runtime/DAILY_LOG.md (most recent row)
   - docs/runtime/DEV_PLAN.md (section for this PR)
   - Specified spec sections from docs/spec/
   - Relevant mockup(s) from docs/mockups/
     Do not write code until this context is confirmed in writing.

2. UI work MUST reference the canonical mockups below.
   Open the relevant file in VS Code Live Preview alongside the code.
   Match layout, spacing, hierarchy, token usage, and all component states.
   Deviations must be logged in DAILY_LOG.md with explicit reason.

3. CANONICAL MOCKUP FILENAMES (use these, no others):
   01-authentication.html ← signup + login + forgot (all in one file)
   02-dashboard.html ← parent dashboard overview
   03-parent-dashboard.html ← child progress detail
   04-billing.html ← plans & billing
   05-student-home.html ← student home + session selection
   06-learning-hub.html ← learning hub (v2 ref)
   07-exam-engine.html ← exam session player (PRIMARY for PR 8)
   08-practice.html ← practice mode
   09-results.html ← results (PRIMARY for PR 9)
   10-student-assignments.html
   11-engagement.html
   12-teacher-dashboard.html
   13-teacher-student-detail.html
   14-analytics.html
   15-assignment-engine.html
   16-admin-intelligence.html
   17-landing.html
   00-design-system.html ← token source of truth (PRIMARY for PR 4)

4. C-C-D-V: Confirm context → Construct plan → Deliver incrementally → Verify.

5. Never modify RLS without running the full pg-tap suite.

6. Never skip DAILY_LOG.md, DEV_PLAN.md, STATUS.md updates. CI blocks merge.

7. Every POST endpoint supports Idempotency-Key. No exceptions.

8. Strict TypeScript: zero `any`, branded IDs (TenantId, UserId, SessionId).

9. Risk gate:
   - Low risk → proceed
   - Medium risk → state the risk explicitly, proceed unless I say stop
   - High risk → STOP and ask for explicit confirmation before starting

10. No TODO/FIXME without a linked issue in docs/runtime/POST_LAUNCH_BACKLOG.md.

11. Squash-merge to main. Main is always deployable at all times.

12. If you are adding a feature not in the MVP plan, STOP.
    Log it in POST_LAUNCH_BACKLOG.md. Do not build it.

13. Design tokens live in docs/mockups/00-design-system.html.
    Extract once into apps/web/app/globals.css in PR 4.
    Never hand-code hex values anywhere else in the codebase.
