# Test Case: Delete All Test Credentials

# Test ID: CRED-002

# Priority: High

# Dependency: CRED-001 (credentials must exist first)

## Test Description

Verify that a user with appropriate permissions can delete all test credentials that were created in CRED-001.
Each credential will be individually deleted with proper confirmation dialogs. Verify complete cleanup and
return to pre-test state.

## Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: credentials.list, credentials.delete
6. Test credentials exist from CRED-001 execution
7. Credentials page accessible at main navigation

## Test Steps

1. Navigate to the Credentials page (sidebar or main menu)
2. Capture initial state screenshot for documentation
3. For each test credential below perform sub-steps (loop):
   - Test GitHub Credential
   - Test GitLab Credential
   - Test Figma Credential
   - Test Confluence Credential
   - Test Jira Credential
   - Test Jira Cloud Credential
   - Test Postman Credential
   - Test Google Credential a. Locate the credential in the list (use search if needed) b. Click on "More
     actions" or "..." menu for the credential c. Select "Delete" option from the dropdown menu d. Confirm
     deletion in the confirmation dialog e. Verify credential is removed from the list f. Verify success
     message/notification appears
4. After all deletions, verify final state matches pre-CRED-001 state
5. Capture final state screenshot for documentation
6. Optional: Refresh page and confirm deletions are persistent

## Expected Results

1. Each test credential is successfully located and deleted
2. Confirmation dialogs appear for each deletion attempt
3. Success messages/notifications confirm each successful deletion
4. Credentials are immediately removed from the list after deletion
5. Final state shows no test credentials remain
6. No error messages during deletion process
7. Page refresh confirms deletions are permanent
8. Credential count returns to pre-test baseline

## Notes

- If any credential is missing (not found), log as NOT-FOUND and continue with remaining
- Confirmation dialogs must be properly handled - clicking "Confirm"/"Delete" not "Cancel"
- Success notifications may appear as toast messages or inline banners
- Some credentials may have dependencies - handle any warning dialogs appropriately
- Background 403/404 network calls unrelated to credentials operations should not fail test
- Document any credentials that cannot be deleted due to active usage/dependencies

## Test Data Reference

Expected credentials to delete (from CRED-001): | Display Name | Provider | Should Exist |
|--------------|----------|--------------| | Test GitHub Credential | GitHub | Yes | | Test GitLab Credential
| GitLab | Yes | | Test Figma Credential | Figma | Yes | | Test Confluence Credential | Confluence | Yes | |
Test Jira Credential | Jira | Yes | | Test Jira Cloud Credential | Jira Cloud | Yes | | Test Postman
Credential | Postman | Yes | | Test Google Credential | Google | Yes |

## Verification Steps

1. Count total credentials before deletion (baseline + 8 test credentials)
2. Count total credentials after each deletion (should decrease by 1)
3. Count total credentials after all deletions (should equal baseline)
4. Search for each deleted credential name (should return no results)
5. Verify no "Test \* Credential" pattern remains in the list

## Cleanup Verification

- [ ] All test credentials deleted successfully
- [ ] No orphaned credential entries
- [ ] Credential count matches pre-test state
- [ ] No error states or broken references
- [ ] Screenshots captured for evidence
