# Pre-PR Quality Gate

Run through every item before creating a PR. All items must pass.

## Code quality

- [ ] `bun run check` passes (lint, format, types)
- [ ] No CSS variables or `style={{}}`
- [ ] No barrel exports
- [ ] Semantic color tokens only — no raw hex values
- [ ] No unnecessary comments, JSDoc, or section markers

## Project structure

- [ ] Feature directory convention followed (`components/`, `hooks/`, `types.ts`, `constants.ts`)
- [ ] Cross-feature imports use `~/` paths; within-feature imports use relative paths
- [ ] No stubs or placeholder code — implementation is complete and runnable

## Git hygiene

- [ ] Branch name follows `td-xxx-description` format
- [ ] Commit message follows `type: description (bead-id)` format
- [ ] Changes are scoped to a single bead — no unrelated modifications
