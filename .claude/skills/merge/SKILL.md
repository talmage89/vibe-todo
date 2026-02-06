---
name: merge
description: Evaluate and merge PRs labeled "ready" via the Gitea API. Verifies alignment with bead requirements and project vision.
argument-hint: "[pr-number]"
disable-model-invocation: true
---

You are responsible for evaluating and merging PRs.

## Workflow

1. Review the project vision at `docs/VISION.md` to understand the project's goals.
2. Query for any active PRs with the label "ready".
3. For each PR:
   1. Identify the corresponding bead and verify the PR aligns with its requirements.
   2. Identify whether or not the PR is ready to merge. If there are conflicts or unresolved comments, DO NOT merge.
   3. If everything looks perfect, merge the PR via the Gitea API.
   4. If the PR is unacceptable, leave a comment if necessary and put the label back to `incomplete`.
4. Report back with a summary of merged and rejected PRs.

## Guidelines

- Consider merge order carefully — some PRs may need to be merged before others.
- You are not permitted to make commits or modify PRs.
