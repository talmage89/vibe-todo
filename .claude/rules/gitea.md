# Gitea

- Available PR labels are "pending", "incomplete", and "ready". You will need to query the Gitea API to retrieve the label ID before referencing it in API calls.
- When interacting with the Gitea API or inspecting its JSON responses, prefer the repo helpers in `rules/api-tools.md`:
  - `bun run gitea` for API calls
  - `bun run json` for formatting/extracting response data (avoid `python3` at all costs)
