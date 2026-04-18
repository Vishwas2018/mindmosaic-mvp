# MindMosaic — Pre-Development Audit Report
Date: 2026-04-18
Auditor: Claude Sonnet 4.6 (automated)
Status: **BLOCKERS EXIST — Not ready to start PR 1**

---

## 1. Workspace Structure

```
Root: mindmosaic-mvp/mindmosaic/
Key layout:
  apps/web/             → .gitkeep only (no scaffold)
  docs/governance/      → present (but filenames have double .md.md extension)
  docs/mockups/         → 18/19 canonical files present
  docs/runtime/         → all runtime docs present
  docs/spec/            → all 3 spec docs present
  supabase/             → directory present, config.toml MISSING
  .github/workflows/    → .gitkeep only (no ci.yml)
  .vscode/              → present with settings and extensions
  pnpm-workspace.yaml   → present
```

### Directory Existence
| Directory | Status |
|-----------|--------|
| `docs/` | ✅ |
| `docs/spec/` | ✅ |
| `docs/mockups/` | ✅ |
| `docs/governance/` | ✅ |
| `docs/runtime/` | ✅ |
| `apps/` | ✅ |
| `supabase/` | ✅ |
| `.github/workflows/` | ✅ |
| `.vscode/` | ✅ |

---

## 2. Spec & Governance Files

### Spec Files
| File | Status | Size |
|------|--------|------|
| `docs/spec/mindmosaic-spec-v4_4.md` | ✅ | 234 KB |
| `docs/spec/mindmosaic-backend-arch-v2_0.md` | ✅ | 106 KB |
| `docs/spec/mindmosaic-dev-plan-v1_1.md` | ✅ | 53 KB |

### Governance Files
| File | Status | Notes |
|------|--------|-------|
| `docs/governance/BUILD_CONTRACT.md` | ❌ MISSING | Exists as `BUILD_CONTRACT.md.md` (double extension) |
| `docs/governance/OWNERS.md` | ❌ MISSING | Exists as `OWNERS.md.md` (double extension) |
| `docs/governance/GIT_WORKFLOW.md` | ❌ MISSING | Exists as `GIT_WORKFLOW.md.md` (double extension) |

> **Fix:** Rename all three files: `mv BUILD_CONTRACT.md.md BUILD_CONTRACT.md`, etc.

### Runtime Files
| File | Status | Notes |
|------|--------|-------|
| `docs/runtime/DEV_PLAN.md` | ⚠️ | 289 bytes — placeholder only, not populated |
| `docs/runtime/DAILY_LOG.md` | ✅ | 457 bytes |
| `docs/runtime/STATUS.md` | ✅ | 753 bytes |
| `docs/runtime/POST_LAUNCH_BACKLOG.md` | ✅ | 186 bytes |

---

## 3. Mockup Files

| File | Status | Size |
|------|--------|------|
| `docs/mockups/index.html` | ❌ MISSING | — |
| `docs/mockups/00-design-system.html` | ⚠️ STUB | 477 bytes |
| `docs/mockups/01-authentication.html` | ✅ | 145 KB |
| `docs/mockups/02-dashboard.html` | ✅ | 45 KB |
| `docs/mockups/03-parent-dashboard.html` | ✅ | 19 KB |
| `docs/mockups/04-billing.html` | ✅ | 28 KB |
| `docs/mockups/05-student-home.html` | ✅ | 18 KB |
| `docs/mockups/06-learning-hub.html` | ✅ | 55 KB |
| `docs/mockups/07-exam-engine.html` | ✅ | 59 KB |
| `docs/mockups/08-practice.html` | ✅ | 35 KB |
| `docs/mockups/09-results.html` | ✅ | 52 KB |
| `docs/mockups/10-student-assignments.html` | ✅ | 22 KB |
| `docs/mockups/11-engagement.html` | ✅ | 46 KB |
| `docs/mockups/12-teacher-dashboard.html` | ✅ | 34 KB |
| `docs/mockups/13-teacher-student-detail.html` | ✅ | 24 KB |
| `docs/mockups/14-analytics.html` | ✅ | 37 KB |
| `docs/mockups/15-assignment-engine.html` | ✅ | 34 KB |
| `docs/mockups/16-admin-intelligence.html` | ✅ | 36 KB |
| `docs/mockups/17-landing.html` | ✅ | 278 KB |
| `docs/mockups/assets/logo.svg` | ⚠️ WRONG PATH | Actual: `assets/logo/logo.svg` |
| `docs/mockups/assets/favicon.svg` | ❌ MISSING | `assets/favicon/` contains PNG package only |
| `docs/mockups/assets/logomark.svg` | ❌ MISSING | Not found anywhere in repo |

### MVP-Critical Mockups Assessment
| Mockup | Needed by | Status |
|--------|-----------|--------|
| `00-design-system.html` | PR 4 | ⚠️ STUB — P1 BLOCKER for PR 4 |
| `01-authentication.html` | PR 2 | ✅ |
| `02-dashboard.html` | PR 10 | ✅ |
| `03-parent-dashboard.html` | PR 4, PR 10 | ✅ |
| `04-billing.html` | PR 5 | ✅ |
| `05-student-home.html` | PR 6, PR 10 | ✅ |
| `07-exam-engine.html` | PR 8 | ✅ |
| `09-results.html` | PR 9 | ✅ |

---

## 4. Environment Configuration

### File Presence
| File | Status | Notes |
|------|--------|-------|
| `.env.example` | ✅ | Present and populated |
| `.env.local` | ✅ not committed | Covered by `.gitignore` |
| `.gitignore` | ✅ | Covers `.env*`, `.next/`, `supabase/.branches/`, `supabase/.temp/` |

### Variables in `.env.example`
| Variable | Present | Value state |
|----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Real URL committed ⚠️ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | **Real JWT committed** ⚠️ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | **Real JWT committed** ⚠️ |
| `STRIPE_SECRET_KEY` | ✅ | Empty (correct pre-PR5) |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Empty (correct pre-PR5) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Empty (correct pre-PR5) |
| `STRIPE_PRICE_ID_MVP` | ✅ | Empty (correct pre-PR5) |
| `NEXT_PUBLIC_APP_URL` | ✅ | `http://localhost:3000` |

> **Security note:** `.env.example` contains real Supabase anon key and service_role JWT. These are `NEXT_PUBLIC_SUPABASE_ANON_KEY` (low risk — public by design) and `SUPABASE_SERVICE_ROLE_KEY` (elevated risk — should be a placeholder like `<your-service-role-key>` in example files). Recommended fix: replace real JWTs in `.env.example` with placeholder strings.

### .gitignore Coverage
| Pattern | Present |
|---------|---------|
| `.env` | ✅ |
| `.env.local` | ✅ |
| `.env.*.local` | ✅ |
| `.next/` | ✅ |
| `node_modules/` | ✅ |
| `supabase/.branches/` | ✅ |
| `supabase/.temp/` | ✅ |

---

## 5. Toolchain

| Tool | Required | Found | Status |
|------|----------|-------|--------|
| Node.js | 20.x+ | v24.12.0 | ✅ |
| pnpm | 9.x+ | 10.30.3 | ✅ (package.json pins 9.0.0 — minor mismatch) |
| supabase CLI | installed | NOT FOUND | ❌ P0 BLOCKER |
| Docker | running | 29.3.1 | ✅ |
| git | any | 2.52.0 | ✅ |

### Scaffold / Config Existence
| Item | Status |
|------|--------|
| `apps/web/package.json` | ❌ MISSING (only `.gitkeep`) |
| `supabase/config.toml` | ❌ MISSING |
| `.github/workflows/ci.yml` | ❌ MISSING (only `.gitkeep`) |
| `pnpm-workspace.yaml` | ✅ |

---

## 6. Git State

- **Current branch:** `main`
- **Remote:** `origin/main` — up to date
- **Commits:** 1 (`f20a49f Initial commit`)
- **Feature branches:** none
- **Uncommitted changes:**
  - `modified: .env.example` (unstaged)
- **Untracked files:**
  - `docs/runtime/STANDING_ORDERS.md`

---

## 7. Blocker Report

### 🔴 P0 — Must fix before PR 1 starts

| # | Issue | File/Location | Fix |
|---|-------|---------------|-----|
| 1 | `supabase` CLI not installed | System | `scoop install supabase` or download from supabase.com/docs/guides/cli |
| 2 | No Next.js app scaffold | `apps/web/` | `pnpm create next-app apps/web` (done in PR 1) |
| 3 | `supabase/config.toml` missing | `supabase/` | `supabase init` (done in PR 1) |
| 4 | No CI workflow | `.github/workflows/` | Create `ci.yml` (done in PR 1) |

### 🟡 P1 — Must fix before the specific PR that needs it

| # | Issue | Needed by PR | Fix |
|---|-------|-------------|-----|
| 1 | Governance files have `.md.md` double extension | PR 1 (convention) | Rename: `mv BUILD_CONTRACT.md.md BUILD_CONTRACT.md` etc. |
| 2 | `docs/mockups/00-design-system.html` is a 477-byte stub | PR 4 | Populate with design tokens and component inventory |
| 3 | `docs/mockups/index.html` missing | PR 4 | Create mockup index/navigation page |
| 4 | `docs/mockups/assets/logo.svg` at wrong path (`assets/logo/logo.svg`) | PR 4 | Normalise asset paths or update spec references |
| 5 | `docs/mockups/assets/logomark.svg` missing | PR 4 | Extract from logo or recreate |
| 6 | `docs/mockups/assets/favicon.svg` missing | PR 4 | `assets/favicon/` has PNG package — add SVG source |
| 7 | `SUPABASE_SERVICE_ROLE_KEY` real JWT in `.env.example` | PR 1 (security hygiene) | Replace with `<your-service-role-key>` placeholder |
| 8 | `docs/runtime/DEV_PLAN.md` is a placeholder | PR 1 | Populate from `docs/spec/mindmosaic-dev-plan-v1_1.md` |

### 🟢 P2 — Nice to fix, won't block progress

| # | Issue | Notes |
|---|-------|-------|
| 1 | `package.json` pins `pnpm@9.0.0` but system has `10.30.3` | Update to `"pnpm@10.30.3"` or remove pin |
| 2 | `supabase/functions/` has scaffolded dirs but no code | Expected — code added in PR 2+ |
| 3 | `docs/runtime/STANDING_ORDERS.md` is untracked | Commit or add to `.gitignore` |
| 4 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` real value in `.env.example` | Anon key is public by design; low risk but use placeholder for clarity |

---

## 8. Verdict

**READY:** No  
**Reason:** Four P0 blockers exist — supabase CLI not installed, Next.js app not scaffolded, `supabase/config.toml` absent, and no CI workflow — all of which are created as part of PR 1 itself; the repo is structurally ready but the toolchain must be completed first.  
**Next action:** Install supabase CLI (`scoop install supabase` or follow https://supabase.com/docs/guides/cli/getting-started), then execute PR 1 prompt which will scaffold the Next.js app, init Supabase, and create the CI workflow.
