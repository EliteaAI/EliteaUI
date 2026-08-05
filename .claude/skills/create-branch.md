# Create Branch

Create a new git branch following the project's naming convention.

## Input

The user provides:

- **Ticket number** (e.g., `EL-6096`)
- **Short description** (e.g., `export analytics`)
- **Type** (optional, defaults to `feat`): `feat`, `fix`, `hotfix`, `refactor`, `chore`

## Branch naming convention

```
<type>/<ticket>/<short-kebab-description>
```

Examples:

- `feat/EL-6096/export-analytics`
- `fix/EL-6111/manage-permissions-menu-label`
- `hotfix/EL-6097/ui-analytics`
- `refactor/EL-5000/migrate-chat-to-fsd`

## Steps

1. Run `git status` to ensure the working tree is clean. If there are uncommitted changes, warn the user and
   stop.
2. Fetch latest from origin: `git fetch origin`.
3. Create the branch from `origin/main`: `git checkout -b <branch-name> origin/main`.
4. Confirm the branch was created and report the branch name.

## Rules

- Description must be kebab-case (convert spaces and underscores automatically)
- Keep description short — 3-5 words max
- Ticket number is always uppercase (convert automatically)
- If the user provides just a ticket number and description without a type, default to `feat`
