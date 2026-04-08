# Scenario ID: 03_Create_Credentials_From_Toolkit

#### Scenario Name:

Create ADO Repos Credentials from Toolkit with Secret Management

#### Scenario Tags:

functional testing, regression, credentials, toolkit, ado_repos, secrets, authentication

#### Scenario Priority:

High

#### Scenario Description:

Validate the credential creation workflow from toolkit interface: verify ADO Repos credential creation using
existing ADO credentials, secret management for secure token storage, toolkit-based credential creation with
both private and project scopes, proper credential linking, and complete cleanup procedures for all created
resources.

## Test Case ID: TC-03-01

#### Test Case Name:

Create ADO Repos credentials from Credentials section using existing ADO configuration

#### Test Case Tags:

positive, credentials, ado_repos, basic_creation

#### Test Case Priority:

High

#### Test Case Description:

Verify that users can create ADO Repos credentials from the Credentials section using an existing ADO
configuration credential.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete,
   credentials.secrets.create, credentials.secrets.list, credentials.secrets.details,
   credentials.secrets.update, credentials.secrets.delete
6. Create ADO configuration credential:
   - Navigate to the **Credentials** section in the {Project} application
   - Click **+ Create** button
   - Select **ADO** credential type from the available options
   - In the **Display Name** field, enter "ADO configuration"
   - In the **ID** field, enter "ado*configuration*{timestamp}"
   - In the **Organization URL** field, enter {Organization_URL}
   - In the **Project** field, enter {Project}
   - In the **Token** field, click on the **password** option
   - Enter the password {password} in the token field
   - Click **Save** button
   - Verify the credential "ADO configuration" appears in the credentials list
   - Verify the credential shows the correct organization URL and project

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on the **+ Create** button in the credentials interface
3. From the credential type selection menu, click on **ADO Repos**
4. Verify the ADO Repos credential creation form opens
5. In the **Display Name** field, enter "ADO Repos"
6. In the **ID** field, enter "ado*repos*{timestamp}"
7. In the **Repository ID** field, enter {repo_ID}
8. Locate the **ADO Configuration** dropdown field
9. Click on the **ADO Configuration** dropdown
10. From the dropdown options, select "ADO configuration"
11. Verify that "ADO configuration" is selected in the dropdown
12. Click the **Save** button to create the credential
13. Wait for the save operation to complete
14. Navigate back to the **Credentials** section
15. Observe the credentials list and verify that "ADO Repos" credential is listed
16. Verify the credential displays correct information (name, type, etc.)
17. Click on the ADO Repos credential to view its details
18. Verify the credential details show the correct repository ID and linked ADO configuration

### Expected Results

- ADO Repos credential creation form opens successfully
- All required fields are present and accessible
- ADO Configuration dropdown shows available ADO credentials
- ADO Repos credential is created successfully
- Credential appears in the credentials list with correct information
- Credential details show proper linking to ADO configuration
- No errors or validation issues occur during creation

### Postconditions

1. Clean up test data by deleting the created credentials:
   - Navigate to the **Credentials** section of the {Project}
   - Delete "ADO Repos" credential:
     - Locate "ADO Repos" credential in the credentials list
     - Click on the ellipsis menu (⋯) or **Actions** button for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "ADO Repos" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "ADO configuration" credential:
     - Locate "ADO configuration" credential in the credentials list
     - Click on the ellipsis menu (⋯) or **Actions** button for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "ADO configuration" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
2. Verify all test credentials have been successfully removed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests basic ADO Repos credential creation using existing ADO configuration
- Validates credential linking functionality

## Test Case ID: TC-03-02

#### Test Case Name:

Create ADO Repos credentials from Credentials section using ADO configuration with secret-based authentication

#### Test Case Tags:

positive, credentials, ado_repos, secrets, authentication

#### Test Case Priority:

High

#### Test Case Description:

Verify that users can create ADO Repos credentials using an ADO configuration credential that utilizes
secret-based authentication for enhanced security.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete,
   credentials.secrets.create, credentials.secrets.list, credentials.secrets.details,
   credentials.secrets.update, credentials.secrets.delete
6. Create secret for ADO token:
   - Navigate to **Settings** section in the {Project} application
   - Click on **Secrets** subsection
   - Click on **+ Create new secret** button
   - In the **Name** field, enter "ADO_secret"
   - Click in the **Value** field
   - Enter {ADO_token} in the value field
   - Click **Save** button to create the secret
   - Verify "ADO_secret" appears in the secrets list
7. Create ADO configuration credential with secret:
   - Navigate to the **Credentials** section in the {Project} application
   - Click **+ Create** button
   - Select **ADO** credential type from the available options
   - In the **Display Name** field, enter "ADO configuration"
   - In the **ID** field, enter "ado*configuration_secret*{timestamp}"
   - In the **Organization URL** field, enter {Organization_URL}
   - In the **Project** field, enter {Project}
   - In the **Token** field, click on the **secret** button
   - From the dropdown, select "ADO_secret"
   - Verify that "ADO_secret" is selected
   - Click **Save** button
   - Verify the credential "ADO configuration" appears in the credentials list

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on the **+ Create** button in the credentials interface
3. From the credential type selection menu, click on **ADO Repos**
4. Verify the ADO Repos credential creation form opens
5. In the **Display Name** field, enter "ADO credentials"
6. In the **ID** field, enter "ado*credentials*{timestamp}"
7. In the **Repository ID** field, enter {repo_ID}
8. Locate the **ADO Configuration** dropdown field
9. Click on the **ADO Configuration** dropdown
10. From the dropdown options, select "ADO configuration"
11. Verify that "ADO configuration" is selected in the dropdown
12. Click the **Save** button to create the credential
13. Wait for the save operation to complete
14. Navigate back to the **Credentials** section
15. Observe the credentials list and verify that "ADO credentials" credential is listed
16. Verify the credential displays correct information and shows it's using secret-based authentication
17. Click on the ADO credentials to view its details
18. Verify the credential details show proper secret integration (token should be masked)

### Expected Results

- Secret is created successfully and appears in secrets list
- ADO configuration credential with secret authentication is created successfully
- ADO Repos credential creation form works with secret-based ADO configuration
- ADO credentials (ADO Repos) credential is created successfully
- Credential appears in list with proper security indicators
- Token information is properly masked in credential details
- Secret integration works seamlessly throughout the process

### Postconditions

1. Clean up test data by deleting the created resources:
   - Navigate to the **Credentials** section of the {Project}
   - Delete "ADO credentials" credential:
     - Locate "ADO credentials" credential in the credentials list
     - Click on the ellipsis menu (⋯) or **Actions** button for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "ADO credentials" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "ADO configuration" credential:
     - Locate "ADO configuration" credential in the credentials list
     - Click on the ellipsis menu (⋯) or **Actions** button for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "ADO configuration" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Navigate to **Settings** -> **Secrets**
   - Delete "ADO_secret" secret:
     - Locate "ADO_secret" in the secrets list
     - Click on the ellipsis menu (⋯) or **Actions** button for this secret
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the secret name "ADO_secret" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the secret is removed from the list
2. Verify all test resources have been successfully removed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests credential creation with secret-based authentication
- Validates proper secret integration and security masking
- Ensures complete cleanup of both credentials and secrets

## Test Case ID: TC-03-03

#### Test Case Name:

Create ADO Repos credentials from Toolkit with new private ADO configuration

#### Test Case Tags:

positive, toolkit, ado_repos, private_credentials, creation_workflow

#### Test Case Priority:

High

#### Test Case Description:

Verify that users can create ADO Repos credentials directly from the Toolkit interface using a new private ADO
configuration credential created inline.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete,
   credentials.secrets.create, credentials.secrets.list, credentials.secrets.details,
   credentials.secrets.update, credentials.secrets.delete, toolkits.toolkits.create, toolkits.toolkits.list,
   toolkits.toolkits.details
6. Create secret for ADO token:
   - Navigate to **Settings** section in the {Project} application
   - Click on **Secrets** subsection
   - Click on **+ Create new secret** button
   - In the **Name** field, enter "ADO_secret"
   - Click in the **Value** field
   - Enter {ADO_token} in the value field
   - Click **Save** button to create the secret
   - Verify "ADO_secret" appears in the secrets list
7. Create base ADO configuration credential:
   - Navigate to the **Credentials** section in the {Project} application
   - Click **+ Create** button
   - Select **ADO** credential type from the available options
   - In the **Display Name** field, enter "ADO configuration"
   - In the **ID** field, enter "ado*configuration_base*{timestamp}"
   - In the **Organization URL** field, enter {Organization_URL}
   - In the **Project** field, enter {Project}
   - In the **Token** field, click on the **secret** button
   - From the dropdown, select "ADO_secret"
   - Click **Save** button
   - Verify the credential appears in the credentials list

### Test Steps

1. Navigate to the **Toolkits** section in the {Project} application
2. Click on the **+ Create toolkit** button
3. From the toolkit type selection, select **ADO Repo**
4. Verify the ADO Repo toolkit creation form opens
5. Locate the **ADO Configuration** dropdown field
6. Click on the **ADO Configuration** dropdown
7. From the dropdown options, select **"New private ADO_repos credentials"**
8. Verify that a new credential creation form appears inline or in a modal
9. In the **Display Name** field, enter "Ado_repo_cred"
10. In the **ID** field, enter "ado*repo_cred_private*{timestamp}"
11. In the **Repository ID** field (marked with \*), enter {repository_id}
12. Locate the **ADO Configuration** field in the inline credential form
13. Click on the **ADO Configuration** dropdown
14. From the dropdown, select "ADO configuration"
15. Verify that "ADO configuration" is selected
16. Click **Save** button to create the private credential and toolkit
17. Wait for the creation process to complete
18. Verify that the toolkit is created successfully
19. Navigate to the **Credentials** section
20. Verify that "Ado_repo_cred" credential appears in the credentials list
21. Verify the credential is marked as private or has appropriate visibility indicators

### Expected Results

- Toolkit creation interface opens successfully from navigation
- ADO Repo toolkit type is available and selectable
- "New private ADO_repos credentials" option is available in dropdown
- Inline credential creation form appears with all required fields
- Repository ID field is properly marked as required (\*)
- ADO Configuration dropdown shows existing ADO credentials
- Private credential and toolkit are created successfully
- Credential appears in credentials list with proper private indicators
- No errors occur during the inline creation process

### Postconditions

1. Clean up test data by deleting the created resources:
   - Navigate to the **Toolkits** section of the {Project}
   - Delete the created ADO Repo toolkit:
     - Locate the toolkit in the toolkits list
     - Click on the ellipsis menu (⋯) or **Actions** button for this toolkit
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Confirm the deletion by clicking **Delete** button
     - Verify the toolkit is removed from the list
   - Navigate to the **Credentials** section of the {Project}
   - Delete "Ado_repo_cred" credential:
     - Locate "Ado_repo_cred" credential in the credentials list
     - Click on the ellipsis menu (⋯) or **Actions** button for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Ado_repo_cred" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "ADO configuration" credential:
     - Locate "ADO configuration" credential in the credentials list
     - Click on the ellipsis menu (⋯) or **Actions** button for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "ADO configuration" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Navigate to **Settings** -> **Secrets**
   - Delete "ADO_secret" secret:
     - Locate "ADO_secret" in the secrets list
     - Click on the ellipsis menu (⋯) or **Actions** button for this secret
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the secret name "ADO_secret" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the secret is removed from the list
2. Verify all test resources have been successfully removed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests toolkit-based credential creation workflow
- Validates inline private credential creation from toolkit interface
- Ensures proper linking between toolkit and credentials

## Test Case ID: TC-03-04

#### Test Case Name:

Create ADO Repos credentials from Toolkit with new project ADO configuration

#### Test Case Tags:

positive, toolkit, ado_repos, project_credentials, configuration_refresh

#### Test Case Priority:

High

#### Test Case Description:

Verify that users can create ADO Repos credentials from Toolkit using a new project-scoped ADO configuration,
including configuration refresh functionality and proper credential linking.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete,
   credentials.secrets.create, credentials.secrets.list, credentials.secrets.details,
   credentials.secrets.update, credentials.secrets.delete, toolkits.toolkits.create, toolkits.toolkits.list,
   toolkits.toolkits.details
6. Create secret for ADO token:
   - Navigate to **Settings** section in the {Project} application
   - Click on **Secrets** subsection
   - Click on **+ Create new secret** button
   - In the **Name** field, enter "ADO_secret"
   - Click in the **Value** field
   - Enter {ADO_token} in the value field
   - Click **Save** button to create the secret
   - Verify "ADO_secret" appears in the secrets list

### Test Steps

1. Navigate to the **Toolkits** section in the {Project} application
2. Click on the **+ Create toolkit** button
3. From the toolkit type selection, select **ADO Repo**
4. Verify the ADO Repo toolkit creation form opens
5. Locate the **ADO Configuration** dropdown field
6. Click on the **ADO Configuration** dropdown
7. From the dropdown options, select **"New project ADO_repos credentials"**
8. Verify that a new project credential creation form appears
9. In the **Display Name** field, enter "Ado_repo_cred_project"
10. In the **ID** field, enter "ado*repo_cred_project*{timestamp}"
11. In the **Organization URL** field, enter {Organization_URL}
12. In the **Project** field, enter {Project}
13. Click on the **Token** field
14. Click on the **secret** option in the token field
15. From the dropdown, select "ADO_secret"
16. Verify that "ADO_secret" is selected
17. Click **Save** button to create the project credential
18. Wait for the credential creation to complete
19. Close the credential creation tab/modal
20. Navigate back to the previous toolkit creation tab
21. In the ADO Configuration section, click the **refresh configurations** button
22. Wait for the configurations to refresh
23. Click on the **ADO Configuration** dropdown field
24. From the dropdown, select "Ado_repo_cred_project"
25. Verify that "Ado_repo_cred_project" is selected
26. In the **Display Name** field for the toolkit, enter "ADO Repo Toolkit Project"
27. Click **Save** button to create the toolkit
28. Wait for the toolkit creation to complete
29. Navigate to **Credentials** section
30. Verify that "Ado_repo_cred_project" credential appears in the credentials list
31. Navigate to **Toolkits** section
32. Verify that "ADO Repo Toolkit Project" toolkit appears in the toolkits list

### Expected Results

- Toolkit creation interface opens successfully
- "New project ADO_repos credentials" option is available
- Project credential creation form opens with all required fields
- Organization URL and Project fields accept input correctly
- Secret selection works properly for token authentication
- Project credential is created successfully
- Refresh configurations button works and updates the dropdown
- Newly created credential appears in the dropdown after refresh
- Toolkit creation completes successfully with linked credential
- Both credential and toolkit appear in their respective sections
- No errors occur during the multi-step creation process

### Postconditions

1. Clean up test data by deleting the created resources:
   - Navigate to the **Toolkits** section of the {Project}
   - Delete "ADO Repo Toolkit Project" toolkit:
     - Locate "ADO Repo Toolkit Project" toolkit in the toolkits list
     - Click on the ellipsis menu (⋯) or **Actions** button for this toolkit
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Confirm the deletion by clicking **Delete** button
     - Verify the toolkit is removed from the list
   - Navigate to the **Credentials** section of the {Project}
   - Delete "Ado_repo_cred_project" credential:
     - Locate "Ado_repo_cred_project" credential in the credentials list
     - Click on the ellipsis menu (⋯) or **Actions** button for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Ado_repo_cred_project" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Navigate to **Settings** -> **Secrets**
   - Delete "ADO_secret" secret:
     - Locate "ADO_secret" in the secrets list
     - Click on the ellipsis menu (⋯) or **Actions** button for this secret
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the secret name "ADO_secret" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the secret is removed from the list
2. Verify all test resources have been successfully removed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests project-scoped credential creation from toolkit interface
- Validates configuration refresh functionality
- Ensures proper credential-toolkit linking workflow
- Tests multi-tab/modal workflow management

## Test Case ID: TC-03-05

#### Test Case Name:

Create GitHub credentials from Credentials section with token authentication

#### Test Case Tags:

positive, credentials, github, token_authentication, basic_creation

#### Test Case Priority:

High

#### Test Case Description:

Verify that users can create GitHub credentials from the Credentials section using token authentication for
GitHub.com integration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete,
   credentials.secrets.create, credentials.secrets.list, credentials.secrets.details,
   credentials.secrets.update, credentials.secrets.delete
6. User has a valid GitHub Personal Access Token {GitHub_Token} with appropriate scopes (repo, workflow,
   read:org)

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on the **+ Create** button in the credentials interface
3. From the credential type selection menu, click on **GitHub**
4. Verify the GitHub credential creation form opens with all required fields
5. In the **Display Name** field, enter "GitHub - Development Team Access"
6. In the **ID** field, enter "github*dev_access*{timestamp}"
7. Verify the **Base URL** field is present
8. Leave the **Base URL** field empty (for GitHub.com default: https://api.github.com)
9. Locate the **Authentication Method** section
10. Select **Token** as the authentication method
11. In the **Token** field, enter {GitHub_Token}
12. Verify the **Shared Credential** checkbox is available
13. Check the **Shared** checkbox to make the credential accessible by all team members
14. Click the **Save** button to create the credential
15. Wait for the save operation to complete
16. Navigate back to the **Credentials** section
17. Observe the credentials list and verify that "GitHub - Development Team Access" credential is listed
18. Verify the credential displays correct information (name, type, shared status)
19. Click on the GitHub credential to view its details
20. Verify the credential details show the correct authentication method and shared status
21. Verify the token is properly masked in the details view

### Expected Results

- GitHub credential creation form opens successfully with all required fields
- Base URL field allows empty value for GitHub.com default
- Authentication method options are available including Token
- Token field accepts the GitHub Personal Access Token
- Shared credential checkbox functions properly
- GitHub credential is created successfully
- Credential appears in the credentials list with correct information
- Credential shows shared status indicator
- Token information is properly masked for security
- No errors or validation issues occur during creation

### Postconditions

1. Clean up test data by deleting the created credential:
   - Navigate to the **Credentials** section of the {Project}
   - Delete "GitHub - Development Team Access" credential:
     - Locate "GitHub - Development Team Access" credential in the credentials list
     - Click on the ellipsis menu (⋯) or **Actions** button for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "GitHub - Development Team Access" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
2. Verify all test credentials have been successfully removed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests basic GitHub credential creation with token authentication
- Validates shared credential functionality
- Ensures proper security masking of sensitive data

## Test Case ID: TC-03-06

#### Test Case Name:

Create GitHub credentials with secret-based token authentication

#### Test Case Tags:

positive, credentials, github, secrets, secure_authentication

#### Test Case Priority:

High

#### Test Case Description:

Verify that users can create GitHub credentials using secret-based token authentication for enhanced security
following the recommended security practices.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete,
   credentials.secrets.create, credentials.secrets.list, credentials.secrets.details,
   credentials.secrets.update, credentials.secrets.delete
6. User has a valid GitHub Personal Access Token {GitHub_Token} with appropriate scopes (repo, workflow,
   read:org)
7. Create secret for GitHub token:
   - Navigate to **Settings** section in the {Project} application
   - Click on **Secrets** subsection
   - Click on **+ Create new secret** button
   - In the **Name** field, enter "GitHub_secret"
   - Click in the **Value** field
   - Enter {GitHub_Token} in the value field
   - Click **Save** button to create the secret
   - Verify "GitHub_secret" appears in the secrets list

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on the **+ Create** button in the credentials interface
3. From the credential type selection menu, click on **GitHub**
4. Verify the GitHub credential creation form opens
5. In the **Display Name** field, enter "GitHub - Secure Access"
6. In the **ID** field, enter "github*secure_access*{timestamp}"
7. Leave the **Base URL** field empty (for GitHub.com default)
8. In the **Authentication Method** section, select **Token**
9. In the **Token** field, click on the **secret** button/option
10. From the dropdown, select "GitHub_secret"
11. Verify that "GitHub_secret" is selected and displayed
12. Leave the **Shared Credential** checkbox unchecked (private credential)
13. Click the **Save** button to create the credential
14. Wait for the save operation to complete
15. Navigate back to the **Credentials** section
16. Observe the credentials list and verify that "GitHub - Secure Access" credential is listed
17. Verify the credential shows proper security indicators for secret-based authentication
18. Click on the GitHub credential to view its details
19. Verify the credential details show secret-based authentication
20. Verify the token information is properly masked and shows secret reference

### Expected Results

- Secret is created successfully and appears in secrets list
- GitHub credential creation form supports secret selection for token field
- Secret dropdown shows available secrets including "GitHub_secret"
- Secret-based authentication is properly configured
- GitHub credential is created successfully with secret integration
- Credential appears in list with proper security indicators
- Token information shows secret reference instead of actual token
- Secret integration works seamlessly throughout the process
- No sensitive data is exposed in the credential details

### Postconditions

1. Clean up test data by deleting the created resources:
   - Navigate to the **Credentials** section of the {Project}
   - Delete "GitHub - Secure Access" credential:
     - Locate "GitHub - Secure Access" credential in the credentials list
     - Click on the ellipsis menu (⋯) or **Actions** button for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "GitHub - Secure Access" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Navigate to **Settings** -> **Secrets**
   - Delete "GitHub_secret" secret:
     - Locate "GitHub_secret" in the secrets list
     - Click on the ellipsis menu (⋯) or **Actions** button for this secret
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the secret name "GitHub_secret" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the secret is removed from the list
2. Verify all test resources have been successfully removed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests GitHub credential creation with secret-based authentication
- Validates security best practices for sensitive data
- Ensures proper secret integration and masking

## Test Case ID: TC-03-07

#### Test Case Name:

Create GitHub Enterprise Server credentials with custom Base URL

#### Test Case Tags:

positive, credentials, github_enterprise, custom_base_url, enterprise_authentication

#### Test Case Priority:

High

#### Test Case Description:

Verify that users can create GitHub Enterprise Server credentials with custom Base URL configuration for
self-hosted GitHub instances.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete,
   credentials.secrets.create, credentials.secrets.list, credentials.secrets.details,
   credentials.secrets.update, credentials.secrets.delete
6. User has access to GitHub Enterprise Server with URL {GitHub_Enterprise_URL}
7. User has a valid GitHub Enterprise Server Personal Access Token {GitHub_Enterprise_Token}
8. Create secret for GitHub Enterprise token:
   - Navigate to **Settings** section in the {Project} application
   - Click on **Secrets** subsection
   - Click on **+ Create new secret** button
   - In the **Name** field, enter "GitHub_Enterprise_secret"
   - Click in the **Value** field
   - Enter {GitHub_Enterprise_Token} in the value field
   - Click **Save** button to create the secret
   - Verify "GitHub_Enterprise_secret" appears in the secrets list

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on the **+ Create** button in the credentials interface
3. From the credential type selection menu, click on **GitHub**
4. Verify the GitHub credential creation form opens
5. In the **Display Name** field, enter "GitHub Enterprise - Company Access"
6. In the **ID** field, enter "github*enterprise_access*{timestamp}"
7. In the **Base URL** field, enter {GitHub_Enterprise_URL}/api/v3
8. Verify the Base URL is properly formatted for GitHub Enterprise Server
9. In the **Authentication Method** section, select **Token**
10. In the **Token** field, click on the **secret** button/option
11. From the dropdown, select "GitHub_Enterprise_secret"
12. Verify that "GitHub_Enterprise_secret" is selected
13. Check the **Shared Credential** checkbox to make it accessible by team members
14. Click the **Save** button to create the credential
15. Wait for the save operation to complete
16. Navigate back to the **Credentials** section
17. Observe the credentials list and verify that "GitHub Enterprise - Company Access" credential is listed
18. Verify the credential displays GitHub Enterprise configuration
19. Click on the GitHub Enterprise credential to view its details
20. Verify the credential details show the custom Base URL and shared status
21. Verify the enterprise-specific configuration is properly displayed

### Expected Results

- GitHub credential creation form accepts custom Base URL
- Base URL field properly handles GitHub Enterprise Server endpoints
- Authentication method works with enterprise server configuration
- Secret integration functions with enterprise credentials
- GitHub Enterprise credential is created successfully
- Credential appears in list with proper enterprise indicators
- Base URL is correctly stored and displayed
- Shared credential functionality works with enterprise configuration
- No errors occur with custom endpoint configuration

### Postconditions

1. Clean up test data by deleting the created resources:
   - Navigate to the **Credentials** section of the {Project}
   - Delete "GitHub Enterprise - Company Access" credential:
     - Locate "GitHub Enterprise - Company Access" credential in the credentials list
     - Click on the ellipsis menu (⋯) or **Actions** button for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "GitHub Enterprise - Company Access" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Navigate to **Settings** -> **Secrets**
   - Delete "GitHub_Enterprise_secret" secret:
     - Locate "GitHub_Enterprise_secret" in the secrets list
     - Click on the ellipsis menu (⋯) or **Actions** button for this secret
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the secret name "GitHub_Enterprise_secret" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the secret is removed from the list
2. Verify all test resources have been successfully removed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests GitHub Enterprise Server credential creation
- Validates custom Base URL configuration
- Ensures enterprise-specific functionality works properly

## Test Case ID: TC-03-08

#### Test Case Name:

Create GitHub credentials from Toolkit with new private GitHub configuration

#### Test Case Tags:

positive, toolkit, github, private_credentials, toolkit_integration

#### Test Case Priority:

High

#### Test Case Description:

Verify that users can create GitHub credentials directly from the Toolkit interface using a new private GitHub
configuration created inline during toolkit setup.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete,
   credentials.secrets.create, credentials.secrets.list, credentials.secrets.details,
   credentials.secrets.update, credentials.secrets.delete, toolkits.toolkits.create, toolkits.toolkits.list,
   toolkits.toolkits.details
6. User has a valid GitHub Personal Access Token {GitHub_Token} with appropriate scopes
7. Create secret for GitHub token:
   - Navigate to **Settings** section in the {Project} application
   - Click on **Secrets** subsection
   - Click on **+ Create new secret** button
   - In the **Name** field, enter "GitHub_toolkit_secret"
   - Click in the **Value** field
   - Enter {GitHub_Token} in the value field
   - Click **Save** button to create the secret
   - Verify "GitHub_toolkit_secret" appears in the secrets list

### Test Steps

1. Navigate to the **Toolkits** section in the {Project} application
2. Click on the **+ Create toolkit** button
3. From the toolkit type selection, select **GitHub** (or relevant GitHub toolkit type)
4. Verify the GitHub toolkit creation form opens
5. Locate the **GitHub Configuration** dropdown field
6. Click on the **GitHub Configuration** dropdown
7. From the dropdown options, select **"New private GitHub credentials"**
8. Verify that a new credential creation form appears inline or in a modal
9. In the **Display Name** field, enter "GitHub_toolkit_cred"
10. In the **ID** field, enter "github*toolkit_cred_private*{timestamp}"
11. Leave the **Base URL** field empty (for GitHub.com default)
12. In the **Authentication Method** section, select **Token**
13. In the **Token** field, click on the **secret** button/option
14. From the dropdown, select "GitHub_toolkit_secret"
15. Verify that "GitHub_toolkit_secret" is selected
16. Leave the **Shared Credential** checkbox unchecked (private credential)
17. Click **Save** button to create the private credential and continue with toolkit
18. Wait for the credential creation to complete
19. Complete the toolkit configuration with required fields
20. Click **Save** button to create the toolkit
21. Wait for the toolkit creation process to complete
22. Verify that the toolkit is created successfully
23. Navigate to the **Credentials** section
24. Verify that "GitHub_toolkit_cred" credential appears in the credentials list
25. Verify the credential is marked as private

### Expected Results

- Toolkit creation interface opens successfully from navigation
- GitHub toolkit type is available and selectable
- "New private GitHub credentials" option is available in dropdown
- Inline credential creation form appears with all required fields
- Secret selection works properly for token authentication
- Private credential and toolkit are created successfully
- Credential appears in credentials list with proper private indicators
- Toolkit is properly linked to the created credential
- No errors occur during the inline creation process

### Postconditions

1. Clean up test data by deleting the created resources:
   - Navigate to the **Toolkits** section of the {Project}
   - Delete the created GitHub toolkit:
     - Locate the toolkit in the toolkits list
     - Click on the ellipsis menu (⋯) or **Actions** button for this toolkit
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Confirm the deletion by clicking **Delete** button
     - Verify the toolkit is removed from the list
   - Navigate to the **Credentials** section of the {Project}
   - Delete "GitHub_toolkit_cred" credential:
     - Locate "GitHub_toolkit_cred" credential in the credentials list
     - Click on the ellipsis menu (⋯) or **Actions** button for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "GitHub_toolkit_cred" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Navigate to **Settings** -> **Secrets**
   - Delete "GitHub_toolkit_secret" secret:
     - Locate "GitHub_toolkit_secret" in the secrets list
     - Click on the ellipsis menu (⋯) or **Actions** button for this secret
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the secret name "GitHub_toolkit_secret" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the secret is removed from the list
2. Verify all test resources have been successfully removed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests toolkit-based GitHub credential creation workflow
- Validates inline private credential creation from toolkit interface
- Ensures proper linking between toolkit and GitHub credentials

## Test Case ID: TC-03-09

#### Test Case Name:

Create GitLab credentials from Credentials section with private token authentication

#### Test Case Tags:

positive, credentials, gitlab, private_token, basic_creation

#### Test Case Priority:

High

#### Test Case Description:

Verify that users can create GitLab credentials from the Credentials section using private token
authentication for GitLab.com integration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete
6. User has a valid GitLab Personal Access Token {GitLab_Token} with appropriate scopes (api, read_api,
   read_repository, write_repository)

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on the **+ Create** button in the credentials interface
3. From the credential type selection menu, click on **GitLab**
4. Verify the GitLab credential creation form opens with all required fields
5. In the **Display Name** field, enter "GitLab - Development Access"
6. In the **ID** field, enter "gitlab*dev_access*{timestamp}"
7. In the **URL** field, enter "https://gitlab.com"
8. Verify the **Auth** section is available
9. Select **GitLab private token** as the authentication method
10. In the **Private Token** field, enter {GitLab_Token}
11. Verify the **Shared** checkbox is available
12. Check the **Shared** checkbox to make the credential accessible by all team members
13. Click the **Save** button to create the credential
14. Wait for the save operation to complete
15. Navigate back to the **Credentials** section
16. Observe the credentials list and verify that "GitLab - Development Access" credential is listed
17. Verify the credential displays correct information (name, type, shared status)
18. Click on the GitLab credential to view its details
19. Verify the credential details show the correct URL and authentication method
20. Verify the private token is properly masked in the details view

### Expected Results

- GitLab credential creation form opens successfully with all required fields
- URL field accepts GitLab.com URL correctly
- GitLab private token authentication method is available
- Private Token field accepts the GitLab Personal Access Token
- Shared credential checkbox functions properly
- GitLab credential is created successfully
- Credential appears in the credentials list with correct information
- Credential shows shared status indicator
- Private token information is properly masked for security
- No errors or validation issues occur during creation

### Postconditions

1. Clean up test data by deleting the created credential:
   - Navigate to the **Credentials** section of the {Project}
   - Delete "GitLab - Development Access" credential:
     - Locate "GitLab - Development Access" credential in the credentials list
     - Click on the ellipsis menu (⋯) or **Actions** button for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "GitLab - Development Access" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
2. Verify all test credentials have been successfully removed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests basic GitLab credential creation with private token authentication
- Validates shared credential functionality for GitLab.com
- Ensures proper security masking of sensitive token data

## Test Case ID: TC-03-10

#### Test Case Name:

Create GitLab credentials with secret-based private token authentication

#### Test Case Tags:

positive, credentials, gitlab, secrets, secure_authentication

#### Test Case Priority:

High

#### Test Case Description:

Verify that users can create GitLab credentials using secret-based private token authentication for enhanced
security following the recommended security practices.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete,
   credentials.secrets.create, credentials.secrets.list, credentials.secrets.details,
   credentials.secrets.update, credentials.secrets.delete
6. User has a valid GitLab Personal Access Token {GitLab_Token} with appropriate scopes (api, read_api,
   read_repository, write_repository)
7. Create secret for GitLab token:
   - Navigate to **Settings** section in the {Project} application
   - Click on **Secrets** subsection
   - Click on **+ Create new secret** button
   - In the **Name** field, enter "GitLab_secret"
   - Click in the **Value** field
   - Enter {GitLab_Token} in the value field
   - Click **Save** button to create the secret
   - Verify "GitLab_secret" appears in the secrets list

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on the **+ Create** button in the credentials interface
3. From the credential type selection menu, click on **GitLab**
4. Verify the GitLab credential creation form opens
5. In the **Display Name** field, enter "GitLab - Secure Access"
6. In the **ID** field, enter "gitlab*secure_access*{timestamp}"
7. In the **URL** field, enter "https://gitlab.com"
8. Select **GitLab private token** as the authentication method
9. In the **Private Token** field, click on the **secret** button/option
10. From the dropdown, select "GitLab_secret"
11. Verify that "GitLab_secret" is selected and displayed
12. Leave the **Shared** checkbox unchecked (private credential)
13. Click the **Save** button to create the credential
14. Wait for the save operation to complete
15. Navigate back to the **Credentials** section
16. Observe the credentials list and verify that "GitLab - Secure Access" credential is listed
17. Verify the credential shows proper security indicators for secret-based authentication
18. Click on the GitLab credential to view its details
19. Verify the credential details show secret-based authentication
20. Verify the token information is properly masked and shows secret reference

### Expected Results

- Secret is created successfully and appears in secrets list
- GitLab credential creation form supports secret selection for private token field
- Secret dropdown shows available secrets including "GitLab_secret"
- Secret-based authentication is properly configured
- GitLab credential is created successfully with secret integration
- Credential appears in list with proper security indicators
- Token information shows secret reference instead of actual token
- Secret integration works seamlessly throughout the process
- No sensitive data is exposed in the credential details

### Postconditions

1. Clean up test data by deleting the created resources:
   - Navigate to the **Credentials** section of the {Project}
   - Delete "GitLab - Secure Access" credential:
     - Locate "GitLab - Secure Access" credential in the credentials list
     - Click on the ellipsis menu (⋯) or **Actions** button for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "GitLab - Secure Access" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Navigate to **Settings** -> **Secrets**
   - Delete "GitLab_secret" secret:
     - Locate "GitLab_secret" in the secrets list
     - Click on the ellipsis menu (⋯) or **Actions** button for this secret
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the secret name "GitLab_secret" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the secret is removed from the list
2. Verify all test resources have been successfully removed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests GitLab credential creation with secret-based authentication
- Validates security best practices for sensitive token data
- Ensures proper secret integration and masking

## Test Case ID: TC-03-11

#### Test Case Name:

Create GitLab self-hosted credentials with custom URL and secret authentication

#### Test Case Tags:

positive, credentials, gitlab_selfhosted, custom_url, secret_authentication

#### Test Case Priority:

High

#### Test Case Description:

Verify that users can create GitLab credentials for self-hosted GitLab instances with custom URL configuration
and secret-based authentication.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete,
   credentials.secrets.create, credentials.secrets.list, credentials.secrets.details,
   credentials.secrets.update, credentials.secrets.delete
6. User has access to self-hosted GitLab instance with URL {GitLab_SelfHosted_URL}
7. User has a valid GitLab Personal Access Token {GitLab_SelfHosted_Token} for the self-hosted instance
8. Create secret for GitLab self-hosted token:
   - Navigate to **Settings** section in the {Project} application
   - Click on **Secrets** subsection
   - Click on **+ Create new secret** button
   - In the **Name** field, enter "GitLab_SelfHosted_secret"
   - Click in the **Value** field
   - Enter {GitLab_SelfHosted_Token} in the value field
   - Click **Save** button to create the secret
   - Verify "GitLab_SelfHosted_secret" appears in the secrets list

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click on the **+ Create** button in the credentials interface
3. From the credential type selection menu, click on **GitLab**
4. Verify the GitLab credential creation form opens
5. In the **Display Name** field, enter "GitLab - Company Self-Hosted"
6. In the **ID** field, enter "gitlab*selfhosted_access*{timestamp}"
7. In the **URL** field, enter {GitLab_SelfHosted_URL}
8. Verify the URL is properly formatted with https:// protocol
9. Select **GitLab private token** as the authentication method
10. In the **Private Token** field, click on the **secret** button/option
11. From the dropdown, select "GitLab_SelfHosted_secret"
12. Verify that "GitLab_SelfHosted_secret" is selected
13. Check the **Shared** checkbox to make it accessible by team members
14. Click the **Save** button to create the credential
15. Wait for the save operation to complete
16. Navigate back to the **Credentials** section
17. Observe the credentials list and verify that "GitLab - Company Self-Hosted" credential is listed
18. Verify the credential displays self-hosted GitLab configuration
19. Click on the GitLab credential to view its details
20. Verify the credential details show the custom URL and shared status
21. Verify the self-hosted configuration is properly displayed

### Expected Results

- GitLab credential creation form accepts custom self-hosted URL
- URL field properly handles self-hosted GitLab instance endpoints
- Authentication method works with self-hosted server configuration
- Secret integration functions with self-hosted credentials
- GitLab self-hosted credential is created successfully
- Credential appears in list with proper self-hosted indicators
- Custom URL is correctly stored and displayed
- Shared credential functionality works with self-hosted configuration
- No errors occur with custom self-hosted endpoint configuration

### Postconditions

1. Clean up test data by deleting the created resources:
   - Navigate to the **Credentials** section of the {Project}
   - Delete "GitLab - Company Self-Hosted" credential:
     - Locate "GitLab - Company Self-Hosted" credential in the credentials list
     - Click on the ellipsis menu (⋯) or **Actions** button for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "GitLab - Company Self-Hosted" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Navigate to **Settings** -> **Secrets**
   - Delete "GitLab_SelfHosted_secret" secret:
     - Locate "GitLab_SelfHosted_secret" in the secrets list
     - Click on the ellipsis menu (⋯) or **Actions** button for this secret
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the secret name "GitLab_SelfHosted_secret" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the secret is removed from the list
2. Verify all test resources have been successfully removed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests GitLab self-hosted instance credential creation
- Validates custom URL configuration for self-hosted GitLab
- Ensures self-hosted specific functionality works properly

## Test Case ID: TC-03-12

#### Test Case Name:

Create GitLab credentials from Toolkit with repository configuration and secret authentication

#### Test Case Tags:

positive, toolkit, gitlab, repository_config, toolkit_integration

#### Test Case Priority:

High

#### Test Case Description:

Verify that users can create GitLab credentials and toolkit directly from the Toolkit interface with
repository configuration using secret-based authentication following the enhanced security practices.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details, credentials.credentials.update, credentials.credentials.delete,
   credentials.secrets.create, credentials.secrets.list, credentials.secrets.details,
   credentials.secrets.update, credentials.secrets.delete, toolkits.toolkits.create, toolkits.toolkits.list,
   toolkits.toolkits.details
6. User has a valid GitLab Personal Access Token {GitLab_Token} with appropriate scopes
7. User has access to GitLab repository {GitLab_Repository} (format: group_or_username/repository_name)
8. Create secret for GitLab token:
   - Navigate to **Settings** section in the {Project} application
   - Click on **Secrets** subsection
   - Click on **+ Create new secret** button
   - In the **Name** field, enter "GitLab_toolkit_secret"
   - Click in the **Value** field
   - Enter {GitLab_Token} in the value field
   - Click **Save** button to create the secret
   - Verify "GitLab_toolkit_secret" appears in the secrets list

### Test Steps

1. Navigate to the **Toolkits** section in the {Project} application
2. Click on the **+ Create toolkit** button
3. From the toolkit type selection, select **GitLab** (or relevant GitLab toolkit type)
4. Verify the GitLab toolkit creation form opens
5. Locate the **GitLab Configuration** dropdown field
6. Click on the **GitLab Configuration** dropdown
7. From the dropdown options, select **"New GitLab tool"** or create new option
8. Verify that the GitLab toolkit configuration section appears
9. In the **GitLab URL** field, enter "https://gitlab.com"
10. In the **API Token** field, click on the **Secret** option
11. From the dropdown, select "GitLab_toolkit_secret"
12. Verify that "GitLab_toolkit_secret" is selected
13. In the **Repository Name** field, enter {GitLab_Repository} (format: group_or_username/repository_name)
14. Verify the repository name follows the correct format
15. Complete any additional required toolkit configuration fields
16. Click **Save** button to create the toolkit with GitLab integration
17. Wait for the toolkit creation process to complete
18. Verify that the toolkit is created successfully
19. Navigate to the **Credentials** section
20. Verify that a GitLab credential has been created automatically for the toolkit
21. Click on the GitLab credential to view its details
22. Verify the credential shows proper GitLab URL and secret-based authentication
23. Verify the repository configuration is properly linked

### Expected Results

- Toolkit creation interface opens successfully from navigation
- GitLab toolkit type is available and selectable
- "New GitLab tool" option allows inline GitLab configuration
- GitLab URL field accepts standard GitLab.com URL
- Secret selection works properly for API token authentication
- Repository Name field accepts proper format (group_or_username/repository_name)
- Toolkit is created successfully with GitLab integration
- GitLab credential is automatically created and properly configured
- Repository configuration is correctly stored and displayed
- Secret integration works seamlessly throughout the process
- No errors occur during the toolkit creation and credential linking

### Postconditions

1. Clean up test data by deleting the created resources:
   - Navigate to the **Toolkits** section of the {Project}
   - Delete the created GitLab toolkit:
     - Locate the toolkit in the toolkits list
     - Click on the ellipsis menu (⋯) or **Actions** button for this toolkit
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Confirm the deletion by clicking **Delete** button
     - Verify the toolkit is removed from the list
   - Navigate to the **Credentials** section of the {Project}
   - Delete the automatically created GitLab credential:
     - Locate the GitLab credential in the credentials list
     - Click on the ellipsis menu (⋯) or **Actions** button for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Navigate to **Settings** -> **Secrets**
   - Delete "GitLab_toolkit_secret" secret:
     - Locate "GitLab_toolkit_secret" in the secrets list
     - Click on the ellipsis menu (⋯) or **Actions** button for this secret
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the secret name "GitLab_toolkit_secret" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the secret is removed from the list
2. Verify all test resources have been successfully removed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests toolkit-based GitLab credential and repository configuration
- Validates enhanced security practices with secret management
- Ensures proper repository format validation (group_or_username/repository_name)
- Tests automatic credential creation during toolkit setup
- Final test case includes complete cleanup of all test data
