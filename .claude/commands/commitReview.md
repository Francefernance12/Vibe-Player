# Review and raise PR

Run this shell command to invoke the opencode sub-agent:

```bash
opencode --model opencode/big-pickle \
  --prompt "You are a code reviewer. Do the following in order:
1. Run 'git log -5 --oneline' to see the last 5 commits.
2. Run 'git diff HEAD~3..HEAD --stat' to see what files changed.
3. Write/add/edit a review to docs/REVIEW.md with these sections: date, branch name, what changed, issues spotted, suggestions. Don't overwrite the file each time.
4. Run 'gh pr create --title \"Review: $(git branch --show-current)\" --body \"Automated review from opencode\" --base main'.
5. Run 'git checkout main'.
Report back when done."
```