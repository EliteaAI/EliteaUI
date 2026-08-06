# Prepare PR

Push changes and create a pull request on GitHub with a well-structured description.

## Steps

### 1. Check state

- Run `git status` to ensure the working tree is clean (all changes committed). If not, suggest using
  `/commit-changes` first.
- Run `git log origin/main..HEAD` to see all commits that will be in the PR.
- Run `git diff origin/main...HEAD` to see the full diff against main.

### 2. Push to remote

- Check if the branch has a remote tracking branch.
- Push with `-u` flag: `git push -u origin <branch-name>`.

### 3. Analyze changes for PR description

- Read through ALL commits in the branch (not just the latest).
- Understand the full scope of changes: new features, bug fixes, refactoring, etc.
- Identify which files/areas were affected.

### 4. Create PR

**Option A — `gh` CLI (preferred if available):**

```
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary

<Brief description of what this PR does and why>

## Changes

- <Bullet point for each meaningful change>
- <Group related changes together>

## Testing

- <How to test the changes>
- <Edge cases considered>
- <Screenshots if UI changes>

## Ticket

[<TICKET>](https://eliteaai.atlassian.net/browse/<TICKET>)
EOF
)"
```

**Option B — GitHub MCP tool (fallback when `gh` is not installed):**

Use `mcp__github__create_pull_request` with:

- `owner`: `EliteaAI`
- `repo`: `EliteaUI`
- `title`: same convention as above
- `head`: current branch name
- `base`: `main`
- `body`: same markdown structure as above

### PR title convention

Same as commit message: `<type>: [<TICKET>] <Short description>`

Keep under 72 characters.

**Examples:**

- `feat: [EL-6096] Export analytics functionality`
- `fix: [EL-6111] Rename bucket menu action to Manage permissions`

### 5. Report

- Show the PR URL.
- Show the PR title and summary.

## Rules

- Extract ticket number from branch name automatically.
- The PR title follows the same convention as commit messages.
- The summary should explain **why** the change was made, not just what changed.
- List changes as bullet points — one per logical change, not one per file.
- Always include a link to the Jira ticket.
- Never force push.
- Base branch is always `main` unless the user specifies otherwise.
