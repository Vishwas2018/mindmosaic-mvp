# MindMosaic — Git & Workflow Rules

## 1. Branch Strategy
- `main` → always deployable. Protected. Require CI + 1 review (self).
- `feat/pr-<N>-<short-name>` → one PR per work item.
- `fix/<scope>` → hotfixes for broken CI/migrations.
- `docs/<scope>` → spec, plan, or runbook updates.

## 2. Commit Convention
Format: `type(scope): subject`
- `feat`: new functionality
- `chore`: tooling, CI, config
- `test`: RLS, pipeline, unit, e2e
- `fix`: bug or CI break
- `docs`: spec, plan, README
Example: `chore(monorepo): add turbo pipelines & base tsconfig`

## 3. Pre-Push Checklist
Before `git push`, run:
```bash
pnpm install
pnpm turbo typecheck lint test db:test
supabase db reset && pnpm test:rls