# CLAUDE.md — Brave Search MCP for VS Code

Project memory for Claude Code. Global standards live in `~/.claude/CLAUDE.md`; this file
records only what is specific to this repo or overrides those defaults. Read it before editing.

---

## What this is

A VS Code extension that exposes Brave Search to AI assistants (GitHub Copilot, etc.) via the
Model Context Protocol. Published to the VS Code Marketplace as `Steve0verton.brave-search-mcp`.

**It is a thin shim, not a search implementation.** The extension does no searching itself. It
registers an MCP *server definition provider* that tells VS Code how to launch the official
`@brave/brave-search-mcp-server` npm package via `npx`, and injects the user's API key as the
`BRAVE_API_KEY` environment variable. All search tools (`brave_web_search`, `brave_news_search`,
`brave_image_search`, `brave_video_search`, `brave_local_search`) live in that upstream package —
not in this repo. To change search behavior, the fix is almost always upstream, not here.

## Architecture (all of it)

- `src/extension.ts` — the entire implementation (~180 lines). Compiles to `out/extension.js`.
  - `activate()` — registers the provider via `vscode.lm.registerMcpServerDefinitionProvider`,
    the `brave-search-mcp.configureApiKey` and `brave-search-mcp.clearApiKey` commands, a
    `context.secrets.onDidChange` listener, and a config-change watcher — all calling
    `provider.refresh()` so the server re-publishes when the key or settings change.
  - `BraveSearchMcpProvider.provideMcpServerDefinitions()` — returns the stdio definition
    (`npx -y @brave/brave-search-mcp-server@<pinned>`) when enabled, `[]` when disabled. No
    credentials here.
  - `BraveSearchMcpProvider.resolveMcpServerDefinition()` — the MCP lifecycle point where user
    interaction is allowed; reads the API key from **SecretStorage** (prompting and storing it if
    absent) and sets `server.env.BRAVE_API_KEY`.
  - `migrateLegacyApiKey()` — runs once on activation; moves any plaintext key from the legacy
    `braveSearchMcp.apiKey` setting into SecretStorage and clears the setting.
  - `promptForApiKey()` — shared masked input box used by the command and the resolve flow.
  - `validateApiKey()` — keys must be non-empty and start with `BSA`.
- That's the whole program. There are no other modules, no bundler, no runtime dependencies.

## Commands

```bash
npm install          # install dev dependencies
npm run compile      # tsc -p ./  → out/  (this is also `vscode:prepublish` and `pretest`)
npm run watch        # tsc -watch for development
npm run lint         # eslint src --ext ts
npm run package      # vsce package --out out/  → produces the .vsix
```

Press **F5** in VS Code to launch the Extension Development Host with the extension loaded
(`.vscode/launch.json` → "Run Extension", runs the default build task first).

## Conventions specific to this repo

- **Double quotes, 2-space indent.** `src/extension.ts` is written Prettier-style with double
  quotes and trailing commas. This *overrides* the global "single quotes" default — match the
  existing file, do not reformat it to single quotes.
- **No test suite exists.** `pretest` only compiles; there is no test runner or test directory.
  Verification is manual via the Extension Development Host (F5). If asked to add a feature that
  the global standards say needs tests, flag that there is no test harness and propose adding one
  (`@vscode/test-electron` / `@vscode/test-cli`) rather than silently skipping.
- **Conventional Commits.** History uses `feat:`, `fix:`, `chore:`, `release:` prefixes.
- **CHANGELOG.md** follows [Keep a Changelog](https://keepachangelog.com/) + SemVer. Update it in
  the same change set as any user-facing change. Use `## [X.Y.Z] - YYYY-MM-DD` version headers and
  categorized sections (`### Added`, `### Fixed`, `### Changed`); be specific and technical.
- Requires VS Code `^1.95.0` — that is the first version with the `vscode.lm`
  MCP server definition provider API. Do not lower the `engines.vscode` floor.

## Gotchas

- **The version string lives in two places** and must be kept in sync on every release:
  `package.json` → `version`, and the `MCP_SERVER_VERSION` constant in `src/extension.ts`
  (plus a new dated section in `CHANGELOG.md`). Bumping one without the others is the easiest
  mistake to make here.
- **The upstream server is pinned to an exact version** via `BRAVE_SEARCH_SERVER_VERSION` in
  `src/extension.ts`. It is deliberately *not* `latest` and deliberately *not* a `^`/`~` range:
  upstream `@brave/brave-search-mcp-server` does not follow semver (breaking changes ship as
  `2.0.x` patches), so only an exact pin protects the ~700 installed users. **Pin to a
  "seasoned" version (a few weeks old), not the newest** — npm 11+ enforces a cooldown /
  minimum-release-age (~14 days) and `npx` will fail with `ETARGET … No matching version … with
  a date before <today−cooldown>` if the pinned version is too fresh. A seasoned pin works for
  everyone, with or without a cooldown. Bumping the pin is a real, user-facing release —
  smoke-test it (F5) and ship it through the release-coordinator; never loosen it to a range or
  `latest`.
- The API key is stored in **VS Code SecretStorage** (`context.secrets`, OS keychain) under the
  key `braveSearchMcp.apiKey` — **never** in plaintext settings. Do not reintroduce
  `config.update("apiKey", …)` as a store path; the `braveSearchMcp.apiKey` *setting* is retained
  only as a deprecated migration source and is cleared on activation. Secret changes drive
  `provider.refresh()` via `context.secrets.onDidChange`.
- `out/` and `*.vsix` are git-ignored build artifacts; never commit them.

## Releasing (CI-driven)

Releases are owned by the `release-coordinator` skill/agent and shipped by GitHub Actions —
**you do not run `vsce publish` or `gh release create` by hand.** Pushing a `vX.Y.Z` tag is
the single trigger: `.github/workflows/release.yml` builds the `.vsix` once on the runner,
`vsce publish`es it to the Marketplace, and creates the GitHub Release with that same `.vsix`
(notes auto-extracted from the matching `CHANGELOG.md` section). `.github/workflows/ci.yml`
build-checks every push to `main` and every PR.

1. Update `version` in `package.json` **and** `MCP_SERVER_VERSION` in `src/extension.ts`.
2. Add a dated section to `CHANGELOG.md` (+ footer compare link). This section **becomes the
   GitHub Release notes verbatim**, so it must be accurate and complete.
3. Commit `release: vX.Y.Z`; ensure `release.yml` is on `main` and in the tagged commit's history.
4. Optional rehearsal: `gh workflow run release.yml --ref main` (builds + packages, no publish).
5. `git tag vX.Y.Z && git push origin vX.Y.Z` → CI publishes and cuts the release. Verify with
   `gh run watch`, `gh release view vX.Y.Z`, and `npx vsce show Steve0verton.brave-search-mcp`.

**Marketplace publishing requires the `VSCE_PAT` repo secret** — an Azure DevOps PAT
(Marketplace > Manage scope) created in the ADO portal under the `overtonlabs` org on the same
Microsoft account that owns the `Steve0verton` publisher; **portal-only (no `az`/CLI path)**, and
it **expires** (rotate via `gh secret set VSCE_PAT`). The Marketplace listing can lag a few
minutes behind a successful publish — the green CI publish step is the real signal.

## Related docs

- `README.md` — user-facing install, configuration, usage, troubleshooting.
- `QUICKSTART.md` — condensed build-and-install steps.
- Upstream search server: https://github.com/brave/brave-search-mcp-server
