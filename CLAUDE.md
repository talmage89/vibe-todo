# Instructions

You are confined to a docker container running a debian-based image with Node and some other core utilities pre-installed. You have full root access via passwordless `sudo`.

The `/workspace` directory contains a git repository that has already been connected to a remote via SSH. Follow these Git guidelines:

- Always commit and push your changes before transitioning the conversation back to the user.
- Use conventional commit messages for your commits. Be descriptive but appropriately high-level in your message title.
- NEVER commit directly on the `main` branch. Use feature branches for all work. Follow this format for branch names: `<user>/<YYYY-MM-DD>-<brief-kebab-case-description>`

