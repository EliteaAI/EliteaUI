# Scenario ID: CANVAS-002-2

#### Scenario Name:

Configuration and creation of toolkits via canvas interface

#### Scenario Tags:

chat,canvas,toolkit,configuration,creation,validation,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the toolkit configuration and creation functionality via the canvas interface. It
covers verifying configuration elements availability, completing the full toolkit creation process, and
validating required field enforcement to ensure proper toolkit setup and configuration persistence.

## Test Case ID: TK-002

#### Test Case Name

Verify GitHub toolkit configuration elements availability

#### Test Case Tags

chat, canvas, toolkit, regression

#### Test Case Priority

High

#### Test Case Description

Verify that all required configuration elements and parameters are available and properly displayed when
creating a GitHub toolkit. This test focuses on validating the presence and accessibility of configuration
fields without completing the full creation process.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: toolkit.create, toolkit.list, toolkit.update

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Toolkits**
3. Click on the **Add toolkit** button
4. Verify the "New Toolkit" dialog opens
5. Click on **+ Create new Toolkit**
6. In the "Choose the toolkit type" interface, click on a category (e.g., **Code Repositories**)
7. Locate and click on a toolkit option (e.g., **GitHub**)
8. Verify the **New GitHub Toolkit** configuration canvas opens
9. Verify availability of the elements required for configuring the **GitHub** toolkit:
10. Check that all configuration sections are accessible and properly labeled
11. Ensure all toolkit-specific tools are displayed in the TOOLS section

### Expected Results

- The GitHub toolkit configuration page loads successfully
- **CONFIGURATION** section is clearly visible and contains all required fields:
  - Github configuration \* (marked as required)
  - PgVector configuration (optional field)
  - Embedding Model (dropdown/selection field)
  - Repository \* (marked as required)
  - Active Branch (branch selection field)
  - Base Branch (branch selection field)
- **TOOLS** section is displayed below configuration with available GitHub-specific tools
- All configuration sections are accessible and interactive
- Field labels are properly aligned and readable
- No broken UI elements or missing components

### Notes

## Test Case ID: TK-005

#### Test Case Name

Complete toolkit configuration and creation via canvas interface

#### Test Case Tags

chat, canvas, toolkit, smoke, create

#### Test Case Priority

High

#### Test Case Description

Verify the complete end-to-end process of configuring and creating a toolkit via the canvas interface,
including field validation, configuration persistence, and successful toolkit creation with proper
functionality verification.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: toolkit.create, toolkit.list, toolkit.update
6. User has valid Elitea Credentials: {credential}

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Toolkits**
3. Click on the **+Add toolkit** icon
4. Verify the "New Toolkit" dialog opens
5. Click on **+ Create new Toolkit**
6. In the "Choose the toolkit type" canvas interface, search for "github"
7. Select **GitHub** from the filtered results under Code Repositories
8. Verify the **New GitHub Toolkit** configuration canvas opens with all required sections
9. Click on **Github configuration** dropdown and select a Saved GitHub Credential: {credential}
10. Click on **PgVector configuration** and select an option from dropdown (e.g., elitea-pgvector)
11. Click on Embedding Model and select an option from dropdown
12. Enter **owner/repository** in the **Repository**
13. Input **main** in the **Active Branch** field
14. Input **main** in the **Base Branch** field
15. Click **Create** (top right) button to create the toolkit
16. Verify successful creation confirmation message
17. Click the **X** (close) button to navigate back to the **PARTICIPANTS** section
18. Verify the **owner/repository** toolkit appears in the **Toolkits** list

### Expected Results

- Canvas interface navigation works smoothly throughout the process
- All configuration fields are accessible and properly validated
- Valid configuration data is accepted and saved correctly
- Toolkit creation completes successfully with confirmation message
- Created toolkit appears in the Toolkits section with correct name and type
- Toolkit configuration persists correctly after creation
- No UI errors or broken elements occur during configuration
- All toolkit-specific tools are properly loaded and accessible

### Postconditions

1. Delete the test toolkit created during the test:
   - Navigate to the **Toolkits** page (sidebar or main menu)
   - Switch to the **Table view**(top right)
   - Find the toolkit with name **owner/repository** and click on the **3 dots** (ellipsis menu) under the
     Actions column
2. Click Delete from the contextual menu
3. Enter **owner/repository** in the Name input field and click **Delete** on the confirmation dialog
4. Verify that the toolkit named **owner/repository** is not available in the toolkits list
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- This test case validates the complete canvas-based toolkit creation workflow

## Test Case ID: TK-006

#### Test Case Name

Validate required fields for toolkit creation

#### Test Case Tags

chat, canvas, toolkit, regression

#### Test Case Priority

High

#### Test Case Description

Verify that the system properly validates required fields and prevents toolkit creation when these mandatory
fields are not provided or selected.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: toolkit.create, toolkit.list

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Toolkits**
3. Click on the **+Add toolkit** icon
4. Verify the "New Toolkit" dialog opens
5. Click on **+ Create new Toolkit**
6. In the "Choose the toolkit type" canvas interface, search for "github"
7. Select **GitHub** from the filtered results under Code Repositories
8. Verify the **New GitHub Toolkit** configuration canvas opens with all required sections
9. Leave the **Github configuration** \* field empty (do not select any option)
10. Leave the **Repository** \* field empty (do not enter any value)
11. Configure optional fields if desired (PgVector configuration, Embedding Model)
12. Enter values in **Active Branch** and **Base Branch** fields (e.g., "main")
13. Click **Create** button to attempt toolkit creation
14. Verify that validation error messages appear for required fields
15. Verify that the toolkit creation is prevented
16. Select a value for **Github configuration** _ dropdown but leave **Repository** _ empty
17. Click **Create** button again
18. Verify that validation error appears only for the **Repository** \* field
19. Enter a valid repository value (e.g., "owner/repository") but clear **Github configuration** \*
20. Click **Create** button again
21. Verify that validation error appears only for the **Github configuration** \* field

### Expected Results

- System prevents toolkit creation when **Github configuration** \* is not selected
- System prevents toolkit creation when **Repository** \* is not provided
- **Create** button behavior properly validates required fields before submission
- User interface clearly indicates which fields are required with asterisk (\*) notation

### Postconditions

1. Click the **X** (close) button then **Confirm** on the opened confirmation dialog
2. Verify no new toolkits appear under the Toolkits section
3. Confirm no residual toolkit data is created
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes
