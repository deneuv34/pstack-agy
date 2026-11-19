#!/usr/bin/env node
// Mirror pstack from cursor/plugins into upstream/ byte for byte, then rebuild every harness tree.
// Usage: node scripts/sync.mjs [ref]   (ref defaults to main)

import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REPO = "https://github.com/cursor/plugins";
const REF = process.argv[2] ?? "main";
const ROOT = join(import.meta.dirname, "..");
const UPSTREAM = join(ROOT, "upstream");
// pstack itself, the Claude Code tree upstream generates from it, and the generator every other tree reuses.
const PATHS = ["pstack", "harness/pstack", "scripts/generate-pstack-harness-trees.mjs"];

const git = (cwd, ...args) => execFileSync("git", ["-c", "core.autocrlf=false", ...args], { cwd, encoding: "utf8" }).trim();

const tmp = mkdtempSync(join(tmpdir(), "pstack-upstream-"));
try {
  const src = join(tmp, "plugins");
  // Full history without file contents, so the lock can name the last commit that touched the mirrored paths.
  git(tmp, "clone", "--quiet", "--branch", REF, "--filter=blob:none", "--no-checkout", REPO, src);
  git(src, "sparse-checkout", "set", "--no-cone", ...PATHS.map((path) => `/${path}`));
  git(src, "checkout", "--quiet");

  rmSync(UPSTREAM, { recursive: true, force: true });
  for (const path of PATHS) cpSync(join(src, path), join(UPSTREAM, path), { recursive: true });

  const { version } = JSON.parse(readFileSync(join(UPSTREAM, "pstack", "plugin.json"), "utf8"));
  // Upstream's HEAD is usually an unrelated plugin's commit. Recording it would change the lock every week.
  const [commit, committedAt] = git(src, "log", "-1", "--format=%H%n%cI", "--", ...PATHS).split("\n");
  const lock = { repository: REPO, ref: REF, commit, committedAt, version };
  writeFileSync(join(UPSTREAM, "UPSTREAM.json"), `${JSON.stringify(lock, null, 2)}\n`);
  console.log(`upstream: pstack ${version} at ${lock.commit.slice(0, 7)}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

execFileSync(process.execPath, [join(ROOT, "scripts", "build.mjs")], { stdio: "inherit" });
