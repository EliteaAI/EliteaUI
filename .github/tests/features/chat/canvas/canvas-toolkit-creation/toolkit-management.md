# Scenario ID: CANVAS-002-4

#### Scenario Name:

Toolkit management operations via canvas interface

#### Scenario Tags:

chat,canvas,toolkit,management,edit,delete,multiple,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates comprehensive toolkit management operations via the canvas interface. It covers
editing existing toolkit configurations, removing toolkits with proper confirmation handling, and managing
multiple toolkits simultaneously to ensure robust toolkit lifecycle management.

## Test Case ID: TK-008

#### Test Case Name

Edit existing toolkit configuration

#### Test Case Tags

chat, canvas, toolkit, regression, edit

#### Test Case Priority

High

#### Test Case Description

Verify that users can edit existing toolkit configurations through the Edit Toolkit functionality, modify
settings, and save changes successfully while maintaining toolkit functionality.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: toolkit.create, toolkit.list, toolkit.update
6. User has valid Elitea Credentials: {credential}
7. Create a test toolkit for editing:
   - Navigate to the **Chat** page (sidebar or main menu)
   - In the **PARTICIPANTS** section, click **+Add toolkit**
   - Click on **+ Create new Toolkit**
   - Search for and select **GitHub** from Code Repositories
   - Configure the toolkit with:
     - Select a GitHub credential from **Github configuration** \* dropdown: {credential}
     - Enter "qa/repository" in **Repository** \* field
     - Input "main" in **Active Branch** field
     - Input "main" in **Base Branch** field
   - Click **Create** button to save the toolkit

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Toolkits**
3. Expand the Toolkits section if collapsed
4. Locate an existing **qa/repository** toolkit in the list
5. Hover over the toolkit
6. Click the pencil **Edit Toolkit** icon that appears
7. Verify the toolkit configuration canvas opens with current settings populated
8. Modify one or more configuration fields:
   - Change the **Repository** field to a different repository (e.g., team/repo)
9. Verify that changes are reflected in the interface
10. Click **Save** button (top right) to save the updated configuration

### Expected Results

- Edit Toolkit button is visible and accessible when a toolkit is selected
- Configuration canvas opens with all current toolkit settings pre-populated
- All editable fields are accessible and modifiable
- Field validation works properly during editing (required fields, format validation)
- Changes made in the interface are visually reflected before saving
- Save button successfully updates the toolkit configuration
- Successful update confirmation message appears after saving
- Edit interface can be closed properly
- Toolkit appears in the Toolkits list with updated information
- Updated configuration is persisted and visible in the toolkit list
- Edited toolkit maintains its functionality with the new configuration
- No data loss occurs during the editing process
- Interface properly handles both required and optional field modifications

### Postconditions

1. Delete the test toolkit created during the test:
   - Navigate to the **Toolkits** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the toolkit and click on the **3 dots** (ellipsis menu) under the Actions column
   - Click Delete from the contextual menu
   - Enter the toolkit name in the Name input field and click **Delete** on the confirmation dialog
2. Verify the toolkit is completely removed from the toolkits list
3. Confirm that the toolkit functions properly with the new configuration (if testing functionality is needed)
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: TK-009

#### Test Case Name

Remove existing toolkit from PARTICIPANTS section with cancellation validation

#### Test Case Tags

chat, canvas, toolkit, regression, delete

#### Test Case Priority

High

#### Test Case Description

Verify that users can remove existing toolkits from the Toolkits section in PARTICIPANTS using the remove
functionality, including proper confirmation dialog handling, successful toolkit removal, and cancellation
workflow validation.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: toolkit.create, toolkit.list, toolkit.delete
6. User has valid Elitea Credentials: {credential}
7. Create test toolkits for removal and cancellation testing:
   - Navigate to the **Chat** page (sidebar or main menu)
   - In the **PARTICIPANTS** section, click **+Add toolkit**
   - Click on **+ Create new Toolkit**
   - Search for and select **GitHub** from Code Repositories
   - Configure the first toolkit with:
     - Select a GitHub credential from **Github configuration** \* dropdown: {credential}
     - Enter "test/remove" in **Repository** \* field
     - Input "main" in **Active Branch** field
     - Input "main" in **Base Branch** field
   - Click **Create** button to save the toolkit

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Toolkits**
3. Expand the Toolkits section if collapsed
4. Locate the **test/remove** toolkit in the list
5. Hover over the toolkit to reveal action buttons
6. Click the **trash** (remove) button that appears
7. Click **Cancel** button to cancel the toolkit removal
8. Locate the **test/remove** toolkit in the list
9. Hover over the toolkit again
10. Click the **trash** (remove) button that appears
11. Click **Remove** button to confirm the toolkit removal

### Expected Results

- Remove (trash) button becomes visible when hovering over the toolkit
- "Remove toolkit?" confirmation dialog appears when clicking the remove button
- Confirmation dialog message states "Are you sure to remove the x toolkit?"
- Dialog contains two buttons: **Cancel** and **Remove**
- Clicking **Cancel** closes the dialog without performing any removal action
- Toolkit remains visible and functional in the Toolkits list after clicking **Cancel**
- No changes are made to the toolkit or its configuration when cancelled
- Clicking **Remove** successfully removes the toolkit from the PARTICIPANTS section
- Confirmation dialog closes after clicking **Remove**
- Removed toolkit no longer appears in the Toolkits list after confirmation
- No error messages or UI issues occur during the removal or cancellation process

### Postconditions

1. Delete the test toolkit created during the test:
   - Navigate to the **Toolkits** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the toolkit with name **test/remove** and click on the **3 dots** (ellipsis menu) under the Actions
     column
   - Click Delete from the contextual menu
   - Enter **test/remove** in the Name input field and click **Delete** on the confirmation dialog
   - Verify that the toolkit named **test/remove** is not available in the toolkits list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- This comprehensive test validates both removal and cancellation workflows from the PARTICIPANTS section
  interface

## Test Case ID: TK-010

#### Test Case Name

Create and manage multiple toolkits via canvas interface

#### Test Case Tags

chat, canvas, toolkit, regression, create

#### Test Case Priority

High

#### Test Case Description

Verify that users can create and manage multiple toolkits of different types (GitHub and Artifact) via the
canvas interface, ensuring proper toolkit creation, configuration, and management of multiple toolkit
instances simultaneously.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: toolkit.create, toolkit.list, toolkit.update, toolkit.delete
6. User has valid Elitea Credentials: {credential}

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Toolkits**
3. Click on the **+Add toolkit** icon
4. Click on **+ Create new Toolkit**
5. In the "Choose the toolkit type" canvas interface, search for "github"
6. Select **GitHub** from the filtered results under Code Repositories
7. Configure the GitHub toolkit:
   - Select a GitHub credential from **Github configuration** \* dropdown: {credential}
   - Enter "multi/repo" in **Repository** \* field
   - Input "main" in **Active Branch** field
   - Input "main" in **Base Branch** field
8. Click **Create** button to create the GitHub toolkit
9. Click the **X** (close) button to return to the **PARTICIPANTS** section
10. Click on the **+Add toolkit** icon again
11. Click on **+ Create new Toolkit**
12. In the "Choose the toolkit type" canvas interface, search for "artifact"
13. Select **Artifact** from the filtered results under Other category
14. Enter **case-folder** in the **Bucket** field
15. Click **Create** button to create the Artifact toolkit
16. Click the **X** (close) button to return to the **PARTICIPANTS** section
17. Expand the Toolkits section if collapsed

### Expected Results

- Both toolkits (**multi/github** and **case-folder**) appear simultaneously in the Toolkits section
- No UI errors or broken elements occur during multiple toolkit creation

### Postconditions

1. Delete GitHub toolkit created during the test:
   - Navigate to the **Toolkits** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the toolkit with name **multi/github** and click on the **3 dots** (ellipsis menu) under the Actions
     column
   - Click Delete from the contextual menu
   - Enter **multi/github** in the Name input field and click **Delete** on the confirmation dialog
2. Delete Artifact toolkit created during the test:
   - Navigate to the **Toolkits** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the toolkit with name **case-folder** and click on the **3 dots** (ellipsis menu) under the Actions
     column
   - Click Delete from the contextual menu
   - Enter **case-folder** in the Name input field and click **Delete** on the confirmation dialog
3. Verify both toolkits are completely removed from the toolkits list
4. Confirm no residual toolkit data remains in the interface
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- This test validates the system's ability to handle multiple toolkit creation and management
