# MindMosaic — Solo Development Plan (Living)

> Source of truth: `docs/spec/mindmosaic-dev-plan-v1_1.md`. Mark each PR ✅ as it completes.

## Status Summary
- Phase: 0 (foundations complete)
- Current PR: 1 ✅ (awaiting CLI install for full CI green)
- Last update: 2026-04-18

## Phase 0 — Foundations

| PR | Title | Status | Notes |
|----|-------|--------|-------|
| 0 | Pre-dev audit | ✅ | AUDIT_REPORT.md written, P0 blockers identified |
| 1 | Repo, Supabase, CI | ✅ | Next.js 14, config.toml, ci.yml — pending: `supabase CLI` install for db-tests |

## Phase 1 — Core Infrastructure

| PR | Title | Status | Mockup dependency |
|----|-------|--------|-------------------|
| 2 | Auth, Tenancy, RLS | ⬜ | 01-authentication.html |
| 3 | Content Schema + Seed | ⬜ | — |
| 4 | Design Tokens + Child Management | ⬜ | 00-design-system.html ⚠️ stub |
| 5 | Stripe Billing | ⬜ | 04-billing.html |

## Phase 2 — Session Engine

| PR | Title | Status | Mockup dependency |
|----|-------|--------|-------------------|
| 6 | Session Schema + Create | ⬜ | 05-student-home.html |
| 7 | Respond / Submit / Scoring | ⬜ | — |
| 8 | Exam UI | ⬜ | 07-exam-engine.html ← PRIMARY |
| 9 | Results Page | ⬜ | 09-results.html ← PRIMARY |

## Phase 3 — Dashboards + Launch

| PR | Title | Status | Mockup dependency |
|----|-------|--------|-------------------|
| 10 | Dashboards | ⬜ | 02, 03, 05-dashboard mockups |
| 11 | Launch Prep | ⬜ | — |

## Architecture Decision: Supabase Cloud (no Docker)

Recorded 2026-04-18. Using Supabase Cloud for all environments — no local Docker stack.
- Migrations deployed via `supabase db push` (requires CLI, no Docker)
- RLS tests run via `pnpm test:rls` (`supabase test db --db-url $DATABASE_URL`)
- CI contains only `lint-typecheck-build` job (no Docker in CI)
- `DATABASE_URL` = direct Postgres connection string from Supabase dashboard

## Remaining Blockers

- `supabase CLI` not installed → `winget install Supabase.CLI` (no Docker needed)
- `supabase link --project-ref hodwyzmpmavvgvvgmpbw` → run once after CLI install
- `00-design-system.html` is a 477-byte stub → must be populated before PR 4
- Governance files renamed ✅ (was `.md.md` double extension)
- `.env.example` real keys replaced with placeholders ✅
