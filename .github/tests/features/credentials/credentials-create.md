# Test Case: Create All Environment Credentials

# Test ID: CRED-001

# Priority: High

# Test Data: Derived from .env.dev (For Secrets section) + Provider mapping

# Dependency: SECR-001 (secrets must exist first)

## Test Description

Verify that users can successfully create a GitHub credential using a stored secret for secure application
authentication.

## Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: credentials.list, credentials.create
6. All corresponding secrets exist (GitHub_LD, GitLab_LD, Figma_LD, etc.) - dependency on SECR-001
7. Credentials page accessible at main navigation

## Test Steps

1. Navigate to the Credentials page (sidebar or main menu)
2. For each provider/secret pair below perform sub-steps (loop):
   - GitHub (using GitHub_LD secret)
   - GitLab (using GitLab_LD secret)
   - Figma (using Figma_LD secret)
   - Confluence (using Confluence_LD secret)
   - Jira (using Jira_LD secret)
   - Jira Cloud (using Jira_Cloud_LD secret)
   - Postman (using Postman_LD secret)
   - Google (using Google_LD secret) a. Click "Create New Credential" or "+" button b. Select the
     corresponding provider from available options (e.g., "GitHub") c. In Display Name field enter: "Test
     {Provider} Credential" (e.g., "Test GitHub Credential") d. Select "Token" as the authentication method
     (if applicable) e. Choose "Secret" option for credential storage f. From the secret dropdown, select
     corresponding secret (e.g., "GitHub_LD") g. Click "Save" or "Create" button to save the credential h.
     Verify confirmation message appears i. Verify credential appears in credentials list j. (Optional) Use
     search to isolate the newly added credential
3. After final credential creation, refresh page (optional) and verify all created credentials still appear
4. Record list of successfully created credential names for CRED-002 deletion test

## Expected Results

1. Each listed provider credential is created exactly once with standardized naming
2. All created credentials reference their corresponding secrets correctly
3. No validation errors (duplicate name errors should be absent if credentials did not pre-exist)
4. Each credential displays correct provider association and authentication method
5. Page refresh retains all new credentials
6. Credentials are available in dependent workflows (e.g., pipeline creation) – optional cross-check
7. No orphan/incomplete credential entries remain

## Notes

- Standardized naming: "Test {Provider} Credential" (e.g., "Test GitHub Credential", "Test GitLab Credential")
- If any credential already exists with same name, log as PRE-EXISTING and skip creating; mark partial pass
- Ensure corresponding secrets exist before creating credentials (dependency validation)
- Some providers may have different authentication methods - adjust steps accordingly
- Background 403/404 network calls unrelated to credentials list should not fail test
- Store final list of actually created (or confirmed pre-existing) credentials for CRED-002 input

## Provider/Secret Mapping

| Provider   | Secret Name   | Display Name               | Auth Method |
| ---------- | ------------- | -------------------------- | ----------- |
| GitHub     | GitHub_LD     | Test GitHub Credential     | Token       |
| GitLab     | GitLab_LD     | Test GitLab Credential     | Token       |
| Figma      | Figma_LD      | Test Figma Credential      | Token       |
| Confluence | Confluence_LD | Test Confluence Credential | Token       |
| Jira       | Jira_LD       | Test Jira Credential       | Token       |
| Jira Cloud | Jira_Cloud_LD | Test Jira Cloud Credential | Token       |
| Postman    | Postman_LD    | Test Postman Credential    | Token       |
| Google     | Google_LD     | Test Google Credential     | Token       |
