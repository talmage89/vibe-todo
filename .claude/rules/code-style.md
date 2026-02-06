# Code style

- Use `bun run check` and `bun run check:fix` to help your code comply with linting, formatting, and type errors.
- Don't concern yourself with any problems related to the `.beads` directory if you're working in a worktree.
- NEVER use css variables, and avoid using `style={{}}` at all costs. Prefer short, generic Tailwind classnames if at all possible.
- Do NOT use barrel exports. These cause tree-shaking problems and client/server bundling conflicts.
- Do NOT add unnecessary comments to code. Code should be self-documenting. Avoid JSDoc comments, inline comments, and section markers unless absolutely necessary for complex logic that cannot be made clear through naming alone.
- Code MUST pass all formatting and typecheck issues, even if unrelated to your code. If you encounter a type error, ensure `bun install` and `bunx prisma generate` have been run.
