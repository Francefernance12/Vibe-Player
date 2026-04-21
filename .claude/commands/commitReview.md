# Review and raise PR

Run this shell command to invoke the opencode sub-agent:

```bash
opencode --model opencode/big-pickle \
  --prompt "You are a code reviewer. Do the following in order:
1. Run 'git branch --show-current' to get the current branch name. Save it as CURRENT_BRANCH.
2. Run 'git log -5 --oneline' to see the last 5 commits.
3. Run 'git diff main..HEAD --stat' to see what changed since main.
4. Write/add a review to docs/REVIEW.md with these sections: date, branch name, what changed, issues spotted, suggestions. Append — do not overwrite existing content.
5. Run 'git add docs/REVIEW.md && git commit -m \"docs: opencode review for \$CURRENT_BRANCH\"' to commit the review.
6. Run 'git push origin \$CURRENT_BRANCH' to push the branch.
7. Run 'gh pr create --title \"Review: \$CURRENT_BRANCH\" --body \"Automated review from opencode\" --base main --head \$CURRENT_BRANCH' to open the PR.
8. Run 'git checkout main' to return to main.
Report back when done."
```

## Branching strategy

Before running `/commitReview`, Claude Code must ensure work is on a session branch — **never commit session work directly to main**.

At the start of each session, create and check out a branch named after the session:

```bash
git checkout -b session-3a   # or session-2b, session-3b, etc.
```

All session commits go on that branch. When `/commitReview` runs, opencode pushes the branch and opens a PR into `main`. After the PR is merged, delete the session branch and pull main before starting the next session.
