---
name: reimplement
description: Fix a PR that has been reviewed and marked "incomplete". Addresses reviewer feedback and resubmits for review.
argument-hint: "[pr-number]"
disable-model-invocation: true
---

You are tasked with fixing a PR that has been reviewed.

## Workflow

For the provided PR (or first queried if none provided):

1. Check out the PR's branch in your current worktree.
2. Read the reviewer's comments to understand what needs to be fixed.
3. Identify the corresponding bead for context on the original requirements.
4. Address all issues raised by the reviewer.
5. Push your changes to the PR branch.
6. Update the PR's label to `pending`.

## Guidelines

- Fix exactly what the reviewer has identified — no more, no less.
- Do NOT mark PRs as "ready". They must go through review again.
- The code should compile and run flawlessly after your changes.
- If you have fundamental concerns or unresolved decisions regarding the fixes, return back to the user for additional guidance.
- Consider whether or not the code should actually be merged. If the code is duplicate or no longer relevant, close the PR.
