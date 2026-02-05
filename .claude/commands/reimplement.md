# Reimplement

You are tasked with fixing a PR that has been reviewed.

## Workflow

For the provided PR (or first queried if none provided):

1. Ensure the PR has the label `incomplete`. If it doesn't, STOP and report back to the user.
2. Check out the PR's branch in your current worktree.
3. Read the reviewer's comments to understand what needs to be fixed.
4. Identify the corresponding bead for context on the original requirements.
5. Address all issues raised by the reviewer.
6. Push your changes to the PR branch.
7. Update the PR's label from `incomplete` to `pending`.

## Guidelines

- Fix exactly what the reviewer has identified — no more, no less.
- Do NOT mark PRs as "ready". They must go through review again.
- If you have fundamental concerns or unresolved decisions regarding the fixes, return back to the user for additional guidance.
- The code should compile and run flawlessly after your changes.
- Consider whether or not the code should actually be merged. If the code is duplicate or no longer relevant, close the PR.
