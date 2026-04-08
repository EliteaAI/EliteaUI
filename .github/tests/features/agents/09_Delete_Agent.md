# Scenario ID: 09_Delete_Agent

#### Scenario Name:

Delete Agent — flows from details and table views, confirmation dialog and permissions

#### Scenario Tags:

functional testing, regression, agents, delete, confirmation

#### Scenario Priority:

High

#### Scenario Description:

This scenario validates deleting an Agent entity both from the Agent details page (Delete button) and from the
Agents table view (Actions -> Delete). It verifies the "Delete confirmation" dialog contents and behavior,
correct activation of the destructive action only after entering the exact agent name, cancel behavior,
clipboard paste behavior, and permission-based visibility of delete controls.

## Test Case ID: TC-09-01

#### Test Case Name:

Open Delete dialog from Agent details page

#### Test Case Tags:

positive, delete, dialog

#### Test Case Priority:

High

#### Test Case Description:

Verify the Delete dialog opens from the agent details page and displays the correct title, message, and Name
input field.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent for delete operation:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the agent details page
3. Locate the **Delete agent** button (visible near top-right or in page actions)
4. Click the **Delete agent** button
5. Observe the modal dialog that appears
6. Verify the dialog title displays "Delete confirmation"
7. Verify the dialog message displays "Are you sure to delete "Test Agent"? Enter the name to complete the
   action."
8. Locate the labeled input field "Name" and verify it is initially empty
9. Verify there are two buttons present: "Cancel" and "Delete"
10. Verify the "Cancel" button is enabled
11. Verify the "Delete" button is disabled
12. Click the "Cancel" button to close the dialog without making changes

### Expected Results

- A modal dialog appears immediately after clicking "Delete agent"
- The dialog displays the correct title "Delete confirmation"
- The dialog message includes the exact agent name "Test Agent" in the confirmation text
- The message reads: "Are you sure to delete "Test Agent"? Enter the name to complete the action."
- The dialog contains a labeled input field "Name" that is initially empty
- Two buttons are present: "Cancel" (enabled) and "Delete" (disabled)
- The "Delete" button remains disabled until a valid exact name is entered
- Clicking "Cancel" closes the dialog without any changes to the agent

### Postconditions

1. Verify the agent "Test Agent" still exists in the agents list
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
3. Verify no residual data remains from the deleted agent
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-09-02

#### Test Case Name:

Delete via typing exact agent name (details page)

#### Test Case Tags:

positive, delete, flow

#### Test Case Priority:

High

#### Test Case Description:

Enter the exact agent name and confirm delete from details page; verify agent is removed and a success message
appears.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent for delete operation:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the agent details page
3. Click the **Delete agent** button
4. In the delete confirmation dialog, locate the **Name** input field
5. Type the exact agent name "Test Agent" in the **Name** input field
6. Observe that the **Delete** button becomes enabled as you type
7. Verify the **Delete** button is now clickable and enabled
8. Click the **Delete** button to confirm the deletion
9. Wait for the deletion process to complete
10. Observe any success notification that appears
11. Navigate to the **Agents** section in the {Project}
12. Click on **Table view** button
13. Verify that "Test Agent" no longer appears in the agents list

### Expected Results

- The Name input field accepts the typed agent name "Test Agent"
- The **Delete** button becomes enabled when the exact agent name is entered
- The **Delete** button changes state from disabled to enabled/clickable
- Clicking **Delete** button initiates the deletion process
- The dialog closes after the delete action completes
- A success notification displays: "Deleted the agent successfully" (or equivalent message)
- "Test Agent" no longer appears in the Agents list (list or table view)
- The agent is permanently removed from the system

### Postconditions

1. Verify no residual data remains from the deleted agent
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-09-03

#### Test Case Name:

Paste exact agent name into Name field (details page)

#### Test Case Tags:

positive, delete, clipboard

#### Test Case Priority:

Medium

#### Test Case Description:

Copy the displayed agent name, paste into the dialog "Name" field, verify Delete button activates and deletion
behaves same as typing.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent for delete operation:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the agent details page
3. Click the **Delete agent** button
4. In the delete confirmation dialog, locate the agent name "Test Agent" displayed in the dialog prompt
5. Select and copy the agent name "Test Agent" from the dialog prompt text
6. Click in the "Name" input field to focus it
7. Paste the copied agent name using Ctrl+V (or right-click -> Paste)
8. Verify that the pasted text appears in the Name input field
9. Observe that the **Delete** button becomes enabled after pasting
10. Verify the **Delete** button is now clickable and enabled
11. Click the **Delete** button to confirm the deletion
12. Wait for the deletion process to complete
13. Observe any success notification that appears
14. Navigate to the **Agents** section in the {Project}
15. Click on **Table view** button
16. Verify that "Test Agent" no longer appears in the agents list

### Expected Results

- The agent name "Test Agent" can be selected and copied from the dialog prompt
- The Name input field accepts the pasted text
- Paste operation is successful and the exact agent name appears in the field
- The **Delete** button becomes enabled only when the pasted value exactly matches the agent name
- The **Delete** button changes state from disabled to enabled/clickable
- Clicking **Delete** initiates the deletion process same as with typed input
- The dialog closes after the delete action completes
- A success notification displays: "Deleted the agent successfully" (or equivalent)
- The agent is deleted and no longer appears in the agents list
- Clipboard paste behaves identically to manual typing

### Postconditions

1. Verify no residual data remains from the deleted agent
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-09-04

#### Test Case Name:

Delete button inactive until valid name entered; Cancel active (details page)

#### Test Case Tags:

negative, delete, dialog

#### Test Case Priority:

High

#### Test Case Description:

Verify the Delete button remains disabled until the exact agent name is provided; the Cancel button remains
active.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent for delete operation:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the agent details page
3. Click the **Delete agent** button
4. In the delete confirmation dialog, observe the initial state of both buttons
5. Leave the "Name" field empty and verify button states
6. Type "test agent" (incorrect lowercase) in the Name input field
7. Observe that the **Delete** button remains disabled
8. Clear the field and type "TestAgent" (no space) in the Name input field
9. Observe that the **Delete** button remains disabled
10. Clear the field and type "Test" (partial name) in the Name input field
11. Observe that the **Delete** button remains disabled
12. Verify the **Cancel** button remains enabled throughout all steps
13. Click the **Cancel** button to close the dialog without making changes

### Expected Results

- The delete confirmation dialog opens with both Cancel and Delete buttons visible
- The **Cancel** button is enabled and clickable at all times during the test
- The **Delete** button is initially disabled when the Name field is empty
- The **Delete** button remains disabled when entering "test agent" (incorrect case)
- The **Delete** button remains disabled when entering "TestAgent" (no space)
- The **Delete** button remains disabled when entering "Test" (partial match)
- The **Delete** button remains disabled for any input that doesn't exactly match "Test Agent"
- Only exact case-sensitive string matching enables the Delete button
- No deletion is possible when the Delete button is disabled
- Clicking Cancel closes the dialog and returns to the agent details page

### Postconditions

1. Verify the agent "Test Agent" still exists in the agents list
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
3. Verify no residual data remains from the deleted agent
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-09-05

#### Test Case Name:

Cancel deletion before entering valid name (details page)

#### Test Case Tags:

negative, cancel

#### Test Case Priority:

Medium

#### Test Case Description:

Cancel deletion from the dialog before a valid name is entered and verify agent remains.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent for delete operation:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the agent details page
3. Click the **Delete agent** button
4. Observe the modal dialog that appears
5. Verify the dialog title displays "Delete confirmation"
6. Verify the dialog message displays "Are you sure to delete "Test Agent"? Enter the name to complete the
   action."
7. Verify the Name input field is empty
8. Verify the **Cancel** button is enabled
9. Verify the **Delete** button is disabled
10. Without entering any text in the Name field, click the **Cancel** button
11. Observe that the dialog closes immediately
12. Navigate to the **Agents** section in the {Project}
13. Click on **Table view** button
14. Verify that "Test Agent" still appears in the agents list

### Expected Results

- The delete confirmation dialog opens with correct title and message
- The Name input field is initially empty
- The **Cancel** button is enabled and clickable
- The **Delete** button is disabled when Name field is empty
- Clicking **Cancel** immediately closes the dialog without any confirmation
- The dialog closes quickly without delay or loading states
- No deletion process is initiated
- No success notification for deletion appears
- No error or warning messages are displayed
- The agent "Test Agent" remains in the agents list unchanged
- The agent is fully functional and accessible after canceling

### Postconditions

1. Verify the agent "Test Agent" still exists in the agents list
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
3. Verify no residual data remains from the deleted agent
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-09-06

#### Test Case Name:

Cancel deletion after entering valid name (details page)

#### Test Case Tags:

negative, cancel

#### Test Case Priority:

Medium

#### Test Case Description:

Enter the exact agent name but click "Cancel" and ensure no deletion occurs.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent for delete operation:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the agent details page
3. Click the **Delete agent** button
4. Observe the modal dialog that appears
5. Verify the dialog title displays "Delete confirmation"
6. Verify the dialog message displays "Are you sure to delete "Test Agent"? Enter the name to complete the
   action."
7. Locate the Name input field and verify it is initially empty
8. Type the exact agent name "Test Agent" in the Name input field
9. Observe that the **Delete** button becomes enabled as you type
10. Verify the **Delete** button is now clickable and enabled
11. Verify the **Cancel** button remains enabled throughout
12. Instead of clicking Delete, click the **Cancel** button
13. Observe that the dialog closes immediately
14. Navigate to the **Agents** section in the {Project}
15. Click on **Table view** button
16. Verify that "Test Agent" still appears in the agents list

### Expected Results

- The delete confirmation dialog opens with correct title and message
- The Name input field accepts the typed agent name "Test Agent"
- The **Delete** button becomes enabled when the exact agent name is entered
- The **Delete** button changes state from disabled to enabled/clickable
- The **Cancel** button remains enabled throughout the entire process
- Clicking **Cancel** (even after enabling Delete) immediately closes the dialog
- No confirmation dialog appears when clicking Cancel
- The dialog closes quickly without delay or loading states
- No deletion process is initiated despite the valid name being entered
- No success notification for deletion appears
- No error or warning messages are displayed
- The agent "Test Agent" remains in the agents list unchanged
- The agent is fully functional and accessible after canceling

### Postconditions

1. Verify the agent "Test Agent" still exists in the agents list
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
3. Verify no residual data remains from the deleted agent
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-09-07

#### Test Case Name:

Delete agent from Table view (positive flow)

#### Test Case Tags:

positive, delete, table-view

#### Test Case Priority:

High

#### Test Case Description:

Delete the agent from the Agents table (Actions -> Delete) and validate the same confirmation dialog and
deletion outcome.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.task.delete, models.applications.versions.get,
   models.applications.tool.delete, models.applications.applications.list,
   models.applications.application_relation.patch, monitoring.applications.list,
   models.applications.tool.update, models.applications.application.delete permission
6. Create a test agent for delete operation:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. In Table view, locate the row for "Test Agent"
2. Click on the agent row menu (3 dots or ellipsis) next to the agent name
3. Observe the contextual menu that appears
4. Select **Delete** from the dropdown menu options
5. Observe the modal dialog that appears
6. Verify the dialog title displays "Delete confirmation"
7. Verify the dialog message displays "Are you sure to delete "Test Agent"? Enter the name to complete the
   action."
8. Locate the labeled input field "Name" and verify it is initially empty
9. Verify there are two buttons present: "Cancel" and "Delete"
10. Verify the **Cancel** button is enabled
11. Verify the **Delete** button is disabled
12. Type the exact agent name "Test Agent" in the Name input field
13. Observe that the **Delete** button becomes enabled as you type
14. Click the **Delete** button to confirm the deletion
15. Wait for the deletion process to complete
16. Observe any success notification that appears
17. Verify that "Test Agent" no longer appears in the Table view

### Expected Results

- The agent row displays the Actions menu (3 dots or ellipsis) correctly
- Clicking the Actions menu reveals a dropdown with available options
- The dropdown includes a **Delete** option that is clickable
- The delete confirmation dialog behavior matches the details-page flow exactly:
  - Same dialog title "Delete confirmation"
  - Same dialog message format with agent name
  - Same Name input field (initially empty)
  - Same Cancel/Delete button states and behavior
- The Name input field accepts the typed agent name "Test Agent"
- The **Delete** button becomes enabled only when the exact agent name is entered
- Clicking **Delete** initiates the deletion process
- The dialog closes after the delete action completes
- A success notification displays: "Deleted the agent successfully" (or equivalent)
- "Test Agent" no longer appears in the Table view
- The table refreshes properly without requiring manual refresh

### Postconditions

1. Verify no residual data remains from the deleted agent
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-09-08

#### Test Case Name:

Delete agent from Table view — user without delete permission

#### Test Case Tags:

negative, permissions, table-view

#### Test Case Priority:

High

#### Test Case Description:

Verify that when the current user lacks delete permission, the "Delete" option is not present in the Actions
dropdown in Table view.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials for a user with limited permissions
3. User logs in with {Limited_Username} / {Limited_Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.task.delete, models.applications.versions.get,
   models.applications.tool.delete, models.applications.applications.list,
   models.applications.application_relation.patch, monitoring.applications.list,
   models.applications.tool.update does NOT have delete permissions for agents (specifically missing
   models.applications.application.delete permission)
6. Ensure a test agent exists for testing:
   - If needed, create a test agent using an admin account:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Verify the test agent appears in the agents list
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the "Test Agent" in the agents list

### Test Steps

1. In Table view, locate the row for "Test Agent"
2. Click on the agent row menu (3 dots or ellipsis) next to the agent name
3. Observe the contextual menu that appears
4. Examine all available options in the dropdown menu
5. Look specifically for a **Delete** option in the menu
6. If a Delete option is present but disabled, hover over it to check for tooltips
7. If a Delete option is present, attempt to click it and observe the response
8. Verify that no delete functionality is accessible through any menu option
9. Check for any visual indicators (grayed out options, missing options, etc.)
10. Close the dropdown menu by clicking elsewhere
11. Navigate to the **Agents** section in the {Project}

- Click on **Table view** button
- Locate the "Test Agent" in the agents list

### Expected Results

- The agent row displays the Actions menu (3 dots or ellipsis) correctly
- Clicking the Actions menu reveals a dropdown with available options
- The dropdown menu does NOT include a **Delete** option for users without delete permissions
- If a Delete option appears but is disabled:
  - The option is visually indicated as disabled (grayed out or similar)
  - Hovering shows a tooltip explaining insufficient permissions
  - Clicking the disabled option produces no action or shows a permission error
- No delete functionality is accessible through the Actions menu
- Other permitted actions (like View, Edit if applicable) may still be present and functional
- The agent remains fully present and functional in the agents list
- General agent access and viewing capabilities work normally
- No error messages appear just from opening the Actions menu
- Permission restrictions are enforced consistently

### Postconditions

1. Verify the agent "Test Agent" still exists in the agents list
2. If a test agent was created for this test, clean it up using an admin account:
   - Log out from the limited permissions account
   - Log in with admin credentials
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Delete the "Test Agent" using proper deletion process
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-09-09

#### Test Case Name:

Case Sensitivity Validation

#### Test Case Tags:

negative, validation, case-sensitivity

#### Test Case Priority:

High

#### Test Case Description:

Verify that agent name matching is case-sensitive in the delete confirmation dialog. Test that entering agent
name with different casing keeps Delete button disabled.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent for delete operation:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the agent details page
3. Click the **Delete agent** button
4. In the delete confirmation dialog, locate the "Name" input field
5. Type "test agent" (all lowercase) in the Name input field
6. Verify the **Delete** button remains disabled
7. Clear the field and type "TEST AGENT" (all uppercase) in the Name input field
8. Verify the **Delete** button remains disabled
9. Clear the field and type "Test agent" (different casing) in the Name input field
10. Verify the **Delete** button remains disabled
11. Clear the field and type "tEST aGENT" (mixed random casing) in the Name input field
12. Verify the **Delete** button remains disabled
13. Clear the field and type the exact agent name "Test Agent" (correct casing)
14. Verify the **Delete** button becomes enabled
15. Click the **Cancel** button to close the dialog without making changes

### Expected Results

- The Name input field accepts all typed variations of the agent name
- The **Delete** button remains disabled when entering "test agent" (lowercase)
- The **Delete** button remains disabled when entering "TEST AGENT" (uppercase)
- The **Delete** button remains disabled when entering "Test agent" (different casing)
- The **Delete** button remains disabled when entering "tEST aGENT" (mixed casing)
- The **Delete** button only becomes enabled when the exact case-sensitive match "Test Agent" is entered
- Case sensitivity is strictly enforced for the delete confirmation
- Only the exact agent name with matching case enables the deletion functionality

### Postconditions

1. Verify the agent "Test Agent" still exists in the agents list
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
3. Verify no residual data remains from the deleted agent
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-09-10

#### Test Case Name:

Delete Button State with Partial Name Matches

#### Test Case Tags:

negative, validation, partial-match

#### Test Case Priority:

Medium

#### Test Case Description:

Verify Delete button behavior when typing partial matches that contain portions of the full agent name. Test
that partial matches do not enable the Delete button.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent for delete operation:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the agent details page
3. Click the **Delete agent** button
4. In the delete confirmation dialog, locate the "Name" input field
5. Type "Test" (partial match - first word only) in the Name input field
6. Verify the **Delete** button remains disabled
7. Clear the field and type "Agent" (partial match - second word only) in the Name input field
8. Verify the **Delete** button remains disabled
9. Clear the field and type "Test Agent Extra" (contains full name plus extra text) in the Name input field
10. Verify the **Delete** button remains disabled
11. Clear the field and type "My Test Agent" (contains full name with prefix) in the Name input field
12. Verify the **Delete** button remains disabled
13. Clear the field and type "Test Agent 2" (contains full name with suffix) in the Name input field
14. Verify the **Delete** button remains disabled
15. Clear the field and type the exact agent name "Test Agent"
16. Verify the **Delete** button becomes enabled
17. Click the **Cancel** button to close the dialog without making changes

### Expected Results

- The Name input field accepts all typed variations and partial matches
- The **Delete** button remains disabled when entering "Test" (partial match)
- The **Delete** button remains disabled when entering "Agent" (partial match)
- The **Delete** button remains disabled when entering "Test Agent Extra" (name plus extra text)
- The **Delete** button remains disabled when entering "My Test Agent" (name with prefix)
- The **Delete** button remains disabled when entering "Test Agent 2" (name with suffix)
- The **Delete** button only becomes enabled when the exact complete match "Test Agent" is entered
- Partial matches, substrings, or extended strings do not trigger deletion capability
- Only exact string matching enables the Delete button functionality

### Postconditions

1. Verify the agent "Test Agent" still exists in the agents list
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
3. Verify no residual data remains from the deleted agent
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-09-11

#### Test Case Name:

Delete Agent with Active Sessions/Dependencies

#### Test Case Tags:

negative, dependencies, active-session

#### Test Case Priority:

High

#### Test Case Description:

Test deletion of agents that may have active sessions, configurations, or dependencies. Verify system behavior
when attempting to delete agents currently being used or having associated data.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent for delete operation with dependencies:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Active Test Agent"
     - Agent's description: "Test Description with Dependencies"
     - Configure any additional settings or toolkits that create dependencies
   - Click the **Save** button
   - Simulate active usage by opening a chat session with the agent or creating configurations that reference
     it
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Active Test Agent" agent in the agents list

### Test Steps

1. While the agent has active sessions or dependencies, click on the "Active Test Agent" agent to open it
2. Navigate to the agent details page
3. Click the **Delete agent** button
4. In the delete confirmation dialog, observe any warning messages about active sessions or dependencies
5. Type the exact agent name "Active Test Agent" in the Name input field
6. Verify the **Delete** button becomes enabled
7. Click the **Delete** button to attempt deletion
8. Observe the system response - whether deletion proceeds or is blocked
9. If deletion is blocked, note any error messages or warnings displayed
10. If deletion proceeds, verify the system handles cleanup of associated data
11. Check for any success or error notifications
12. Navigate to the **Agents** section in the {Project}
13. Click on **Table view** button
14. Verify the agent status in the agents list
15. If agent was deleted, verify that associated sessions/configurations are properly cleaned up
16. If agent deletion was blocked, verify the agent remains functional

### Expected Results

- The delete confirmation dialog may display warnings about active sessions or dependencies
- The system either blocks deletion with appropriate error messages OR proceeds with proper cleanup
- If deletion is blocked: Clear error message explains why deletion cannot proceed (e.g., "Agent is currently
  in use in active sessions")
- If deletion proceeds: All associated data, sessions, and configurations are properly cleaned up
- No orphaned data or broken references remain in the system
- Success notification appears if deletion completes successfully
- Error notification appears if deletion is blocked due to dependencies
- Agent functionality remains intact if deletion is blocked
- System maintains data integrity throughout the process

### Postconditions

1. If agent was successfully deleted: Verify no residual data remains and all dependencies are cleaned up
2. If agent deletion was blocked: Clean up any test sessions or dependencies manually, then delete the agent
   using standard deletion process
3. Verify system stability and no broken references exist
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-09-12

#### Test Case Name:

Delete Performance with Large Agent Names

#### Test Case Tags:

performance, edge-case, large-name

#### Test Case Priority:

Low

#### Test Case Description:

Test deletion performance with maximum-length agent names (64 characters). Verify that agents with long names
can be deleted efficiently without performance degradation.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with maximum-length name:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "TestAgentWithVeryLongNameThatIsExactlySixtyFourCharactersLong123" (exactly 64
       characters)
     - Agent's description: "Test Description for Performance Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent with long name in the agents list

### Test Steps

1. Record the current time before starting the deletion process
2. Click on the agent with the 64-character name to open it
3. Navigate to the agent details page
4. Click the **Delete agent** button
5. Observe the dialog loading time and responsiveness
6. In the delete confirmation dialog, verify the full agent name is displayed correctly
7. Type the complete 64-character agent name
   "TestAgentWithVeryLongNameThatIsExactlySixtyFourCharactersLong123" in the Name input field
8. Monitor typing responsiveness and field performance while entering the long name
9. Verify the **Delete** button becomes enabled after entering the complete name
10. Click the **Delete** button to confirm deletion
11. Monitor the deletion process time and system responsiveness
12. Observe any loading indicators or progress feedback
13. Record the time when the success notification appears
14. Navigate to the **Agents** section in the {Project}
15. Click on **Table view** button
16. Verify the agent with long name no longer appears in the agents list
17. Calculate total deletion time from step 1 to completion

### Expected Results

- The delete confirmation dialog loads within reasonable time (< 2 seconds)
- The full 64-character agent name is displayed correctly in the dialog message
- The Name input field handles the 64-character input without performance issues
- Typing the long name in the input field remains responsive
- The **Delete** button enables promptly after entering the complete name
- Deletion process completes within acceptable time frame (< 5 seconds)
- Success notification appears promptly after deletion completes
- Agent list updates efficiently after deletion
- No performance degradation or system lag occurs during the process
- Long agent names do not cause UI layout issues or truncation problems
- Overall deletion time remains comparable to standard-length names

### Postconditions

1. Verify no residual data remains from the deleted agent with long name
2. Verify system performance returns to normal levels
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-09-13

#### Test Case Name:

Browser Refresh During Delete Process

#### Test Case Tags:

negative, browser-state, interruption

#### Test Case Priority:

Medium

#### Test Case Description:

Test system behavior when browser is refreshed during deletion process. Verify that incomplete deletions are
handled gracefully and system state remains consistent.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent for interruption testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Refresh Test Agent"
     - Agent's description: "Test Description for Browser Refresh"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Refresh Test Agent" agent in the agents list

### Test Steps

1. Click on the "Refresh Test Agent" agent to open it
2. Navigate to the agent details page
3. Click the **Delete agent** button
4. In the delete confirmation dialog, type the exact agent name "Refresh Test Agent"
5. Verify the **Delete** button becomes enabled
6. Click the **Delete** button to initiate deletion
7. Immediately after clicking Delete, press F5 or Ctrl+F5 to refresh the browser
8. Wait for the page to reload completely
9. Re-authenticate if necessary (enter credentials again)
10. Navigate to the **Agents** section in the {Project}
11. Click on **Table view** button
12. Check if "Refresh Test Agent" still appears in the agents list
13. If the agent still exists, click on it to verify its functionality
14. Attempt to access the agent details page
15. Try to perform operations on the agent (edit, delete again)
16. Check for any error states or inconsistent data
17. Verify no orphaned or corrupted data exists

### Expected Results

- Browser refresh interrupts the deletion process
- After refresh and re-authentication, the system state is consistent
- Either the agent is completely deleted (if deletion completed before refresh) OR the agent remains fully
  functional (if deletion was interrupted)
- No partial deletion state exists - agent is either fully present or fully absent
- If agent remains: All agent functionality works correctly without corruption
- If agent was deleted: No traces of the agent remain in the system
- No error states or inconsistent data are present
- Agent list displays correctly without broken entries
- System handles the interruption gracefully without data corruption
- No orphaned references or incomplete records exist
- User can perform normal operations after the refresh

### Postconditions

1. If agent still exists after refresh: Delete the agent properly using standard deletion process
2. If agent was successfully deleted: Verify no residual data remains
3. Verify system stability and data consistency
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-
