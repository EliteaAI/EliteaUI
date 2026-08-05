# Commit Changes

Create a git commit following the project's commit message convention.

## Commit message convention

```
<type>: [<TICKET>] <Description>
```

**Types:**

- `feat` — new feature or functionality
- `fix` — bug fix
- `refactor` — code restructuring without behavior change
- `chore` — tooling, config, dependencies
- `build` — build system changes
- `test` — adding or updating tests
- `docs` — documentation only

**Examples:**

- `feat: [EL-6096] Export analytics functionality + UI updates`
- `fix: [EL-6111] Rename bucket menu action to Manage permissions`
- `refactor: [EL-5000] Migrate chat components to FSD`

## Steps

### 1. Analyze changes

- Run `git status` to see all changed/untracked files.
- Run `git diff` (staged and unstaged) to understand what changed.
- Extract the ticket number from the current branch name (e.g., `feat/EL-6096/export-analytics` → `EL-6096`).
- Determine the commit type from the branch prefix (e.g., `feat/` → `feat`, `fix/` → `fix`, `hotfix/` →
  `fix`).

### 2. Review changes

- Do NOT stage or commit files that look like they contain secrets (`.env`, tokens, keys).
- Do NOT stage unrelated files (`.DS_Store`, editor configs, etc.).
- Show the user what will be committed and the proposed commit message.

### 3. Stage and commit

- Stage the relevant files (prefer specific files over `git add -A`).
- Create the commit with the conventional message format.
- The ticket number must be uppercase and in square brackets.
- The description should be concise (under 72 chars) and describe the **what**, not the **how**.

### 4. Verify

- Run `git status` after commit to confirm it succeeded.
- Show the commit hash and message.

## Rules

- If the branch name doesn't contain a ticket number, ask the user for one.
- `hotfix/` branches use `fix:` as the commit type.
- Never amend previous commits unless the user explicitly asks.
- Never use `--no-verify`.
