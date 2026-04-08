# Test Case: Create All Environment Secrets

# Test ID: SECR-001

# Priority: High

# Test Data: Derived from .env.dev (For Secrets section)

## Test Description

Verify that a user with appropriate permissions can create a separate secret in the project scope for EACH
secret defined under the "# For Secrets" section of `.env.dev`. Each secret will use the env variable name as
the secret name (verbatim) and the corresponding env value as the secret value. Confirm all are created,
masked, and listed. Capture names for subsequent deletion in SECR-002.

## Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: secrets.list, secrets.create
6. Secrets page accessible at Settings > Secrets

## Test Steps

1. Navigate to Settings (sidebar settings icon or menu)
2. Select the "Secrets" tab
3. For each env secret below perform sub-steps (loop):
   - GitHub_LD
   - GitLab_LD
   - Figma_LD
   - Confluence_LD
   - Jira_LD
   - Jira_Cloud_LD (strip surrounding single quotes if present)
   - Postman_LD
   - Google_LD a. Click "Create" / "+" or trigger inline new row b. In Name field enter the exact variable
     name (e.g., `GitHub_LD`) c. In Value field enter the value from `.env.dev` (placeholder {<VarName>}) d.
     Save the row e. Verify row appears with masked value f. (Optional) Use search to isolate the newly added
     secret
4. After final secret creation, refresh page (optional) and verify all created secrets still appear
5. Record list of successfully created names for SECR-002 deletion test

## Expected Results

1. Each listed env secret is created exactly once with matching name
2. All created secret values are masked (not in clear text) unless reveal is deliberately invoked
3. No validation errors (duplicate name errors should be absent if secrets did not pre-exist)
4. Page refresh retains all new secrets
5. Each secret appears in dependent selectors (e.g., credential creation secret dropdown) – optional
   cross-check for a sample subset
6. Jira_Cloud_LD stored without extraneous quote characters
7. Creation timestamps or ordering not strictly required, but no orphan/empty rows remain

## Notes

- Do NOT append timestamp; exact env variable names are required for downstream usage consistency.
- If any secret already exists, log as PRE-EXISTING and skip creating; mark partial pass (decide policy:
  either treat as setup issue or acceptable skip).
- Jira_Cloud_LD includes surrounding single quotes in `.env.dev`; remove them when pasting value unless UI
  expects literal quotes.
- Ensure no accidental leading/trailing whitespace is introduced.
- Background 403/404 network calls unrelated to secrets list should not fail test.
- Store final list of actually created (or confirmed pre-existing) secrets for SECR-002 input.

## Env Secret Mapping

| Secret Name   | Placeholder     | Source Env Key |
| ------------- | --------------- | -------------- |
| GitHub_LD     | {GitHub_LD}     | GitHub_LD      |
| GitLab_LD     | {GitLab_LD}     | GitLab_LD      |
| Figma_LD      | {Figma_LD}      | Figma_LD       |
| Confluence_LD | {Confluence_LD} | Confluence_LD  |
| Jira_LD       | {Jira_LD}       | Jira_LD        |
| Jira_Cloud_LD | {Jira_Cloud_LD} | Jira_Cloud_LD  |
| Postman_LD    | {Postman_LD}    | Postman_LD     |
| Google_LD     | {Google_LD}     | Google_LD      |
