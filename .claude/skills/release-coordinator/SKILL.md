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
| "cut a release", "create a release", "time to release", "full release", "ship it", "draft the release notes" | Full release — **CI-driven**: pushing the `vX.Y.Z` tag triggers Marketplace publish **and** the GitHub Release | No by default — the agent prepares everything and **pauses before push/tag** unless "push" was said. It **explicitly asks** whether to cut a full release (push the tag) |
| "bump the patch version" | Patch release | No by default — version level is chosen, push still gated |
| "bump the minor version" | Minor release | No by default — version level is chosen, push still gated |
| "bump the major version" | Major (breaking) release | No — major needs explicit confirmation; push still gated |
| "publish to the marketplace", "ship the release" | Triggers the CI publish — done by pushing the `vX.Y.Z` tag | No — the tag push is always an explicit gate |
| feature branches piling up | Branch-checkpoint nudge | No |

> **Posture:** pushing the branch and **pushing the `vX.Y.Z` tag** are **always an explicit
> gate** — the agent pauses before any outward action even during a "release," unless the
> user said "push"/"and push." The tag push is the irreversible one — it triggers CI to
> publish to the Marketplace and cut the GitHub Release. Per CLAUDE.md and global rules,
> commit/push only when the user asks.

> **The "full release" question (CI-driven).** A *full release* in this repo is triggered
> by **pushing the `vX.Y.Z` tag** — that one push fires the `release.yml` GitHub Actions
> workflow, which builds once and ships that artifact to **both** the Marketplace
> (`vsce publish`) **and** a GitHub Release at the
> [releases page](https://github.com/overtonlabs/brave-search-vscode-mcp-extension/releases).
> The agent **does not** run `vsce publish` or `gh release create` itself — CI owns both.
> Its job is to ask the user explicitly whether to cut a full release, get the CHANGELOG and
> three version sync points right, walk the pre-publish gate, and on the user's go push the
> tag. Key consequences it must respect:
> - **Pushing the tag is the irreversible step** — it publishes to 700+ users and creates
>   the public release. Gate it like the highest-stakes action.
> - **The CHANGELOG section becomes the release notes verbatim** — CI extracts this version's
>   section (header stripped, headings promoted one level) for the body. A sloppy entry ships
>   publicly. The fixed title is `Release vX.Y.Z - Brave Search MCP for VS Code`; the asset is
>   the CI-built `brave-search-mcp-X.Y.Z.vsix` plus GitHub's auto-attached source archives.
> - **CI needs the `VSCE_PAT` repo secret** (Azure DevOps PAT, Marketplace > Manage). If it's
>   missing, CI builds then fails at publish — the agent flags it; the user sets it.
> - A safe rehearsal exists: the workflow's `workflow_dispatch` dry-run builds + packages
>   without publishing or releasing.

> **Process notes / runbook** (the agent's *Release runbook & process notes* section has the
> full detail — pass these along so it doesn't relearn them):
> - **Working outward order:** push branch → ff-merge to `main` (triggers `ci.yml`) →
>   `gh workflow run release.yml --ref main` (dry-run, no publish; needs `release.yml` on the
>   default branch) → on green, `git tag vX.Y.Z && git push origin vX.Y.Z` (the publish
>   trigger; tag must point at a commit containing `release.yml`) → verify.
> - **Marketplace propagation lag:** after a green publish step, `vsce show` can keep showing
>   the old version for minutes. The green CI publish step is the success signal — not the
>   lagging `vsce show`.
> - **`VSCE_PAT` lifecycle:** an **Azure DevOps** PAT (Marketplace > Manage), created in the
>   ADO portal under the `overtonlabs` org on the **same Microsoft account that owns the
>   `Steve0verton` publisher** — **portal-only, no `az`/CLI path**. It **expires**; rotate via
>   `gh secret set VSCE_PAT`. Verify without publishing: `npx vsce verify-pat Steve0verton`.
> - **Node-version CI warning is benign** (checkout/setup-node forced onto Node 24); future
>   action-version bump, not a blocker.
> - **Phase 2 (deferred):** move the Marketplace **publisher** `Steve0verton` → `overtonlabs`
>   (repo already moved). Official deprecation of the old listing is requested via the
>   microsoft/vscode-discussions "Deprecated Extensions" thread (deprecate *in favor of* the
>   new id → Migrate button); not self-serve, has Microsoft lead time.

> **⚠️ This is a public Marketplace extension with 700+ live users on auto-update.** A bad
> publish can't be cleanly un-published — only superseded by another release. Publishing and
> the GitHub Release are CI-driven (`release.yml`, on the `vX.Y.Z` tag push), so **pushing
> the tag** is the highest-stakes action: it is gated on the user's explicit go **and** on
> the agent walking its Pre-publish checklist (compile + lint clean, all three versions
> synced and strictly greater than the published one, `.vsix` inspected, `VSCE_PAT` secret
> present, **user-confirmed F5 smoke test**, rollback noted). The agent also runs a
> blast-radius scan on every release and a secret-hygiene scan before every commit. A plain
> "push" authorizes the branch push — it does **not** authorize the tag push; that is its own
> confirmation.

## Repo-specific context to pass the agent

**Versioning lives in THREE places** (the agent's defining concern):
1. `package.json` → `version`
2. `MCP_SERVER_VERSION` constant in `src/extension.ts`
3. `CHANGELOG.md` — a new dated `## [X.Y.Z] - YYYY-MM-DD` section **and** the
   compare-link reference at the bottom of the file.

Releases are git-tagged `vX.Y.Z`. The agent verifies a bump with `npm run compile`;
**pushing the `vX.Y.Z` tag** then triggers CI (`release.yml`) to package, `vsce publish`
to the Marketplace, and cut the GitHub Release — the agent does not publish locally.

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

**Public-release guardrails (700+ users):** the agent treats the **tag push** as the
highest-stakes action (it triggers CI to publish + release) and enforces, on every release:
- a **blast-radius scan** of user-facing surfaces (`contributes.configuration` /
  `contributes.commands` / `activationEvents` / `engines.vscode` in `package.json`, the
  upstream pin and identity constants in `src/extension.ts`) — any change is flagged
  **USER IMPACT** and a setting/command rename pushes the bump to **MAJOR**;
- a **pre-publish checklist** before pushing the `vX.Y.Z` tag (compile + lint clean; all
  three versions synced and strictly greater than the published version; `.vsix` built and
  inspected; `VSCE_PAT` secret present; **user-confirmed F5 smoke test**; rollback noted);
- a **secret-hygiene scan** (no `BSA…` key / `.env` / PAT) before every commit;
- **post-release verification** that the CI run is green and both the Marketplace and the
  GitHub Release reflect the new version.

## How to dispatch

Invoke the agent with enough context to skip re-discovery:

```
Agent({
  subagent_type: "release-coordinator",
  prompt: "Release/commit workflow triggered by: '<user's exact phrase>'.
  Push implied: <yes only if the user said push/and-push; otherwise no — pause before outward>.
  Version level implied: <patch/minor/major/unspecified>.
  Repo context: versioning = THREE sync points — package.json version + MCP_SERVER_VERSION in src/extension.ts + CHANGELOG.md (dated section + footer compare link); releases tagged vX.Y.Z. PATCH = common (fixes/deps/docs); MINOR = new user-facing capability; MAJOR = breaking change (rare, needs confirmation). Verify bumps with npm run compile. The version bump is an explicit user gate — always ask unless the level was named. Pause before any branch push or tag push.
  PUBLIC RELEASE — 700+ live users on auto-update; a bad publish can only be superseded, not undone. Run the blast-radius scan (guardrails §A) on user-facing surfaces and flag USER IMPACT (a setting/command rename ⇒ MAJOR). Before pushing the vX.Y.Z tag (which triggers CI to publish + release), walk the full pre-publish gate (§B: compile+lint clean, three versions synced and strictly greater than published, .vsix built + inspected, VSCE_PAT secret present, USER-confirmed F5 smoke test, rollback noted). Secret-hygiene scan before every commit (§C). Post-release verification after the tag-triggered run (§D). A plain 'push' authorizes the branch push, NOT the tag push that ships the release.
  FULL RELEASE IS CI-DRIVEN — publishing and the GitHub Release are both owned by .github/workflows/release.yml and both trigger on pushing the vX.Y.Z tag (one CI build ships to Marketplace AND cuts the GitHub Release). Do NOT run vsce publish or gh release create yourself. When the intent is a release (not a plain commit), explicitly ASK whether to cut a full release (push the tag). Pushing the tag is the irreversible outward action — gate it; get the user's explicit go. The CHANGELOG section IS the release notes (CI extracts it, header stripped + headings promoted one level), so get it right before tagging. Confirm the VSCE_PAT repo secret exists (gh secret list) — if missing, CI fails at publish; the user sets it, you only flag it. After the tag push, verify with gh run watch + gh release view + vsce show (§D). A workflow_dispatch dry-run (gh workflow run Release) builds without publishing, for safe rehearsal.
  Proceed with the standard release-coordinator process."
})
```

Pass the user's exact words so the agent can judge intent accurately.

## What NOT to do

- Do not run `git add`, `git commit`, `git push`, or `git tag` yourself.
- Do not run `vsce publish`, `gh release create`, or `npm run package` for a release — and
  do not assume a release wants a GitHub Release. CI (`release.yml`, triggered by the tag
  push) owns publishing and the GitHub Release; the agent asks the user and prepares the tag.
- Do not let the tag push skip the agent's pre-publish checklist, and do not treat a plain
  "push" as authorization to push the `vX.Y.Z` tag — the tag push (which ships the release)
  is its own explicit gate.
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
