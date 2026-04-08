# EliteA UI – Test Execution Guide

This guide explains how to write and run manual-style test cases and execute them against the live Dev
environment using Playwright MCP (via Copilot Chat). It also covers where to store environment variables and
how to select specific test files for execution.

## Overview

- Test cases live in Markdown under `.github/tests/features/**`. Each file represents a case or a small suite.
- Variables (URL, credentials, flags) live in `.env.*` files (e.g., `EliteAUI/.env.dev`).
- Execution is interactive using Playwright MCP through Copilot Chat, or via the existing Playwright+Cucumber
  framework under `tests/` for automated suites.

## Prerequisites

- Access to Dev environment: `https://dev.elitea.ai`
- A valid test account (email/password) available in an env file.
- VS Code with Copilot Chat enabled.

## Directory Structure

- `.github/tests/README.md` – this guide
- `.github/tests/COPILOT.md` – ready-to-use prompts for Copilot Chat
- `.github/tests/features/**` – Markdown test cases (one file per case/small suite)
- `tests/` – Existing Playwright + Cucumber framework (automated suites)

## Environment Variables

Place runtime variables in env files inside the `EliteAUI/` folder, for example `EliteAUI/.env.dev`:

```

# For Testing on DEV environment
URL=https://dev.elitea.ai
Username=<test_account_email>
Password=<test_account_password>
SKIP_AUTH=false
```

Notes:

- Always keep secrets out of tracked files for production; `.env.dev` is for Dev/testing only.
- When using Copilot Chat with Playwright MCP, reference the env file explicitly so the assistant reads
  variables from it.

## Test Case Format (Markdown)

Create files like `.github/tests/features/credentials/credentials-create.md` with this structure:

```
# Test Case: <Short, Actionable Name>
# Test ID: <ID or Key>
# Test Data: <Optional link to test data file>

## Test Description
<What the test verifies and why>

## Preconditions
1. User navigates to {URL}
2. User has valid login credentials
... (use {VariableName} placeholders when values come from env)

## Test Steps
1. <Step 1>
2. <Step 2>
...

## Expected Results
1. <Expectation 1>
2. <Expectation 2>
...

## Notes
- <Optional clarifications>
```

Guidelines:

- Use `{URL}`, `{Username}`, `{Password}`, etc., as placeholders the runner will fill from the selected
  `.env.*` file.
- Keep steps explicit and UI-driven (buttons, fields, selections, and expected messages).

## Running Tests with Playwright MCP (Interactive)

Use Copilot Chat to execute a specific case file (or a small set):

1. Open Copilot Chat in VS Code.
2. Provide a prompt that includes:
   - The path to the test case file(s) in `.github/tests/features/**`
   - The path to the env file (e.g., `EliteAUI/.env.dev`)
   - Request to use Playwright MCP and to produce a report and screenshots

Example prompt:

```
Execute test cases from the #file:.github/tests/features/credentials/credentials-create.md
Use variables from the #file:EliteAUI/.env.dev
Use #Playwright to execute the steps.
Provide a test execution report and screenshots.
```

Selecting multiple files:

```
Run all test cases found under #dir:.github/tests/features/credentials/
Use variables from #file:EliteAUI/.env.dev
Use #Playwright to execute them and summarize results.
```

Artifacts:

- Screenshots from MCP runs are saved under `.playwright-mcp/` in your workspace.
- The assistant will also summarize pass/fail and key assertions.

## Troubleshooting

- Login fails: Verify `URL`, `Username`, `Password` in the chosen `.env.*`. Confirm realm and redirects reach
  `auth.elitea.ai`.
- Missing toast: Some actions complete without visible notifications; verify via list/detail views and field
  values.
- 403/404 in console: Background requests may 404 without impacting the UI flow; proceed if UI behaves
  correctly.
- Session stuck: Try logging out and back in, or re-run in a fresh MCP session.

## Best Practices

- Keep one clear scenario per Markdown file for focused MCP runs.
- Reuse env placeholders consistently.
- Add screenshots or links to artifacts in the Notes when useful.

## Security

- Do not commit real secrets. Use safe test accounts and test-only tokens.
- Prefer referencing saved Secrets inside the app when creating credentials (e.g., `GitHub_LD`).
