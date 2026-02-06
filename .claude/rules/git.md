# Git

The Git remote is on a dedicated Gitea instance. There's a secondary `push` remote that is read-only.

## Worktrees

- You will begin each session in a dedicated, permanent worktree slot. This worktree is already set up and ready for use.
- You do not need to create or delete worktrees — your worktree slot is persistent and dedicated to your instance.
- Never check out your worktree to `main`. Work exclusively within your assigned worktree.
- Before handing off to the user, you MUST leave your worktree in a "detached HEAD" state. This allows future worktrees to use your branch.

## Pull requests

- Pull requests MUST be managed via the Gitea API.
  - DO NOT use `gh` (GitHub CLI), `glab` (GitLab CLI), or any other third-party Git hosting CLI tools. Any attempts to use these tools will fail.
  - DO NOT use web UI interactions or browser automation for PR management.
  - DO NOT use any wrapper scripts or shortcuts that bypass the Gitea API.
- Documentation for the API can be found at `docs/GITEA-API.yaml`.
- Further information can be discovered in `.giteaconfig` on the `main` worktree (`todo/todo/.giteaconfig`).
- When updating PRs, respond to comments you resolved or leave leave your own comments discussing your changes.
- Code MUST pass all formatting and typecheck issues, even if unrelated to your code. If you encounter a type error, ensure `bun install` and `bunx prisma generate` have been run.
