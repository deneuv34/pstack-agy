# pstack-agy

[pstack](https://github.com/cursor/plugins/tree/main/pstack), poteto's Cursor plugin, for **Claude Code**, **pi**, **oh-my-pi**, and **Antigravity**. It is the same skills, agents, scripts, and guide as the original, mirrored byte for byte and re-synced every week.

pstack is by [Lauren Tan (poteto)](https://x.com/poteto). Read the [original README](./upstream/pstack/README.md) and the [pstack guide](./upstream/pstack/docs/guide/README.md) for what the skills do. This repository only ports them.

## Install

### Claude Code

```
/plugin marketplace add deneuv34/pstack-agy
/plugin install pstack@pstack-agy
```

Commands take the `pstack:` prefix, such as `/pstack:poteto-mode`. This tree is upstream's own Claude Code tree, so do not also install `pstack@cursor-plugins`. To update, run `/plugin marketplace update pstack-agy`, or turn on auto-update for the marketplace in `/plugin`.

### pi

```
pi install git:github.com/deneuv34/pstack-agy
```

Run a skill with `/skill:<name>`, such as `/skill:poteto-mode`. To update, run `pi update`. pi has no subagent tool, so pstack runs each subagent as a separate `pi --print` process. See [the pi adapter](./adapters/pi.md).

### oh-my-pi

```
omp plugin marketplace add deneuv34/pstack-agy
omp plugin install pstack@pstack-agy
```

Run a skill with `/skill:<name>`. To update, run `omp plugin marketplace update`, then `omp plugin upgrade pstack@pstack-agy`.

### Antigravity

```
git clone https://github.com/deneuv34/pstack-agy
node pstack-agy/scripts/install-antigravity.mjs
```

This copies the skills and the two agents into `~/.gemini/config/skills/` and `~/.gemini/config/agents/`, with the docs beside them. It refuses to overwrite a skill or agent that it did not install. Start a new conversation, then run a skill with `/<name>`, such as `/poteto-mode`. To update, run `git pull`, then the script again. To remove pstack, run the script with `--uninstall`.

With the `agy` CLI, you can run `agy plugin install ./pstack-agy/harness/antigravity` instead. Use one way, not both.

### First run, every agent

Run `setup-pstack` once to pick your models. Each adapter says where that agent keeps the result. Then start real work with `poteto-mode`.

## How the port stays exact

| Path | What it is |
| --- | --- |
| `upstream/` | A byte-for-byte copy of `pstack/`, `harness/pstack/`, and the tree generator from `cursor/plugins`. `UPSTREAM.json` records the commit and version. Never edit it. |
| `adapters/` | One file per agent that maps Cursor's tool, subagent, model, and path names to that agent, in the shape of upstream's [Claude Code adapter](./upstream/pstack/docs/harness/claude-code.md). These files are the port. |
| `harness/<agent>/` | The tree each agent installs. `claude-code` is upstream's own tree. The others come from upstream's generator, run with that agent's adapter. Never edit them. |
| `scripts/sync.mjs` | Copies upstream into `upstream/`, then runs the build. |
| `scripts/build.mjs` | Builds `harness/`, and stamps upstream's version into every manifest. |
| `scripts/install-antigravity.mjs` | The Antigravity installer. |

A generated tree differs from upstream in these places only:

- The 22 skills that use Cursor names get one line under their title. It tells the agent to read its adapter first, the same line that upstream adds for Claude Code.
- `docs/harness/` holds that agent's adapter.
- The manifest is the one that agent reads: `.omp-plugin/plugin.json` for oh-my-pi, and `plugin.json` for pi and Antigravity.
- The `model:` line in `agents/poteto-agent.md` holds a Cursor slug. oh-my-pi would read it as its own model selector, so its tree drops the line. Antigravity agents accept only `inherit`, `flash`, or `pro`, so its tree sets `inherit`.
- A link to a pstack file that a tree leaves out points at that file on GitHub, as upstream's generator does.

The build runs upstream's generator, so its checks run too. When upstream starts using a Cursor name that an adapter has no row for, or changes the generator in a way the build does not expect, the build fails instead of shipping a wrong tree.

## Weekly sync

[`.github/workflows/sync-upstream.yml`](./.github/workflows/sync-upstream.yml) runs every Monday at 03:17 UTC:

1. It copies the latest `pstack` from `cursor/plugins` `main` and rebuilds every tree.
2. When nothing changed, it stops.
3. Otherwise it commits the change. The message lists the upstream commits and the changed skill, agent, and script files.
4. When upstream's version is new, it tags `v<version>` and publishes a GitHub release.
5. When the sync fails, it opens an issue, or comments on the open one, with a link to the run.

To sync now, run the workflow from the Actions tab, or locally:

```
node scripts/sync.mjs
```

Build on Linux or macOS. On Windows the build works, but the trees lose the executable bit on scripts, so let CI make the commits.

## License

MIT, as upstream. See [LICENSE](./LICENSE).
