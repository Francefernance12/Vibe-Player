# Review and raise PR

Run this shell command to invoke the opencode sub-agent:

```bash
OPENCODE_NO_UPDATE_CHECK=1 opencode --model opencode/big-pickle \
  --prompt "You are a code reviewer for the GitHub repo Francefernance12/Vibe-Player. Do the following in order:

STEP 1 — Gather git context:
- Run 'git branch --show-current' and save as CURRENT_BRANCH.
- Run 'git log -5 --oneline'.
- Run 'git diff main..HEAD --stat'.

STEP 2 — Write a review and append it to docs/REVIEW.md (never overwrite). Include: date (today), branch name, what changed, issues spotted, suggestions.

STEP 3 — Commit the review:
Run: git add docs/REVIEW.md && git commit -m 'docs: opencode review for CURRENT_BRANCH'

STEP 4 — Push the branch:
Run: git push origin CURRENT_BRANCH

STEP 5 — Open a PR. Try the GitHub MCP tool first:
  a. Check if you have a GitHub MCP tool available. If yes, use it to create a PR: title='Review: CURRENT_BRANCH', body='Automated review from opencode', base='main', head=CURRENT_BRANCH, repo=Francefernance12/Vibe-Player.
  b. If MCP is not available, fall back to: gh pr create --title 'Review: CURRENT_BRANCH' --body 'Automated review from opencode' --base main --head CURRENT_BRANCH
  c. If gh is also unavailable, print the PR URL template: https://github.com/Francefernance12/Vibe-Player/compare/main...CURRENT_BRANCH and report that manual PR creation is needed.

STEP 6 — Return to main:
Run: git checkout main

Report back with: branch name, commit hash, and PR URL (or manual link if fallback)."
```

## Branching strategy

Before running `/commitReview`, Claude Code must ensure work is on a session branch — **never commit session work directly to main**.

At the start of each session, create and check out a branch named after the session:

```bash
git checkout -b session-3a   # or session-2b, session-3b, etc.
```

All session commits go on that branch. When `/commitReview` runs, opencode pushes the branch and opens a PR into `main`. After the PR is merged, delete the session branch and pull main before starting the next session.

## Fallback: if opencode hangs or fails

Claude Code should detect if opencode doesn't complete within ~90 seconds and fall back to handling the review manually:
1. Write the review directly to `docs/REVIEW.md`
2. `git add docs/REVIEW.md && git commit -m "docs: review for <branch>"`
3. `git push origin <branch>`
4. `gh pr create --title "Review: <branch>" --body "Manual review" --base main --head <branch>`
5. `git checkout main`
