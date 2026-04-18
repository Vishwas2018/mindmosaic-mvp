# MindMosaic — Build Contract v1.1 (Solo-Optimized)
> This document is the persistent authority on engineering rules. All PRs must comply. Deviations require explicit justification in the PR description and a linked tracking issue.

## 1. Core Principles
- **Configuration over code**: New pathways/exams are added via `framework_config`, `assessment_profile`, and `blueprint` rows, not engine refactors.
- **Engine–Framework separation**: Engines implement `AssessmentEngine`; routing/scoring rules are injected via config.
- **Skill-graph-first**: All analytics, recommendations, and intelligence anchor to the unified skill taxonomy.
- **Evidence-based intelligence**: No hallucination. Every insight traces to `learning_event` + `intelligence_audit_log`.
- **Privacy by design**: RLS on all tenant-scoped tables. PII never appears in logs or metrics.
- **Vertical slices > horizontal layers**: Build end-to-end features (Auth → Session → Score → Parent View → Billing) before hardening infra.
- **Intelligence is layered**: L1/L2/L3a run sync (<3s). L3b–L9 are deferred until v2 triggers are met.

## 2. Naming & Type Contracts
- **Database**: `snake_case` for tables, columns, enums, policies. `timestamptz` with `DEFAULT now()`. UUIDs via `gen_random_uuid()`.
- **TypeScript**: Strict mode enabled. Zero `any` allowed.
- **DTOs**: Defined in `packages/types` with Zod schemas. `SCHEMA_VERSION` constant bumps on breaking changes. Client sends `X-Client-Version`; server logs mismatches.
- **Branded IDs**: Use `TenantId`, `UserId`, `SessionId`, etc. from `@mm/types`.

## 3. API & Error Conventions
- **Versioning**: Path-based (`/api/v1/...`). Breaking change → new path.
- **Error Envelope**: All errors return `{ error: { code, message, status, details?, trace_id } }` per Arch §1.5.
- **Idempotency**: All `POST`/`PATCH`/`DELETE` accept `Idempotency-Key: <uuid>`. Flow enforced via `api_idempotency_key` table (§7.3). Duplicate in-flight → `409`; mismatched body → `422`.
- **Rate Limiting**: Table-backed (`rate_limit_bucket`). Atomic `INSERT ... ON CONFLICT DO UPDATE`. No in-memory counters.

## 4. Security & Data Integrity
- **RLS**: Mandatory on all tenant-scoped tables. Use `auth_tenant_id()`, `auth_user_id()`, `auth_role()`. CI runs tenant-isolation tests on every PR.
- **Stripe Webhooks**: Signature verified within 300ms before state change. Invalid → `400` + `billing_event` log.
- **PII Redaction**: Logging middleware strips `response_data`, `stem`, `payload.answers`, raw webhook bodies. Only `student_id`/`tenant_id` logged for correlation.
- **Admin Action Audit**: Every `org_admin`/`platform_admin` write to mutable config/subscription tables logs to `admin_action_log`.

## 5. Observability & Tracing
- **Trace ID**: Read/generate `X-Trace-Id` at edge. Propagate to DB (`set_config('app.trace_id', ...)`), jobs, and external APIs.
- **Structured Logs**: JSON format with mandatory fields: `timestamp`, `level`, `service`, `trace_id`, `tenant_id`, `user_id`, `endpoint`, `status_code`, `duration_ms`, `error_code`.
- **Metrics**: Supabase logs + Vercel error tracking for v1. Add OpenTelemetry/Sentry at 1k MAU.
- **Sentry**: Frontend (unhandled errors + Web Vitals) + Edge Functions (5xx) deferred until Phase 3.

## 6. Database & Pipeline Rules (Solo v1)
- **Mutability Classes** (§1.3):
  - `Immutable`: `learning_event`, `session_response`, `item_version`. Never `UPDATE`/`DELETE`.
  - `Append-only`: `intelligence_audit_log`, `plan_revision`, `admin_action_log`. Only `INSERT`.
  - `Controlled mutable`: `session_record`, `learning_plan`. Specific columns only, via owning service.
  - `Mutable`: `skill_mastery`, `behaviour_profile`, `feature_flag`, `subscription`. Standard `UPDATE` by owner.
- **Pipeline SLAs**: Sync (L1–L3a) < 3s. Async (L3b–L9) deferred until v2.
- **Outbox Pattern**: Direct `INSERT` + hourly `pg_cron` for v1. Replace with transactional outbox when job ordering/idempotency becomes critical.
- **Partitioning**: Deferred. Standard tables with `created_at` indexes until >5M rows.
- **Skill Graph**: Draft → Publish flow. Published graphs immutable. Migration job (`batch.skill_graph_migration`) handles consumer references.

## 7. Frontend & UX Rules
- **Stack**: Next.js 14 App Router, React Query, Tailwind + CSS tokens (`packages/ui/tokens.css`).
- **Role Routing**: Layouts `(student)`, `(parent)`, `(admin)`. Middleware + route guards enforce role separation.
- **Widget States**: Every data component renders `Loading` (skeleton), `Empty` (descriptive), `Error` (message + retry / 402 upgrade prompt).
- **Accessibility**: Keyboard navigation, `aria-live` for timers/feedback, focus management on question transitions. Zero serious/critical `axe-core` violations on exam screen.
- **Session Rules**: Client timer decorative. Server authoritative. Autosave fire-and-forget. Offline queue with idempotent replay.

## 8. Testing & CI Gates
- **Required per PR**:
  - ✅ Migrations `up`/`down` apply cleanly
  - ✅ Tenant isolation test passes (2 tenants, 0 cross-reads)
  - ✅ Zero TS/ESLint errors
  - ✅ Contract tests match Zod schemas
  - ✅ `DAILY_LOG.md` & `STATUS.md` updated
- **Performance Budgets**: Regression > 10% fails review.
- **Rollback**: Every migration reversible. Features behind `feature_flag` (default `off` in prod until 24h soak).

## 9. Solo Execution Rules
1. **One PR = One Vertical Slice**. Never merge infrastructure without consumer UI.
2. **AI Guardrails**: Always use C-C-D-V prompts. Pin spec/arch section numbers. Never skip RLS or typecheck.
3. **Commit Discipline**: Squash merge to `main`. `main` is always deployable.
4. **Daily Tracking**: Log every prompt, commit, and CI result in `DAILY_LOG.md`.
5. **No TODO/FIXME without linked issue**. If it's not tracked, it doesn't exist.

## 10. Definition of Done (Universal)
A PR is merge-ready ONLY when:
1. All tests pass locally & in CI.
2. `supabase db reset && pnpm test:rls` green.
3. `pnpm turbo build && pnpm turbo typecheck lint test` clean.
4. Rate limit, feature flag, and idempotency considered for new endpoints.
5. `OWNERS.md` & `STATUS.md` updated.