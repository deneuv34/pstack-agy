#!/usr/bin/env node
// Build harness/<agent>/ from upstream/ with no hand edits.
// claude-code is the tree upstream generates, copied as is. Every other tree comes from upstream's own generator,
// pointed at that agent's adapter in adapters/, so its files match upstream byte for byte except the one adapter
// line each wrapped SKILL.md gets, exactly as upstream does for Claude Code.

import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const UPSTREAM = join(ROOT, "upstream");
const HARNESS = join(ROOT, "harness");
const GENERATOR = "scripts/generate-pstack-harness-trees.mjs";

// agentModel rewrites the Cursor slug in agents/*.md frontmatter, which these agents would misread: null drops the line.
const TREES = {
  pi: { label: "pi", manifests: ["plugin.json"] },
  // .omp-plugin makes omp read the tree as an omp-native plugin, whose agent `model:` it parses as an omp selector.
  omp: { label: "oh-my-pi", manifests: [".omp-plugin/plugin.json"], agentModel: null },
  // Antigravity agents take only a tier: inherit, flash, or pro.
  antigravity: { label: "Antigravity", manifests: ["plugin.json"], agentModel: "inherit" },
};

// Each swap must match, so an upstream change to the generator fails the build instead of producing a wrong tree.
function patch(source, name, { label, manifests }) {
  const swaps = [
    [`const TREE = "claude-code";`, `const TREE = ${JSON.stringify(name)};`],
    [`const ADAPTER = "docs/harness/claude-code.md";`, `const ADAPTER = "docs/harness/${name}.md";`],
    [`const MANIFESTS = ["plugin.json", ".claude-plugin/plugin.json"];`, `const MANIFESTS = ${JSON.stringify(manifests)};`],
    // The adapter line every wrapped SKILL.md gets. The replaceAll below renames the agent in it.
    ["`In Claude Code, read [the Claude Code adapter]", "`In Claude Code, read [the Claude Code adapter]"],
  ];
  // Upstream assumes POSIX paths. On Windows its file keys come out with backslashes, so turn them into slashes.
  // ponytail: local Windows runs only; CI builds on Linux and never applies this. Windows loses the executable bit.
  if (process.platform === "win32") swaps.push(["[relative(PSTACK, path), file(path)]", '[relative(PSTACK, path).replaceAll("\\\\", "/"), file(path)]']);
  for (const [from, to] of swaps) {
    if (!source.includes(from)) throw new Error(`${GENERATOR} no longer contains ${from}. Update scripts/build.mjs.`);
    source = source.replace(from, to);
  }
  return source.replaceAll("Claude Code", label);
}

function setAgentModel(dir, model) {
  for (const name of readdirSync(dir).filter((name) => name.endsWith(".md"))) {
    const path = join(dir, name);
    const line = model === null ? "" : `model: ${model}\n`;
    const text = readFileSync(path, "utf8").replace(/^(---\n(?:(?!---\n)[^\n]*\n)*?)model: [^\n]*\n/, `$1${line}`);
    // A model line in a shape the swap missed would ship the Cursor slug, so fail instead.
    const left = text.match(/^---\r?\n[\s\S]*?\n---/)?.[0].match(/^model:\s*(.*?)\s*$/m)?.[1];
    if (left !== undefined && left !== model) throw new Error(`agents/${name} still has model: ${left}. Update setAgentModel.`);
    writeFileSync(path, text);
  }
}

rmSync(HARNESS, { recursive: true, force: true });
cpSync(join(UPSTREAM, "harness", "pstack", "claude-code"), join(HARNESS, "claude-code"), { recursive: true });

const generator = readFileSync(join(UPSTREAM, GENERATOR), "utf8");
for (const [name, tree] of Object.entries(TREES)) {
  const stage = mkdtempSync(join(tmpdir(), `pstack-${name}-`));
  try {
    cpSync(join(UPSTREAM, "pstack"), join(stage, "pstack"), { recursive: true });
    cpSync(join(ROOT, "adapters", `${name}.md`), join(stage, "pstack", "docs", "harness", `${name}.md`));
    mkdirSync(join(stage, "scripts"));
    writeFileSync(join(stage, GENERATOR), patch(generator, name, tree));
    process.stdout.write(`${name}: `);
    execFileSync(process.execPath, [join(stage, GENERATOR)], { stdio: "inherit" });
    cpSync(join(stage, "harness", "pstack", name), join(HARNESS, name), { recursive: true });
  } finally {
    rmSync(stage, { recursive: true, force: true });
  }
  if ("agentModel" in tree) setAgentModel(join(HARNESS, name, "agents"), tree.agentModel);
}

// Every manifest carries upstream's version, so each agent's updater sees a new upstream release as an update.
const { version } = JSON.parse(readFileSync(join(UPSTREAM, "pstack", "plugin.json"), "utf8"));
const stamp = (path, edit) => {
  const json = JSON.parse(readFileSync(join(ROOT, path), "utf8"));
  edit(json);
  writeFileSync(join(ROOT, path), `${JSON.stringify(json, null, 2)}\n`);
};
stamp("package.json", (pkg) => (pkg.version = version));
for (const marketplace of [".claude-plugin/marketplace.json", ".omp-plugin/marketplace.json"]) {
  stamp(marketplace, ({ plugins }) => plugins.forEach((plugin) => (plugin.version = version)));
}
console.log(`harness trees built for pstack ${version}`);
