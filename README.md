# MindMosaic

A learning platform where parents track their children's exam preparation
across NAPLAN Y3/Y5 and ICAS Y3/Y5.

## Prerequisites

- Node.js 20+
- pnpm 10+
- Supabase CLI (`brew install supabase/tap/supabase` or equivalent)
- Docker (for local Supabase)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start local Supabase
supabase start

# Apply migrations and seed
supabase db reset

# Run the web app
pnpm -C apps/web dev
```

Visit http://localhost:3000

## Repo Layout

```
apps/web/              Next.js 14 App Router
supabase/              Migrations, Edge Functions, RLS tests
docs/
├── spec/              Read-only: product spec, backend arch, dev plan
├── mockups/           Read-only: HTML UI mockups (open with Live Preview)
├── governance/        Read-only: Build Contract, Owners, Git Workflow
└── runtime/           Living: DEV_PLAN, DAILY_LOG, STATUS, backlog
scripts/               Validation and test helpers
k6/                    Load test scripts
```

## Working With Claude Code

1. Open `mindmosaic.code-workspace` in VS Code (multi-root workspace).
2. For each PR, open the relevant mockup HTML via "Live Preview" alongside your code.
3. Paste the PR prompt from the execution plan into the Claude Code chat panel.
4. Update `docs/runtime/DAILY_LOG.md`, `DEV_PLAN.md`, `STATUS.md` after every merge.

## PR Order

See `docs/runtime/DEV_PLAN.md` for the full 11-PR execution path. Do not advance
to PR N+1 until PR N's acceptance criteria are green and CI passes.
