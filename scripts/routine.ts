#!/usr/bin/env tsx
/**
 * MindMosaic Routine Dispatcher
 * Usage: pnpm routine <routine-name>
 *
 * Reads scripts/routines/<n>.md, injects live git/file context,
 * writes to docs/runtime/last-routine.md, and prints to stdout.
 */

import { execSync }                    from "node:child_process";
import { existsSync, mkdirSync,
         readFileSync, writeFileSync } from "node:fs";
import { join, resolve }               from "node:path";

const ROOT         = resolve(__dirname, ".".repeat(1) + ".");
const ROUTINES_DIR = join(__dirname, "routines");
const RUNTIME_DIR  = join(ROOT, "docs", "runtime");
const OUTPUT       = join(RUNTIME_DIR, "last-routine.md");

const VALID = new Set([
  "morning-standup", "pre-commit", "end-of-day",
  "weekly-review",   "pre-merge-gate", "incident-triage",
]);

function shell(cmd: string, fallback = "(unavailable)"): string {
  try {
    return execSync(cmd, {
      cwd: ROOT, encoding: "utf8", timeout: 8_000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch { return fallback; }
}

function readOrDefault(path: string, fallback: string): string {
  if (!existsSync(path)) return fallback;
  const s = readFileSync(path, "utf8").trim();
  return s.length > 0 ? s : fallback;
}

function lastN(text: string, n: number): string {
  return text.split("\n").filter(l => l.trim()).slice(-n).join("\n");
}

function lastLogRow(log: string): string {
  return log.split("\n").filter(
    l => l.startsWith("|") && !l.includes("---") &&
         !l.toLowerCase().includes("date") &&
         !l.toLowerCase().includes("phase")
  ).at(-1) ?? "(no entries yet)";
}

function collectContext() {
  const now       = new Date();
  const statusRaw = readOrDefault(join(RUNTIME_DIR, "STATUS.md"),    "(STATUS.md not found)");
  const logRaw    = readOrDefault(join(RUNTIME_DIR, "DAILY_LOG.md"), "(DAILY_LOG.md not found)");
  return {
    timestamp:    now.toISOString(),
    date:         now.toLocaleDateString("en-AU", {
                    weekday: "long", year: "numeric",
                    month: "long",   day: "numeric",
                  }),
    gitBranch:    shell("git rev-parse --abbrev-ref HEAD", "unknown"),
    gitStatus:    shell("git status --short",              "(unavailable)"),
    gitLog:       shell("git log --oneline -5",            "(no commits yet)"),
    statusMd:     lastN(statusRaw, 20),
    lastLogEntry: lastLogRow(logRaw),
    ciState:      shell(
      "gh run list --branch main --limit 1 " +
      "--json status,conclusion " +
      "--jq '.[0] | .status + \":\" + (.conclusion // \"pending\")'",
      "unknown (install gh CLI)"
    ),
    openPR: shell(
      "gh pr view --json number,title,headRefName " +
      "--jq '\"PR \" + (.number|tostring) + \" \u2014 \" + .title + \" (\" + .headRefName + \")\"",
      "no open PR on current branch"
    ),
  };
}

function buildPreamble(ctx: ReturnType<typeof collectContext>): string {
  const indent = (s: string) => s.split("\n").map(l => `#   ${l}`).join("\n");
  return [
    "# +------------------------------------------------------------------+",
    "# |  LIVE CONTEXT — auto-injected by scripts/routine.ts             |",
    "# +------------------------------------------------------------------+",
    `# Timestamp:  ${ctx.timestamp}`,
    `# Date:       ${ctx.date}`,
    `# Branch:     ${ctx.gitBranch}`,
    `# CI state:   ${ctx.ciState}`,
    `# Open PR:    ${ctx.openPR}`,
    "#",
    "# Git status:",
    ctx.gitStatus ? indent(ctx.gitStatus) : "#   (clean)",
    "#",
    "# Recent commits:",
    indent(ctx.gitLog),
    "#",
    "# STATUS.md (last 20 lines):",
    indent(ctx.statusMd),
    "#",
    "# Last DAILY_LOG entry:",
    `#   ${ctx.lastLogEntry}`,
    "# -------------------------------------------------------------------",
    "",
  ].join("\n");
}

function main(): void {
  const name = process.argv[2];
  if (!name || !VALID.has(name)) {
    const list = [...VALID].map(r => `  ${r}`).join("\n");
    process.stderr.write(`Usage: pnpm routine <n>\nValid:\n${list}\n`);
    process.exit(name ? 1 : 0);
  }
  const routineFile = join(ROUTINES_DIR, `${name}.md`);
  if (!existsSync(routineFile)) {
    process.stderr.write(`Not found: ${routineFile}\nRe-run ./setup.sh\n`);
    process.exit(1);
  }
  const content   = readFileSync(routineFile, "utf8");
  const ctx       = collectContext();
  const assembled = buildPreamble(ctx) + content;
  mkdirSync(RUNTIME_DIR, { recursive: true });
  writeFileSync(OUTPUT, assembled, "utf8");
  process.stdout.write(assembled + "\n");
  process.stderr.write(
    `\nRoutine assembled: ${name}\n` +
    "Written to: docs/runtime/last-routine.md\n\n" +
    "Next: select all in last-routine.md, paste into Claude Code, press Enter.\n\n"
  );
}

main();