---
name: release-coordinator
description: Use when committing, releasing, or version-bumping any substantial change in the Brave Search MCP extension. Triggers on "commit this", "let's commit", "commit and push", "ready to commit", "cut a release", "create a release", "time to release", "bump the patch/minor/major version", "push this", "push the release", "publish to the marketplace", or when local feature branches are stacking up. NEVER run git commands directly when this skill applies — always dispatch the release-coordinator agent.
allowed-tools: Agent
---

# Release Coordinator Skill

This skill is a **mandatory dispatcher**. When any commit, release, version-bump, push,
tag, publish, or branch-checkpoint intent is detected, you do **not** run git commands
yourself — you dispatch the `release-coordinator` agent (defined in
`.claude/agents/release-coordinator.md`). The agent owns the full process: diff analysis,
branch-hygiene nudge, doc reconciliation, CHANGELOG drafting, the version gate, the
three-place version bump, clean commits, and the pause before any outward action.

**Your only job here is to invoke the agent with the right context, then step aside.**

## Trigger phrases

| Phrase | Intent | Push implied? |
|--------|--------|---------------|
| "commit this", "let's commit", "ready to commit" | Standard commit workflow | No — pause before outward actions |
| "commit and push", "push this", "push the release" | Commit then push | Yes — the user explicitly authorized push |
| "cut a release", "create a release", "time to release" | Full release workflow | No by default — the agent prepares everything and **pauses before push/tag/publish** unless "push" was said |
| "bump the patch version" | Patch release | No by default — version level is chosen, push still gated |
| "bump the minor version" | Minor release | No by default — version level is chosen, push still gated |
| "bump the major version" | Major (breaking) release | No — major needs explicit confirmation; push still gated |
| "publish to the marketplace" | `vsce publish` | No — publish is always an explicit gate |
| feature branches piling up | Branch-checkpoint nudge | No |

> **Posture:** push, tag, and `vsce publish` are **always an explicit gate** — the agent
> pauses before any outward action even during a "release," unless the user said
> "push"/"and push." Per CLAUDE.md and global rules, commit/push only when the user asks.

> **⚠️ This is a public Marketplace extension with 700+ live users on auto-update.** A bad
> publish can't be cleanly un-published — only superseded by another release. So `vsce publish`
> is the highest-stakes action: it is gated on the user's explicit go **and** on the agent
> walking its Pre-publish checklist (compile + lint clean, all three versions synced and
> strictly greater than the published one, `.vsix` inspected, **user-confirmed F5 smoke test**,
> rollback noted). The agent also runs a blast-radius scan on every release and a secret-hygiene
> scan before every commit. The user said "push" authorizes push — it does **not** authorize
> publish; publish is its own confirmation.

## Repo-specific context to pass the agent

**Versioning lives in THREE places** (the agent's defining concern):
1. `package.json` → `version`
2. `MCP_SERVER_VERSION` constant in `src/extension.ts`
3. `CHANGELOG.md` — a new dated `## [X.Y.Z] - YYYY-MM-DD` section **and** the
   compare-link reference at the bottom of the file.

Releases are git-tagged `vX.Y.Z`. The agent verifies a bump with `npm run compile`
and (for publishing) `npm run package` → `vsce publish`.

**SemVer rules (post-1.0, published Marketplace extension):**
- **PATCH** (`X.Y.Z+1`) — the common case: fixes, dependency bumps, doc-only changes,
  internal cleanup.
- **MINOR** (`X.Y+1.0`) — a notable new user-facing capability (new search tool surfaced,
  new command/setting, meaningful UX addition).
- **MAJOR** (`X+1.0.0`) — a breaking change for users (dropping VS Code version support,
  renaming/removing a `braveSearchMcp.*` setting or command). Rare; needs explicit confirmation.

**The version gate is a hard, blocking question the agent always puts to the user** — it
never decides, defaults, or carries a prior session's choice forward. When the user says
"bump the patch/minor/major version," that *is* the user's level choice: the agent still
drafts the CHANGELOG and confirms the computed next number, but doesn't re-ask the level.

**Doc reconciliation targets:** `CHANGELOG.md`, `README.md`, `QUICKSTART.md`, `CLAUDE.md`,
and `package.json` metadata. A *large* reconciliation (a settings/command rename touching
README + CLAUDE.md + package.json together, a restructure) → the agent STOPS and flags
scope first.

**Architecture reminder:** this extension is a thin shim — the actual search tools live in
the upstream `@brave/brave-search-mcp-server` package. A behavior change in search itself is
upstream, not changelog material for this repo. The upstream package is **pinned to an exact
version** (`BRAVE_SEARCH_SERVER_VERSION` in `src/extension.ts`) — upstream doesn't follow semver,
so the pin must never be loosened to a range or `latest`. Bumping the pin ships a new server to
all 700+ users and counts as a tested, user-facing release.

**Public-release guardrails (700+ users):** the agent treats publish as the highest-stakes
action and enforces, on every release:
- a **blast-radius scan** of user-facing surfaces (`contributes.configuration` /
  `contributes.commands` / `activationEvents` / `engines.vscode` in `package.json`, the
  upstream pin and identity constants in `src/extension.ts`) — any change is flagged
  **USER IMPACT** and a setting/command rename pushes the bump to **MAJOR**;
- a **pre-publish checklist** before any `vsce publish` (compile + lint clean; all three
  versions synced and strictly greater than the published version; `.vsix` built and
  inspected; **user-confirmed F5 smoke test**; rollback version noted);
- a **secret-hygiene scan** (no `BSA…` key / `.env` / PAT) before every commit;
- **post-publish verification** that the Marketplace and git tag reflect the release.

## How to dispatch

Invoke the agent with enough context to skip re-discovery:

```
Agent({
  subagent_type: "release-coordinator",
  prompt: "Release/commit workflow triggered by: '<user's exact phrase>'.
  Push implied: <yes only if the user said push/and-push; otherwise no — pause before outward>.
  Version level implied: <patch/minor/major/unspecified>.
  Repo context: versioning = THREE sync points — package.json version + MCP_SERVER_VERSION in src/extension.ts + CHANGELOG.md (dated section + footer compare link); releases tagged vX.Y.Z. PATCH = common (fixes/deps/docs); MINOR = new user-facing capability; MAJOR = breaking change (rare, needs confirmation). Verify bumps with npm run compile. The version bump is an explicit user gate — always ask unless the level was named. Pause before any push/tag/publish.
  PUBLIC RELEASE — 700+ live users on auto-update; a bad publish can only be superseded, not undone. Run the blast-radius scan (guardrails §A) on user-facing surfaces and flag USER IMPACT (a setting/command rename ⇒ MAJOR). Before any vsce publish, walk the full pre-publish gate (§B: compile+lint clean, three versions synced and strictly greater than published, .vsix built + inspected, USER-confirmed F5 smoke test, rollback noted). Secret-hygiene scan before every commit (§C). Post-publish verification after publish (§D). 'push' authorizes push, not publish.
  Proceed with the standard release-coordinator process."
})
```

Pass the user's exact words so the agent can judge intent accurately.

## What NOT to do

- Do not run `git add`, `git commit`, `git push`, or `git tag` yourself.
- Do not run `vsce publish` or `npm run package` for a release yourself.
- Do not let a publish skip the agent's pre-publish checklist, and do not treat "push"
  as authorization to publish — publish is its own explicit gate.
- Do not look up the current version and announce it — that is the agent's first step.
- Do not draft a CHANGELOG entry yourself — the agent reads the diff and does this.
- Do not decide the version bump or push without the user's explicit call.
- Do not skip this skill because the change "looks small" — the agent determines
  significance and keeps it proportionate.

## The lightweight commit exception

If the user says "just a quick/trivial/typo commit" and the diff clearly has no source
(`src/*.ts`), `package.json`, or configuration changes (e.g., a pure README typo or a
comment edit), the `commit-commands:commit` skill is appropriate. When in doubt, use this
skill — the release-coordinator recognizes a trivial change and stays proportionate.
