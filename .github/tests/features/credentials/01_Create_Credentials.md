# Scenario ID: 01_Create_Credentials

#### Scenario Name:

Create Credentials with various types and authentication methods

#### Scenario Tags:

functional testing, regression, credentials, authentication, security

#### Scenario Priority:

High

#### Scenario Description:

Validate the credential creation UX: navigation to credentials menu, credential type selection, form
validation, authentication method configuration (password/secret), field validation, error handling, and
successful credential creation for ADO, Jira, and Confluence platforms with proper security masking and
cleanup procedures.

## Test Case ID: TC-01-01

#### Test Case Name:

Navigate to credentials menu and verify credentials exist in the menu

#### Test Case Tags:

positive, ui, navigation

#### Test Case Priority:

High

#### Test Case Description:

Verify that users can navigate to the credentials menu and access credential management functionality from the
main navigation.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete,
   credentials.secrets.create, credentials.secrets.list, credentials.secrets.details,
   credentials.secrets.update, credentials.secrets.delete

### Test Steps

1. Navigate to the main application interface in the {Project}
2. Examine the main navigation menu structure (left sidebar or top navigation)
3. Locate the **Credentials** menu item in the navigation
4. Click on the **Credentials** menu item
5. Wait for the page to load completely
6. Verify the page URL contains "credentials" or similar identifier
7. Examine the page header and verify it displays **Credentials** title
8. Locate the **+ Create** button in the page header or toolbar
9. Verify the **+ Create** button is visible and appears enabled (not grayed out)
10. Examine the credentials dashboard interface layout
11. Check for presence of search functionality (search bar or filter options)
12. Verify the credentials list area is displayed (may be empty for new installations)
13. Check for proper page styling and layout without visual errors

### Expected Results

- The **Credentials** menu item is clearly visible in the main navigation
- Clicking the menu item successfully navigates to the credentials page
- The credentials page loads without errors or broken elements
- Page title displays **Credentials** or similar appropriate heading
- The **+ Create** button is prominently displayed and appears enabled
- The credentials dashboard interface is properly rendered and functional
- Search and filter functionality controls are visible and accessible
- The page layout is clean and follows the application's design standards
- No loading errors or broken UI elements are present
- The page responds appropriately to different screen sizes if applicable

### Postconditions

1. User remains on the credentials page with full access to credential functionality
2. No new credential data is created during navigation test
3. Application state remains unchanged from the navigation action
4. All UI elements are properly rendered and accessible for subsequent operations
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-02

#### Test Case Name:

Open credential creation window and verify interface elements

#### Test Case Tags:

positive, ui, modal

#### Test Case Priority:

High

#### Test Case Description:

Verify that the credential creation window opens correctly with proper interface elements, credential type
selection functionality, and organized categorization of available credential types.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete,
   credentials.secrets.create, credentials.secrets.list, credentials.secrets.details,
   credentials.secrets.update, credentials.secrets.delete
6. User is on the Credentials page as verified in TC-01-01

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Verify that credential creation window opens
4. Verify that the page name displays **New Credential** or **New {cred_type} credential**
5. Verify there is a search window with **Choose credential type** message
6. Verify that different credential types are listed by sections
7. Verify that **Delete** button is inactive and not clickable
8. Test search functionality by typing credential type names
9. Verify credential types are organized in categorized sections

### Expected Results

- Credential creation window opens successfully
- Page title shows "New Credential" or similar
- Search field displays "Choose credential type" placeholder text
- Credential types are organized in logical sections (Project Management, Code Repositories, etc.)
- Delete button is disabled/inactive when no credential is selected
- Search functionality filters credential types correctly
- All supported credential types are visible (ADO, Jira, Confluence, GitHub, etc.)

### Postconditions

1. Credential creation window remains open
2. No credential is created yet
3. User can proceed to select credential type
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-03

#### Test Case Name:

Create ADO credential with all mandatory fields using password token

#### Test Case Tags:

positive, credential-creation, ado

#### Test Case Priority:

High

#### Test Case Description:

Ensure that ADO credential can be created successfully by filling all mandatory fields with password token
authentication method and verify proper security masking of sensitive data.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete,
   credentials.secrets.create, credentials.secrets.list, credentials.secrets.details,
   credentials.secrets.update, credentials.secrets.delete
6. Valid ADO organization URL is available (e.g., https://dev.azure.com/organization-name)
7. Valid ADO project name is available for testing
8. Valid ADO personal access token with appropriate permissions is available

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** credential type from the list
4. Fill in **Display Name** field with "Test*ADO_Credential*{timestamp}"
5. Fill in **ID** field with "test*ado_cred*{timestamp}"
6. Fill in **Organization URL** field with valid ADO organization URL
7. Fill in **Project** field with valid project name
8. In **Token** field, click on **Password** button/option
9. Enter valid ADO personal access token manually in the password field
10. Verify password field masks the input with asterisks or dots
11. Click **Save** button
12. Verify credential is created and appears in credentials list

### Expected Results

- All mandatory fields accept valid input without errors
- Password field properly masks token input for security
- Credential is created successfully
- Success message or notification is displayed
- New ADO credential appears in the credentials dashboard list
- Credential details are saved correctly with proper authentication type

### Postconditions

1. Clean up test data by deleting the created credential:
   - Navigate to the **Credentials** section in the {Project}
   - Locate the created credential "Test*ADO_Credential*{timestamp}" in the credentials list
   - Click on the credential to open its details
   - Click the **Delete** (trash) button in the credential details
   - A modal window opens with "Delete confirmation" title
   - Click on the name field in the modal
   - Manually enter the credential name "Test*ADO_Credential*{timestamp}" in the field
   - Click the **Delete** button in the modal to confirm deletion
   - Verify the credential is removed from the credentials list
2. Verify no residual data remains from the deleted credential
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-04

#### Test Case Name:

Create ADO credential using Secret token option

#### Test Case Tags:

Smoke, Regression, ADO Credential, Secret Authentication, Security

#### Test Case Priority:

High

#### Test Case Description

Ensure that ADO credential can be created using previously saved secret for enhanced security.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create credentials and secrets
6. Valid ADO organization URL and project are available
7. Create a secret with ADO token:
   - Navigate to **Settings** → **Secrets**
   - Click **+** button to create new secret
   - Enter secret name: "ADO*TOKEN_SECRET*{timestamp}"
   - Enter valid ADO personal access token in value field
   - Save the secret

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** or **Azure DevOps** credential type from the list
4. Fill in **Display Name** field with "Test*ADO_Secret_Credential*{timestamp}"
5. Fill in **ID** field with "test*ado_secret*{timestamp}"
6. Fill in **Organization URL** field with valid ADO organization URL
7. Fill in **Project** field with valid project name
8. In **Token** field, click on **Secret** button/option
9. From dropdown menu, select "ADO*TOKEN_SECRET*{timestamp}"
10. Verify the secret is properly selected and linked
11. Click **Save** button
12. Verify credential is created successfully

### Expected Results

- Secret dropdown shows available secrets created by the user
- Previously created secret "ADO*TOKEN_SECRET*{timestamp}" can be selected
- Credential is created successfully using secret reference
- Credential appears in credentials list with secret-based authentication
- Secret remains secure and is not exposed in the interface

### Postconditions

1. Clean up test data by deleting the created credential:
   - Navigate to the **Credentials** section in the {Project}
   - Click on **Table View** to display credentials in table format
   - In the credentials list, find "Test*ADO_Secret_Credential*{timestamp}"
   - Click on the ellipsis (...) button in the Actions column for this credential
   - Select **Delete** from the dropdown menu
   - A modal window opens with "Delete confirmation" title
   - In the modal, copy the credential name from the prompt text
   - Paste the credential name "Test*ADO_Secret_Credential*{timestamp}" into the name field
   - Click the **Delete** button in the modal to confirm deletion
   - Verify the credential is removed from the credentials list
2. Clean up the secret (optional - secret can remain for other tests):
   - Navigate to **Settings** → **Secrets**
   - Delete "ADO*TOKEN_SECRET*{timestamp}" if no longer needed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-05

#### Test Case Name:

Cancel credential creation after filling mandatory fields

#### Test Case Tags:

Functional, Negative Testing, Cancel Operation

#### Test Case Priority:

Medium

#### Test Case Description

Verify that credential creation can be cancelled without saving data after filling all mandatory fields.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create credentials
6. Valid test data is available for credential fields

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** or **Azure DevOps** credential type from the list
4. Fill in all mandatory fields:
   - **Display Name**: "Test*Cancel_Credential*{timestamp}"
   - **ID**: "test*cancel*{timestamp}"
   - **Organization URL**: valid ADO organization URL
   - **Project**: valid project name
   - **Token**: select Password option and enter valid token
5. Verify all fields are filled correctly
6. Click **Cancel** button instead of Save
7. Verify user is returned to credentials dashboard/list
8. Search for "Test*Cancel_Credential*{timestamp}" in credentials list
9. Confirm the credential does not exist in the list

### Expected Results

- Cancel button functions correctly and is accessible
- No credential is created or saved when Cancel is clicked
- User is redirected back to credentials list/dashboard
- No traces of cancelled credential remain in the system
- Form data is properly discarded without persistence

### Postconditions

1. Verify no new credential exists in the system with the test name
2. User remains on credentials list page
3. Application state is unchanged from before the cancelled operation
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-06

#### Test Case Name:

Create credential with manual password entry

#### Test Case Tags:

Functional, Manual Input, Password Security

#### Test Case Priority:

High

#### Test Case Description

Verify that credentials can be created with manually entered password tokens with proper security masking.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create credentials
6. Valid ADO personal access token is available for manual entry

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** or **Azure DevOps** credential type
4. Fill in **Display Name**: "Manual*Password_Credential*{timestamp}"
5. Fill in **ID**: "manual*pwd*{timestamp}"
6. Fill in **Organization URL** with valid ADO organization URL
7. Fill in **Project** with valid project name
8. Click on **Password** button in Token field
9. Manually type the ADO personal access token character by character
10. Verify password field masks the input with asterisks or dots
11. Verify typed characters are not visible in plain text
12. Click **Save** button
13. Verify credential is created successfully

### Expected Results

- Password field properly masks token input during typing
- All fields accept manual input correctly without formatting issues
- Token characters are not visible as plain text for security
- Credential is created and saved successfully
- Token is securely stored and encrypted in the system

### Postconditions

1. Clean up test data by deleting the created credential:
   - Navigate to the **Credentials** section in the {Project}
   - Locate the created credential "Manual*Password_Credential*{timestamp}" in the credentials list
   - Click on the credential to open its details
   - Click the **Delete** (trash) button in the credential details
   - A modal window opens with "Delete confirmation" title
   - The modal displays a prompt with the credential name to be deleted
   - Copy the credential name "Manual*Password_Credential*{timestamp}" from the prompt text in the modal
   - Click on the name field in the modal and paste the copied credential name
   - Click the **Delete** button in the modal to confirm deletion
   - Verify the credential is removed from the credentials list
2. Verify credential cleanup is successful and no residual data remains
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-07

#### Test Case Name:

Create credential using copy-paste for all field values

#### Test Case Tags:

Functional, Copy-Paste Operations, Data Entry

#### Test Case Priority:

Medium

#### Test Case Description

Verify that credentials can be created using copy-paste operations for all field values without formatting
issues.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create credentials
6. Valid credential data is prepared in external source (notepad/document):
   - Display Name: "CopyPaste*Credential*{timestamp}"
   - ID: "copypaste\_{timestamp}"
   - Organization URL: valid ADO organization URL
   - Project: valid project name
   - Token: valid ADO personal access token

### Test Steps

1. Prepare test data in external application (Notepad, Word, etc.)
2. Navigate to the **Credentials** section in the {Project} application
3. Click on **+ Create** button
4. Select **ADO** or **Azure DevOps** credential type
5. Copy "CopyPaste*Credential*{timestamp}" from external source and paste into **Display Name** field
6. Copy "copypaste\_{timestamp}" from external source and paste into **ID** field
7. Copy organization URL from external source and paste into **Organization URL** field
8. Copy project name from external source and paste into **Project** field
9. Click **Password** button in Token field
10. Copy token from external source and paste into Token field
11. Verify all pasted values appear correctly without formatting corruption
12. Click **Save** button
13. Verify credential is created successfully

### Expected Results

- All fields accept copy-pasted values correctly
- No formatting issues occur with pasted content (no extra spaces, line breaks, etc.)
- Pasted values are properly validated according to field requirements
- Credential is created successfully with all copy-pasted data
- Token field maintains security masking even with pasted content

### Postconditions

1. Clean up test data by deleting the created credential:
   - Navigate to the **Credentials** section in the {Project}
   - Click on **Table View** to display credentials in table format
   - In the credentials list, find "CopyPaste*Credential*{timestamp}"
   - Click on the ellipsis (...) button in the Actions column for this credential
   - Select **Delete** from the dropdown menu
   - A modal window opens with "Delete confirmation" title
   - In the modal, copy the credential name from the prompt text
   - Paste the credential name "CopyPaste*Credential*{timestamp}" into the name field
   - Click the **Delete** button in the modal to confirm deletion
   - Verify the credential is removed from the credentials list
2. Verify credential cleanup is successful and no residual data remains
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-08

#### Test Case Name:

Validate empty Display Name field

#### Test Case Tags:

Negative Testing, Field Validation, Required Fields

#### Test Case Priority:

High

#### Test Case Description

Verify that credential creation is prevented when mandatory Display Name field is empty.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create credentials

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** or **Azure DevOps** credential type
4. Leave **Display Name** field empty (do not enter any value)
5. Fill in all other mandatory fields with valid data:
   - **ID**: "empty*display*{timestamp}"
   - **Organization URL**: valid ADO organization URL
   - **Project**: valid project name
   - **Token**: select Password and enter valid token
6. Attempt to click **Save** button
7. Verify validation error appears for Display Name field
8. Verify credential is not created
9. Verify Save button behavior (disabled or shows error)

### Expected Results

- Validation error message appears specifically for empty Display Name field
- Error message is clear and indicates Display Name is required
- Credential creation is prevented until Display Name is provided
- Save button is either disabled or shows validation error
- User remains on creation form to correct the error
- Other filled field values are preserved during validation

### Postconditions

1. No credential is created in the system
2. User can correct the error by filling Display Name and retry
3. Form retains other filled values for user convenience
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-09

#### Test Case Name:

Validate empty ID field

#### Test Case Tags:

Negative Testing, Field Validation, Required Fields

#### Test Case Priority:

High

#### Test Case Description

Verify that credential creation is prevented when mandatory ID field is empty.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create credentials

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** or **Azure DevOps** credential type
4. Fill in **Display Name**: "Test*Empty_ID*{timestamp}"
5. Leave **ID** field empty (do not enter any value)
6. Fill in other mandatory fields with valid data:
   - **Organization URL**: valid ADO organization URL
   - **Project**: valid project name
   - **Token**: select Password and enter valid token
7. Attempt to click **Save** button
8. Verify validation error appears for ID field
9. Verify credential is not created

### Expected Results

- Validation error message appears specifically for empty ID field
- Error message clearly indicates ID is required
- Credential creation is prevented until ID is provided
- Form shows specific error highlighting for ID field
- Other field values remain preserved during validation

### Postconditions

1. No credential is created in the system
2. User can correct the error by filling ID field and retry
3. Other filled field values are retained
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-10

#### Test Case Name:

Validate empty Organization URL field

#### Test Case Tags:

Negative Testing, Field Validation, Required Fields

#### Test Case Priority:

High

#### Test Case Description

Verify that credential creation is prevented when mandatory Organization URL field is empty.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create credentials

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** or **Azure DevOps** credential type
4. Fill in **Display Name**: "Test*Empty_URL*{timestamp}"
5. Fill in **ID**: "empty*url*{timestamp}"
6. Leave **Organization URL** field empty (do not enter any value)
7. Fill in other mandatory fields:
   - **Project**: valid project name
   - **Token**: select Password and enter valid token
8. Attempt to click **Save** button
9. Verify validation error appears for Organization URL field
10. Verify credential is not created

### Expected Results

- Validation error message appears for empty Organization URL field
- Error message guides user to enter valid Organization URL
- Credential creation is prevented until Organization URL is provided
- Field validation highlights the empty Organization URL field
- Error message may include format guidance (e.g., https://dev.azure.com/organization)

### Postconditions

1. No credential is created in the system
2. User can correct the error by entering valid Organization URL
3. Other field values remain preserved
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-11

#### Test Case Name:

Validate empty Project field

#### Test Case Tags:

Negative Testing, Field Validation, Required Fields

#### Test Case Priority:

High

#### Test Case Description

Verify that credential creation is prevented when mandatory Project field is empty.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create credentials

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** or **Azure DevOps** credential type
4. Fill in **Display Name**: "Test*Empty_Project*{timestamp}"
5. Fill in **ID**: "empty*project*{timestamp}"
6. Fill in **Organization URL**: valid ADO organization URL
7. Leave **Project** field empty (do not enter any value)
8. Fill in **Token**: select Password and enter valid token
9. Attempt to click **Save** button
10. Verify validation error appears for Project field
11. Verify credential is not created

### Expected Results

- Validation error message appears for empty Project field
- Error message clearly indicates Project field is required
- Credential creation is prevented until Project is specified
- Project field is highlighted as having validation error
- Form preserves other entered values during validation

### Postconditions

1. No credential is created in the system
2. User can correct the error by entering valid project name
3. Previously filled fields retain their values
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-12

#### Test Case Name:

Validate empty Token field

#### Test Case Tags:

Negative Testing, Field Validation, Required Fields, Authentication

#### Test Case Priority:

High

#### Test Case Description

Verify that credential creation is prevented when mandatory Token field is empty.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create credentials

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** or **Azure DevOps** credential type
4. Fill in all other mandatory fields:
   - **Display Name**: "Test*Empty_Token*{timestamp}"
   - **ID**: "empty*token*{timestamp}"
   - **Organization URL**: valid ADO organization URL
   - **Project**: valid project name
5. Leave **Token** field empty (don't select Password or Secret, or select Password but leave field blank)
6. Attempt to click **Save** button
7. Verify validation error appears for Token field
8. Verify credential is not created

### Expected Results

- Validation error message appears for empty Token field
- Error message indicates Token/authentication is required
- Credential creation is prevented until Token is provided
- Token field shows validation error highlighting
- Error may specify that either Password or Secret must be selected and filled

### Postconditions

1. No credential is created in the system
2. User can correct the error by providing valid token (Password or Secret)
3. Other field values are retained during validation
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-13

#### Test Case Name:

Create shared credential with all mandatory fields

#### Test Case Tags:

Functional, Shared Credentials, Collaboration

#### Test Case Priority:

Medium

#### Test Case Description

Verify that credentials can be created with "Shared" option enabled for team collaboration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create shared credentials
6. Valid credential data is available

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** or **Azure DevOps** credential type
4. Fill in all mandatory fields:
   - **Display Name**: "Shared*ADO_Credential*{timestamp}"
   - **ID**: "shared*ado*{timestamp}"
   - **Organization URL**: valid ADO organization URL
   - **Project**: valid project name
   - **Token**: select Password and enter valid token
5. Locate and check the **Shared** checkbox
6. Click **Save** button
7. Verify credential is created successfully
8. Verify credential appears with shared indicator in credentials list
9. Verify shared status is clearly displayed

### Expected Results

- Shared checkbox is available and functional
- Credential is created successfully with shared property enabled
- Shared status is clearly indicated in credentials list (icon, label, or visual indicator)
- Credential becomes accessible to appropriate team members/users
- Shared credential appears in shared credentials section if applicable

### Postconditions

1. Clean up test data by deleting the created shared credential:
   - Navigate to the **Credentials** section in the {Project}
   - Locate the created credential "Shared*ADO_Credential*{timestamp}" in the credentials list
   - Click on the credential to open its details
   - Click the **Delete** (trash) button in the credential details
   - A modal window opens with "Delete confirmation" title
   - Click on the name field in the modal
   - Manually enter the credential name "Shared*ADO_Credential*{timestamp}" in the field
   - Click the **Delete** button in the modal to confirm deletion
   - Verify the credential is removed from the credentials list
2. Verify shared credential cleanup is successful and no residual data remains
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-14

#### Test Case Name:

Prevent duplicate credential IDs

#### Test Case Tags:

Negative Testing, ID Validation, Duplicate Prevention

#### Test Case Priority:

High

#### Test Case Description

Verify that the system prevents creation of credentials with duplicate IDs to maintain data integrity.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create credentials
6. Create a credential with ID "duplicate*test*{timestamp}" first:
   - Navigate to **Credentials** section
   - Create ADO credential with ID "duplicate*test*{timestamp}"
   - Verify it exists in the system

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** or **Azure DevOps** credential type
4. Fill in **Display Name**: "Duplicate*Test_Second*{timestamp}"
5. Fill in **ID**: "duplicate*test*{timestamp}" (same as existing credential)
6. Fill in other mandatory fields with valid but different data:
   - **Organization URL**: valid ADO organization URL
   - **Project**: valid project name
   - **Token**: valid token
7. Attempt to click **Save** button
8. Verify error message appears indicating ID already exists
9. Verify credential is not created
10. Verify existing credential with same ID remains unchanged

### Expected Results

- System validates ID uniqueness before saving
- Clear error message appears indicating ID already exists
- Error message suggests user choose a different ID
- Credential creation is prevented to maintain data integrity
- Existing credential with the same ID is unaffected
- User can modify ID and retry creation process

### Postconditions

1. No new credential is created with duplicate ID
2. Original credential "duplicate*test*{timestamp}" remains unchanged
3. Clean up by removing the pre-existing test credential:
   - Navigate to the **Credentials** section in the {Project}
   - Click on **Table View** to display credentials in table format
   - In the credentials list, find "duplicate*test*{timestamp}"
   - Click on the ellipsis (...) button in the Actions column for this credential
   - Select **Delete** from the dropdown menu
   - A modal window opens with "Delete confirmation" title
   - In the modal, copy the credential name from the prompt text
   - Paste the credential name "duplicate*test*{timestamp}" into the name field
   - Click the **Delete** button in the modal to confirm deletion
   - Verify the credential is removed from the credentials list
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-15

#### Test Case Name:

Create Jira credential with Basic authentication

#### Test Case Tags:

Functional, Jira Credentials, Basic Authentication

#### Test Case Priority:

High

#### Test Case Description

Verify that Jira credentials can be created using Basic authentication flow with username and API key.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create credentials
6. Valid Jira instance URL and credentials are available

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **Jira** credential type from the list
4. Fill in mandatory fields:
   - **Display Name**: "Jira*Basic_Auth*{timestamp}"
   - **ID**: "jira*basic*{timestamp}"
   - **Base URL**: valid Jira instance URL (e.g., https://company.atlassian.net)
5. Select **Basic** authentication flow from Auth dropdown/options
6. Fill in **Username**: valid Jira username/email
7. Fill in **API Key**: valid Jira API token
8. Click **Save** button
9. Verify credential is created successfully
10. Verify credential appears in credentials list with correct authentication type

### Expected Results

- Jira credential type is available in the credential types list
- Basic auth option is available and selectable
- Username and API Key fields appear and are required for Basic auth
- All fields accept valid Jira-specific data
- Credential is created and saved successfully
- Authentication method (Basic) is properly stored and displayed

### Postconditions

1. Clean up test data by deleting the created Jira credential:
   - Navigate to the **Credentials** section in the {Project}
   - Locate the created credential "Jira*Basic_Auth*{timestamp}" in the credentials list
   - Click on the credential to open its details
   - Click the **Delete** (trash) button in the credential details
   - A modal window opens with "Delete confirmation" title
   - Click on the name field in the modal
   - Manually enter the credential name "Jira*Basic_Auth*{timestamp}" in the field
   - Click the **Delete** button in the modal to confirm deletion
   - Verify the credential is removed from the credentials list
2. Verify credential cleanup is successful and no residual data remains
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-16

#### Test Case Name:

Create Jira credential with Bearer authentication

#### Test Case Tags:

Functional, Jira Credentials, Bearer Authentication

#### Test Case Priority:

High

#### Test Case Description

Verify that Jira credentials can be created using Bearer authentication flow with API token only.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create credentials
6. Valid Jira Bearer token is available

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **Jira** credential type from the list
4. Fill in mandatory fields:
   - **Display Name**: "Jira*Bearer_Auth*{timestamp}"
   - **ID**: "jira*bearer*{timestamp}"
   - **Base URL**: valid Jira instance URL
5. Select **Bearer** authentication flow from Auth dropdown/options
6. Fill in **API Key**: valid Bearer token
7. Verify **Username** field is not required/optional for Bearer auth
8. Click **Save** button
9. Verify credential is created successfully

### Expected Results

- Bearer authentication option is available for Jira credentials
- Only API Key field is required for Bearer auth flow
- Username field is optional/hidden when Bearer auth is selected
- Bearer token is accepted in API Key field
- Credential is created successfully with Bearer authentication
- Authentication type is properly stored as Bearer

### Postconditions

1. Clean up test data by deleting the created Jira credential:
   - Navigate to the **Credentials** section
   - Locate the credential "Jira*Bearer_Auth*{timestamp}" in the credentials list
   - Option 1: Click on the credential name to open credential details page, then click **Delete** button
   - Option 2: Use the ellipsis menu (⋯) next to the credential in the table view and select **Delete**
   - Option 3: From the modal prompt showing the credential name, copy the name and paste it into the
     confirmation field
   - In the **Delete confirmation** modal:
     - Enter the credential name "Jira*Bearer_Auth*{timestamp}" in the confirmation field (either by typing or
       copy-paste)
     - Click **Delete** button to confirm
   - Verify the credential is removed from the list
2. Verify credential cleanup is successful
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-17

#### Test Case Name:

Create shared Jira credential with Basic authentication

#### Test Case Tags:

Functional, Jira Credentials, Shared Credentials, Basic Authentication

#### Test Case Priority:

Medium

#### Test Case Description

Verify that shared Jira credentials can be created with Basic authentication for team collaboration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create shared credentials
6. Valid Jira credentials are available

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **Jira** credential type from the list
4. Fill in mandatory fields:
   - **Display Name**: "Shared*Jira_Credential*{timestamp}"
   - **ID**: "shared*jira*{timestamp}"
   - **Base URL**: valid Jira instance URL
5. Select **Basic** authentication flow
6. Fill in **Username** and **API Key** with valid Jira credentials
7. Check **Shared** checkbox to enable sharing
8. Click **Save** button
9. Verify shared Jira credential is created successfully
10. Verify shared indicator appears in credentials list

### Expected Results

- Shared option is available for Jira credentials
- Credential is created successfully with shared status
- Shared status is clearly indicated in the credentials interface
- Other authorized users can access the shared Jira credential
- Authentication type and sharing status are both properly stored

### Postconditions

1. Clean up test data by deleting the created shared Jira credential:
   - Navigate to the **Credentials** section
   - Locate the credential "Shared*Jira_Credential*{timestamp}" in the credentials list
   - Option 1: Click on the credential name to open credential details page, then click **Delete** button
   - Option 2: Use the ellipsis menu (⋯) next to the credential in the table view and select **Delete**
   - Option 3: From the modal prompt showing the credential name, copy the name and paste it into the
     confirmation field
   - In the **Delete confirmation** modal:
     - Enter the credential name "Shared*Jira_Credential*{timestamp}" in the confirmation field (either by
       typing or copy-paste)
     - Click **Delete** button to confirm
   - Verify the credential is removed from the list
2. Verify shared credential cleanup is successful
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-18

#### Test Case Name:

Create Confluence credential with Basic authentication

#### Test Case Tags:

Functional, Confluence Credentials, Basic Authentication

#### Test Case Priority:

High

#### Test Case Description

Verify that Confluence credentials can be created using Basic authentication with username and API key.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create credentials
6. Valid Confluence instance and credentials are available

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **Confluence** credential type from the list
4. Fill in mandatory fields:
   - **Display Name**: "Confluence*Basic_Auth*{timestamp}"
   - **ID**: "confluence*basic*{timestamp}"
   - **Base URL**: valid Confluence instance URL (e.g., https://{company}.atlassian.net)
5. Select **Basic** authentication flow from available options
6. Fill in **Username**: valid Confluence username/email
7. Fill in **API Key**: valid Confluence API token
8. Click **Save** button
9. Verify credential is created successfully
10. Verify credential appears in list with correct type and auth method

### Expected Results

- Confluence credential type is available in the credential types list
- Basic authentication flow works correctly for Confluence
- All mandatory fields are validated appropriately
- Username and API Key fields are required for Basic auth
- Credential is created and stored successfully
- Confluence-specific validation is applied to Base URL

### Postconditions

1. Clean up test data by deleting the created Confluence credential:
   - Navigate to the **Credentials** section
   - Locate the credential "Confluence*Basic_Auth*{timestamp}" in the credentials list
   - Option 1: Click on the credential name to open credential details page, then click **Delete** button
   - Option 2: Use the ellipsis menu (⋯) next to the credential in the table view and select **Delete**
   - Option 3: From the modal prompt showing the credential name, copy the name and paste it into the
     confirmation field
   - In the **Delete confirmation** modal:
     - Enter the credential name "Confluence*Basic_Auth*{timestamp}" in the confirmation field (either by
       typing or copy-paste)
     - Click **Delete** button to confirm
   - Verify the credential is removed from the list
2. Verify credential cleanup is successful
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-19

#### Test Case Name:

Create Confluence credential with Bearer authentication

#### Test Case Tags:

Functional, Confluence Credentials, Bearer Authentication

#### Test Case Priority:

High

#### Test Case Description

Verify that Confluence credentials can be created using Bearer authentication with API token only.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create credentials
6. Valid Confluence Bearer token is available

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **Confluence** credential type from the list
4. Fill in mandatory fields:
   - **Display Name**: "Confluence*Bearer_Auth*{timestamp}"
   - **ID**: "confluence*bearer*{timestamp}"
   - **Base URL**: valid Confluence instance URL
5. Select **Bearer** authentication flow from available options
6. Fill in **API Key**: valid Bearer token for Confluence
7. Verify **Username** field behavior (optional for Bearer auth)
8. Click **Save** button
9. Verify credential is created successfully

### Expected Results

- Bearer authentication option is available for Confluence credentials
- API Key field accepts Bearer token format
- Username field behavior matches authentication type (optional for Bearer)
- Credential creation succeeds with Bearer authentication
- Authentication method is properly stored and indicated

### Postconditions

1. Clean up test data by deleting the created Confluence credential:
   - Navigate to the **Credentials** section
   - Locate the credential "Confluence*Bearer_Auth*{timestamp}" in the credentials list
   - Option 1: Click on the credential name to open credential details page, then click **Delete** button
   - Option 2: Use the ellipsis menu (⋯) next to the credential in the table view and select **Delete**
   - Option 3: From the modal prompt showing the credential name, copy the name and paste it into the
     confirmation field
   - In the **Delete confirmation** modal:
     - Enter the credential name "Confluence*Bearer_Auth*{timestamp}" in the confirmation field (either by
       typing or copy-paste)
     - Click **Delete** button to confirm
   - Verify the credential is removed from the list
2. Verify credential cleanup is successful
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-20

#### Test Case Name:

Validate mandatory field requirements for Jira credentials

#### Test Case Tags:

Negative Testing, Field Validation, Jira Credentials

#### Test Case Priority:

High

#### Test Case Description

Verify that all mandatory fields are properly validated for Jira credential creation.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions to create credentials

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **Jira** credential type from the list
4. **Test Empty Display Name:**
   - Leave **Display Name** empty, fill other fields with valid data
   - Attempt to save, verify validation error appears
5. **Test Empty ID:**
   - Fill **Display Name**, leave **ID** empty, fill other fields
   - Attempt to save, verify validation error appears
6. **Test Empty Base URL:**
   - Fill **Display Name** and **ID**, leave **Base URL** empty
   - Attempt to save, verify validation error appears
7. **Test Empty Username (Basic Auth):**
   - Fill **Display Name**, **ID**, **Base URL**, select **Basic** auth
   - Leave **Username** empty, fill **API Key**
   - Attempt to save, verify validation error appears
8. **Test Empty API Key:**
   - Fill all fields except **API Key**
   - Attempt to save, verify validation error appears

### Expected Results

- Each empty mandatory field triggers specific validation error
- Clear error messages appear for each missing field
- Error messages are specific to the field and authentication type
- Credential creation is prevented until all mandatory fields are filled
- Form preserves filled values during validation process
- Validation errors are clearly highlighted on respective fields

### Postconditions

1. No credential is created during validation testing
2. User remains on the credential creation form
3. Click **Cancel** to return to credentials list
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-01-21

#### Test Case Name:

Test ID field uniqueness validation

#### Test Case Tags:

negative, validation, uniqueness

#### Test Case Priority:

High

#### Test Case Description:

Verify that the system prevents creation of credentials with duplicate IDs and displays appropriate error
messages.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete
6. Create a reference credential for duplication testing:
   - Navigate to **Credentials** section
   - Click **+ Create** button
   - Select **ADO** credential type
   - Fill fields: Display Name: "Reference*Credential*{timestamp}", ID: "unique*test_id*{timestamp}"
   - Complete creation with valid data and save

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** credential type from the list
4. Fill in **Display Name** field with "Duplicate*ID_Test*{timestamp}"
5. Fill in **ID** field with the same value as reference credential: "unique*test_id*{timestamp}"
6. Fill in all other mandatory fields with valid data:
   - **Organization URL**: valid ADO organization URL
   - **Project**: valid project name
   - **Token**: select Password option and enter valid token
7. Click **Save** button
8. Observe validation error message
9. Verify the error message clearly indicates ID duplication
10. Attempt to modify ID to a unique value: "unique*test_id_new*{timestamp}"
11. Click **Save** button again
12. Verify credential creation succeeds with unique ID

### Expected Results

- System detects duplicate ID and prevents credential creation
- Clear error message appears indicating "ID already exists" or similar
- Error message highlights the ID field specifically
- Form retains all other field values during validation error
- After changing to unique ID, credential creation succeeds
- Both credentials can coexist with different IDs but similar other data
- System maintains ID uniqueness constraint across all credential types

### Postconditions

1. Clean up test data by deleting both created credentials:
   - Navigate to the **Credentials** section in the {Project}
   - Click on **Table View** button
   - For "Reference*Credential*{timestamp}":
     - Find credential in the list, click ellipsis (...) in Actions column
     - Select **Delete**, confirm in modal by entering credential name
   - For "Duplicate*ID_Test*{timestamp}" (if created successfully):
     - Find credential in the list, click ellipsis (...) in Actions column
     - Select **Delete**, confirm in modal by entering credential name
   - Verify both credentials are removed from the list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-22

#### Test Case Name:

Test Display Name field boundary value - maximum allowed length (64 characters)

#### Test Case Tags:

positive, boundary, validation, display-name

#### Test Case Priority:

High

#### Test Case Description:

Verify Display Name field accepts exactly 64 characters (MAX_NAME_LENGTH boundary value) and creates
credential successfully.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** credential type from the list
4. **Test exact maximum length (64 characters):**
   - Enter exactly 64-character string in **Display Name** field:
     "TestCredentialDisplayNameWithExactSixtyFourCharactersLength_12"
   - Fill **ID** field with "test*display_64*{timestamp}"
   - Fill other mandatory fields with valid data:
     - **Organization URL**: valid ADO organization URL
     - **Project**: valid project name
     - **Token**: select Password option and enter valid token
   - Click **Save** button
   - Verify credential is created successfully
5. Verify the credential appears in the credentials list with full display name
6. Open the credential details and verify all 64 characters are preserved

### Expected Results

- 64-character Display Name is accepted without validation errors
- Input field allows typing exactly 64 characters
- All 64 characters are preserved and displayed correctly
- Credential is created successfully with the boundary value
- Display name appears fully in credentials list and detail views
- No truncation or data loss occurs with maximum length input

### Postconditions

1. Clean up test data by deleting the created credential:
   - Navigate to **Credentials** section, click **Table View**
   - Find "TestCredentialDisplayNameWithExactSixtyFourCharactersLength_12"
   - Click ellipsis (...) → **Delete**
   - In "Delete confirmation" modal, manually enter the full credential name
   - Confirm deletion and verify removal from list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- MAX_NAME_LENGTH constant value is 64 characters based on codebase analysis

## Test Case ID: TC-01-23

#### Test Case Name:

Test Display Name field out-of-boundary value - exceeding maximum length (65+ characters)

#### Test Case Tags:

negative, boundary, validation, display-name

#### Test Case Priority:

High

#### Test Case Description:

Verify Display Name field rejects input exceeding 64 characters and prevents credential creation with
appropriate validation.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** credential type from the list
4. **Test exceeding maximum length (65 characters):**
   - Attempt to enter 65-character string in **Display Name** field:
     "TestCredentialDisplayNameWithExactSixtyFiveCharactersLength_123"
   - Verify input field behavior (should prevent typing beyond 64 characters)
5. **Test exceeding maximum length (100 characters):**
   - Attempt to enter 100-character string:
     "TestCredentialDisplayNameWithOneHundredCharactersLengthToTestInputValidationBoundaryLimits_12345"
   - Verify input field behavior and validation
6. Fill other mandatory fields with valid data and attempt to save
7. Verify validation behavior and error messages

### Expected Results

- Input field prevents typing beyond 64 characters (character limit enforcement)
- If user manages to enter excess characters, validation error appears
- Clear error message indicates maximum length limit (64 characters)
- Form does not submit with invalid Display Name length
- Character counter or limit indicator is visible (if implemented)
- Error message is specific: "Display Name cannot exceed 64 characters" or similar

### Postconditions

1. No credential is created during validation testing
2. Return to credentials list page by clicking **Cancel**
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- MAX_NAME_LENGTH constant enforces 64-character limit at UI input level

## Test Case ID: TC-01-24

#### Test Case Name:

Test ID field boundary value - maximum allowed length (64 characters)

#### Test Case Tags:

positive, boundary, validation, id-field

#### Test Case Priority:

High

#### Test Case Description:

Verify ID field accepts exactly 64 characters (MAX_NAME_LENGTH boundary value) and creates credential
successfully.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** credential type from the list
4. Fill **Display Name** field with "Test*ID_Boundary_64*{timestamp}"
5. **Test exact maximum length (64 characters) for ID:**
   - Enter exactly 64-character string in **ID** field:
     "test_credential_id_with_exactly_sixty_four_characters_length_12"
   - Fill other mandatory fields with valid data:
     - **Organization URL**: valid ADO organization URL
     - **Project**: valid project name
     - **Token**: select Password option and enter valid token
   - Click **Save** button
   - Verify credential is created successfully
6. Verify the credential appears in the credentials list with the full ID
7. Open credential details and verify all 64 characters are preserved in ID

### Expected Results

- 64-character ID is accepted without validation errors
- Input field allows typing exactly 64 characters
- All 64 characters are preserved correctly in the ID field
- Credential is created successfully with boundary value ID
- ID appears correctly in credentials list and detail views
- System accepts alphanumeric characters and underscores in 64-char ID

### Postconditions

1. Clean up test data by deleting the created credential:
   - Navigate to **Credentials** section, click **Table View**
   - Find credential with ID "test_credential_id_with_exactly_sixty_four_characters_length_12"
   - Click ellipsis (...) → **Delete**
   - In "Delete confirmation" modal, copy credential name from prompt and paste
   - Confirm deletion and verify removal from list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ID field uses same MAX_NAME_LENGTH (64) constant as Display Name

## Test Case ID: TC-01-25

#### Test Case Name:

Test ID field out-of-boundary value - exceeding maximum length (65+ characters)

#### Test Case Tags:

negative, boundary, validation, id-field

#### Test Case Priority:

High

#### Test Case Description:

Verify ID field rejects input exceeding 64 characters and prevents credential creation with appropriate
validation.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** credential type from the list
4. Fill **Display Name** field with "Test*ID_OutOfBoundary*{timestamp}"
5. **Test exceeding maximum length (65 characters) for ID:**
   - Attempt to enter 65-character string in **ID** field:
     "test_credential_id_with_exactly_sixty_five_characters_length_123"
   - Verify input field behavior (should prevent typing beyond 64 characters)
6. **Test exceeding maximum length (80 characters) for ID:**
   - Attempt to enter 80-character string:
     "test_credential_id_with_exactly_eighty_characters_length_for_boundary_testing_123"
   - Verify input field behavior and validation
7. Fill other mandatory fields with valid data and attempt to save
8. Verify validation behavior and error messages

### Expected Results

- Input field prevents typing beyond 64 characters (character limit enforcement)
- If excess characters are entered, validation error appears on field
- Clear error message indicates maximum ID length limit (64 characters)
- Form does not submit with invalid ID length
- Character counter or limit indicator is visible for ID field (if implemented)
- Error message is specific: "ID cannot exceed 64 characters" or similar

### Postconditions

1. No credential is created during validation testing
2. Return to credentials list page by clicking **Cancel**
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ID field enforces same 64-character limit as Display Name through MAX_NAME_LENGTH

## Test Case ID: TC-01-26

#### Test Case Name:

Test Organization URL field boundary value - maximum allowed length

#### Test Case Tags:

positive, boundary, validation, organization-url

#### Test Case Priority:

Medium

#### Test Case Description:

Verify Organization URL field accepts maximum reasonable URL length and creates credential successfully.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** credential type from the list
4. Fill **Display Name** field with "Test*URL_Boundary*{timestamp}"
5. Fill **ID** field with "test*url_boundary*{timestamp}"
6. **Test maximum reasonable URL length (255 characters):**
   - Enter long but valid URL in **Organization URL** field:
     "https://dev.azure.com/very-long-organization-name-for-testing-maximum-url-length-boundaries-in-credential-creation-form-with-valid-azure-devops-organization-structure-and-proper-formatting-to-ensure-system-handles-long-urls-properly-123456789"
   - Fill other mandatory fields with valid data:
     - **Project**: "TestProject"
     - **Token**: select Password option and enter valid token
   - Click **Save** button
   - Verify credential is created successfully
7. Verify the credential appears with full URL preserved
8. Open credential details and verify complete URL is stored

### Expected Results

- Long URL (255 characters) is accepted without validation errors
- URL field accommodates maximum reasonable length input
- Complete URL is preserved and stored correctly
- Credential is created successfully with long URL
- URL appears fully in credentials list and detail views
- No truncation occurs with maximum length URL input

### Postconditions

1. Clean up test data by deleting the created credential:
   - Navigate to **Credentials** section, click **Table View**
   - Find credential "Test*URL_Boundary*{timestamp}"
   - Click ellipsis (...) → **Delete**
   - In "Delete confirmation" modal, enter credential name manually
   - Confirm deletion and verify removal from list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- URL fields typically have higher length limits than name fields (commonly 255-2048 characters)

## Test Case ID: TC-01-27

#### Test Case Name:

Test Organization URL field out-of-boundary value - exceeding practical limits

#### Test Case Tags:

negative, boundary, validation, organization-url

#### Test Case Priority:

Medium

#### Test Case Description:

Verify Organization URL field handles extremely long URLs appropriately with validation or truncation.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** credential type from the list
4. Fill **Display Name** field with "Test*URL_OutOfBoundary*{timestamp}"
5. Fill **ID** field with "test*url_oob*{timestamp}"
6. **Test extremely long URL (500+ characters):**
   - Attempt to enter extremely long URL:
     "https://dev.azure.com/extremely-long-organization-name-for-testing-maximum-url-length-boundaries-beyond-reasonable-limits-in-credential-creation-form-with-excessive-azure-devops-organization-structure-and-unrealistic-formatting-to-verify-system-handles-unreasonably-long-urls-with-proper-validation-or-truncation-mechanisms-implemented-correctly-without-system-errors-or-crashes-during-input-processing-12345678901234567890123456789012345678901234567890"
   - Verify input field behavior and any length restrictions
7. Fill other mandatory fields with valid data and attempt to save
8. Verify system behavior with excessively long URL

### Expected Results

- System handles extremely long URLs gracefully (either truncation or validation)
- If length limit exists, clear error message appears
- Input field may prevent excessive input or show warning
- Form behavior remains stable with very long input
- No system crashes or unexpected errors occur
- Appropriate user feedback is provided for excessive length

### Postconditions

1. No credential is created if validation prevents it
2. Return to credentials list page by clicking **Cancel**
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Extremely long URLs test system robustness and input handling limits

#### Test Case Name:

Test ID field format and character validation

#### Test Case Tags:

boundary, validation, format, id-field

#### Test Case Priority:

Medium

#### Test Case Description:

Verify ID field accepts valid formats and rejects invalid characters or formats with appropriate validation
messages.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** credential type from the list
4. **Test valid alphanumeric ID:**
   - Enter "validid123\_{timestamp}" in **ID** field
   - Fill other mandatory fields and verify acceptance
5. **Test ID with underscores:**
   - Enter "valid*id_with_underscores*{timestamp}" in **ID** field
   - Fill other mandatory fields and verify acceptance
6. **Test ID with hyphens:**
   - Enter "valid-id-with-hyphens-{timestamp}" in **ID** field
   - Fill other mandatory fields and verify acceptance
7. **Test ID with spaces:**
   - Enter "invalid id with spaces {timestamp}" in **ID** field
   - Verify validation error appears
8. **Test ID with special characters:**
   - Enter "invalid@#$%id{timestamp}" in **ID** field
   - Verify validation error appears
9. **Test ID starting with number:**
   - Enter "123invalidstart{timestamp}" in **ID** field
   - Verify result based on system requirements
10. **Test empty ID:**
    - Leave **ID** field empty
    - Verify validation error appears
11. **Test very long ID:**
    - Enter ID exceeding reasonable length (100+ characters)
    - Verify character limit enforcement

### Expected Results

- Alphanumeric IDs are accepted
- Underscores in IDs are accepted
- Hyphens in IDs are accepted (if supported)
- Spaces in IDs are rejected with clear error message
- Special characters in IDs are rejected with clear error message
- IDs starting with numbers are handled based on system requirements
- Empty IDs are rejected with validation error
- Overly long IDs are rejected or truncated with appropriate feedback
- Error messages clearly indicate valid ID format requirements
- Valid IDs allow successful credential creation

### Postconditions

1. Clean up any successfully created test credentials
2. Return to credentials list page
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ID format requirements may vary based on system specifications
- Test expectations should align with documented ID validation rules

## Test Case ID: TC-01-24

#### Test Case Name:

Test URL field format validation for different credential types

#### Test Case Tags:

boundary, validation, url-format

#### Test Case Priority:

High

#### Test Case Description:

Verify URL fields accept valid formats and reject invalid URLs with appropriate validation for ADO, Jira, and
Confluence credentials.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete

### Test Steps

1. **Test ADO Organization URL validation:**
   - Navigate to **Credentials** → **+ Create** → Select **ADO**
   - Test valid URL: "https://dev.azure.com/organization-name"
   - Test invalid URL: "invalid-url-format"
   - Test URL without protocol: "dev.azure.com/organization"
   - Test URL with wrong protocol: "ftp://dev.azure.com/org"
   - Verify validation results for each case

2. **Test Jira Base URL validation:**
   - Navigate to **Credentials** → **+ Create** → Select **Jira**
   - Test valid URL: "https://company.atlassian.net"
   - Test valid self-hosted: "https://jira.company.com"
   - Test invalid URL: "not-a-valid-url"
   - Test URL without https: "http://jira.company.com"
   - Verify validation results for each case

3. **Test Confluence Base URL validation:**
   - Navigate to **Credentials** → **+ Create** → Select **Confluence**
   - Test valid URL: "https://company.atlassian.net/wiki"
   - Test valid self-hosted: "https://confluence.company.com"
   - Test invalid URL: "invalid.url.format"
   - Test URL with port: "https://confluence.company.com:8080"
   - Verify validation results for each case

### Expected Results

- Valid URLs are accepted without validation errors
- Invalid URL formats trigger clear validation error messages
- URLs without proper protocol (https://) are either auto-corrected or rejected
- Error messages specify expected URL format for each credential type
- URL validation is performed in real-time or on field blur
- System provides helpful examples of valid URL formats
- Different credential types may have specific URL format requirements

### Postconditions

1. No credentials are created during URL validation testing
2. User remains on credential creation forms during testing
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- URL validation requirements may vary by credential type and deployment environment
- Some systems may auto-correct common URL format issues

## Test Case ID: TC-01-25

#### Test Case Name:

Test credential creation with maximum field lengths

#### Test Case Tags:

boundary, stress-testing, maximum-values

#### Test Case Priority:

Medium

#### Test Case Description:

Verify system handles maximum allowed field lengths correctly and maintains performance with large data
inputs.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** credential type from the list
4. Fill fields with maximum allowed lengths:
   - **Display Name**: Generate string of maximum allowed length (e.g., 255 chars)
   - **ID**: Generate string of maximum allowed length (e.g., 64 chars)
   - **Organization URL**: Valid URL with maximum path length
   - **Project**: Maximum length project name
   - **Token**: Maximum length token (if applicable)
5. Verify all fields accept maximum length inputs
6. Click **Save** button
7. Verify credential creation performance and success
8. Verify credential displays correctly in list view
9. Open created credential and verify all data is preserved
10. Test credential functionality if validation endpoints are available

### Expected Results

- All fields accept maximum allowed character lengths
- Form remains responsive with maximum length inputs
- Credential creation completes successfully within reasonable time
- All maximum-length data is preserved correctly
- Credential displays properly in list and detail views
- No truncation occurs in stored or displayed data
- System performance remains acceptable with large inputs
- Credential functions correctly with maximum-length values

### Postconditions

1. Clean up test data by deleting the created credential:
   - Navigate to **Credentials** section, click **Table View**
   - Find the maximum-length credential in the list
   - Click ellipsis (...) → **Delete**
   - In "Delete confirmation" modal, copy credential name from prompt
   - Paste and confirm deletion
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Maximum field lengths should be determined from system documentation or requirements
- Performance expectations may vary based on system specifications

## Test Case ID: TC-01-28

#### Test Case Name:

Test Project field boundary value - maximum allowed length (64 characters)

#### Test Case Tags:

positive, boundary, validation, project-field

#### Test Case Priority:

Medium

#### Test Case Description:

Verify Project field accepts exactly 64 characters (MAX_NAME_LENGTH boundary value) and creates credential
successfully.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** credential type from the list
4. Fill **Display Name** field with "Test*Project_Boundary*{timestamp}"
5. Fill **ID** field with "test*proj_boundary*{timestamp}"
6. Fill **Organization URL** field with valid ADO organization URL
7. **Test exact maximum length (64 characters) for Project:**
   - Enter exactly 64-character string in **Project** field:
     "TestProjectNameWithExactlySixtyFourCharactersForBoundaryTest12"
   - Select Password option in **Token** field and enter valid token
   - Click **Save** button
   - Verify credential is created successfully
8. Verify the credential appears with full project name preserved
9. Open credential details and verify all 64 characters are preserved

### Expected Results

- 64-character Project name is accepted without validation errors
- Input field allows typing exactly 64 characters
- All 64 characters are preserved correctly in the Project field
- Credential is created successfully with boundary value project name
- Project name appears fully in credentials list and detail views
- No truncation or data loss occurs with maximum length project input

### Postconditions

1. Clean up test data by deleting the created credential:
   - Navigate to **Credentials** section, click **Table View**
   - Find credential "Test*Project_Boundary*{timestamp}"
   - Click ellipsis (...) → **Delete**
   - In "Delete confirmation" modal, manually enter credential name
   - Confirm deletion and verify removal from list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Project field likely uses MAX_NAME_LENGTH (64) constant for consistency

## Test Case ID: TC-01-29

#### Test Case Name:

Test Project field out-of-boundary value - exceeding maximum length (65+ characters)

#### Test Case Tags:

negative, boundary, validation, project-field

#### Test Case Priority:

Medium

#### Test Case Description:

Verify Project field rejects input exceeding 64 characters and prevents credential creation with appropriate
validation.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User have permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **ADO** credential type from the list
4. Fill **Display Name** field with "Test*Project_OutOfBoundary*{timestamp}"
5. Fill **ID** field with "test*proj_oob*{timestamp}"
6. Fill **Organization URL** field with valid ADO organization URL
7. **Test exceeding maximum length (65 characters) for Project:**
   - Attempt to enter 65-character string in **Project** field:
     "TestProjectNameWithExactlySixtyFiveCharactersForBoundaryTest123"
   - Verify input field behavior (should prevent typing beyond 64 characters)
8. **Test exceeding maximum length (80 characters) for Project:**
   - Attempt to enter 80-character string:
     "TestProjectNameWithExactlyEightyCharactersForOutOfBoundaryTestingValidation123456"
   - Verify input field behavior and validation
9. Fill Token field with valid data and attempt to save
10. Verify validation behavior and error messages

### Expected Results

- Input field prevents typing beyond 64 characters (character limit enforcement)
- If excess characters are entered, validation error appears on Project field
- Clear error message indicates maximum Project name length limit (64 characters)
- Form does not submit with invalid Project name length
- Character counter or limit indicator is visible for Project field (if implemented)
- Error message is specific: "Project name cannot exceed 64 characters" or similar

### Postconditions

1. No credential is created during validation testing
2. Return to credentials list page by clicking **Cancel**
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Project field should enforce same 64-character limit as other name fields

## Test Case ID: TC-01-30

#### Test Case Name:

Test Folder field boundary value for Artifact credentials - maximum allowed length (56 characters)

#### Test Case Tags:

positive, boundary, validation, folder-field, artifacts

#### Test Case Priority:

Medium

#### Test Case Description:

Verify Folder field in Artifact credential accepts exactly 56 characters (specific artifact folder limit) and
creates credential successfully.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **Artifact** or similar credential type that includes folder field
4. Fill **Display Name** field with "Test*Folder_Boundary*{timestamp}"
5. Fill **ID** field with "test*folder_boundary*{timestamp}"
6. Fill other mandatory fields with valid data
7. **Test exact maximum length (56 characters) for Folder:**
   - Enter exactly 56-character string in **Folder** field:
     "TestArtifactFolderNameWithExactlySixtyCharacters123456"
   - Complete other required fields
   - Click **Save** button
   - Verify credential is created successfully
8. Verify the credential appears with full folder name preserved
9. Open credential details and verify all 56 characters are preserved

### Expected Results

- 56-character Folder name is accepted without validation errors
- Input field allows typing exactly 56 characters
- All 56 characters are preserved correctly in the Folder field
- Credential is created successfully with boundary value folder name
- Folder name appears fully in credentials list and detail views
- No truncation or data loss occurs with maximum length folder input

### Postconditions

1. Clean up test data by deleting the created credential:
   - Navigate to **Credentials** section, click **Table View**
   - Find credential "Test*Folder_Boundary*{timestamp}"
   - Click ellipsis (...) → **Delete**
   - In "Delete confirmation" modal, manually enter credential name
   - Confirm deletion and verify removal from list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Artifact folder fields use specific 56-character limit based on codebase analysis

## Test Case ID: TC-01-31

#### Test Case Name:

Test Folder field out-of-boundary value - exceeding maximum length (57+ characters)

#### Test Case Tags:

negative, boundary, validation, folder-field, artifacts

#### Test Case Priority:

Medium

#### Test Case Description:

Verify Folder field rejects input exceeding 56 characters and prevents credential creation with appropriate
validation.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on **+ Create** button
3. Select **Artifact** or similar credential type that includes folder field
4. Fill **Display Name** field with "Test*Folder_OutOfBoundary*{timestamp}"
5. Fill **ID** field with "test*folder_oob*{timestamp}"
6. Fill other mandatory fields with valid data
7. **Test exceeding maximum length (57 characters) for Folder:**
   - Attempt to enter 57-character string in **Folder** field: "TestArtifactFolderNameWithExactlyFiftySeven
     Characters1234567"
   - Verify input field behavior (should prevent typing beyond 56 characters)
8. **Test exceeding maximum length (70 characters) for Folder:**
   - Attempt to enter 70-character string:
     "TestArtifactFolderNameWithExactlySeventyCharactersForBoundaryTesting123"
   - Verify input field behavior and validation
9. Complete other fields and attempt to save
10. Verify validation behavior and error messages

### Expected Results

- Input field prevents typing beyond 56 characters (character limit enforcement)
- If excess characters are entered, validation error appears on Folder field
- Clear error message indicates maximum Folder name length limit (56 characters)
- Form does not submit with invalid Folder name length
- Character counter or limit indicator is visible for Folder field (if implemented)
- Error message is specific: "Folder name cannot exceed 56 characters" or similar

### Postconditions

1. No credential is created during validation testing
2. Return to credentials list page by clicking **Cancel**
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Artifact folder fields enforce specific 56-character limit as per codebase inputProps maxLength
