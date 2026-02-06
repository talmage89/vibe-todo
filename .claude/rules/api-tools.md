# API tools (no `python3`)

When you need to inspect, format, or extract data from JSON (especially API responses), **do not use `python3`**.

Use the dedicated repo tools instead:

- **JSON formatting / extraction**: `bun run json`
  - Pretty-print: `... | bun run json`
  - Extract a field (JSON Pointer): `... | bun run json --pointer /id --raw`
  - Extract a field (dot path): `... | bun run json --path data.items[0].title --raw`
- **Gitea API wrapper**: `bun run gitea`
  - Example: `bun run gitea GET /api/v1/user | bun run json`

These are preferred because `bun` is allowlisted and this avoids ad-hoc command execution.
