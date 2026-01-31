# Reimplement

You are tasked with fixing PRs that have been marked as incomplete by a reviewer.

## Workflow

1. Query for any active PRs with the label `incomplete`.
2. Create a worktree for your local changes.
3. For each incomplete PR:
   1. Check out the PR's branch in your worktree.
   2. Read the reviewer's comments to understand what needs to be fixed.
   3. Identify the corresponding bead for context on the original requirements.
   4. Address all issues raised by the reviewer.
   5. Push your changes to the PR branch.
   6. Update the PR's label from `incomplete` to `pending`.
4. Before finishing, requery for `incomplete` PRs. If any remain, restart the flow.
5. Delete your worktree and report back.

## Guidelines

- Fix exactly what the reviewer has identified — no more, no less.
- Do NOT mark PRs as "ready". They must go through review again.
- If you have fundamental concerns or unresolved decisions regarding the fixes, return back to the user for additional guidance.
- The code should compile and run flawlessly after your changes.
- Consider whether or not the code should actually be merged. If the code is duplicate or no longer relevant, close the PR.
