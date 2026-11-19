# pstack in oh-my-pi

pstack skills use Cursor names. In oh-my-pi (`omp`), read this file once per session, then map each Cursor name in a skill with the tables below. `<pstack>` means the folder that holds `skills/` and `docs/`, two levels above the SKILL.md you are following. If a Cursor field has no row, drop it and say so. Never pass a field or value the tool schema rejects.

## Tools

| Cursor | oh-my-pi |
| --- | --- |
| `Task` | `task`. In its batch shape, `context` goes to every subagent and each `tasks` item is one subagent with its own `task` text. Fill every field the schema marks required. Items in one call run in parallel. |
| `AskQuestion` | `ask`. In `omp --print` mode it is absent, so ask in plain text. |
| Open a todolist, or copy steps into the todolist tool | `todo`, with `init` for the list and `start` and `done` as each step moves. |
| Run another pstack skill (`/name` or "the **name** skill") | `read` `<pstack>/skills/<name>/SKILL.md` and follow it. When you tell the user to type it, write `/skill:<name>`. |
| `Grep`, `Glob` | `grep`, `glob`. |

## Subagent fields

| Cursor | oh-my-pi |
| --- | --- |
| `subagent_type: generalPurpose` | `agent: "task"`, the built-in full-access worker. |
| `poteto-agent`, `comment-sicko` | `agent: "poteto-agent"`, `agent: "comment-sicko"`. The pstack plugin ships both. |
| The `model:` line in `poteto-agent`'s file | The oh-my-pi tree drops it. `task` takes no model per call, so `poteto-agent` runs on omp's `task` model role, or on its entry in the `task.agentModelOverrides` setting. When the schema lists `effort` (setting `task.enableEffort`), pass `hi` for `xhigh`, `high`, or `max`, `med` for `medium`, and `lo` for `low` or `minimal`. Say once per run which model the role ran on. |
| `readonly: true` | `agent: "scout"` when a fast read-only search fits, since it has only `read`, `grep`, `glob`, and `web_search`. Otherwise keep the agent, and the brief says "do not edit files", and you check `git status` afterward. |
| `readonly: false` | `agent: "task"`. |
| `environment: "cloud"` | `isolated: true` on the item when the schema lists it, which runs the subagent in its own worktree. Otherwise create one with `git worktree add` and tell the worker to work only there. Name the branch or commit the worker checks out. |
| `environment: "local"` | Omit. |
| `cloud_base_branch: <b>` | Tell the worker to check out `<b>` first. |
| `run_in_background: true` | Omit. The items of one `task` call run in parallel, and with `async.enabled` they run in the background and report back. |
| `resume` | Spawn a new task and paste the earlier result into its brief. |
| `file_attachments` | List the paths in the brief. |

## Models

`task` takes no model per call. A subagent runs on its agent's model, on omp's `task` model role, or on the agent's entry in the `task.agentModelOverrides` setting. Per call you can pass only `effort`, as in Subagent fields. So a panel that asks for several models runs each seat on the `task` model unless the user has set overrides. Say so once per run, and still run one subagent per panel entry, naming in each brief the seat it fills. Map a slug to an omp selector only to tell the user what to put in a model role or an override.

| Cursor | oh-my-pi |
| --- | --- |
| `claude-<family>-<version>-<effort>[-fast]`, such as `claude-opus-5-5-xhigh` | The selector `claude-<family>-<version>:<effort>`, such as `claude-opus-5-5:xhigh`. Drop `-fast`. omp matches the id across the providers you have logged in to. |
| A `gemini-*`, `gpt-*`, `grok-*`, or other slug | Split it the same way, with the last token as the effort: `gemini-4-neon-high` is `gemini-4-neon:high`. Run `omp models` to check that omp has it. |
| `auto` or `inherit-parent` | The `task` model role. |
| The `pstack-models.mdc` rule, `~/.cursor/rules/pstack-models.mdc` | `~/.omp/agent/pstack-models.md`. omp does not load it on its own, so read it when a skill needs a role's model. If the file or the role's line is missing, use the skill's default slug. |
| A role value `<model> <effort>`, such as `anthropic/claude-opus-5-5 high` | The selector `<model>:<effort>`. A role value can also be an omp model role such as `@slow`. |

## setup-pstack

omp loads no rule file for pstack, so `setup-pstack` writes a plain file that this adapter reads. Follow its steps with these changes:

- Detect. Run `omp models`. The detected models are the ones it lists, as `provider/id`. Write a real model as `<provider/id> <effort>`, such as `anthropic/claude-opus-5-5 xhigh`. The effort is the last token, so the budget step works as written.
- Defaults. Map each default slug with the rows above: `claude-opus-5-5-xhigh-fast` is the detected Opus 5.5 id with `xhigh`, `claude-opus-5-5-high-fast` is that id with `high`, `claude-fable-5-2-high` is the detected Fable 5.2 id with `high`, and `gemini-4-neon-high` is the detected Gemini 4 Neon id with `high`. A default with no detected id is `inherit-parent`.
- Write. Write `~/.omp/agent/pstack-models.md` with no frontmatter, then the comment lines, the `# budget` line, and one line per role from step 5. Overwrite the whole file. Never put the role lines in `AGENTS.md` or `SYSTEM.md`.
- Confirm. Tell the user that `task` cannot pick a model per call, so a role's model takes effect only through omp's `task` model role or `task.agentModelOverrides`.

## Paths

| Cursor | oh-my-pi |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `.omp/skills/` or `.agents/skills/`, `~/.omp/agent/skills/` or `~/.agents/skills/` |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | `~/.omp/plugins/`, where omp installs marketplace plugins, and `.omp-plugin/plugin.json`. |
| `.cursor/rules/*.mdc`, always-applied rules | `AGENTS.md` in the project, or `~/.omp/agent/AGENTS.md` for every project. omp never reads `.mdc` files. The model rule is the exception. See Models. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when that file exists. The plugin ships the skills, `docs/guide/`, and `README.md`. Read the local copy and never fetch it. Give the user the URL when they need a link. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | `~/.omp/agent/sessions/<slug>/*.jsonl`, one folder per working directory, named from its path, so `C:\Users\you\proj` is `--C--Users-you-proj--`. List `~/.omp/agent/sessions/` and take the folder for this workspace. The newest `.jsonl` in it is the current session. Read only this workspace's folder. |

## Cursor-only features

oh-my-pi has no Cursor Automations, Bugbot, Cursor cloud agents, or built-in PR tool. When a step needs one, put one line in your reply, `Skipped in oh-my-pi: <step>. <reason>.`, then go on to the next step. Do not stop, ask, or retry. When a later step needs what the skipped step made, such as a URL or a key, leave a placeholder and name it in the line.

| Cursor | oh-my-pi |
| --- | --- |
| Cursor Automations: routines, `update_state` routine calls, `api2.cursor.sh/automations` webhooks, routine wakes, and `SendToUser` secret requests | Skip with the line. |
| Bugbot | Bugbot comments on a GitHub PR are ordinary review threads, so triage them with the forge command that the step gives. Skip a step that starts, waits for, or configures Bugbot when the PR has no Bugbot check or comment. |
| Cursor cloud agents | `environment: "cloud"` maps to a worktree, as in Subagent fields. Skip a step that needs the cloud agent itself, such as its dashboard status or its own machine. |
| A built-in PR tool | Use the forge command that the step gives, such as `gh pr create`. That is not a skip, so write no line. |
