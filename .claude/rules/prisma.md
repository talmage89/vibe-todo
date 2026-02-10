# Prisma

- You MUST run `bunx prisma generate` when you enter a new worktree or after making database changes.
- The prisma DB_URL has been stubbed in your local worktree. You are not to interact with the database itself.
- You may experience Prisma errors due to your stubbed Prisma db url. Try to work around them.
- Use this command to generate migrations:
  - `prisma migrate diff --from-empty --to-schema-datamodel ./prisma/schema.prisma --script`
- Prefer using prisma generated types for all enums, and `Prisma.<model>GetPayload<typeof select>` for all queries.
