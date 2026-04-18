#!/usr/bin/env node
// =============================================================================
// MindMosaic — Developer Routine Setup Runner v2.0.0
// Pure JavaScript ESM — Node.js 20+, zero external dependencies.
//
// Architecture:
//   buildFileContents() -> Record<relPath, content>
//     Single source of truth for every file this setup creates.
//     Separating data from behaviour makes the setup auditable and testable.
//
//   writeFile(relPath, content, alwaysOverwrite)
//     Stateless write helper. Caller decides the overwrite policy.
//     Runtime/user docs  -> alwaysOverwrite=false (preserve user edits)
//     Templates          -> alwaysOverwrite=true  (always refresh)
//
//   patchPackageJson()   JSON-aware; no shell subprocess.
//   writeAliases()       Expands REPO_ROOT at setup time (not shell-eval time).
//   selfVerify()         File presence + dispatcher smoke test.
// =============================================================================

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname, resolve }                              from "node:path";
import { execSync }                                            from "node:child_process";
import { fileURLToPath }                                       from "node:url";

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const REPO_ROOT  = resolve(__dirname);

const args        = process.argv.slice(2);
const DRY_RUN     = args.includes("--dry-run");
const VERIFY_ONLY = args.includes("--verify");

// ---------------------------------------------------------------------------
// Terminal colours — disabled when stdout is not a TTY (e.g. CI, file redirect)
// ---------------------------------------------------------------------------

const tty = Boolean(process.stdout.isTTY);
const C = {
  green:  tty ? "\x1b[32m" : "",
  yellow: tty ? "\x1b[33m" : "",
  blue:   tty ? "\x1b[34m" : "",
  red:    tty ? "\x1b[31m" : "",
  bold:   tty ? "\x1b[1m"  : "",
  reset:  tty ? "\x1b[0m"  : "",
};

// ---------------------------------------------------------------------------
// Counters (module-level — mutated by logging helpers)
// ---------------------------------------------------------------------------

let written = 0, skipped = 0, passed = 0, failed = 0;

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

const log = {
  header : (s) => console.log(`\n${C.bold}=== ${s} ===${C.reset}`),
  ok     : (s) => { console.log(`  ${C.green}ok${C.reset}    ${s}`);    passed++; },
  skip   : (s) => { console.log(`  ${C.yellow}skip${C.reset}  ${s} (already has content)`); skipped++; },
  write  : (s) => { console.log(`  ${C.green}write${C.reset} ${s}`);    written++; },
  dryrun : (s) => console.log(`  ${C.blue}dry${C.reset}   ${s}`),
  warn   : (s) => console.log(`  ${C.yellow}warn${C.reset}  ${s}`),
  error  : (s) => { console.error(`  ${C.red}fail${C.reset}  ${s}`);    failed++; },
  fatal  : (s) => { console.error(`\n${C.red}${C.bold}FATAL: ${s}${C.reset}\n`); process.exit(1); },
};

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------

function hasContent(fullPath) {
  if (!existsSync(fullPath)) return false;
  return /\S/.test(readFileSync(fullPath, "utf8"));
}

function writeFile(relPath, content, alwaysOverwrite) {
  const fullPath = join(REPO_ROOT, relPath);

  if (DRY_RUN) {
    log.dryrun(`${relPath}${alwaysOverwrite ? " (overwrite)" : ""}`);
    return;
  }

  mkdirSync(dirname(fullPath), { recursive: true });

  if (!alwaysOverwrite && hasContent(fullPath)) {
    log.skip(relPath);
    return;
  }

  writeFileSync(fullPath, content, "utf8");
  log.write(relPath);
}

// ---------------------------------------------------------------------------
// Configuration constants
// ---------------------------------------------------------------------------

const REQUIRED_DIRS = [
  "scripts/routines",
  "docs/spec",
  "docs/mockups/assets",
  "docs/governance",
  "docs/runtime/incidents",
  ".vscode",
  "apps",
  "supabase/migrations",
  "supabase/tests/rls",
  "k6",
];

// These paths are always overwritten — they are templates, not user data.
const ALWAYS_OVERWRITE = new Set([
  "scripts/routine.ts",
  "scripts/routines/morning-standup.md",
  "scripts/routines/pre-commit.md",
  "scripts/routines/end-of-day.md",
  "scripts/routines/weekly-review.md",
  "scripts/routines/pre-merge-gate.md",
  "scripts/routines/incident-triage.md",
  ".vscode/tasks.json",
]);

const REQUIRED_FILES = [
  "scripts/routine.ts",
  "scripts/routines/morning-standup.md",
  "scripts/routines/pre-commit.md",
  "scripts/routines/end-of-day.md",
  "scripts/routines/weekly-review.md",
  "scripts/routines/pre-merge-gate.md",
  "scripts/routines/incident-triage.md",
  "scripts/shell-aliases.sh",
  "docs/runtime/STATUS.md",
  "docs/runtime/DAILY_LOG.md",
  "docs/runtime/DEV_PLAN.md",
  "docs/runtime/POST_LAUNCH_BACKLOG.md",
  ".vscode/tasks.json",
  ".vscode/settings.json",
  ".vscode/extensions.json",
  "mindmosaic.code-workspace",
  ".gitignore",
  "package.json",
  "pnpm-workspace.yaml",
];

// ---------------------------------------------------------------------------
// FILE CONTENTS — single source of truth
//
// Every file the setup creates is defined here as a plain string.
// Template literal interpolation is used only for dynamic values (today's date,
// REPO_ROOT). All other content is literal.
// ---------------------------------------------------------------------------

function buildFileContents() {
  const today = new Date().toISOString().split("T")[0];

  // Embedded TypeScript source for scripts/routine.ts.
  // Stored as a string here so setup.mjs needs zero runtime dependencies.
  // This file is TypeScript and requires tsx to execute (installed as devDep).
  const routineTs = [
    "#!/usr/bin/env tsx",
    "/**",
    " * MindMosaic Routine Dispatcher",
    " * Usage: pnpm routine <routine-name>",
    " *",
    " * Reads scripts/routines/<n>.md, injects live git/file context,",
    " * writes to docs/runtime/last-routine.md, and prints to stdout.",
    " */",
    "",
    'import { execSync }                    from "node:child_process";',
    'import { existsSync, mkdirSync,',
    '         readFileSync, writeFileSync } from "node:fs";',
    'import { join, resolve }               from "node:path";',
    "",
    "const ROOT         = resolve(__dirname, \".\".repeat(1) + \".\");",
    "const ROUTINES_DIR = join(__dirname, \"routines\");",
    "const RUNTIME_DIR  = join(ROOT, \"docs\", \"runtime\");",
    "const OUTPUT       = join(RUNTIME_DIR, \"last-routine.md\");",
    "",
    "const VALID = new Set([",
    "  \"morning-standup\", \"pre-commit\", \"end-of-day\",",
    "  \"weekly-review\",   \"pre-merge-gate\", \"incident-triage\",",
    "]);",
    "",
    "function shell(cmd: string, fallback = \"(unavailable)\"): string {",
    "  try {",
    "    return execSync(cmd, {",
    "      cwd: ROOT, encoding: \"utf8\", timeout: 8_000,",
    "      stdio: [\"pipe\", \"pipe\", \"pipe\"],",
    "    }).trim();",
    "  } catch { return fallback; }",
    "}",
    "",
    "function readOrDefault(path: string, fallback: string): string {",
    "  if (!existsSync(path)) return fallback;",
    "  const s = readFileSync(path, \"utf8\").trim();",
    "  return s.length > 0 ? s : fallback;",
    "}",
    "",
    "function lastN(text: string, n: number): string {",
    "  return text.split(\"\\n\").filter(l => l.trim()).slice(-n).join(\"\\n\");",
    "}",
    "",
    "function lastLogRow(log: string): string {",
    "  return log.split(\"\\n\").filter(",
    "    l => l.startsWith(\"|\") && !l.includes(\"---\") &&",
    "         !l.toLowerCase().includes(\"date\") &&",
    "         !l.toLowerCase().includes(\"phase\")",
    "  ).at(-1) ?? \"(no entries yet)\";",
    "}",
    "",
    "function collectContext() {",
    "  const now       = new Date();",
    "  const statusRaw = readOrDefault(join(RUNTIME_DIR, \"STATUS.md\"),    \"(STATUS.md not found)\");",
    "  const logRaw    = readOrDefault(join(RUNTIME_DIR, \"DAILY_LOG.md\"), \"(DAILY_LOG.md not found)\");",
    "  return {",
    "    timestamp:    now.toISOString(),",
    "    date:         now.toLocaleDateString(\"en-AU\", {",
    "                    weekday: \"long\", year: \"numeric\",",
    "                    month: \"long\",   day: \"numeric\",",
    "                  }),",
    "    gitBranch:    shell(\"git rev-parse --abbrev-ref HEAD\", \"unknown\"),",
    "    gitStatus:    shell(\"git status --short\",              \"(unavailable)\"),",
    "    gitLog:       shell(\"git log --oneline -5\",            \"(no commits yet)\"),",
    "    statusMd:     lastN(statusRaw, 20),",
    "    lastLogEntry: lastLogRow(logRaw),",
    "    ciState:      shell(",
    "      \"gh run list --branch main --limit 1 \" +",
    "      \"--json status,conclusion \" +",
    "      \"--jq '.[0] | .status + \\\":\\\" + (.conclusion // \\\"pending\\\")'\",",
    "      \"unknown (install gh CLI)\"",
    "    ),",
    "    openPR: shell(",
    "      \"gh pr view --json number,title,headRefName \" +",
    "      \"--jq '\\\"PR \\\" + (.number|tostring) + \\\" \\u2014 \\\" + .title + \\\" (\\\" + .headRefName + \\\")\\\"\",",
    "      \"no open PR on current branch\"",
    "    ),",
    "  };",
    "}",
    "",
    "function buildPreamble(ctx: ReturnType<typeof collectContext>): string {",
    "  const indent = (s: string) => s.split(\"\\n\").map(l => `#   ${l}`).join(\"\\n\");",
    "  return [",
    "    \"# +------------------------------------------------------------------+\",",
    "    \"# |  LIVE CONTEXT — auto-injected by scripts/routine.ts             |\",",
    "    \"# +------------------------------------------------------------------+\",",
    "    `# Timestamp:  ${ctx.timestamp}`,",
    "    `# Date:       ${ctx.date}`,",
    "    `# Branch:     ${ctx.gitBranch}`,",
    "    `# CI state:   ${ctx.ciState}`,",
    "    `# Open PR:    ${ctx.openPR}`,",
    "    \"#\",",
    "    \"# Git status:\",",
    "    ctx.gitStatus ? indent(ctx.gitStatus) : \"#   (clean)\",",
    "    \"#\",",
    "    \"# Recent commits:\",",
    "    indent(ctx.gitLog),",
    "    \"#\",",
    "    \"# STATUS.md (last 20 lines):\",",
    "    indent(ctx.statusMd),",
    "    \"#\",",
    "    \"# Last DAILY_LOG entry:\",",
    "    `#   ${ctx.lastLogEntry}`,",
    "    \"# -------------------------------------------------------------------\",",
    "    \"\",",
    "  ].join(\"\\n\");",
    "}",
    "",
    "function main(): void {",
    "  const name = process.argv[2];",
    "  if (!name || !VALID.has(name)) {",
    "    const list = [...VALID].map(r => `  ${r}`).join(\"\\n\");",
    "    process.stderr.write(`Usage: pnpm routine <n>\\nValid:\\n${list}\\n`);",
    "    process.exit(name ? 1 : 0);",
    "  }",
    "  const routineFile = join(ROUTINES_DIR, `${name}.md`);",
    "  if (!existsSync(routineFile)) {",
    "    process.stderr.write(`Not found: ${routineFile}\\nRe-run ./setup.sh\\n`);",
    "    process.exit(1);",
    "  }",
    "  const content   = readFileSync(routineFile, \"utf8\");",
    "  const ctx       = collectContext();",
    "  const assembled = buildPreamble(ctx) + content;",
    "  mkdirSync(RUNTIME_DIR, { recursive: true });",
    "  writeFileSync(OUTPUT, assembled, \"utf8\");",
    "  process.stdout.write(assembled + \"\\n\");",
    "  process.stderr.write(",
    "    `\\nRoutine assembled: ${name}\\n` +",
    "    \"Written to: docs/runtime/last-routine.md\\n\\n\" +",
    "    \"Next: select all in last-routine.md, paste into Claude Code, press Enter.\\n\\n\"",
    "  );",
    "}",
    "",
    "main();",
  ].join("\n");

  return {

    // ── Runtime docs — skip if they already have content ──────────────────

    "docs/runtime/STATUS.md": [
      "# MindMosaic — System Status",
      `Last updated: ${today}`,
      "Phase: 0 — Pre-development",
      "Current PR: none (run PR 0 audit first)",
      "Last merged: none",
      "CI: not configured",
      "Schema version: none",
      "RLS tables covered: 0/13",
      "Mockups present: check docs/mockups/",
      "Known Issues: setup in progress",
      "",
      "## Next Action",
      "Run: pnpm routine morning-standup",
      "",
    ].join("\n"),

    "docs/runtime/DAILY_LOG.md": [
      "# MindMosaic — Daily Execution Log",
      "",
      "> **Rule**: Do not advance to PR N+1 until acceptance is PASSED and CI is green.",
      "",
      "| Date | Phase / PR | Prompt ID | Goal / Acceptance | Result / Output | Blockers / Fixes | Git Commit | Time |",
      "|------|------------|-----------|-------------------|-----------------|------------------|------------|------|",
      "",
    ].join("\n"),

    "docs/runtime/DEV_PLAN.md": [
      "# MindMosaic — Solo Development Plan (Living Doc)",
      "",
      "> Copy the phase/PR table from docs/spec/mindmosaic-dev-plan-v1_1.md into this file.",
      "> Mark each PR complete as it is merged to main.",
      "",
      "## Status Summary",
      "- Phase: 0",
      "- Current PR: (run morning-standup routine)",
      `- Last update: ${today}`,
      "",
    ].join("\n"),

    "docs/runtime/POST_LAUNCH_BACKLOG.md": [
      "# Post-Launch Backlog",
      "",
      "> Items deferred from MVP. Do NOT build during MVP development.",
      "",
      "## P0 — Fix before launch if discovered",
      "| Date | Severity | Location | Description | Trigger |",
      "|------|----------|----------|-------------|---------|",
      "",
      "## P1 — Next quarter",
      "| Date | Severity | Location | Description | Trigger |",
      "|------|----------|----------|-------------|---------|",
      "",
      "## P2 — Consider",
      "| Date | Severity | Location | Description | Trigger |",
      "|------|----------|----------|-------------|---------|",
      "",
      "## P3 — Icebox",
      "| Date | Severity | Location | Description | Trigger |",
      "|------|----------|----------|-------------|---------|",
      "",
    ].join("\n"),

    "docs/runtime/UI_PRIMITIVES.md": [
      "# UI Primitives Inventory",
      "> Populated during PR 4.",
      "",
      "| Component | Mockup Source | States Implemented | Notes |",
      "|-----------|--------------|-------------------|-------|",
      "",
    ].join("\n"),

    "docs/runtime/CONTENT_INVENTORY.md": [
      "# Content Inventory",
      "> Auto-generated during PR 3 via scripts/validate-content.ts",
      "",
      "| item_id | pathway | skill_code | difficulty | stem (first 60 chars) |",
      "|---------|---------|------------|------------|----------------------|",
      "",
    ].join("\n"),

    "docs/governance/README.md": [
      "# Governance Documents (Read-Only)",
      "Drop these here before development:",
      "- BUILD_CONTRACT.md",
      "- OWNERS.md",
      "- GIT_WORKFLOW.md",
      "",
    ].join("\n"),

    "docs/spec/README.md": [
      "# Reference Specifications (Read-Only)",
      "Drop these here before development:",
      "- mindmosaic-spec-v4_4.md",
      "- mindmosaic-backend-arch-v2_0.md",
      "- mindmosaic-dev-plan-v1_1.md",
      "",
    ].join("\n"),

    "docs/mockups/README.md": [
      "# UI Mockups",
      "",
      "Canonical numbered filenames referenced by all PR prompts:",
      "",
      "  index.html                      mockup browser hub",
      "  00-design-system.html           token source of truth (PR 4)",
      "  01-authentication.html          signup + login + forgot (PR 2)",
      "  02-dashboard.html               parent dashboard (PR 10)",
      "  03-parent-dashboard.html        child progress detail (PR 10)",
      "  04-billing.html                 billing (PR 5)",
      "  05-student-home.html            student home + session selection (PR 6, PR 10)",
      "  06-learning-hub.html            v2 reference",
      "  07-exam-engine.html             exam session player PRIMARY (PR 8)",
      "  08-practice.html                practice mode",
      "  09-results.html                 results PRIMARY (PR 9)",
      "  10-student-assignments.html     v2 reference",
      "  11-engagement.html              v2 reference",
      "  12-teacher-dashboard.html       v2 reference",
      "  13-teacher-student-detail.html  v2 reference",
      "  14-analytics.html               v2 reference",
      "  15-assignment-engine.html       v2 reference",
      "  16-admin-intelligence.html      v2 reference",
      "  17-landing.html                 landing page",
      "  assets/logo.svg",
      "  assets/favicon.svg",
      "  assets/logomark.svg",
      "",
      "Open with VS Code Live Preview: right-click -> Open with Live Server",
      "",
    ].join("\n"),

    "pnpm-workspace.yaml": "packages:\n  - \"apps/*\"\n",

    ".gitignore": [
      "# Dependencies",
      "node_modules/",
      ".pnpm-store/",
      "",
      "# Build outputs",
      ".next/",
      "dist/",
      "build/",
      "*.tsbuildinfo",
      "",
      "# Environment — NEVER COMMIT",
      ".env",
      ".env.local",
      ".env.*.local",
      "",
      "# Deployment",
      ".vercel/",
      "",
      "# Supabase local state",
      "supabase/.branches/",
      "supabase/.temp/",
      "",
      "# OS",
      ".DS_Store",
      "Thumbs.db",
      "",
      "# Logs",
      "*.log",
      "npm-debug.log*",
      "pnpm-debug.log*",
      "",
      "# IDE (keep .vscode/*.json and *.code-workspace)",
      ".idea/",
      "*.swp",
      "*.swo",
      "",
      "# Test output",
      "playwright-report/",
      "test-results/",
      "coverage/",
      "",
      "# Routine output (generated — not source of truth)",
      "docs/runtime/last-routine.md",
      "docs/runtime/last-pre-commit.md",
      "docs/runtime/last-merge-gate.md",
      "",
    ].join("\n"),

    // ── VS Code config (skip if present — may have user customisations) ────

    "mindmosaic.code-workspace": JSON.stringify({
      folders: [
        { name: "app  (apps/web)", path: "apps/web"  },
        { name: "supabase",        path: "supabase"   },
        { name: "docs",            path: "docs"       },
        { name: "scripts",         path: "scripts"    },
        { name: "root",            path: "."          },
      ],
      settings: {},
    }, null, 2) + "\n",

    ".vscode/settings.json": JSON.stringify({
      "editor.formatOnSave": true,
      "editor.defaultFormatter": "esbenp.prettier-vscode",
      "[typescript]":      { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      "[typescriptreact]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      "[markdown]":        { "editor.defaultFormatter": "esbenp.prettier-vscode" },
      "files.associations": { "*.css": "tailwindcss" },
      "markdown.preview.openMarkdownLinks": "inEditor",
      "search.exclude": {
        "**/node_modules": true,
        "**/.next": true,
        "**/supabase/.branches": true,
        "**/supabase/.temp": true,
      },
    }, null, 2) + "\n",

    ".vscode/extensions.json": JSON.stringify({
      recommendations: [
        "bradlc.vscode-tailwindcss",
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "supabase.supabase-vscode",
        "shd101wyy.markdown-preview-enhanced",
        "ms-vscode.live-server",
        "ms-playwright.playwright",
        "mikestead.dotenv",
        "streetsidesoftware.code-spell-checker",
      ],
    }, null, 2) + "\n",

    // ── VS Code tasks — always overwrite ──────────────────────────────────

    ".vscode/tasks.json": JSON.stringify({
      version: "2.0.0",
      tasks: [
        {
          label: "Routine: Morning Standup",
          type: "shell",
          command: "pnpm routine morning-standup && code docs/runtime/last-routine.md",
          group: "none",
          presentation: { reveal: "always", panel: "new", clear: true },
          problemMatcher: [],
          runOptions: { instanceLimit: 1 },
        },
        {
          label: "Routine: Pre-Commit Check",
          type: "shell",
          command: "pnpm routine pre-commit && code docs/runtime/last-routine.md",
          group: "none",
          presentation: { reveal: "always", panel: "new", clear: true },
          problemMatcher: [],
          runOptions: { instanceLimit: 1 },
        },
        {
          label: "Routine: End of Day",
          type: "shell",
          command: "pnpm routine end-of-day && code docs/runtime/last-routine.md",
          group: "none",
          presentation: { reveal: "always", panel: "new", clear: true },
          problemMatcher: [],
          runOptions: { instanceLimit: 1 },
        },
        {
          label: "Routine: Weekly Review",
          type: "shell",
          command: "pnpm routine weekly-review && code docs/runtime/last-routine.md",
          group: "none",
          presentation: { reveal: "always", panel: "new", clear: true },
          problemMatcher: [],
          runOptions: { instanceLimit: 1 },
        },
        {
          label: "Routine: Pre-Merge Gate",
          type: "shell",
          command: "pnpm routine pre-merge-gate && code docs/runtime/last-routine.md",
          group: "none",
          presentation: { reveal: "always", panel: "new", clear: true },
          problemMatcher: [],
          runOptions: { instanceLimit: 1 },
        },
        {
          label: "Routine: Incident Triage",
          type: "shell",
          command: "pnpm routine incident-triage && code docs/runtime/last-routine.md",
          group: "none",
          presentation: { reveal: "always", panel: "new", clear: true },
          problemMatcher: [],
          runOptions: { instanceLimit: 1 },
        },
      ],
    }, null, 2) + "\n",

    // ── Routine definition files — always overwrite ───────────────────────

    "scripts/routines/morning-standup.md": [
      "# ROUTINE: morning-standup",
      "# Live context is injected above this line by scripts/routine.ts",
      "# Paste the full contents of docs/runtime/last-routine.md into Claude Code.",
      "",
      "## Your role",
      "You are the solo developer assistant for MindMosaic.",
      "Live context has been injected in the preamble above. Do not ask me to",
      "re-read files already present there. Work through every step in order.",
      "Make decisions without asking clarifying questions.",
      "",
      "---",
      "",
      "## Step 1 — CI Gate",
      "",
      "Check the CI state in the live context preamble.",
      "",
      "If it contains \"failure\" or \"failed\":",
      "  Print: \"CI IS RED — today's only job is fixing CI\"",
      "  Read .github/workflows/ci.yml",
      "  State the most likely cause from recent commits",
      "  STOP. Do not proceed to Step 2.",
      "",
      "Otherwise continue.",
      "",
      "---",
      "",
      "## Step 2 — Unresolved Blockers",
      "",
      "Check the last DAILY_LOG entry in the preamble.",
      "",
      "If the Result column contains \"PARTIAL\" or \"BLOCKED\":",
      "  Print: \"UNRESOLVED BLOCKER from yesterday: [what it was]\"",
      "  State the exact first action to resolve it.",
      "  Flag as today's first priority.",
      "",
      "---",
      "",
      "## Step 3 — Current Position",
      "",
      "Read docs/runtime/DEV_PLAN.md",
      "Find the first PR not marked complete.",
      "State: PR number, title, next step, estimated hours today.",
      "",
      "---",
      "",
      "## Step 4 — Today's Single Win",
      "",
      "Define one acceptance criterion verifiable by end of day.",
      "",
      "Format: \"Today's win: [specific, testable statement]\"",
      "Good: \"Today's win: pg-tap 001_tenant_isolation.sql passes with 2 tenants\"",
      "Bad:  \"Today's win: make progress on auth\"",
      "",
      "---",
      "",
      "## Step 5 — Write to docs/runtime/DAILY_LOG.md",
      "",
      "Append exactly one row:",
      "",
      "| YYYY-MM-DD | PR N — title | morning-standup | [today's win] | In progress | — | — | — |",
      "",
      "---",
      "",
      "## Step 6 — Print standup summary",
      "",
      "STANDUP — [date]",
      "================",
      "CI:           [green / red / unknown]",
      "Yesterday:    [one line from last log entry]",
      "Blocker:      [none / description]",
      "Today's PR:   PR N — [title]",
      "Today's step: [specific step name from DEV_PLAN]",
      "Today's win:  [acceptance criterion]",
      "ETA:          [hours]",
      "",
    ].join("\n"),

    "scripts/routines/pre-commit.md": [
      "# ROUTINE: pre-commit",
      "# Live context injected by scripts/routine.ts",
      "",
      "## Your role",
      "Run every check in order. Stop at the first failure.",
      "Never skip a check. Write results to docs/runtime/last-pre-commit.md",
      "",
      "---",
      "",
      "## Step 1 — TypeScript",
      "Run: pnpm -C apps/web typecheck 2>&1",
      "Pass: exit 0, zero \"error TS\" lines",
      "Fail: print first 20 errors, state which file to fix first.",
      "",
      "## Step 2 — Lint",
      "Run: pnpm -C apps/web lint 2>&1",
      "Pass: exit 0",
      "Fail: print failing rules, state if auto-fixable.",
      "",
      "## Step 3 — Build",
      "Run: pnpm -C apps/web build 2>&1",
      "Pass: exit 0, no \"Type error\" lines",
      "Fail: print error, trace to source file.",
      "",
      "## Step 4 — Database migrations",
      "Run: supabase db reset 2>&1",
      "Pass: exits 0, no \"ERROR\" lines",
      "Fail: print failing migration and error.",
      "If supabase not installed: skip with warning.",
      "",
      "## Step 5 — RLS tests",
      "Run: supabase test db 2>&1",
      "Pass: all \"ok\", zero \"not ok\"",
      "Fail: print failing test name and assertion.",
      "If supabase not installed: skip with warning.",
      "",
      "## Step 6 — service_role key in client bundle",
      "Run: grep -r \"service_role\" apps/web/ 2>/dev/null || echo \"CLEAN\"",
      "Pass: \"CLEAN\" or empty",
      "Fail: print file and line. P0 blocker — do not push.",
      "",
      "## Step 7 — Hardcoded hex values",
      "Run:",
      "  grep -rE \"#[0-9a-fA-F]{3,8}\" apps/web/app apps/web/components \\",
      "    --include=\"*.tsx\" --include=\"*.ts\" --include=\"*.css\" 2>/dev/null \\",
      "  | grep -v \"globals.css\" | grep -v \"tailwind.config\" \\",
      "  || echo \"CLEAN\"",
      "Pass: \"CLEAN\" or empty",
      "Fail: print each occurrence, state the token to use instead.",
      "",
      "---",
      "",
      "## Step 8 — Write docs/runtime/last-pre-commit.md",
      "",
      "# Pre-Commit Check — [timestamp]",
      "Branch: [branch]",
      "",
      "| Check         | Result | Notes |",
      "|---------------|--------|-------|",
      "| TypeScript    | ok/fail|       |",
      "| Lint          | ok/fail|       |",
      "| Build         | ok/fail|       |",
      "| DB migrations | ok/fail|       |",
      "| RLS tests     | ok/fail|       |",
      "| service_role  | ok/fail|       |",
      "| Hex values    | ok/fail|       |",
      "",
      "Overall: PASS / BLOCKED",
      "[If blocked: exact command to fix the first failure]",
      "",
      "---",
      "",
      "## Step 9 — Print verdict",
      "",
      "PRE-COMMIT — [branch]",
      "=====================",
      "[one line per check: ok/fail + note]",
      "",
      "Verdict: PASS — safe to push",
      "     or: BLOCKED — fix [check] first: [exact command]",
      "",
    ].join("\n"),

    "scripts/routines/end-of-day.md": [
      "# ROUTINE: end-of-day",
      "# Live context injected by scripts/routine.ts",
      "",
      "## Your role",
      "Close today with zero ambiguity about tomorrow's starting point.",
      "Every step writes to a file. Nothing lives only in chat.",
      "",
      "---",
      "",
      "## Step 1 — Capture today's commit SHA",
      "Run: git log --oneline -1 2>&1",
      "Store this SHA. Reference it in every output below.",
      "",
      "## Step 2 — Assess today's goal",
      "Read docs/runtime/DAILY_LOG.md",
      "Find today's row (Result says \"In progress\").",
      "Evaluate: was the criterion met?",
      "- Test: run it, capture output",
      "- Visual: state whether manually verified",
      "- Not done: mark PARTIAL with reason",
      "",
      "## Step 3 — Update today's DAILY_LOG row",
      "Replace \"In progress\" with:",
      "- PASSED — criterion verified, CI green",
      "- PARTIAL — some progress, state what remains",
      "- BLOCKED — explicit blocker, state it",
      "Fill in: Blockers/Fixes, Git Commit (SHA), Time (hours).",
      "",
      "## Step 4 — Technical debt sweep",
      "Run: git diff main -- \"*.ts\" \"*.tsx\" \"*.sql\" 2>&1 | grep \"^+\" | grep -E \"TODO|FIXME|HACK|@ts-ignore|eslint-disable\" | head -30",
      "For each: append to docs/runtime/POST_LAUNCH_BACKLOG.md:",
      "| [date] | P2 | [file:line] | [description] | before launch |",
      "",
      "## Step 5 — Overwrite docs/runtime/STATUS.md",
      "Write the complete file (not an append):",
      "",
      "# MindMosaic — System Status",
      "Last updated: [timestamp]",
      "Phase: [current phase]",
      "Current PR: N — [title] — [in progress / complete]",
      "Last merged: PR N-1 — [date]",
      "CI: [green / red / unknown]",
      "Schema version: [latest migration prefix]",
      "RLS tables covered: [N/13]",
      "",
      "## Today's Result",
      "[PASSED / PARTIAL / BLOCKED] — [one sentence]",
      "",
      "## Known Issues",
      "[none / list with P0/P1/P2]",
      "",
      "## Tomorrow's First Action",
      "[Exact command or specific file — not a PR title.]",
      "",
      "---",
      "",
      "## Step 6 — Print wrap summary",
      "",
      "END OF DAY — [date]",
      "===================",
      "Commit:        [SHA]",
      "Goal:          [today's criterion]",
      "Achieved:      [PASSED / PARTIAL / BLOCKED]",
      "Debt logged:   [N items]",
      "STATUS.md:     updated",
      "DAILY_LOG.md:  updated",
      "Tomorrow:      [exact first action]",
      "",
    ].join("\n"),

    "scripts/routines/weekly-review.md": [
      "# ROUTINE: weekly-review",
      "# Live context injected by scripts/routine.ts",
      "# Run every Monday before standup. Allocate 30-45 minutes.",
      "",
      "## Your role",
      "Audit the week for schema drift, spec gaps, and scope creep.",
      "Produce a written report. Update all living docs.",
      "",
      "---",
      "",
      "## Step 1 — Schema integrity",
      "Run: supabase db reset 2>&1 | tail -5",
      "Run: supabase test db 2>&1",
      "For every table in supabase/migrations/:",
      "  Verify: RLS enabled, entry in OWNERS.md, pg-tap coverage.",
      "  Gap: append to POST_LAUNCH_BACKLOG.md as P1.",
      "",
      "## Step 2 — Spec compliance",
      "For each PR marked complete this week:",
      "- Read the spec section referenced in that PR prompt",
      "- Confirm what was built matches the spec",
      "- Delta: log in POST_LAUNCH_BACKLOG.md with spec section ref",
      "",
      "| PR | Spec ref | Planned | Delivered | Delta |",
      "|----|----------|---------|-----------|-------|",
      "",
      "## Step 3 — Mockup fidelity",
      "For each UI PR this week:",
      "- State the mockup reference file",
      "- State whether visual regression baseline was captured",
      "- List deviations and their backlog entries",
      "",
      "## Step 4 — Scope integrity",
      "For each item added to POST_LAUNCH_BACKLOG this week:",
      "  \"Can the product launch without this?\" Yes: stays. No: move to current/next PR.",
      "",
      "## Step 5 — Week plan",
      "",
      "WEEK PLAN — [week of date]",
      "==========================",
      "Monday:     [goal] | win: [criterion]",
      "Tuesday:    [goal] | win: [criterion]",
      "Wednesday:  [goal or buffer]",
      "Thursday:   [goal] | win: [criterion]",
      "Friday:     end-of-week review",
      "",
      "Biggest risk:    [one sentence]",
      "Dependency:      [none / what / by when]",
      "PRs to complete: N",
      "",
      "## Step 6 — Append to docs/runtime/STATUS.md",
      "",
      "## Weekly Review — [date]",
      "PRs merged:   [list]",
      "Schema drift: [none / N issues]",
      "Spec gaps:    [none / N]",
      "Scope caught: [none / N moved back]",
      "Debt added:   [N items]",
      "Week plan:    Mon-Fri one line each",
      "",
      "## Step 7 — Print summary",
      "",
      "WEEKLY REVIEW — [date]",
      "======================",
      "PRs merged:           [list]",
      "Schema issues:        [N]",
      "Spec gaps:            [N]",
      "Scope items caught:   [N]",
      "Debt logged:          [N]",
      "Weeks to launch:      [estimate]",
      "This week's priority: [one sentence]",
      "",
    ].join("\n"),

    "scripts/routines/pre-merge-gate.md": [
      "# ROUTINE: pre-merge-gate",
      "# Live context injected by scripts/routine.ts",
      "# Run before every squash merge to main. No exceptions.",
      "",
      "## Your role",
      "Enforce the full Definition of Done from BUILD_CONTRACT.md section 10.",
      "Every box must pass. A single failure blocks the merge.",
      "State evidence — do not mark boxes without proof.",
      "",
      "---",
      "",
      "## Step 1 — Identify PR and acceptance criteria",
      "From the git branch in preamble, identify which PR this is.",
      "Read docs/runtime/DEV_PLAN.md, extract acceptance criteria verbatim.",
      "Print as numbered list — this is your checklist for Step 6.",
      "",
      "## Step 2 — Automated gates",
      "  pnpm -C apps/web typecheck 2>&1 | tail -3",
      "  pnpm -C apps/web lint 2>&1 | tail -3",
      "  pnpm -C apps/web build 2>&1 | tail -5",
      "  supabase db reset 2>&1 | tail -5",
      "  supabase test db 2>&1",
      "  grep -r \"service_role\" apps/web/ 2>/dev/null || echo \"CLEAN\"",
      "Any failure: print it and STOP.",
      "",
      "## Step 3 — Security gates",
      "  grep -rE \"#[0-9a-fA-F]{3,8}\" apps/web/app apps/web/components \\",
      "    --include=\"*.tsx\" --include=\"*.ts\" \\",
      "    | grep -v globals.css | grep -v tailwind.config \\",
      "    2>/dev/null || echo \"CLEAN\"",
      "",
      "  git diff main -- \"*.ts\" \"*.tsx\" | grep \"^+\" | grep \": any\" 2>/dev/null || echo \"CLEAN\"",
      "",
      "  git diff main -- \"*.ts\" \"*.tsx\" \"*.sql\" \\",
      "    | grep \"^+\" | grep -E \"TODO|FIXME|HACK\" 2>/dev/null || echo \"CLEAN\"",
      "",
      "## Step 4 — Process gates (Yes / No / NA)",
      "- Every new POST/PATCH/DELETE accepts Idempotency-Key",
      "- Every new tenant-scoped table has RLS + pg-tap test",
      "- Every new feature is behind a feature_flag (default off)",
      "- docs/governance/OWNERS.md updated for new tables/endpoints",
      "- docs/runtime/STATUS.md reflects post-merge state",
      "- docs/runtime/DAILY_LOG.md complete with today's commit SHA",
      "",
      "## Step 5 — Mockup fidelity (UI PRs only)",
      "- State the mockup reference file",
      "- Confirm visual regression baseline exists",
      "- State deviations and their backlog entries",
      "",
      "## Step 6 — PR acceptance criteria",
      "List each criterion from Step 1.",
      "Mark PASS (with evidence) or FAIL (with reason).",
      "",
      "## Step 7 — Verdict",
      "",
      "If ALL pass:",
      "MERGE GATE: APPROVED",
      "====================",
      "  git checkout main && git pull origin main",
      "  git merge --squash [branch from preamble]",
      "  git commit && git push origin main",
      "",
      "If ANY fail:",
      "MERGE GATE: BLOCKED",
      "===================",
      "Failing: [check]",
      "Evidence: [output]",
      "Fix: [exact command]",
      "",
      "## Step 8 — Write docs/runtime/last-merge-gate.md",
      "Full results table + merge command if approved.",
      "",
    ].join("\n"),

    "scripts/routines/incident-triage.md": [
      "# ROUTINE: incident-triage",
      "# Live context injected by scripts/routine.ts",
      "# Run immediately when anything breaks in production or CI goes red on main.",
      "",
      "## Your role",
      "Structured diagnosis under pressure. No guessing. No random fixes.",
      "Follow every step in order. Do not skip Step 1.",
      "",
      "---",
      "",
      "## Step 1 — Contain before diagnosing",
      "Answer from what you can observe now:",
      "1. Live users affected? (Yes / No / Unknown)",
      "2. Data at risk? (Yes / No / Unknown)",
      "3. Feature flag can mitigate?",
      "",
      "Run: supabase db -- \"SELECT key, enabled FROM feature_flag ORDER BY key;\" 2>/dev/null || echo \"DB unavailable\"",
      "",
      "If data is at risk: STOP.",
      "Print: \"DATA RISK DETECTED\"",
      "State last deployment SHA and rollback command.",
      "Do not write any code until rollback decision is made.",
      "",
      "## Step 2 — Reproduce locally",
      "Do not touch live environments until reproduced locally.",
      "State verbatim: exact error, numbered steps, expected vs actual.",
      "Run: git log --oneline -10",
      "Identify likely introducing commit. Do not proceed until confirmed.",
      "",
      "## Step 3 — Classify",
      "Type (one only):",
      "  RLS_LEAK        tenant data visible to wrong tenant",
      "  SCORING_ERROR   session score wrong",
      "  SESSION_CORRUPT session state inconsistent",
      "  PAYMENT_ERROR   billing state wrong",
      "  AUTH_FAILURE    auth not working",
      "  PERF_BREACH     p95 > SLA",
      "  CI_FAILURE      main branch broken",
      "  UI_REGRESSION   visual/functional breakage",
      "",
      "Severity: P0 fix NOW | P1 before new features | P2 within 24h | P3 backlog",
      "",
      "## Step 4 — Fix on isolated branch",
      "  git checkout main && git pull origin main",
      "  git checkout -b fix/[type]-[3-word-description]",
      "Rules: minimum diff, write failing test first, reversible with git revert.",
      "For RLS_LEAK: write + confirm failing test, write fix, confirm passing, run full suite.",
      "",
      "## Step 5 — Run pre-commit + pre-merge gate",
      "  pnpm -C apps/web typecheck lint build",
      "  supabase db reset && supabase test db",
      "Then run the pre-merge-gate routine. Not optional for hotfixes.",
      "",
      "## Step 6 — Post-mortem (within 24h)",
      "Write docs/runtime/incidents/YYYY-MM-DD-[type].md:",
      "",
      "# Incident — [date] [type]",
      "Severity: [P0/P1/P2/P3]",
      "Duration: [detected] to [resolved]",
      "",
      "## Timeline",
      "## Root Cause",
      "## Fix (commit SHA)",
      "## Prevention (implemented or added to backlog as P0)",
      "",
      "Append to DAILY_LOG.md:",
      "| [date] | INCIDENT | [type] | P[N] | [root cause] | [fix] | [SHA] | [duration] |",
      "",
      "## Step 7 — Print summary",
      "",
      "INCIDENT — [date]",
      "=================",
      "Type:        [type]",
      "Severity:    [P0/P1/P2/P3]",
      "Reproduced:  [Yes / No]",
      "Root cause:  [one sentence]",
      "Fix:         [branch] -> [SHA]",
      "Deployed:    [Yes / pending / rolled back]",
      "Post-mortem: docs/runtime/incidents/[date]-[type].md",
      "Prevention:  [implemented / added to backlog as P0]",
      "",
    ].join("\n"),

    // ── scripts/routine.ts — the TypeScript dispatcher ─────────────────────

    "scripts/routine.ts": routineTs,

  }; // end return
}

// ---------------------------------------------------------------------------
// package.json — pure JS JSON manipulation (no subprocess)
// ---------------------------------------------------------------------------

function patchPackageJson() {
  log.header("Patching package.json");

  const pkgPath = join(REPO_ROOT, "package.json");

  if (DRY_RUN) { log.dryrun("package.json"); return; }

  let pkg;

  if (!existsSync(pkgPath)) {
    pkg = {
      name:            "mindmosaic",
      version:         "0.0.0",
      private:         true,
      packageManager:  "pnpm@9.0.0",
      scripts:         {},
      devDependencies: {},
    };
  } else {
    try {
      pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    } catch (err) {
      log.fatal(`package.json is not valid JSON: ${err instanceof Error ? err.message : err}`);
      return;
    }
  }

  if (!pkg.scripts)         pkg.scripts         = {};
  if (!pkg.devDependencies) pkg.devDependencies  = {};

  let changed = false;
  if (!pkg.scripts.routine)     { pkg.scripts.routine     = "tsx scripts/routine.ts"; changed = true; }
  if (!pkg.devDependencies.tsx) { pkg.devDependencies.tsx = "^4.0.0";                changed = true; }

  if (changed || !existsSync(pkgPath)) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
    log.write("package.json");
    written++;
  } else {
    log.ok("package.json already up to date");
  }
}

// ---------------------------------------------------------------------------
// Shell aliases (REPO_ROOT is expanded at setup time, not at eval time)
// ---------------------------------------------------------------------------

function writeAliases() {
  log.header("Shell Aliases");

  const aliasPath = join(REPO_ROOT, "scripts", "shell-aliases.sh");

  if (DRY_RUN) { log.dryrun("scripts/shell-aliases.sh"); return; }

  mkdirSync(dirname(aliasPath), { recursive: true });

  // Normalise to forward slashes for Git Bash on Windows
  const root = REPO_ROOT.replace(/\\/g, "/");

  const lines = [
    "#!/usr/bin/env bash",
    "# MindMosaic developer aliases",
    "# Source from your shell profile:",
    "#   echo \"source $(pwd)/scripts/shell-aliases.sh\" >> ~/.bashrc",
    "#   source ~/.bashrc",
    "",
    `export MINDMOSAIC_ROOT="${root}"`,
    "",
    "# mm <routine-name> — assemble prompt and open in VS Code",
    "mm() {",
    "  local name=\"${1:-}\"",
    "  if [ -z \"$name\" ]; then",
    "    echo \"Usage: mm <routine>\"",
    "    echo \"Routines: morning-standup pre-commit end-of-day weekly-review pre-merge-gate incident-triage\"",
    "    return 1",
    "  fi",
    "  cd \"$MINDMOSAIC_ROOT\" || return 1",
    "  pnpm routine \"$name\" && code docs/runtime/last-routine.md",
    "}",
    "",
    "alias mm-start=\"mm morning-standup\"",
    "alias mm-check=\"mm pre-commit\"",
    "alias mm-end=\"mm end-of-day\"",
    "alias mm-week=\"mm weekly-review\"",
    "alias mm-merge=\"mm pre-merge-gate\"",
    "alias mm-911=\"mm incident-triage\"",
    "",
    "_mm_complete() {",
    "  local r=\"morning-standup pre-commit end-of-day weekly-review pre-merge-gate incident-triage\"",
    "  COMPREPLY=( $(compgen -W \"$r\" -- \"${COMP_WORDS[1]}\") )",
    "}",
    "complete -F _mm_complete mm",
    "",
  ].join("\n");

  writeFileSync(aliasPath, lines, "utf8");

  try { execSync(`chmod +x "${aliasPath}"`, { stdio: "pipe" }); } catch { /* non-fatal on Windows */ }

  log.write("scripts/shell-aliases.sh");
  written++;
}

// ---------------------------------------------------------------------------
// Install dependencies
// ---------------------------------------------------------------------------

function installDependencies() {
  log.header("Installing Dependencies");

  if (DRY_RUN) { log.dryrun("pnpm install"); return; }

  const pkgPath = join(REPO_ROOT, "package.json");
  if (!existsSync(pkgPath)) {
    log.warn("No package.json found — skipping install");
    return;
  }

  try {
    log.ok("Running pnpm install...");
    execSync("pnpm install", { cwd: REPO_ROOT, stdio: "inherit" });
    log.ok("pnpm install succeeded");
  } catch {
    log.warn("pnpm install failed — run manually: pnpm install");
  }
}

// ---------------------------------------------------------------------------
// Self-verification
// ---------------------------------------------------------------------------

function selfVerify() {
  log.header("Self-Verification");
  let allOk = true;

  log.ok("Checking required files...");
  for (const f of REQUIRED_FILES) {
    if (existsSync(join(REPO_ROOT, f))) {
      log.ok(f);
    } else {
      log.error(`${f} — MISSING`);
      allOk = false;
    }
  }

  if (DRY_RUN) {
    log.warn("Dry-run — skipping dispatcher smoke test");
    return allOk;
  }

  log.ok("Running dispatcher smoke test...");
  try {
    execSync("pnpm routine morning-standup", { cwd: REPO_ROOT, stdio: "pipe" });
    const outPath = join(REPO_ROOT, "docs/runtime/last-routine.md");
    if (existsSync(outPath)) {
      const lineCount = readFileSync(outPath, "utf8").split("\n").length;
      log.ok(`last-routine.md written (${lineCount} lines)`);
    } else {
      log.error("last-routine.md not created by dispatcher");
      allOk = false;
    }
  } catch (err) {
    log.error(`Dispatcher failed: ${err instanceof Error ? err.message : err}`);
    allOk = false;
  }

  return allOk;
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

function printSummary(ok) {
  const status = ok
    ? `${C.green}${C.bold}SETUP COMPLETE${C.reset}`
    : `${C.red}${C.bold}SETUP COMPLETED WITH ERRORS${C.reset}`;

  const failLine = failed > 0 ? `\n  Checks failed:  ${C.red}${failed}${C.reset}` : "";

  console.log(`
${C.bold}======================================================${C.reset}
  ${status}
${C.bold}======================================================${C.reset}

  Files written:  ${C.green}${written}${C.reset}
  Files skipped:  ${C.yellow}${skipped}${C.reset}  (already had content)
  Checks passed:  ${C.green}${passed}${C.reset}${failLine}

${C.bold}How to run routines:${C.reset}

  Option A — VS Code (Ctrl+Shift+P > Tasks: Run Task):
    "Routine: Morning Standup"    start of day
    "Routine: Pre-Commit Check"   before every git push
    "Routine: End of Day"         end of day
    "Routine: Weekly Review"      every Monday
    "Routine: Pre-Merge Gate"     before merging to main
    "Routine: Incident Triage"    when something breaks

  Option B — Terminal (after sourcing shell-aliases.sh):
    mm-start  mm-check  mm-end  mm-week  mm-merge  mm-911

  To persist aliases in Git Bash:
    echo "source $(pwd)/scripts/shell-aliases.sh" >> ~/.bashrc
    source ~/.bashrc

${C.bold}Next steps:${C.reset}
  1. Drop spec files into        docs/spec/
  2. Drop governance files into  docs/governance/
  3. Drop mockup HTML files into docs/mockups/
  4. Run: pnpm routine morning-standup
`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function main() {
  console.log(`\n${C.bold}MindMosaic Developer Routine Setup v2.0.0${C.reset}`);
  if (DRY_RUN)     console.log(`  ${C.yellow}Mode: DRY-RUN (no files written)${C.reset}`);
  if (VERIFY_ONLY) console.log(`  ${C.yellow}Mode: VERIFY-ONLY${C.reset}`);
  console.log();

  if (VERIFY_ONLY) {
    process.exit(selfVerify() ? 0 : 1);
  }

  // Create directories
  log.header("Creating Directory Structure");
  for (const dir of REQUIRED_DIRS) {
    if (!DRY_RUN) mkdirSync(join(REPO_ROOT, dir), { recursive: true });
    log.ok(`dir: ${dir}`);
  }

  // Write all files
  log.header("Writing Files");
  const files = buildFileContents();
  for (const [relPath, content] of Object.entries(files)) {
    writeFile(relPath, content, ALWAYS_OVERWRITE.has(relPath));
  }

  // JSON-aware package.json patch
  patchPackageJson();

  // Shell aliases (needs runtime REPO_ROOT)
  writeAliases();

  // Install dependencies
  installDependencies();

  // Verify everything
  const ok = selfVerify();
  printSummary(ok);
  process.exit(ok ? 0 : 1);
}

main();
