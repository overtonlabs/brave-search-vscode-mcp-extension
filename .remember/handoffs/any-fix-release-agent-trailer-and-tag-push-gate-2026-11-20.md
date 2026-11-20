---
title: Fix the release-coordinator agent's stale commit trailer and its relayed-consent tag-push rule
machine: any
created: 2026-11-20
from: OvertonMBP
---
## Goal
Commits made through the release agent carry the bare global trailer, and the irreversible
Marketplace tag push happens only on Steve's own decision, returned to the main session, never on
consent relayed to a subagent. Done when the greps in steps 1 and 2 return the expected lines.

## Where things stand
Found by the 2026-11-20 machine-sync audit on OvertonMBP
(`~/dev/sysadmin/OvertonMBP/claude/audits/2026-11-20T011258Z/report.md` section 3, and
`recon/brave-search-vscode-mcp-extension.md` beside it):

- `.claude/agents/release-coordinator.md:288` mandates
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. The global rule is the bare
  `Co-Authored-By: Claude <noreply@anthropic.com>` with no model or context suffix. The last five
  commits carry the stale form.
- `:347` "Authorization channel" tells the agent to treat "faithfully-relayed explicit user
  authorization" from the coordinator as valid for gated outward steps, including the `vX.Y.Z` tag
  push that CI publishes to ~700 auto-updating Marketplace users and can't be un-published.
  `settings.json` doesn't allowlist `git push` or `git tag`, so the permission prompt is still a
  real gate.
- Related, moderate: lines 232-237 let the agent edit CLAUDE.md as a "small in-scope doc update",
  against the global rule that CLAUDE.md line changes are proposed and made only on Steve's yes.
  `.claude/skills/release-coordinator/SKILL.md:34-35` claims "commit/push only when the user asks",
  which matches neither CLAUDE.md nor the global checkpoint-commit rule.

## Decisions already made
Steve asked for these via handoff.

## Steps
1. Set line 288's trailer to `Co-Authored-By: Claude <noreply@anthropic.com>`. Verify:
   `grep -n 'Co-Authored-By' .claude/agents/release-coordinator.md` shows only the bare form.
2. Rewrite the "Authorization channel" note: for the tag push (and any other irreversible outward
   step), the agent stops and returns the exact command to the dispatching session, which asks Steve
   and runs it in the main session. Verify: `grep -n 'relayed' .claude/agents/release-coordinator.md`
   no longer grants authority.
3. Carve CLAUDE.md out of the auto-edit doc list (propose the line change instead). Verify: the
   section names CLAUDE.md as propose-only.
4. Replace `SKILL.md:34-35` with the actual policy: commit at checkpoints without asking, push and
   tag only on Steve's word. Verify: the line matches CLAUDE.md and the global rule.
5. Have `code-reviewer` review the change, commit through the release-coordinator skill (using the
   corrected trailer), and delete this file in that same commit.

## Watch out for
- Don't rewrite the history of the five commits that carry the old trailer.
- `.vscodeignore` already excludes `.remember/**`, so this file never ships in the `.vsix`.
