# TODO — Brave Search MCP for VS Code

Next steps and known follow-ups. Detail for the release/migration items lives in `CLAUDE.md`
(Releasing) and the `release-coordinator` agent runbook (`.claude/agents/release-coordinator.md`).

## Now / verify

- [ ] **Confirm v1.2.0 propagated to the Marketplace.** The CI publish step was green and the
      GitHub Release is live, but the gallery/CDN lags a few minutes. Refresh the listing and
      confirm it shows `1.2.0` (`npx vsce show Steve0verton.brave-search-mcp`).

## Phase 2 — move the Marketplace publisher `Steve0verton` → `overtonlabs`

> The GitHub repo already moved to the `overtonlabs` org; only the **Marketplace publisher** is
> still `Steve0verton`. This move **resets the install base** (count/ratings/reviews don't carry
> over) and changes the extension id to `overtonlabs.brave-search-mcp`.

- [ ] **Create the `overtonlabs` Marketplace publisher** at marketplace.visualstudio.com/manage
      — separate from the Azure DevOps org of the same name; create it under the **same Microsoft
      account** that owns `Steve0verton` so the existing `VSCE_PAT` can publish to it.
- [ ] **Republish under the new publisher** — set `package.json` `publisher` to `overtonlabs`,
      release `overtonlabs.brave-search-mcp` (via the normal tag-triggered CI flow).
- [ ] **Add a DEPRECATED banner** to the old `Steve0verton.brave-search-mcp` README pointing
      users to the new extension (Claude to draft, following the standard "moved" format).
- [ ] **Request official deprecation** by commenting in the microsoft/vscode-discussions
      "Deprecated Extensions" thread, deprecated **in favor of** `overtonlabs.brave-search-mcp`
      (gives users the in-product Migrate button). Not self-serve / not a PR; has Microsoft lead time.

## Maintenance

- [ ] **Bump GitHub Actions versions.** `actions/checkout@v4` / `actions/setup-node@v4` are being
      force-run on Node 24 (GitHub is deprecating Node 20 on runners). Bump the action majors when
      convenient — non-blocking.
- [ ] **Rotate `VSCE_PAT` before it expires.** It's an Azure DevOps PAT with a set expiry; when it
      lapses, CI builds then fails at publish. Mint a new one (portal-only) and
      `gh secret set VSCE_PAT --repo overtonlabs/brave-search-vscode-mcp-extension`.
