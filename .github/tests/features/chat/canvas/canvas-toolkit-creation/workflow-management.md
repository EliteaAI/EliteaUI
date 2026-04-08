# Scenario ID: CANVAS-002-3

#### Scenario Name:

Workflow management for canvas toolkit creation

#### Scenario Tags:

chat,canvas,toolkit,workflow,cancellation,confirmation,regression

#### Scenario Priority:

Medium

#### Scenario Description

This scenario validates the workflow management aspects of toolkit creation via the canvas interface. It
covers cancellation processes at various stages and confirmation dialog handling to ensure users can properly
manage their toolkit creation workflow and avoid accidental data loss.

## Test Case ID: TK-004

#### Test Case Name

Cancel toolkit creation process

#### Test Case Tags

chat, canvas, toolkit, regression

#### Test Case Priority

Medium

#### Test Case Description

Verify that users can cancel the toolkit creation process at various stages without creating a toolkit.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: toolkit.create, toolkit.list

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Toolkits**
3. Click on the **Add toolkit** button
4. Verify the "New Toolkit" dialog opens
5. Click on **+ Create new Toolkit**
6. In the "Choose the toolkit type" interface, select a toolkit type (e.g., GitHub)
7. Before clicking Create, click the **X** (close) button
8. Verify the dialog closes without creating a toolkit

### Expected Results

- Dialog can be closed at toolkit type selection stage
- No toolkit is created when canceling at type selection
- Configuration can be canceled without saving
- No partial toolkit data is saved when canceling configuration
- Toolkits section remains unchanged after cancellation

### Postconditions

1. Verify no new toolkits appear in the Toolkits section
2. Confirm no residual toolkit data is created
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: TK-007

#### Test Case Name

Verify confirmation dialog appears when interrupting toolkit creation

#### Test Case Tags

chat, canvas, toolkit, regression

#### Test Case Priority

Medium

#### Test Case Description

Verify that a confirmation dialog appears when users attempt to interrupt or cancel the toolkit creation
process after making configuration changes, ensuring users don't accidentally lose their work.

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
8. Verify the **New GitHub Toolkit** configuration canvas opens
9. Make partial configuration changes:
   - Enter a repository name in **Repository** \* field (e.g., "owner/repo")
10. Attempt to interrupt creation by clicking the **X** (close) button
11. Click **Cancel** on the confirmation dialog to stay in the creation process
12. In the confirmation dialog, click **X** (close) button
13. In the confirmation dialog, click **Confirm** to proceed with cancellation

### Expected Results

- Confirmation dialog with title "Warning" appears when attempting to close toolkit creation with unsaved
  changes
- Dialog message clearly states "You are editing now. Do you want to discard current changes and continue?"
- Dialog provides two clear buttons: **Cancel** and **Confirm**
- Clicking **Cancel** keeps the configuration canvas open
- All previously entered configuration data is preserved when staying in creation mode
- Configuration canvas remains open with previously entered data intact when clicking **Cancel**
- Clicking **Confirm** closes the creation process without saving
- Dialog closes and returns to the previous screen when clicking **Confirm**
- No toolkit is created in the Toolkits section when cancelling
- No partial or incomplete toolkit is created when cancelling
- User returns to the appropriate previous screen (Chat page with Toolkits section)
- Confirmation dialog does not appear if no configuration changes were made

### Postconditions

1. Verify no new toolkits appear in the Toolkits section
2. Confirm no residual or partial toolkit data is created
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes
