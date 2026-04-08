# Test Case: Comprehensive Credentials Management

# Test ID: CRED-COMP

# Priority: High

# Test Data: Derived from .env.dev + UI analysis

# Dependencies: None (independent test suite)

## Test Description

Verify comprehensive credentials management functionality including navigation, view modes, search/filter
functionality, CRUD operations, validation, and provider-specific form handling. Test covers all major
credential providers and authentication methods available in the Private project environment.

## Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: credentials.list, credentials.create, credentials.update, credentials.delete
6. Credentials page accessible at main navigation
7. Test environment has existing credentials for filtering/search validation

## Test Steps

### Phase 1: Navigation and Access Validation

1. Navigate to the Credentials page (sidebar menu "Credentials")
2. Verify page loads with title "Credentials: all - {Project}"
3. Verify project selector shows "{Project}" context
4. Verify user profile displays current user
5. Take screenshot for baseline evidence

### Phase 2: View Mode Testing

6. Verify current view mode (Card list view or Table view)
7. Click "Table view" button in view toggle a. Verify table view becomes active/pressed b. Verify credentials
   display in table format with columns c. Take screenshot of table view
8. Click "Card list view" button in view toggle a. Verify card list view becomes active/pressed b. Verify
   credentials display as individual cards c. Verify each card shows: name, type icon, owner, type label d.
   Take screenshot of card view

### Phase 3: Search and Filter Functionality

9. Locate search textbox with placeholder "Let's find something amazing!"
10. Test search functionality: a. Enter search term "GitHub" b. Verify results are filtered to GitHub
    credentials only c. Clear search and verify all credentials return d. Test case-insensitive search with
    "github"
11. Test type filtering: a. In "Types" filter section, click "Github" filter b. Verify only GitHub credentials
    are shown c. Click additional type filter (e.g., "Jira") d. Verify multiple type selection works e. Clear
    all filters and verify full list returns

### Phase 4: Credential Creation Flow

12. Click "Create Credential" button in sidebar
13. Verify credential type selection page loads with: a. "Choose the credentials type" message b. Search box
    for credential types c. Provider categories displayed
14. Test provider search: a. Search for "github" - should find GitHub b. Search for "sql" - should find SQL c.
    Search for "openai" - should show "No credentials found" d. Clear search and verify all providers return

### Phase 5: GitHub Credential Creation Testing

15. Select GitHub from code repositories category
16. Test Anonymous authentication (default): a. Fill Display Name: "Test GitHub Anonymous {timestamp}" b.
    Verify Base URL defaults to "https://api.github.com" c. Verify "Anonymous" auth is selected by default d.
    Leave "Shared" unchecked e. Click "Test connection" button f. Click "Save" button g. Verify credential
    appears in credentials list
17. Create new GitHub credential with Token auth: a. Select GitHub provider again b. Fill Display Name: "Test
    GitHub Token {timestamp}" c. Select "Token" authentication d. Enter Access Token: {GitHub_Token} from
    .env.dev e. Test "Secret"/"Password" toggle for token field f. Click "Test connection" g. Save the
    credential h. Verify credential appears in list

### Phase 6: SQL Credential Creation Testing

18. Navigate to Create Credential page
19. Select SQL from development category
20. Fill SQL credential form: a. Display Name: "Test SQL Connection {timestamp}" b. Host: "localhost"
    (required field marked with _) c. Port: 5432 d. Username: "testuser" (required field marked with _) e.
    Password: "testpass" (required field marked with \*) f. Test "Secret"/"Password" toggle for password field
    g. Note "Test connection" is disabled with message h. Save the credential i. Verify credential appears in
    list

### Phase 7: Credential Management Operations

21. Switch to table view for management testing
22. Test context menu access: a. Right-click on a test credential row b. Verify context menu appears with
    "Delete" option c. Press Escape to close context menu
23. Test credential deletion: a. Right-click on a test credential b. Select "Delete" from context menu c.
    Confirm deletion if prompted d. Verify credential is removed from list

### Phase 8: Data Validation Testing

24. Navigate to Create Credential page
25. Select any credential type (e.g., GitHub)
26. Test required field validation: a. Attempt to save without filling Display Name (required) b. Verify
    validation prevents saving c. Fill Display Name and verify save becomes enabled
27. Test field format validation: a. Enter invalid URL in Base URL field b. Enter non-numeric value in Port
    field (if applicable) c. Verify appropriate validation messages appear

### Phase 9: Multi-Provider Loop Testing

28. For each provider in the available list, perform:
    ```
    Available Providers: GitHub, GitLab, Bitbucket, ADO repos, Slack,
    Confluence, Jira, SQL, ServiceNow, QTest, TestRail, Figma, Postman
    ```
    a. Navigate to Create Credential page b. Search for and select provider c. Fill form with valid test data
    (use {Provider}\_Token from .env.dev if available) d. Save credential with name "Loop Test {Provider}
    {timestamp}" e. Verify credential appears in list f. Record created credential name for cleanup

### Phase 10: Cleanup and Final Verification

29. Delete all test credentials created during this test: a. Use search to find credentials with "Test" or
    "Loop Test" in name b. Delete each test credential via context menu c. Verify all test credentials are
    removed
30. Perform final verification: a. Refresh page and verify normal credentials remain b. Verify no test
    artifacts remain in the system

## Expected Results

1. **Navigation and Access**: Page loads successfully with correct title "Credentials: all - {Project}",
   project context is maintained, user authentication persists
2. **View Mode Functionality**: Both table and card views display correctly, view toggle works seamlessly, all
   credential information is visible in both modes
3. **Search and Filter Operations**: Search box filters credentials by name/type, type filters work
   individually and in combination, clearing filters restores full list
4. **Credential Creation Flow**: Provider selection works, all provider categories accessible, search filters
   available providers correctly
5. **GitHub Credential Forms**: All authentication methods (Anonymous, Token, Password, App Key) display
   correct fields and save successfully
6. **SQL Credential Forms**: Required fields enforced, port accepts numeric input, password field has view
   toggle, test connection properly disabled
7. **Management Operations**: Context menu accessible, credential deletion works, confirmation dialogs appear
   where implemented
8. **Data Validation**: Required field validation prevents invalid saves, format validation works for
   URLs/ports, error messages are clear
9. **Multi-Provider Testing**: All available providers can be accessed and configured, loop iteration
   completes without errors
10. **Cleanup and Verification**: All test credentials can be deleted, system returns to clean state, no test
    artifacts remain

## Notes

- Use timestamp in credential names to avoid duplicates: "Test GitHub Token {timestamp}"
- Variable placeholders: {URL}, {Username}, {Password}, {Project} from .env.dev
- GitHub forms have 4 auth types: Anonymous (default), Token, Password, App private key
- SQL credentials have disabled "Test connection" with explanatory message
- Context menu accessible via right-click in table view only
- Some providers may have different field requirements - adapt validation testing accordingly
- Background 404 network calls are expected and should not fail the test
- Screenshots recommended for visual validation of view modes and forms
- Clean up all test credentials to avoid cluttering the system

## Provider Categories and Options

| Category           | Available Providers                                                            |
| ------------------ | ------------------------------------------------------------------------------ |
| code repositories  | ADO repos, Bitbucket, GitHub, GitLab                                           |
| communication      | Slack                                                                          |
| development        | Sonar, SQL                                                                     |
| documentation      | Confluence                                                                     |
| office             | SharePoint                                                                     |
| other              | Figma, Google Places, Postman, Salesforce, ServiceNow                          |
| project management | Ado, Jira, Rally                                                               |
| test management    | QTest, TestRail, Xray Cloud, Zephyr Enterprise, Zephyr Essential, Zephyr Scale |
| testing            | Browser, Carrier, Report Portal, TestIO                                        |

## Test Data Mapping for .env.dev

```bash
# Authentication
URL=http://localhost:5173
Username=<your_username>
Password=<your_password>
Project=Private

# GitHub testing
GitHub_Token=<your_github_token>
GitHub_Username=<your_github_username>
GitHub_Password=<your_github_password>

# Database testing
DB_Host=localhost
DB_Port=5432
DB_Username=testuser
DB_Password=testpass

# Optional provider tokens for loop testing
GitLab_Token=<your_gitlab_token>
Slack_Token=<your_slack_token>
Jira_Token=<your_jira_token>
Confluence_Token=<your_confluence_token>
```
