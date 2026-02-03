# Prefer Bun CLI & APIs

When suggesting or generating commands in this codebase or terminal instructions:

- Use `bun install` instead of `npm install`, `pnpm install`, or `yarn install`.
- Use `bun run <script>` instead of `npm run <script>`, `pnpm run <script>`, or `yarn run <script>`.
- Use `bunx <package> <command>` instead of `npx <package> <command>`.
- Use `bunx --bun prisma` for any prisma commands.
- Use Bun's built-in runner (`bun <file>`) instead of `node <file>` or `ts-node <file>`.
- For Vite commands, prefer invoking via `bunx --bun vite` (or equivalent) over a plain Node-based invocation.
