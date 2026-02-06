---
name: sync
description: Sync a worktree by installing deps and generating Prisma client (no DB migrations).
argument-hint: ""
disable-model-invocation: true
---

You are responsible for syncing the local worktree so code can build, typecheck, and run.

## Workflow

1. Ensure dependencies are installed:
   - `bun install`
2. Ensure the Prisma client is generated:
   - `bun run db:generate`

## Constraints

- Do NOT run any Prisma migrations:
  - Do not run `bun run db:migrate:dev`
  - Do not run `bun run db:migrate:prod`
  - Do not run `bun run db:push`
