# Instructions

## Project

Closely follow the vision outlined at `docs/VISION.md`. If you encounter decisions related to feature sets or business logic, report back the the user and ask for their preference.

## Git

The Git remote is on a dedicated Gitea instance. There's a secondary `push` remote that is read-only.

### Worktrees

- Create Git worktrees as siblings to the main directory.
- After creating a new worktree, run the `./cmd/sync-worktree.sh` script to automaticlly put your worktree in a proper workable state.
- Your worktree name MUST be unique. If you have a bead you're working on, use the bead name as the worktree state. Otherwise, use some other unique identifier such as a timestamp for your worktree and branch name.
- Never check out worktrees to `main`.
- Delete worktrees after work has been completed. Ensure you clean up the worktree in Git state.

### Pull requests

- Pull requests can be managed via the Gitea API.
- Documentation for the API can be found at `docs/GITEA-API.yaml`.
- Further information can be discovered in `.giteaconfig` on the `main` worktree.

## Code style

- Use `bun run check` and `bun run check:fix` to help your code comply with linting, formatting, and type errors.
- Don't concern yourself with any problems related to the `.beads` directory if you're working in a worktree.
- NEVER use css variables, and avoid using `style={{}}` at all costs. Prefer short, generic Tailwind classnames if at all possible.

## Prefer Bun CLI & APIs

When suggesting or generating commands in this codebase or terminal instructions:

- Use `bun install` instead of `npm install`, `pnpm install`, or `yarn install`.
- Use `bun run <script>` instead of `npm run <script>`, `pnpm run <script>`, or `yarn run <script>`.
- Use `bunx <package> <command>` instead of `npx <package> <command>`.
- Use `bunx --bun prisma` for any prisma commands.
- Use Bun’s built-in runner (`bun <file>`) instead of `node <file>` or `ts-node <file>`.
- For Vite commands, prefer invoking via `bunx --bun vite` (or equivalent) over a plain Node-based invocation.

## Beads

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

### Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

### Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session
