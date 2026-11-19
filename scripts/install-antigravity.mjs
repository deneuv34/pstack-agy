#!/usr/bin/env node
// Install harness/antigravity into Antigravity's global folders, ~/.gemini/config/{skills,agents}.
// docs/ and README.md land beside them, where each skill's ../../ links point.
// Usage: node scripts/install-antigravity.mjs [--uninstall]
// With the agy CLI you can run `agy plugin install ./harness/antigravity` instead. Do not use both.

import { cpSync, existsSync, readdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const TREE = join(import.meta.dirname, "..", "harness", "antigravity");
const CONFIG = process.env.ANTIGRAVITY_CONFIG_DIR ?? join(homedir(), ".gemini", "config");
const RECORD = join(CONFIG, "pstack-install.json");

const previous = existsSync(RECORD) ? JSON.parse(readFileSync(RECORD, "utf8")).paths : [];
const remove = () => {
  for (const path of previous) rmSync(join(CONFIG, path), { recursive: true, force: true });
  rmSync(RECORD, { force: true });
  for (const dir of ["docs/harness", "docs"]) {
    try {
      rmdirSync(join(CONFIG, dir)); // only when empty
    } catch {}
  }
};

if (process.argv.includes("--uninstall")) {
  remove();
  console.log(`removed pstack from ${CONFIG}`);
  process.exit(0);
}

const paths = [
  ...readdirSync(join(TREE, "skills")).map((name) => `skills/${name}`),
  ...readdirSync(join(TREE, "agents")).map((name) => `agents/${name}`),
  "docs/harness/antigravity.md",
  "docs/guide",
  "README.md",
];
// Never overwrite a skill, agent, or file this script did not install. Check before removing the last install.
const taken = paths.filter((path) => !previous.includes(path) && existsSync(join(CONFIG, path)));
if (taken.length > 0) {
  console.error(`not installing: ${CONFIG} already has ${taken.join(", ")}. Move them away and rerun.`);
  process.exit(1);
}
// Removing the last install first drops skills that upstream renamed or deleted.
remove();
for (const path of paths) cpSync(join(TREE, path), join(CONFIG, path), { recursive: true });
const { version } = JSON.parse(readFileSync(join(TREE, "plugin.json"), "utf8"));
writeFileSync(RECORD, `${JSON.stringify({ version, paths }, null, 2)}\n`);
console.log(`installed pstack ${version} into ${CONFIG}: ${paths.length} paths. Start a new conversation, or run /skills reload.`);
