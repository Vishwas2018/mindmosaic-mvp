# MindMosaic — Development Plan v1.0

**Companion to:** Backend Architecture v2.0 (`mindmosaic-backend-arch-v2_0.md`), Master Product Specification v4.4 (`mindmosaic-spec-v4_4.md`)
**Status:** Implementation-Ready — no ambiguity, no guesswork
**Audience:** Engineering lead + coding agents (Claude Sonnet 4.6) executing the build

This plan converts the architecture into sequenced, executable work. Every item has a defined deliverable, acceptance criterion, and dependency. Nothing is "TBD".

**Document alignment verified:** Spec v4.4 Change Log (items 1–22) is fully covered by Architecture v2.0 Change Log (items 1–30). The four new product domains introduced in Spec v4.4 (§24 Assignments, §25 Billing, §26 Engagement, §27 Notifications) are materialised in this plan's PRs: Assignments (PR 2.11, 2.17, 2.18), Billing (PRs 4.1–4.4, 4.8), Engagement (PRs 5.3, 5.4), Notifications (PR 2.12). Plan overrides (§16.6.1) → PR 2.13. Data subject rights (§22.3.2) → PR 4.9. Skill graph migration job (§22.9.2) → PR 2.23.

---

## 0. How to Use This Plan

- Work proceeds strictly phase-by-phase. Phase N+1 cannot begin until Phase N acceptance is met.
- Within a phase, work is organised into **PRs**, each with a single scope. Do not combine unrelated work in one PR.
- Every PR lists its exact deliverables, the migrations it touches, the endpoints it adds, and its acceptance tests.
- The agent follows the PR order exactly. If a blocker arises, it raises it before re-ordering.
- The `BUILD_CONTRACT.md` (repo root) is the persistent authority on engineering rules; this plan is the sequencing authority.

---

## 1. Target Environment

- **Hosting:** Supabase (Sydney `au-syd` region, fixed), Vercel (deployment), Stripe (billing).
- **Runtime:** Deno for Edge Functions, Node 20 for CI and scripts.
- **Package manager:** pnpm 9.
- **Monorepo:** Turborepo.
- **Node version:** 20 LTS.
- **CI:** GitHub Actions.
- **Required SaaS accounts:** Supabase, Vercel, Stripe, Sentry, OTel backend (Honeycomb or Grafana Cloud — pick at Phase 2 start).

---

## 2. Repository Layout (Locked)

```
/apps
  /web                        Next.js 14 app
/packages
  /types                      DTOs + Zod (single source of truth)
  /sdk                        Typed API client + React Query hooks
  /ui                         Shared primitives + design tokens
  /core                       Circuit breaker, feature-gate, explain-format, id helpers
  /engines                    Server-side AssessmentEngine implementations
  /engines-client             Client timer/nav helpers
/supabase
  /migrations                 NNNN_<n>.sql; numbered, immutable after merge
  /functions                  Edge Functions, one service per folder
  /tests
    /rls                      Tenant isolation tests
    /pipeline                 Pipeline integration tests
    /sql                      Pure SQL tests
  /seeds                      Deterministic seed data
/docs
  mindmosaic-spec-v4_3.md
  mindmosaic-backend-arch-v2_0.md
  PROJECT_PLAN.md             (this file)
  OWNERS.md                   Service-to-table ownership matrix
  RUNBOOKS/                   Ops playbooks
/e2e                          Playwright specs
/scripts                      Utility scripts (seed, backfill, etc.)
BUILD_CONTRACT.md
README.md
turbo.json
pnpm-workspace.yaml
tsconfig.base.json
.github/workflows/            CI definitions
```

---

## 3. Phase 0 — Foundations (est. 12–14 working days)

**Goal:** Clean repo, production-shaped infra, all schema and RLS in place, auth working end-to-end, typed SDK and UI primitives ready for consumers.

**Exit criteria:**

- Every migration applies and reverts cleanly in CI on a fresh Supabase project.
- Tenant isolation test covers every tenant-scoped table and passes.
- A seeded student can sign up, log in, and see an empty dashboard.
- All DTOs from Phase 1 scope are in `packages/types` with Zod.
- Zero TypeScript errors, zero lint errors in CI.

### PR 0.1 — Monorepo & Tooling

- Initialise Turborepo with `apps/web`, `packages/types`, `packages/sdk`, `packages/ui`, `packages/core`, `packages/engines`, `packages/engines-client`.
- Set up pnpm workspaces, shared `tsconfig.base.json`, ESLint, Prettier, Husky pre-commit (lint + typecheck on changed files).
- Turbo pipelines: `build`, `test`, `lint`, `typecheck`, `db:migrate`, `db:test`.
- GitHub Actions: matrix job running lint / typecheck / unit tests / migration dry-run on every PR.
- Supabase project provisioned in `au-syd`; credentials in GitHub secrets.
- README with onboarding steps.
- `BUILD_CONTRACT.md` pinned at repo root.
- `OWNERS.md` scaffolded from Architecture §1.2.

**Acceptance:** CI runs green on the empty repo.

### PR 0.2 — Migration 0001: Enums + Tenancy + Auth + Admin Log

Creates all custom types from Architecture §2.1 and all tenancy/identity tables from §2.2.

- All enums.
- `tenant`, `user_profile`, `parent_student_link`, `class_group`, `class_student`, `feature_flag`, `admin_action_log`.
- RLS helpers: `auth_tenant_id()`, `auth_user_id()`, `auth_role()`.
- `handle_new_user()` trigger on `auth.users`.
- Feature flag indexes (two partial uniques).
- Universal `set_updated_at()` function + triggers.
- All RLS policies for these tables.
- Seed script for 1 tenant, 1 platform_admin.

**Tests:**

- Migration up/down.
- Tenant isolation covering these tables.
- Trigger correctness: creating an `auth.users` row creates a `user_profile` row.

### PR 0.3 — Migration 0002: Content & Skill Graph

- `skill_graph_version` with draft/published/archived flow.
- `skill_node`, `skill_edge` with CHECK constraints from §2.3.
- `skill_migration_map` (table only; the migration **worker** that consumes this table is implemented in PR 2.23 — publishing a new graph version is not supported end-to-end until that PR ships).
- `publish_skill_graph()` function (full topological validation).
- `misconception`, `repair_sequence`.
- `stimulus`, `item`, `item_version`.
- `v_item_current` view.
- Indexes as specified.
- RLS policies (Pattern F).

**Tests:**

- Cycle detection rejects cycles of length 2, 3, 5, 10.
- `publish_skill_graph` succeeds on valid DAG, fails on cycle with path in error.
- `v_item_current` returns only current versions.
- Tenant isolation (no tenant_id here, so only admin-write enforced).

### PR 0.4 — Migration 0003: Assessment Config

- `framework_config`, `pathway`, `blueprint`, `assessment_profile`, `diagnostic_rule`.
- Indexes.
- RLS Pattern F.

**Tests:** migration up/down; admin-only writes.

### PR 0.5 — Migration 0004: Sessions + Canonical Events

- `session_record` with partial unique for one-active and all indexes.
- `session_response`, `response_telemetry`, `session_checkpoint`.
- `learning_event` declared as `PARTITION BY RANGE (created_at)` with a default partition, plus `pg_partman` config for monthly partitions from launch month forward.
- `create_session_response_atomic()` function.
- `api_idempotency_key`.
- RLS Pattern A.

**Tests:**

- `create_session_response_atomic` writes all four rows atomically; version mismatch returns `VERSION_CONFLICT`.
- Dedup indexes reject duplicates.
- One-active-session partial unique enforced.
- Tenant isolation.

### PR 0.6 — Migration 0005: Intelligence + Orchestration + Analytics

- `skill_mastery`, `learning_velocity`, `behaviour_profile`.
- `student_misconception`, `repair_record` with concurrency partial uniques.
- `intelligence_audit_log` (partitioned).
- `learning_plan`, `plan_revision`, `recommendation`, `plan_override`.
- `intervention_alert`, `cohort_metric_cache`.
- RLS Patterns A and B.

**Tests:** migration up/down; concurrency constraints reject double-queue of same misconception; tenant isolation.

### PR 0.7 — Migration 0006: Jobs + Outbox + Rate Limit

- `job_queue`, `pipeline_event`, `outbox_event`, `rate_limit_bucket`.
- All polling/dedup/stuck-detection indexes.
- RLS Pattern G (service-role only).

**Tests:** polling index used by `EXPLAIN`; dedup rejects duplicate pending/processing jobs.

### PR 0.8 — Migration 0007: New Domains

- Assignments: `assignment`, `assignment_target`, `assignment_session` + FK addition to `session_record.assignment_id`.
- Billing: `subscription`, `billing_customer`, `invoice`, `billing_event`.
- Engagement: `engagement_streak`, `achievement_definition`, `student_achievement`.
- Notifications: `notification`.
- All relevant RLS.

**Tests:** RLS correctness; assignment-target XOR check enforced.

### PR 0.9 — pg_cron Setup

- Install `pg_cron` extension.
- Schedule all crons from Architecture §5.5 with idempotent job inserts.
- `jobs.reaper`, `outbox.dispatch` (every 2s via edge function not pg_cron — see PR 0.10).

**Tests:** crons visible in `cron.job`; dry-run each by invoking the function directly.

### PR 0.10 — Outbox Dispatcher Edge Function

- Edge Function `outbox-dispatcher` invoked every 2 seconds by a scheduled edge invocation (Vercel Cron or Supabase Scheduled Trigger).
- Reads `outbox_event WHERE processed_at IS NULL` with `FOR UPDATE SKIP LOCKED`, dispatches to `job_queue` per a type-mapping table, sets `processed_at`.

**Tests:** insert 100 outbox events; run dispatcher; assert all become job_queue rows exactly once.

### PR 0.11 — `packages/types` + Shared Zod Schemas

- Every DTO from Architecture Part VI as a TypeScript interface + Zod schema.
- `SCHEMA_VERSION` constant.
- Error envelope + error codes enum.
- Shared branded types for IDs (`TenantId`, `UserId`, `SessionId`, etc.).

**Acceptance:** `import { CreateSessionResponseSchema } from '@mm/types'` works from any package.

### PR 0.12 — `packages/sdk` Typed Client

- Fetch wrapper that:
  - Injects JWT from Supabase client.
  - Generates and forwards `X-Trace-Id`.
  - Supports `Idempotency-Key` per method.
  - Decodes error envelope into typed `APIError`.
- React Query hooks for every endpoint planned in Phase 1.
- Query key factory convention.

**Acceptance:** End-to-end type safety from SDK call to typed response (no `any`).

### PR 0.13 — `packages/ui` Primitives + Design Tokens

- Port CSS variables from mockups into `tokens.css`.
- Implement primitives listed in Architecture §8.4 Layout, Navigation, Data display, Forms, Overlay, Feedback (loading/empty/error).
- Storybook with stories for every primitive.
- **`axe-core` is wired into CI from this PR forward, not Phase 5.** Every Storybook story runs `@storybook/addon-a11y` in CI; any serious or critical violation blocks merge. Design tokens include focus-ring, minimum contrast ratios, and minimum 44 px touch targets. The Phase 5 accessibility pass (PR 5.5) becomes an audit of completed flows, not a retrofit — most violations should be caught at component-build time.

**Acceptance:** Storybook runs; each primitive has at least one story; axe-core passes on all stories; keyboard-only navigation verified for every interactive primitive.

### PR 0.14 — `apps/web` Shell

- Next.js 14 App Router with role-based layouts (`(student)`, `(parent)`, `(teacher)`, `(admin)`, `(public)`).
- Middleware that reads Supabase JWT, redirects unauthenticated users to `/login`, and dispatches by role.
- `AuthProvider`, `EntitlementsProvider` in root layout.
- Error boundary per layout with Sentry integration.
- Placeholder pages for every route in Architecture §8.3.

**Acceptance:** Signed-in student lands on `/`; signed-in teacher lands on `/teacher`; middleware denies cross-role access.

### PR 0.15 — Auth Service

- Edge Functions `/auth/signup`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`.
- Rate limits per Architecture §4.13.
- Auth pages implementing `authentication.html` mockup.

**Acceptance:** End-to-end signup → email verify → login → dashboard load works.

### PR 0.16 — Seed Data & Fixtures

- Deterministic seed script producing:
  - 1 platform_admin, 1 org_admin.
  - 1 family tenant, 1 school tenant.
  - 2 parents, 3 students (years 3/5/7), 1 teacher, 1 class.
  - 1 published skill_graph_version: 1 domain (Number & Algebra), 2 strands, 6 skills, 4 prerequisite edges forming a valid DAG.
  - 20 items (10 NAPLAN Y5 Numeracy, 10 ICAS Mathematics Paper C), 2 stimuli, 3 misconceptions with distractor rationales.
  - 1 NAPLAN framework_config + assessment_profile + blueprint.
  - 1 ICAS framework_config + assessment_profile + blueprint.
  - **`feature_flag` rows explicitly seeded** for each seeded tenant per the spec §20.3.1 feature registry. The seed must include every `feature_key` the platform uses (pathways, modes, intelligence layers, orchestration, teacher tools, session limits) — not just the ones relevant to Phase 1. Tenant tiers are set as: family tenant → `standard`; school tenant → `premium`. Platform-wide defaults (`tenant_id = NULL`) are seeded for every key so first-time users get safe defaults before any subscription row exists.
  - **Feature flag operation pre-Stripe:** Until PR 4.3 wires Stripe → feature flag propagation, flags are managed exclusively by (a) this seed script, (b) direct `platform_admin` edits via `/admin/feature-flags` (added in PR 2.22), and (c) a manual admin script `scripts/set-tenant-tier.ts` documented in the Phase 0 README. No Phase 1–3 PR should introduce an ad-hoc flag-management path; when Phase 4 activates, Stripe becomes the authoritative writer for `source='subscription'` flags while admin overrides remain available under `source='admin_override'`.

**Acceptance:** Seed runs idempotently; verifies via SELECT counts; tier-entitled endpoints return expected 200/402 responses for seeded users without any Stripe dependency.

### PR 0.17 — CI Gate Extension

- Add `supabase db reset && pnpm test:rls` to CI.
- Add `pnpm test:contract` (hits a staging Supabase + deployed preview functions to verify DTO shapes).
- Add `pnpm test:migration` (up → down → up).
- Block merge if any Phase 0 acceptance fails.

---

## 4. Phase 1 — Core Assessment Flow (est. 18–22 working days)

**Goal:** A seeded student completes a full end-to-end NAPLAN or ICAS session; scores post; mastery and basic intelligence flow to the dashboard.

**Exit criteria:**

- Student completes a 30-item adaptive session; score returned in < 5 s.
- Replay of `learning_event` reproduces identical `skill_mastery`.
- Autosave + resume works across devices.
- Load test: 500 concurrent sessions, 20 tenants, zero cross-tenant reads.
- `session.respond.latency_p95` < 300 ms under load.

### PR 1.1 — `packages/engines` Contracts

- `AssessmentEngine` interface from spec §3.1.
- Shared types for `EngineState`, `TerminationSignal`, `ScoreResult`.
- Test harness with mock session.

### PR 1.2 — LinearEngine (ICAS)

- Implementation, unit-tested on the harness.
- Back-navigation, flagging, session timer enforced.

**Tests:** golden-path 30-item session, termination at max items, navigation edge cases.

### PR 1.3 — SkillEngine (Practice)

- Mastery-driven next-item selection via `skill_mastery` reads.
- In-session up/down difficulty rule.
- Optional timer; immediate feedback.

**Tests:** cognitive load > 0.8 reduces difficulty; mastery threshold terminates.

### PR 1.4 — DiagnosticEngine

- Binary-search-over-difficulty branching.
- Terminate on confidence threshold or max items.
- Emits proficiency map, not score.

### PR 1.5 — AdaptiveEngine (NAPLAN)

- Testlet routing per `framework_config.adaptive_rules`.
- Stage timer, stage-bound back-nav, server-authoritative routing.
- Writing-stage extended response capture (text only; no auto-marking).

**Tests:** routing table honoured; stage boundaries enforced; back-nav blocked across stages.

### PR 1.6 — Content Service

- `/pathways`, `/pathways/{slug}`, `/assessment-profiles`, `/content/items/{id}`, `/content/select`, `/content/search`, `/content/import` (admin dry-run), `/skill-graphs/active`.
- In-module-scope skill graph cache with watermark check.
- Blueprint-driven item selection with deterministic ordering.

**Tests:** unit + contract; skill graph cache hit on repeat request; blueprint returns expected item count + difficulty distribution.

### PR 1.7 — Assessment Service (Endpoints)

- `/sessions/create` — feature-flag check → create `session_record` → call `engine.initialise` → persist `engine_state_snapshot.planned_items`.
- `/sessions/{id}/respond` — lock token check → `create_session_response_atomic()` → engine.recordResponse → return next item.
- `/sessions/{id}/submit` — terminal write + `pipeline_event` + `outbox_event` in one transaction; invoke sync pipeline inline via function call.
- `/sessions/{id}/state` — resume returning current item.
- `/sessions/{id}/checkpoint` — upsert only `session_checkpoint`; never touches `session_record.version`.
- `/sessions/{id}/abandon`.
- `/sessions/recent`.
- Idempotency contract for all POSTs.
- Rate limiting via `rate_limit_bucket`.

**Tests:**

- Version conflict surface `409 VERSION_CONFLICT`.
- Idempotency replay returns cached response.
- Autosave does not conflict with concurrent response writes.
- One-active-session enforced at DB layer.
- Checkpoint replay honours `(session_id, item_id, sequence_number)` dedup.

### PR 1.8 — Intelligence Service Sync (L1 + L2 + L3-scoped)

- Edge Function `intelligence-svc`.
- `/intelligence/process-session/{id}` called inline from `/sessions/{id}/submit`.
- L1 Foundation: batch UPSERT `skill_mastery`, recompute `learning_velocity` using 14-day window, write `intelligence_audit_log` with `algorithm_version`.
- L2 Behaviour: compute guess_probability per response (stored in `learning_event.metadata`), fatigue_score, persistence adjustments; UPDATE `behaviour_profile` rolling aggregate with defaults-blending per spec §9.6.
- L3 Causal-scoped: for each skill touched with mastery < threshold, walk one level of prerequisites (no deep traversal); detect misconception from distractor_rationale; UPSERT `student_misconception` with confidence.
- Emit `pipeline_event` rows per step.

**Tests:**

- Replay determinism: given fixed input events, output is identical.
- Algorithm version recorded.
- SLA: p95 < 3 s under load with skill graph cache warm.

### PR 1.9 — Skill Graph Cache (Edge Function Module Scope)

- Shared library loaded by Content and Intelligence services.
- Structure: `Map<skill_id, SkillNodeRecord>` + adjacency map.
- TTL 1 h; on every call, check `SELECT version FROM skill_graph_version WHERE status='published'` once per cold start; refresh if changed.

**Acceptance:** first request cold-loads; 1000 subsequent requests skip DB for graph reads; cache invalidates on publish.

### PR 1.10 — Frontend: Session Selection Screen

Implement `session-selection.html` against real APIs: `/pathways`, `/assessment-profiles`, recent sessions list.

- Displays only entitled pathways (locked pathways show upgrade prompt).
- Recent sessions via `SessionSummaryDTO`.

### PR 1.11 — Frontend: Exam Engine Screen

Implement `exam_engine.html` — used by Adaptive and Linear engines:

- Server-authoritative timer (client display synced on each `respond`).
- Autosave every 30 s + on blur.
- Lock token in `X-Session-Lock`.
- Navigation constraints from `CreateSessionResponse.navigation`.
- Question map sidebar.
- Flag button.
- Offline tolerance: queue responses locally, replay on reconnect.
- **Accessibility is a Phase 1 requirement for this screen, not a Phase 5 retrofit.** The exam engine is the most complex interaction surface in the product and the hardest to fix later.
  - Full keyboard navigation: question content, all option controls, flag, question map, submit, and timer region reachable via Tab; answer selection via Space/Enter; question map cells navigable via arrow keys.
  - `aria-live="polite"` on the timer and feedback regions; `aria-live="assertive"` on timer expiry warnings.
  - Focus management: on next-question transition, focus moves to the question heading, not the body.
  - Visible focus indicators on every control (design tokens from PR 0.13 include focus-ring styles).
  - Screen-reader labels on every icon-only button (flag, question-map cell, media zoom controls).
  - `axe-core` runs in Playwright as part of this PR's e2e suite — the exam engine e2e must pass with zero serious/critical violations. This gate fails the PR if violations appear.

**Tests:** Playwright e2e running a full 30-item ICAS session; keyboard-only completion of the same session; axe-core passes.

### PR 1.12 — Frontend: Practice Screen

Implement `practice.html` — SkillEngine mode:

- Immediate feedback after each response.
- In-session summary modal on completion.
- Streak indicator (read-only from `engagement_streak` once ENG is added; for Phase 1, derive from session).

### PR 1.13 — Frontend: Results Screen

Implement `results.html` with mode-aware rendering:

- **Scored modes** (`exam`, `challenge`, NAPLAN/ICAS/Selective): hero score ring, topic breakdown, performance insights, recommended next action. Consumes `SubmitSessionResponse.score` + `SkillProgressDTO`.
- **Practice / Skill Drill modes**: no score ring; mastery delta per touched skill, session insight summary, recommended next action.
- **Diagnostic mode** (§3.2.4): renders a **Proficiency Map** variant instead of a score. The map shows, per skill in the diagnostic's scope: current proficiency estimate (0–1), confidence interval, and status band (`developing` | `proficient` | `advanced` | `insufficient_data`). No raw score, no topic-breakdown bars, no ranked correct/incorrect counts — diagnostics are about mapping, not performance. "What to do next" maps proficiency gaps to recommended practice.
- **Repair mode** (deferred to Phase 3 UI but stub the mode branch now): renders a repair completion summary — stages completed, mastery check score vs threshold, misconception status (resolved / unresolved).

DTO consumption:

- Scored → `SubmitSessionResponse` + `SkillProgressDTO[]`
- Diagnostic → `SubmitSessionResponse` (with `score = null`) + `ProficiencyMapDTO` (new in `packages/types` — add as part of this PR if not already present).

The mode branch is determined from `session_record.mode` returned in the submit response; no client guesswork.

**Tests:** Playwright e2e verifying each mode branch renders the correct variant; no scored components appear for diagnostic mode; proficiency bands colour-coded correctly.

### PR 1.14 — Frontend: Student Dashboard (Minimal)

Implement a minimal subset of `dashboard.html`:

- "Continue last" card (shows active/interrupted session).
- Mastery snapshot (from `/intelligence/learner-profile`).
- Recent sessions table.
- Start-an-assessment tiles.
- No weekly plan (comes in Phase 2).

### PR 1.15 — Load & Soak Test Suite

- k6 scripts simulating 500 concurrent sessions across 20 tenants.
- Run in CI nightly.
- Gate Phase 1 exit on latency p95 and zero cross-tenant reads.

**Tests:** SLA met; zero `rls.violation.count`.

---

## 5. Phase 2 — Full Intelligence + Analytics + Assignments (est. 23–28 working days)

**Goal:** Full async pipeline operational. Teacher and parent dashboards functional. Assignments deliver end-to-end.

**Exit criteria:**

- Async pipeline p95 < 30 s under 1,000 concurrent submissions.
- Dead-letter rate < 0.5% over a 7-day soak.
- Parent dashboard loads < 2 s p95.
- Teacher sees a 30-student class with auto-groups and intervention alerts within 5 min of student submissions.
- Teacher creates a targeted assignment; 5 students complete; tracking accurate.

### PR 2.1 — Job Worker Edge Function

- Polls `job_queue` with `FOR UPDATE SKIP LOCKED` ordered by priority/scheduled_at.
- Retry with exponential backoff per job-type config.
- Dead-letter handling; poison detection.
- Per-tenant concurrent-job throttle.
- Stuck-worker reaper (already in crons).

**Tests:** 500 jobs enqueued, all processed; failure injection drives retries; dead-letter flows trigger alerts.

### PR 2.2 — Causal Full Traversal (L3b Async)

- `pipeline.causal.evaluate_full` job.
- `traverse_upstream` and `traverse_downstream` from spec §5.1.3/§5.1.4.
- Store misconception confidence updates; emit `intelligence_audit_log`.

### PR 2.3 — Repair Queue (L4 Async)

- `pipeline.repair_queue` job.
- Advisory lock on `student_id` before evaluating; enforces max-3 active repairs.
- Respects partial unique indexes on `repair_record`.
- Emits `repair_record` with status `queued`.
- **Graceful degradation for pre-P3 state:** the RepairEngine itself is implemented in PR 3.1. Until then, `repair_record` rows are created but no student can enter the engine. Any student attempt to start a repair session (`POST /sessions/create` with `repair_sequence_id`) returns `503 SERVICE_UNAVAILABLE` with `details.reason = 'repair_engine_pending'` and a `notification` is written to the student ("Repair ready — we'll let you know when it's available"). The queue job never fails because the engine is missing; it logs an informational event and continues. When PR 3.1 lands, queued repairs become startable without backfill — the `queued` → `in_progress` transition is gated solely on the student starting the session.

**Tests:** concurrency test — two submissions trigger repair simultaneously; only one record created. Degradation test — student attempts to start repair pre-PR-3.1 and receives 503 with correct code.

### PR 2.4 — Predictive (L5)

- `pipeline.predictive_refresh` job.
- Exam readiness, forecast, mastery timeline per spec §12.
- Cached with 1 h TTL in `cohort_metric_cache` keyed on student + pathway.

### PR 2.5 — Stretch (L6)

- `pipeline.stretch_evaluate` job per spec §13.

### PR 2.6 — Teacher Intelligence (L7)

- `pipeline.teacher_refresh` job.
- Auto-group clustering (k-means on feature vectors per spec §14.1).
- Intervention alert generation per spec §14.2 trigger rules.

### PR 2.7 — Orchestration (L9) — Weekly Plan

- `pipeline.orchestration_replan` job with idempotency check: skip if `learning_plan.updated_at > job scheduled_at`.
- Priority queue per spec §16.2.
- Writes `learning_plan` (supersedes previous) + `plan_revision` + `intelligence_audit_log`.
- Respects `plan_override` entries.

**Tests:** plan regeneration is deterministic; override honoured; stale_since set on failure path.

### PR 2.8 — Exam Countdown Plan

- `/orchestration/exam-countdown` endpoint.
- Phase logic per spec §16.3.

### PR 2.9 — Intelligence Service Endpoints

- `/intelligence/learner-profile`, `/intelligence/causal-map`, `/intelligence/behaviour-profile`, `/intelligence/predictions`, `/intelligence/stretch`, `/intelligence/explain`, `/intelligence/audit-log`.
- All return DTOs with `stale_since` on degradation.

### PR 2.10 — Analytics Service

- `/analytics/cohort`, `/analytics/pathway-readiness`, `/analytics/auto-groups`, `/analytics/intervention-alerts`, `/analytics/generate-assignment`, `/analytics/misconception-prevalence`, `/analytics/reports/export`.
- Hourly `batch.cohort_analytics` job populates `cohort_metric_cache`.

### PR 2.11 — Assignments Service

- Full CRUD endpoints.
- `POST /assignments/{id}/publish` → creates `assignment_session` rows for all targets + notifications.
- `POST /assignments/{id}/start` → creates session_record with `assignment_id` populated; blueprint selection delegated to Content Service with assignment target skills.
- Overdue transition via daily cron.

**Tests:** teacher creates assignment → publish → student sees it → starts session → completion tracked.

### PR 2.12 — Notifications Service

**Depends on:** PR 2.1 (Job Worker). Notifications are emitted via the transactional outbox → outbox dispatcher (PR 0.10) writes `notification.create` jobs to `job_queue` → the worker from PR 2.1 processes them. If the worker is not running, notifications do not fire. This is not a bug — it is a deliberate consequence of the outbox pattern for at-least-once delivery. Do not work around it by writing notifications inline.

- `/notifications/me`, mark-read endpoints.
- Domain events emitted via outbox produce `notification` rows: `assignment_assigned`, `assignment_due_soon` (daily cron), `plan_updated`, `intervention_alert`.
- Bell UI component reading unread count.

### PR 2.13 — Plan Overrides

- `POST /orchestration/overrides`, `DELETE /orchestration/overrides/{id}`.
- Parent/teacher can pin a skill or dismiss a recommendation.
- Orchestration consumes `plan_override` on replan.

### PR 2.14 — Frontend: Parent Dashboard

Full `parent-dashboard.html`:

- Child switcher (reads `parent_student_link`).
- Readiness ring, subject areas, recent sessions.
- "What we noticed" / "What would help" cards composed from `ExplanationDTO` via a versioned copy-builder in `packages/core`.

### PR 2.15 — Frontend: Teacher Dashboard

Full `teacher-dashboard.html`:

- Class KPIs.
- Intervention alerts banner (drives from `/analytics/intervention-alerts`).
- Student performance table.
- Topic mastery bars.
- Assignments widget.

### PR 2.16 — Frontend: Teacher Student Detail

Full `teacher-student-detail.html`:

- Per-student drill-down.
- Strand performance, misconceptions, recent activity.
- Action buttons: assign, message (notification), view plan.

### PR 2.17 — Frontend: Assignment Engine (Teacher)

Full `assignment-engine.html`:

- Multi-step creation wizard.
- Auto-generation via `/analytics/generate-assignment`.
- Tracking view.
- Publish action.

### PR 2.18 — Frontend: Student Assignments

Full `student-assignments.html` with tabs Assigned / In-Progress / Completed, overdue markers.

### PR 2.19 — Frontend: Full Dashboard + Weekly Plan

Upgrade dashboard from Phase 1 with:

- Weekly Learning Plan widget (from `LearningPlanDTO`).
- Quick Insights (from Causal + Behaviour summary).
- Notifications bell with unread badge.

### PR 2.20 — OpenTelemetry + Sentry

- OTel SDK wired into every Edge Function; traces exported to chosen backend.
- Sentry integrated on frontend (unhandled errors + web vitals) and Edge Functions (5xx).
- Dashboards for latency, error rate, pipeline health.
- Alert routing to Slack/PagerDuty.

### PR 2.21 — Intelligence Audit Log Cold Storage

- Daily `audit.archive` job writes aged partitions to Supabase Storage as Parquet.
- Admin query tool (script, not UI) using DuckDB.

### PR 2.22 — Admin: Dead-Letter + Job Admin UI

- `/admin/jobs` page listing jobs by status.
- Retry button (one-click).
- Dead-letter list with poison markers.

### PR 2.23 — Skill Graph Migration Worker

Implements the `batch.skill_graph_migration` job defined in Spec §22.9.2 and Arch §2.3. This is the data-integrity bridge between draft-graph publish and all student-data tables; without it, publishing a new graph orphans records.

**Scope:**

- Worker consumes jobs with `job_type = 'batch.skill_graph_migration'`, payload `{from_graph_version, to_graph_version}`.
- Uses `skill_migration_map` rows to rewrite references in every consumer table listed in Spec §22.9.2:
  - `skill_mastery`, `learning_velocity` — rewrite `skill_id`; mark retired (NULL mapping) rows with `retired_at` metadata.
  - `student_misconception.evidence` jsonb — rewrite any embedded `skill_ids` arrays.
  - `repair_record.root_cause_skill_id` — rewrite; if NULL mapping, transition to `status='deferred'` with reason.
  - `learning_plan.sessions[].target_skill_ids` + `recommendation.target_skills` — rewrite via jsonb operations; set `stale_since = now()`.
  - `plan_override.target` — rewrite for `pin_skill` type; expire immediately if NULL mapping.
  - `assignment.target_skill_ids` — rewrite; auto-archive published assignments with unmapped skills and notify creators.
- **Resumability:** the job processes tables in chunks of 10,000 rows, committing each chunk in its own transaction. Progress is tracked in `job_queue.payload.progress = {table_name, last_processed_pk}`. On restart, resumes from last checkpoint — no duplicate writes.
- **Post-migration verification:** a final SELECT pass counts dangling references across every consumer table; any non-zero count fails the job.
- **Rollback:** on verification failure or explicit admin action, runs the inverse migration using the same `skill_migration_map` in reverse, and flips both `skill_graph_version` status values back. The archived version's 7-day retention window enforces this capability.

**Triggering:**

- `POST /skill-graphs/{id}/publish` succeeds only after atomically transitioning statuses AND enqueueing a `batch.skill_graph_migration` job.
- The publish endpoint blocks on the migration job if the student count is small (< 1,000 in the tenant); otherwise returns 202 and polls via `/admin/jobs/{id}`.
- Concurrent publishes are prevented by the `skill_graph_version` partial unique index on `status='published'`.

**Observability:**

- Dedicated metric `skill_graph.migration.duration_seconds` histogram.
- Structured logs at each table boundary.
- Admin `/admin/jobs` UI (from PR 2.22) surfaces progress.

**Tests:**

- Unit: each rewriter function for each consumer table.
- Integration: seed a tenant with realistic data (10k skill_mastery rows, 100 plans, 20 assignments); run migration; assert zero dangling references.
- Resumability: kill mid-migration; re-enqueue; assert idempotent completion.
- Rollback: inject a verification failure; assert complete reversal.

**Acceptance:** publishing a new graph with 50 skill additions + 10 retirements + 5 renames completes in < 2 minutes on the reference tenant; zero orphaned rows; tenant-isolation test still green.

---

## 6. Phase 3 — Repair Engine + Content Intelligence + Stretch (est. 16–20 working days)

**Goal:** The differentiator layer — misconceptions flow into repair sequences; content intelligence loop refines items.

**Exit criteria:**

- A student with a detected misconception is offered a repair; completes it; misconception resolves; downstream re-assessment unblocked.
- 7-day follow-up probe runs; recurrence flow works.
- L8 content loop auto-flags drifted items; admin can retire/recalibrate.
- Stretch offers appear for mastery ≥ 0.85 + high persistence.

### PR 3.1 — RepairEngine

- Spec §3.2.5 implementation.
- Stage types: `prerequisite_review`, `visual_explanation`, `guided_practice`, `independent_practice`, `mastery_check`.
- Micro-adjustment on consecutive correct/incorrect and cognitive load (spec §11.3).

### PR 3.2 — Repair Sequence Authoring (Seed + Admin)

- Seed 20 high-value repair sequences (fraction-addition add-denominators, place-value, etc.).
- Admin UI for creating/editing repair sequences (low-fidelity, functional only).

### PR 3.3 — Frontend: Repair Session UI

- Repair variant of `exam_engine.html` with stage sidebar.
- Worked-solution panel for visual explanation stages.
- Hint reveal in guided practice.

### PR 3.4 — Follow-Up Assessment Scheduler

- `scheduled.follow_up_assessment` cron job.
- At `follow_up_assessment_at`, probes the skill; sets `follow_up_result`; on regression, creates a new repair_record with `critical` priority.

### PR 3.5 — Real-Time Adaptation Hooks

- SkillEngine and RepairEngine consult `behaviour_profile.avg_cognitive_load_comfort` and in-session rolling load to adjust difficulty per spec §9.5.

### PR 3.6 — L6 Stretch Full

- Wire `pipeline.stretch_evaluate` to surface stretch opportunities in dashboard + plan.
- Stretch session runs via SkillEngine with difficulty + 0.15.

### PR 3.7 — L8 Content Intelligence Loop

- Hourly `batch.content_recalibration` job.
- `recalibrate_difficulty` + `update_discrimination` per spec §15.1/15.2.
- Lifecycle transitions (`active` → `monitored` → `retired`).
- `flag_for_review` writes to an admin queue.

### PR 3.8 — Admin: Content Intelligence Dashboard

Full `admin-intelligence.html`:

- Per-item detail panel.
- Distractor misconception mapping.
- Drift and discrimination flags.
- Recalibrate / retire actions (audited in `admin_action_log`).

### PR 3.9 — Cross-Pathway Intelligence

- Spec §17 convergence and transfer logic wired into Predictive and Plan generation.

---

## 7. Phase 4 — Billing + SaaS + Long-Term Plans (est. 14–18 working days)

**Goal:** Paid tiers active end-to-end via Stripe. Premium and Institutional features gated correctly.

**Exit criteria:**

- Upgrade Free → Premium via Stripe; feature flags propagate within 30 s; Premium features visible.
- Cancellation preserves access until period end.
- Stripe webhook replay safe: 50 duplicate events processed idempotently.
- Long-term plan generation works for a 12-week target.
- Institutional tenant can bulk-invite 100 students.

### PR 4.1 — Stripe Integration

- Stripe accounts and products configured for AU GST.
- Webhook Edge Function `/billing/webhook/stripe` verifying signature, writing to `billing_event` atomically, processing via `pipeline.billing_event_apply` job.
- Events handled: `checkout.session.completed`, `customer.subscription.created/updated/deleted`, `invoice.paid/payment_failed`.

### PR 4.2 — Billing Endpoints

- `/billing/plans`, `/billing/checkout`, `/billing/portal`, `/billing/subscription`, `/billing/subscription/cancel`, `/billing/invoices`.
- Idempotency on checkout.

### PR 4.3 — Subscription → Feature Flag Propagation

- On `subscription` write (from webhook processor), UPSERT `feature_flag` rows for the tenant per the feature registry in spec §20.3.1.
- Audit in `admin_action_log` with actor `system`.

**Tests:** upgrade test — within 30 s of webhook receipt, `feature_flag` reflects new tier.

### PR 4.4 — Frontend: Billing

Full `billing.html` — pricing, plan comparison, subscription management, invoice history, payment method (Stripe Elements).

### PR 4.5 — Long-Term Plan Generation

- `POST /orchestration/long-term-plan`.
- Phase allocation per spec §16.5.
- Milestone tracking: weekly mastery comparison with compression/extension logic.

### PR 4.6 — Pathway Switching

- `POST /orchestration/pathway-switch`.
- Coverage analysis; diagnostic / blended / integrate routing per spec §16.4.

### PR 4.7 — Institutional Features

- Bulk CSV user invite (org_admin).
- Custom tenant branding stored in `tenant.config` (logo URL, brand colours); applied via theme provider when present.
- SAML SSO scaffolding via Supabase Auth (admin-configurable).
- Institutional onboarding runbook.

### PR 4.8 — Dunning / Failed Payment Flow

- Stripe sends `invoice.payment_failed` → `billing_event` → job writes a `notification` to tenant admins and schedules tier downgrade after grace period.

### PR 4.9 — Data Subject Rights

- `/privacy/export-data`, `/privacy/delete-account`.
- Batch jobs `batch.privacy_export`, `batch.privacy_delete` with 7-day grace.
- Runbook for manual compliance requests.

---

## 8. Phase 5 — Scale, Polish, Engagement (est. 12–16 working days)

**Goal:** 10k concurrent, WCAG 2.1 AA, mobile polish, engagement layer live, launch-ready.

**Exit criteria:**

- 10k concurrent sessions sustained for 30 min with < 1% 5xx and SLAs green.
- WCAG 2.1 AA audit passes with no serious/critical issues.
- Engagement streaks and achievements work end-to-end.
- All playbooks executed in dry-run.

### PR 5.1 — Load Testing at Scale

- k6 scenario: 10k concurrent virtual users across 200 tenants.
- DB read replicas provisioned for Analytics Service queries; routing wired.
- Connection pool tuning verified.

### PR 5.2 — Partition Rotation Automation

- `pg_partman` creates next month's partitions automatically.
- Old partitions detached and dumped to storage on schedule.

### PR 5.3 — Engagement Service

- `/engagement/summary`, `/engagement/achievements`, `/engagement/nudges`.
- Daily `engagement.streaks` cron updates `engagement_streak`.
- `engagement.achievement_evaluate` job runs post-session; writes `student_achievement` + `notification`.
- Seed ~20 achievement definitions across bronze/silver/gold/platinum tiers.

### PR 5.4 — Frontend: Engagement

Full `engagement.html` — streak ring, weekly goals, achievements, nudges.

### PR 5.5 — Accessibility Audit (not Retrofit)

Because `axe-core` has been in CI since PR 0.13 and the exam engine shipped keyboard-accessible in PR 1.11, this PR is a **final audit** of completed flows — not a bulk remediation.

- `axe-core` full-flow runs in Playwright covering every role's primary journeys end-to-end (not just component stories).
- Manual keyboard-only navigation audit of every screen.
- Screen-reader audit on key screens (dashboard, exam, results, parent dashboard, teacher dashboard).
- Colour-contrast verification on dynamic states (stale badges, error states, disabled controls).
- WCAG 2.1 AA conformance report issued.

Any violations found here are treated as regressions and fixed in the originating screen's PR, not layered as patches.

### PR 5.6 — Mobile Polish

- Responsive breakpoints audit.
- Touch targets ≥ 44 px.
- Exam engine works end-to-end on iPhone 12 / Pixel 5.

### PR 5.7 — Operational Playbooks

Add to `/docs/RUNBOOKS/`:

- `dead-letter-recovery.md`.
- `tenant-data-export.md`, `tenant-data-delete.md`.
- `incident-response.md`.
- `schema-graph-version-publish.md`.
- `content-import.md`.
- `stripe-failed-webhook.md`.
- `pipeline-stuck-investigation.md`.

### PR 5.8 — Security Audit

- External penetration test.
- OWASP Top 10 checklist signed off.
- Secrets rotation procedure documented and tested.

### PR 5.9 — Launch Readiness Review

- All SLAs green for 7 consecutive days.
- Backups verified (restore drill).
- On-call rotation configured.
- Status page live.

---

## 9. Cross-Cutting Standards (Apply Every PR)

### 9.1 Definition of Done (Universal)

Every PR must have:

1. Tests: unit + (if API) contract + (if table) tenant isolation.
2. Migration up/down verified.
3. Typecheck + lint passing.
4. Storybook stories updated (UI PRs).
5. Documentation updated (`OWNERS.md` if ownership changes, `RUNBOOKS/` if operational).
6. No TODO/FIXME without an accompanying GitHub issue.
7. No increase in log sensitivity (no new PII in logs).
8. Rate limit considered for any new endpoint.
9. Feature-flag-gated if scope-dependent on tier.

### 9.2 Code Review Checklist

- RLS policies present for new tables?
- Mutability class assigned in `OWNERS.md`?
- Idempotency-Key honoured on new POSTs?
- Optimistic locking respected for `session_record` and `learning_plan`?
- Error envelope used for all error returns?
- Trace ID propagated?
- Metrics emitted for latency / error rate?

### 9.3 Monitoring per PR

Every feature PR adds (at minimum):

- One latency histogram metric for the primary endpoint.
- One error-rate counter.
- A relevant dashboard panel.

### 9.4 Rollback Plan

- Every migration has a reversible down migration.
- Every feature is behind a `feature_flag` when released; flag defaults off in production until 24 h soak passes.
- Deployment rollback via Vercel revert; DB rollback via down migration + replay.

### 9.5 Performance Budgets

| Metric                        | Budget   |
| ----------------------------- | -------- |
| Item delivery latency p95     | ≤ 200 ms |
| Session create p95            | ≤ 1 s    |
| Session respond p95           | ≤ 300 ms |
| Session submit p95            | ≤ 5 s    |
| Pipeline sync portion p95     | ≤ 3 s    |
| Pipeline async portion p95    | ≤ 30 s   |
| Dashboard load p95            | ≤ 2 s    |
| Orchestration replan p95      | ≤ 15 s   |
| Content recalibration (batch) | ≤ 300 s  |

Any PR that regresses a budget by > 10 % fails review.

### 9.6 Security Checklist (Every PR Touching Auth/Data)

- RLS policies tested with two tenants.
- No secrets committed (pre-commit hook enforces).
- No raw SQL string concatenation; parameterised queries only.
- JWT verification on every Edge Function entry point.
- Stripe webhook signature verified before any state change.
- Rate limit on any endpoint that can be abused.

---

## 10. OWNERS.md (Scaffold)

This file is created in PR 0.1 and updated every time ownership changes. Format:

```
## Service: <service-name>
Path: supabase/functions/<service-name>
Lead: <github-handle>

### Tables (WRITE)
- <table-name> — mutability: <class>
- ...

### Tables (READ)
- <table-name>
- ...

### Endpoints Owned
- <METHOD> <path>
- ...
```

Any PR that changes writer ownership must update this file, or CI blocks merge.

---

## 11. Dependency Graph (Phase Ordering)

```
Phase 0 Foundations
  └─ Phase 1 Core Assessment Flow
       └─ Phase 2 Full Intelligence + Analytics + Assignments
            ├─ Phase 3 Repair + Content Intelligence + Stretch
            │    └─ Phase 4 Billing + SaaS + Long-Term
            │         └─ Phase 5 Scale + Polish + Engagement
            └─ (Phase 3 can overlap with Phase 4 up to PR 4.1 if team size permits)
```

Within a phase, the PR order is strict. The only safe parallelism inside a phase:

- Phase 0: 0.13 (UI) can run in parallel with 0.2–0.8 (migrations).
- Phase 1: 1.1–1.5 (engines) can run in parallel with 1.6 (content service).
- Phase 2: 2.14–2.19 (frontend) can run in parallel with 2.20–2.22 (ops).
- Phase 3: 3.7–3.8 (content loop) parallel with 3.1–3.6 (repair).

---

## 12. Total Estimate & Staffing Assumption

Single senior engineer full-time (or one Claude Sonnet 4.6 agent under supervision):

| Phase                                    | Duration (working days) |
| ---------------------------------------- | ----------------------- |
| 0 Foundations                            | 12–14                   |
| 1 Core Assessment                        | 18–22                   |
| 2 Intelligence + Analytics + Assignments | 23–28                   |
| 3 Repair + Content Loop + Stretch        | 16–20                   |
| 4 Billing + SaaS                         | 14–18                   |
| 5 Scale + Polish                         | 12–16                   |
| **Total**                                | **94–116 working days** |

With a two-engineer team able to parallelise per §11, total can compress to **70–85 working days**.

Buffer: add 15 % for content authoring (repair sequences, item library expansion) that runs in parallel with engineering from Phase 3 onward.

---

## 13. Launch Gate — Go/No-Go Checklist

Before flipping the first paying customer live:

1. All Phase 5 exit criteria met.
2. Load test at 10k concurrent green for 30 min.
3. `pipeline.dead_letter.count` = 0 for 7 days.
4. Backup + restore drill completed in staging within the last 14 days.
5. On-call rotation staffed for 24/7 coverage.
6. Support channel (email + in-app) active.
7. Status page published.
8. Incident response playbook dry-run executed once.
9. Data subject rights flow (export + delete) tested end-to-end with seed tenant.
10. Stripe taxes and invoicing verified with a real AUD transaction (test mode → live mode cutover).
11. External security audit signed off (no high/critical unresolved).
12. Content authoring signed off: ≥ 300 items with quality review, ≥ 20 repair sequences, ≥ 50 misconceptions catalogued.

Missing any one = no launch.

---

## 14. Project Management & Daily Execution Protocol

##### 14.1 Daily Progress Tracking

Every working day must produce a dated entry in `DAILY_LOG.md` at the repo root. The log tracks exactly what was prompted, what was built, and how it maps to the PR acceptance criteria.

**Required Fields per Entry:**
| Field | Purpose |
|-------|---------|
| `Date` | ISO-8601 (`2026-04-17`) |
| `Phase / PR` | e.g., `Phase 0 / PR 0.1` |
| `Prompt ID` | Unique hash or short title (`p01-monorepo-init`) |
| `Goal / Acceptance` | Copy-pasted from this plan |
| `Result / Output` | Summary of generated files, CI status, any deviations |
| `Blockers / Fixes` | What failed, how it was resolved |
| `Git Commit` | Short SHA or branch name |
| `Time` | Hours spent on this PR |

**Rule:** Do not advance to PR N+1 until the log entry for PR N shows `Acceptance: ✅ PASSED` and CI is green.

##### 14.2 Prompt & Results Strategy

Claude Code is deterministic only when prompts follow the **C-C-D-V** pattern:

1. **Context**: State the exact PR, acceptance criteria, and architectural constraint being targeted.
2. **Constraints**: List forbidden patterns, version locks, and file paths.
3. **Deliverables**: Exact files to create/modify, commands to run, tests to pass.
4. **Verification**: Step-by-step commands the agent must run to prove success before committing.

**Prompt Storage Convention:**

- Save every executed prompt in `/docs/prompts/` as `YYYY-MM-DD_PR-ID.md`.
- Attach the console output or error logs in `/docs/prompts/logs/`.
- This creates a reproducible audit trail and enables rapid debugging if a later PR breaks a dependency.

##### 14.3 Git Workflow & Repo Management

| Rule                  | Enforcement                                                                        |
| --------------------- | ---------------------------------------------------------------------------------- |
| **Branch per PR**     | `feat/pr-0.1-monorepo`, `feat/pr-0.11-types`, etc.                                 |
| **Commit Convention** | `type(scope): description` (`feat`, `chore`, `test`, `fix`, `docs`)                |
| **PR Size Limit**     | Max 30 files, 1 logical scope. No mixing migrations + UI + CI.                     |
| **Pre-merge Gate**    | CI must pass: `lint`, `typecheck`, `test`, `db:migrate-dryrun`, `axe-core`         |
| **Push Strategy**     | Commit early, push only after `pnpm turbo build && pnpm turbo test` passes locally |
| **Merge Policy**      | Squash merge. PR description must include `Acceptance Checklist` + `CI Screenshot` |

##### 14.4 Tracking Dashboard

Maintain a live status table in `README.md` (top) or `/docs/STATUS.md`. Example:

```markdown
| PR  | Phase | Title                  | Status         | Branch      | CI  | Owner | Completed  |
| --- | ----- | ---------------------- | -------------- | ----------- | --- | ----- | ---------- |
| 0.1 | 0     | Monorepo & Tooling     | 🟢 Done        | feat/pr-0.1 | ✅  | @you  | 2026-04-17 |
| 0.2 | 0     | Enums + Tenancy + Auth | 🟡 In Progress | feat/pr-0.2 | ⏳  | @you  | -          |
| ... | ...   | ...                    | ...            | ...         | ... | ...   | ...        |
```

---

### 📄 Create `/DAILY_LOG.md` (Template)

```markdown
# MindMosaic — Daily Execution Log

## Format

| Date | Phase / PR | Prompt ID | Goal / Acceptance | Result / Output | Blockers / Fixes | Git Commit | Time |
| ---- | ---------- | --------- | ----------------- | --------------- | ---------------- | ---------- | ---- |

## Entries

### 2026-04-17

| Phase 0 / PR 0.1 | `p01-monorepo-init` | Init Turborepo, pnpm, TSConfig, ESLint, CI stub, `BUILD_CONTRACT.md`, `OWNERS.md` | Created `apps/web`, `packages/{types,sdk,ui,core,engines,engines-client}`, `turbo.json`, `pnpm-workspace.yaml`, `.github/workflows/ci.yml`. `pnpm turbo build` passes. CI matrix green. | Husky pre-commit failed on `.env` lint. Fixed by adding `.env` to `.gitignore` and updating lint-staged scope. | `a1b2c3d` | 2.5h |
| ---------------- | ------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------- | ---- |

<!-- Add new entries daily. Do not delete history. -->
```

---

### 📄 Create `/GIT_WORKFLOW.md`

````markdown
# MindMosaic — Git & Workflow Rules

## 1. Branch Strategy

- `main` → always deployable. Protected. Require CI + 1 review.
- `feat/pr-<N>-<short-name>` → one PR per work item.
- `fix/<scope>` → hotfixes for broken CI/migrations.
- `docs/<scope>` → spec, plan, or runbook updates.

## 2. Commit Convention

Format: `type(scope): subject`

- `feat`: new functionality (PR deliverables)
- `chore`: tooling, CI, config, deps
- `test`: RLS, pipeline, unit, e2e
- `fix`: bug or CI break
- `docs`: spec, plan, README, prompts

Example: `chore(monorepo): add turbo pipelines & base tsconfig`

## 3. Pre-Push Checklist

Before `git push`, run:

```bash
pnpm install
pnpm turbo typecheck lint test db:migrate-dryrun --filter=...
git status --porcelain | grep -v "node_modules\|.next\|dist"
```
````

If any step fails → fix locally → do NOT push.

## 4. PR Template (copy-paste into GitHub)

````markdown
## Scope

PR <N> — <Title> (Dev Plan §<X>)

## Deliverables

- [ ] Migrations up/down apply cleanly
- [ ] Tenant isolation test passes
- [ ] Zero TS/ESLint errors
- [ ] Acceptance criteria met (copy from plan)

## Verification

```bash
# Commands run to verify:
pnpm turbo build && pnpm turbo test
supabase db reset && pnpm test:rls
```
````

## Notes / Blockers

<any deviations from plan, known limitations, or follow-up items>

```

## 5. Merge & Rollback
- Squash merge only.
- On merge failure: revert commit, open new branch, re-run CI.
- DB migration rollback: `supabase migration down` + replay `db:test`.
```

---

### 🔁 How to Use This with Claude Code in VS Code

1. **Initialize Tracking:**
   ```bash
   mkdir -p docs/prompts/logs
   cp DAILY_LOG.md GIT_WORKFLOW.md .
   ```
2. **Daily Routine:**
   - Open `DAILY_LOG.md`, add today's header.
   - Run the day's PR prompt in Claude Code.
   - Claude executes → you verify → you log the result + commit SHA.
   - Save prompt to `docs/prompts/`.
   - Push branch → open PR → wait for CI.
3. **AI Agent Guardrail:**
   Tell Claude at the start of each session:
   > "You are executing PR <N>. Follow C-C-D-V prompt strategy. Output a summary matching the Daily Log format. Do not commit until CI passes locally."

This turns your spec into a **living, auditable build system**. Every line of code, every prompt, every CI gate is traceable. If you want, I can generate the exact PR 0.1 prompt formatted with this tracking structure ready to paste into VS Code.

---

_End of Development Plan v1.0._
