# Copilot Chat – Quickstart for Test Execution

This guide provides copy‑paste prompts and steps to run test cases interactively with Playwright MCP using
GitHub Copilot Chat.

## One‑Shot: Run a Single Test Case

Paste this into Copilot Chat:

```
Execute test cases from the #file:.github/tests/features/credentials/credentials-create.md
Use variables from the #file:EliteAUI/.env.dev
Use #Playwright to execute the steps.
Provide a test execution report and screenshots.
```

## Select a Group of Test Files

```
Run all test cases under #dir:.github/tests/features/credentials/
Use variables from the #file:EliteAUI/.env.dev
Use #Playwright for execution; produce per‑case summaries and a final report.
```

## Specify a Different Environment File

```
Execute the test cases from #file:.github/tests/features/<your-folder>/<your-case>.md
Use variables from the #file:EliteAUI/.env.staging
Use #Playwright to run and attach screenshots.
```

## Common Follow‑ups

- “Continue to iterate?” → Reply “Yes. Verify the entity appears in the list and open details.”
- “Capture artifacts” → “Take full‑page screenshots for the last two pages and summarize.”
- “Change project” → “Switch project to the target `Project` via the project combobox.”

## Tips

- Make sure your env file contains `URL`, `Username`, `Password`, and any flags like `SKIP_AUTH`.
- If the app shows no success toast, ask to verify via list and detail pages.
- Screenshots from MCP are saved under `.playwright-mcp/` in your workspace.
