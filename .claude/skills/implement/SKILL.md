---
name: implement
description: Implement a bead (issue) from a given epic/task or the current epic. Creates a branch, implements the work, and opens a PR.
argument-hint: "[bead-id or epic]"
disable-model-invocation: true
---

You are tasked with implementing a bead from the epic/task provided below, or with the current epic if none provided.

## Workflow

1. **Select a bead** — pick a bead from the epic/task, update its status to `in_progress`.
2. **Branch** — create a branch in your current worktree. Name it `td-{bead-short-id}-{description}` (e.g. `td-3cl-wire-task-ui`).
3. **Implement** — carry out the work to completion. Commit with the format `type: description (bead-id)` (e.g. `feat: wire up task management UI (td-3cl)`).
4. **Quality gate** — run through every item in `checklist.md` before proceeding. All items must pass.
5. **PR** — push to the remote and create a PR using the structure in `pr-template.md`.

## Guidelines

- Implement exactly what the ticket specifies — no more, no less. Every requirement must be met, and no additional features should be added.
- Your implementation should be a cohesive, individual unit of work. It should build on the previous state of the application without adding stubs.
- The code should compile and run flawlessly after your changes even if your changes are a piece of a larger project.
- If you have fundamental concerns or unresolved decisions to make regarding your implementation, return back to the user for additional guidance.
- Implement ONE bead. Stop work after your PR has been created.
- Do NOT touch the main branch. Your work should be scoped ONLY to your current worktree.

## PRs

- Create descriptive-yet-direct PR descriptions following the template in `pr-template.md`.
- Your PR MUST be created with the label "pending". You will have to query the Gitea API to identify its ID.
