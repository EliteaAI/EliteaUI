# Prepare Commit

Run all code quality checks to ensure the code is ready to commit. This does NOT create a commit — it only
validates.

## Steps

Run these checks in order, stopping on first failure:

### 1. Format code

```bash
npm run format
```

This runs Prettier with the project's `.prettierrc` config (single quotes, trailing commas, 110 char width,
import sorting).

### 2. Lint

```bash
npm run lint
```

If there are auto-fixable issues, run `npm run lint -- --fix` and report what was fixed.

If there are errors that cannot be auto-fixed, report them clearly with file paths and line numbers so the
user can fix them.

### 3. Build check

```bash
npm run build
```

Verify the production build succeeds. If it fails, report the errors.

## Output

Report the result of each step:

- **Format**: passed / X files reformatted
- **Lint**: passed / X errors (list them)
- **Build**: passed / failed (with errors)

If all checks pass, tell the user the code is ready to commit (suggest using `/commit-changes`).
