# Test Case: Delete All Environment Secrets

# Test ID: SECR-002

# Priority: Medium

# Dependency: SECR-001 (created or confirmed secrets list)

## Test Description

Verify that a user with delete permission can remove each secret created ( or confirmed) in SECR-001
(`GitHub_LD`, `GitLab_LD`, `Figma_LD`, `Confluence_LD`, `Jira_LD`, `Jira_Cloud_LD`, `Postman_LD`,
`Google_LD`). Confirm they disappear from the Secrets table and are no longer selectable in dependent secret
dropdowns.

## Preconditions

1. Secrets from SECR-001 exist or were marked PRE-EXISTING
2. User navigates to {URL}
3. User logged in with {Username} / {Password}
4. User is in target {Project}
5. User has permissions: secrets.list, secrets.delete
6. Secrets page accessible at Settings > Secrets
7. List of target secret names available: GitHub_LD, GitLab_LD, Figma_LD, Confluence_LD, Jira_LD,
   Jira_Cloud_LD, Postman_LD, Google_LD

## Test Steps

For each secret in the target list:

1. Navigate / remain on Settings > Secrets
2. Search for the exact secret name (e.g., `GitHub_LD`)
3. If not found: mark as NOT FOUND (possible prior cleanup) and continue
4. If found: click delete (trash icon / row action menu)
5. Confirm deletion (if confirmation dialog appears)
6. Re-search the same name to assert absence
7. (Optional) Open a credential creation form secret dropdown to ensure it is removed (perform for at least
   two sample secrets)
8. Proceed to next secret After loop:
9. Refresh page and spot-check two previously deleted names to confirm persistence of deletion

## Expected Results

1. Each located secret is removed from table after deletion
2. Re-search yields no results for deleted names
3. Sample secret names no longer appear in dependent secret dropdowns
4. No unhandled error banners; permission errors cause test failure
5. Secrets not found at start are logged but do not fail test (treat as cleanup variance) unless policy
   requires strict presence
6. Refresh does not resurrect deleted secrets

## Notes

- Maintain an execution log with status per secret: CREATED_DELETED | PREEXISTING_DELETED | NOT_FOUND_SKIPPED
- If soft-delete occurs, verify state indicator change (capture screenshot)
- Capture before/after screenshots for at least first and last secret processed
- Jira_Cloud_LD name match should exclude quotes (search raw name without quotes)
- If one deletion fails (API error), attempt once more; log incident and continue (overall test may be marked
  partial)
