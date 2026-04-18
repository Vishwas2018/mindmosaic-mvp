# MindMosaic

A learning platform where parents track their children's exam preparation
across NAPLAN Y3/Y5 and ICAS Y3/Y5.

## Prerequisites

- Node.js 20+
- pnpm 10+
- Supabase CLI (`winget install Supabase.CLI` or `brew install supabase/tap/supabase`)
- A Supabase cloud project (no Docker required)

## Getting Started

```bash
# Install dependencies
pnpm install

# Link your Supabase cloud project (first time only)
supabase link --project-ref <your-project-ref>

# Push migrations to cloud
pnpm db:push

# Run the web app
pnpm dev
```

Copy `.env.example` → `.env.local` and fill in your Supabase project URL and keys
(Settings → API in the Supabase dashboard).

Visit http://localhost:3000

## Database Workflow

```bash
# Create a new migration
supabase migration new <name>

# Push migrations to cloud
pnpm db:push

# Run RLS tests against cloud (requires DATABASE_URL in .env.local)
pnpm test:rls
```

`DATABASE_URL` is the direct Postgres connection string from the Supabase dashboard:
Settings → Database → Connection string → URI (use the pooler URL for transactions).

## Repo Layout

```
apps/web/              Next.js 14 App Router
supabase/
├── migrations/        SQL migration files (applied via supabase db push)
├── functions/         Edge Functions
└── tests/rls/         pg-tap RLS isolation tests
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
