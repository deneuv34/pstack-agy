# pstack in pi

pstack skills use Cursor names. In pi, read this file once per session, then map each Cursor name in a skill with the tables below. `<pstack>` means the folder that holds `skills/` and `docs/`, two levels above the SKILL.md you are following. If a Cursor field has no row, drop it and say so. Never pass a flag or value pi rejects.

pi has no subagent, todo, or question tool of its own. A pstack subagent is a separate `pi` process that you start with `bash`. If a flag below is rejected, run `pi --help` once and use the form your version shows.

## Tools

| Cursor | pi |
| --- | --- |
| `Task` | `bash` running `pi --print --no-session "<brief>"` with the flags in Subagent fields. The brief is the subagent's whole context, so it carries everything the subagent needs. The subagent's final text comes back on stdout. If the session lists a `subagent` tool, such as the one from pi's subagent example extension, use that instead. |
| `AskQuestion` | Ask in plain text and end your turn. In `--print` mode no one can answer, so take the default the skill names and say so. |
| Open a todolist, or copy steps into the todolist tool | Use a `todo` tool if the session lists one. Otherwise keep the list in your reply and update it at each phase. |
| Run another pstack skill (`/name` or "the **name** skill") | `read` `<pstack>/skills/<name>/SKILL.md` and follow it. When you tell the user to type it, write `/skill:<name>`. |
| `Grep`, `Glob` | `grep` and `find` when the session lists them. Otherwise `bash` with `rg`. |

## Subagent fields

| Cursor | pi |
| --- | --- |
| `subagent_type: generalPurpose` | A plain `pi --print --no-session` run. |
| `poteto-agent`, `comment-sicko` | Add `--append-system-prompt <pstack>/agents/poteto-agent.md` or `--append-system-prompt <pstack>/agents/comment-sicko.md` to the run. |
| The `model:` line in `poteto-agent`'s file | It holds a Cursor slug, and pi ignores it. Pass `--model` and `--thinking` on every run that spawns `poteto-agent`, mapped with the Models table. |
| `readonly: true` | `--tools read,grep,find,ls`. The brief also says "do not edit files", and you check `git status` afterward. |
| `readonly: false` | pi's default tools. |
| `environment: "cloud"` | Run it in its own git worktree: `git worktree add <path> <branch>`, then `cd <path> && pi --print ...`. Name the branch or commit the worker checks out. |
| `environment: "local"` | Omit. |
| `cloud_base_branch: <b>` | Tell the worker to check out `<b>` first. |
| `run_in_background: true` | Start each run in the background with its output in a file, `pi --print ... > <file> 2>&1 &`, then `wait` and read the files. A run without `&` blocks until it ends. |
| `resume` | Start a new run and paste the earlier result into its brief. |
| `file_attachments` | Pass each file as an `@<path>` argument, or list the paths in the brief. |

## Models

| Cursor | pi |
| --- | --- |
| `claude-<family>-<version>-<effort>[-fast]`, such as `claude-opus-5-5-xhigh` | `--model <provider>/claude-<family>-<version> --thinking <effort>`, such as `--model anthropic/claude-opus-5-5 --thinking xhigh`. Drop `-fast`. Take the provider from `pi --list-models claude-<family>-<version>`. If it shows no match, omit `--model`, and say so. |
| A `gemini-*`, `gpt-*`, `grok-*`, or other slug | Split it the same way, with the last token as `--thinking`: `gemini-4-neon-high` is `--model <provider>/gemini-4-neon --thinking high`. If `pi --list-models <id>` shows no match, omit `--model` so the run uses pi's default model, and say so. |
| `auto` or `inherit-parent` | Pass the model this session runs on when you know it. Otherwise omit `--model`, and the run uses pi's default model. |
| The `pstack-models.mdc` rule, `~/.cursor/rules/pstack-models.mdc` | `~/.pi/agent/pstack-models.md`. pi does not load it on its own, so read it when a skill needs a role's model. If the file or the role's line is missing, use the skill's default slug. |
| A role value `<model> <effort>`, such as `anthropic/claude-opus-5-5 high` | `--model <model> --thinking <effort>`. |

## setup-pstack

pi loads no rule files, so `setup-pstack` writes a plain file that this adapter reads. Follow its steps with these changes:

- Detect. Run `pi --list-models`. The detected models are the ids it lists, as `provider/id`. Write a real model as `<provider/id> <effort>`, such as `anthropic/claude-opus-5-5 xhigh`. The effort is the last token, so the budget step works as written.
- Defaults. Map each default slug with the rows above: `claude-opus-5-5-xhigh-fast` is the detected Opus 5.5 id with `xhigh`, `claude-opus-5-5-high-fast` is that id with `high`, `claude-fable-5-2-high` is the detected Fable 5.2 id with `high`, and `gemini-4-neon-high` is the detected Gemini 4 Neon id with `high`. A default with no detected id is `inherit-parent`.
- Write. Write `~/.pi/agent/pstack-models.md` with no frontmatter, then the comment lines, the `# budget` line, and one line per role from step 5. Overwrite the whole file. Never put the role lines in `AGENTS.md`, `SYSTEM.md`, or `APPEND_SYSTEM.md`.

## Paths

| Cursor | pi |
| --- | --- |
| `.cursor/skills/`, `~/.cursor/skills/` | `.pi/skills/` or `.agents/skills/`, `~/.pi/agent/skills/` or `~/.agents/skills/` |
| `~/.cursor/plugins/`, `.cursor-plugin/plugin.json` | `~/.pi/agent/git/github.com/deneuv34/pstack-agy/harness/pi/`, where `pi install git:...` puts this port's pi tree, and `<pstack>/plugin.json`, which holds the pstack version. The clone has trees for other agents too, so use only the `harness/pi/` copy. |
| `.cursor/rules/*.mdc`, always-applied rules | `AGENTS.md` in the project, or `~/.pi/agent/AGENTS.md` for every project. pi never reads `.mdc` files. The model rule is the exception. See Models. |
| `https://github.com/cursor/plugins/blob/main/pstack/<path>` | `<pstack>/<path>` when that file exists. The package ships the skills, `docs/guide/`, and `README.md`. Read the local copy and never fetch it. Give the user the URL when they need a link. |
| Transcripts in `~/.cursor/projects/<slug>/agent-transcripts/` | `~/.pi/agent/sessions/<slug>/*.jsonl`, one folder per working directory, named from its path, so `C:\Users\you\proj` is `--C--Users-you-proj--`. List `~/.pi/agent/sessions/` and take the folder for this workspace. The newest `.jsonl` in it is the current session. Runs started with `--no-session` leave no transcript. Read only this workspace's folder. |

## Cursor-only features

pi has no Cursor Automations, Bugbot, Cursor cloud agents, or built-in PR tool. When a step needs one, put one line in your reply, `Skipped in pi: <step>. <reason>.`, then go on to the next step. Do not stop, ask, or retry. When a later step needs what the skipped step made, such as a URL or a key, leave a placeholder and name it in the line.

| Cursor | pi |
| --- | --- |
| Cursor Automations: routines, `update_state` routine calls, `api2.cursor.sh/automations` webhooks, routine wakes, and `SendToUser` secret requests | Skip with the line. |
| Bugbot | Bugbot comments on a GitHub PR are ordinary review threads, so triage them with the forge command that the step gives. Skip a step that starts, waits for, or configures Bugbot when the PR has no Bugbot check or comment. |
| Cursor cloud agents | `environment: "cloud"` maps to a worktree, as in Subagent fields. Skip a step that needs the cloud agent itself, such as its dashboard status or its own machine. |
| A built-in PR tool | Use the forge command that the step gives, such as `gh pr create`. That is not a skip, so write no line. |
