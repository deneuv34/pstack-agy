# pstack in Antigravity

pstack skills use Cursor names. In Antigravity, read this file once per session, then map each Cursor name in a skill with the tables below. `<pstack>` means the folder that holds `skills/` and `docs/`, two levels above the SKILL.md you are following. If a Cursor field has no row, drop it and say so. Never pass a field or value the tool schema rejects.

Antigravity's tool names differ between the IDE, the App, and the `agy` CLI. Each row names the usual tool. When your session lists another name for the same job, use that one.

## Tools

| Cursor | Antigravity |
| --- | --- |
| `Task` | `invoke_subagent` (`start_subagent` in some builds). A subagent starts with a fresh context, so the brief carries everything it needs. |
| `AskQuestion` | `ask_question`. When the session has none, ask in plain text. |
| Open a todolist, or copy steps into the todolist tool | Keep the list in the conversation's task artifact when the session offers one, such as through `task_boundary`. Otherwise keep the list in your reply and update it at each phase. |
| Run another pstack skill (`/name` or "the **name** skill") | `view_file` `<pstack>/skills/<name>/SKILL.md` and follow it. When you tell the user to type it, write `/<name>`. |
| `Grep`, `Glob` | `grep_search` and `find_by_name`, or `run_command` with `rg`. |

## Subagent fields

| Cursor | Antigravity |
| --- | --- |
| `subagent_type: generalPurpose` | The built-in `self` subagent. |
| `poteto-agent`, `comment-sicko` | The `poteto-agent` and `comment-sicko` agents that pstack installs. Invoke them by name. |
| The `model:` line in `poteto-agent`'s file | The Antigravity tree sets it to `inherit`, so the agent runs on the session model. Antigravity agents take only a tier, `inherit`, `flash`, or `pro`, never a slug or an effort. |
| `readonly: true` | The built-in `research` subagent when the job is reading and searching. Otherwise `self`. Either way the brief says "do not edit files", and you check `git status` afterward. |
| `readonly: false` | `self`. |
| `environment: "cloud"` | Antigravity has no cloud agents. Create a worktree with `git worktree add` and tell the worker to work only there. Name the branch or commit the worker checks out. |
| `environment: "local"` | Omit. |
| `cloud_base_branch: <b>` | Tell the worker to check out `<b>` first. |
| `run_in_background: true` | Omit. Invoke independent subagents together when the session allows parallel calls, otherwise one after another. |
| `resume` | Invoke a new subagent and paste the earlier result into its brief. |
| `file_attachments` | List the paths in the brief. |

## Models

Antigravity picks one model per conversation, chosen in its model selector. A subagent cannot take a model or an effort per call. So every pstack role, panel seats included, runs on the session model. Say so once per run, and still run one subagent per panel entry, naming in each brief the seat it fills.

| Cursor | Antigravity |
| --- | --- |
| `claude-<family>-<version>-<effort>[-fast]`, such as `claude-opus-5-5-xhigh` | The session model. |
| A `gemini-*`, `gpt-*`, `grok-*`, or other slug | The session model. |
| `auto` or `inherit-parent` | The session model. |
| The `pstack-models.mdc` rule, `~/.cursor/rules/pstack-models.mdc` | `~/.gemini/config/rules/pstack-models.md`, a rule with `trigger: always_on` frontmatter, so its role lines are already in context. If they are not, read the file. If the file or the role's line is missing, use the skill's default slug. |
| A role value `<model> <effort>`, such as `pro high` | The session model. The value records the user's choice for when the session model can be changed. |

## setup-pstack

Antigravity loads every rule in `~/.gemini/config/rules/`, so `setup-pstack` writes its rule there. Follow its steps with these changes:

- Detect. The detected models are the ones the model selector lists, such as Gemini 4 Neon or Claude Opus 5.5. Ask the user to confirm them. Write a real model as `<model> <effort>`, such as `gemini-4-neon xhigh`. The effort is the last token, so the budget step works as written.
- Defaults. Map each default slug the same way: `claude-opus-5-5-xhigh-fast` is `claude-opus-5-5 xhigh`, `claude-opus-5-5-high-fast` is `claude-opus-5-5 high`, `claude-fable-5-2-high` is `claude-fable-5-2 high`, and `gemini-4-neon-high` is `gemini-4-neon high`. A default the selector does not list is `inherit-parent`.
- Write. Write `~/.gemini/config/rules/pstack-models.md` with the frontmatter `trigger: always_on`, then the comment lines, the `# budget` line, and one line per role from step 5. Overwrite the whole file. Never put the role lines in `GEMINI.md` or `AGENTS.md`.
- Confirm. Tell the user that Antigravity runs every role on the session model, so the rule takes effect only through the model they pick.

## Paths

| Cursor | Antigravity |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `.agents/skills/`, `~/.gemini/config/skills/` |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | `~/.gemini/config/`, where pstack's installer puts `skills/` and `agents/`, with the version in `~/.gemini/config/pstack-install.json`. After `agy plugin install`, it is `~/.gemini/config/plugins/`, with the version in `<pstack>/plugin.json`. |
| `.cursor/rules/*.mdc`, always-applied rules | `AGENTS.md` (or `GEMINI.md`) in the project, or `.agents/rules/*.md` with `trigger: always_on` frontmatter. Antigravity never reads `.mdc` files. The model rule is the exception. See Models. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when that file exists. The plugin ships the skills, `docs/guide/`, and `README.md`. Read the local copy and never fetch it. Give the user the URL when they need a link. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | Antigravity stores conversations in a binary format you cannot read. Use the conversation artifacts in `~/.gemini/antigravity/brain/<conversation-id>/`, such as task lists, plans, and walkthroughs, when they exist, and git history otherwise. Say which you used. |

## Cursor-only features

Antigravity has no Cursor Automations, Bugbot, Cursor cloud agents, or built-in PR tool. When a step needs one, put one line in your reply, `Skipped in Antigravity: <step>. <reason>.`, then go on to the next step. Do not stop, ask, or retry. When a later step needs what the skipped step made, such as a URL or a key, leave a placeholder and name it in the line.

| Cursor | Antigravity |
| --- | --- |
| Cursor Automations: routines, `update_state` routine calls, `api2.cursor.sh/automations` webhooks, routine wakes, and `SendToUser` secret requests | Skip with the line. |
| Bugbot | Bugbot comments on a GitHub PR are ordinary review threads, so triage them with the forge command that the step gives. Skip a step that starts, waits for, or configures Bugbot when the PR has no Bugbot check or comment. |
| Cursor cloud agents | `environment: "cloud"` maps to a worktree, as in Subagent fields. Skip a step that needs the cloud agent itself, such as its dashboard status or its own machine. |
| A built-in PR tool | Use the forge command that the step gives, such as `gh pr create`. That is not a skip, so write no line. |
