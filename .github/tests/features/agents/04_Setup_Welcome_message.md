# Scenario ID: A-04

#### Scenario Name:

Setting up and managing Welcome Messages for Agents

#### Scenario Tags:

Welcome Message Management, UI Testing, Functional

#### Scenario Priority:

Medium

#### Scenario Description

This scenario verifies the complete functionality of welcome message management for agents including adding,
editing, deleting, and UI interactions such as full-screen view, copy to clipboard, and collapse/expand
behaviors. It validates both positive and negative test cases for welcome message operations. Note: only one
welcome message is allowed per agent.

## Test Case ID: TC-04-01

#### Test Case Name:

Add Welcome Message with Valid Content

#### Test Case Tags:

Smoke, Regression, functional testing, welcome-message

#### Test Case Priority:

High

#### Test Case Description

Verify that a welcome message can be successfully added by entering valid content in the welcome message
field.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for welcome message setup:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Locate the **Welcome message** field
7. Click in the **Welcome message** field
8. Enter valid welcome message text: "Welcome! I can help you with various tasks and questions."
9. Click the **Save** button to save the agent configuration

### Expected Results

- The **Welcome message** field accepts the entered text
- The welcome message is visible in the agent configuration
- The **Save** button is active and clickable
- The welcome message is saved successfully with the agent
- After saving, the welcome message displays correctly in the configuration

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-04-02

#### Test Case Name:

Add Welcome Message Exceeding Character Limit

#### Test Case Tags:

Regression, functional testing, negative testing, welcome-message, validation

#### Test Case Priority:

Medium

#### Test Case Description

Verify system behavior when entering a welcome message that exceeds the maximum allowed character limit.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for welcome message setup:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Locate the **Welcome message** field
7. Click in the **Welcome message** field
8. Enter a welcome message text that exceeds the maximum allowed characters (over 2048 characters)
9. Attempt to save the agent configuration by clicking the **Save** button

### Expected Results

- The system handles the excessive input appropriately (truncation or validation error)
- If truncated, the saved welcome message equals the truncated value within the character limit
- If validation error, appropriate error message is displayed
- The system prevents saving invalid data or auto-corrects the input

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-04-03

#### Test Case Name:

Add Single Welcome Message (Only One Allowed)

#### Test Case Tags:

Regression, functional testing, welcome-message, business-rules

#### Test Case Priority:

High

#### Test Case Description

Verify that only one welcome message can be added per agent.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for welcome message setup:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Verify no welcome message exists initially
7. Click in the **Welcome message** field
8. Enter valid welcome message text: "Welcome! How can I assist you today?"
9. Click the **Save** button to save the agent
10. Verify the "Welcome! How can I assist you today?" welcome message appears in the configuration
11. Check that only one welcome message field is available (no option to add additional messages)

### Expected Results

- "Welcome! How can I assist you today?" welcome message is visible
- No additional welcome message options are presented
- The single welcome message persists after saving and reopening the agent

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-04-04

#### Test Case Name:

Enlarge Welcome Message to Full Screen View

#### Test Case Tags:

Regression, functional testing, welcome-message, ui-interaction

#### Test Case Priority:

Medium

#### Test Case Description

Verify that clicking the full screen button opens the welcome message editor in full-screen mode for enhanced
editing experience.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with welcome message for UI interaction:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent to open it
   - Navigate to **Configuration** tab
   - Add a welcome message: "Welcome! How can I assist you today?"
   - Click the **Save** button

### Test Steps

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Locate the welcome message with existing content
7. Click the **Full Screen** (expand) button for the welcome message
8. Verify the full-screen editor opens
9. Make a small edit to test functionality
10. Close the full-screen view using cancel or close button

### Expected Results

- The **Full Screen** button is visible and clickable
- The welcome message editor opens in full-screen mode (modal or takeover view)
- The full-screen editor displays the existing welcome message content
- The editor allows editing with larger text area for better user experience
- Save and cancel options are available in full-screen mode
- Closing full-screen view returns to normal configuration view

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-04-05

#### Test Case Name:

Copy Welcome Message to Clipboard

#### Test Case Tags:

Regression, functional testing, welcome-message, ui-interaction, copy-functionality

#### Test Case Priority:

Medium

#### Test Case Description

Verify that the copy to clipboard functionality works correctly and copies the welcome message text to the
system clipboard.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with welcome message for copy functionality:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent to open it
   - Navigate to **Configuration** tab
   - Add a welcome message: "Welcome! I can help you with various tasks and answer your questions."
   - Click the **Save** button

### Test Steps

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Locate the welcome message with existing content
7. Click the **Copy** button next to the welcome message
8. Verify the copy confirmation message appears
9. Test paste functionality in another application to verify clipboard content

### Expected Results

- The **Copy** button is visible and clickable next to the welcome message
- Clicking the copy button successfully copies the welcome message text
- A confirmation message appears: "The content has been copied to the clipboard"
- The welcome message text is available in the system clipboard
- The copied text can be pasted correctly in other applications

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-04-06

#### Test Case Name:

Collapse Welcome Message Field

#### Test Case Tags:

Regression, functional testing, welcome-message, ui-interaction, collapse-expand

#### Test Case Priority:

Low

#### Test Case Description

Verify that collapsing the welcome message hides its content while keeping the title and control buttons
visible for space optimization.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with welcome message for collapse functionality:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent to open it
   - Navigate to **Configuration** tab
   - Add a welcome message: "Welcome! I'm here to help you with your questions and tasks."
   - Click the **Save** button

### Test Steps

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Locate the welcome message with existing content (should be expanded by default)
7. Click the **Collapse** button for the welcome message
8. Verify the welcome message body is hidden
9. Verify the title and control buttons remain visible

### Expected Results

- The **Collapse** button is visible and clickable when the welcome message is expanded
- After clicking collapse, the welcome message body content is hidden
- The welcome message title/header remains visible
- Control buttons (expand, copy, full screen) remain accessible
- The collapsed state provides space optimization in the configuration view
- The interface clearly indicates the collapsed state

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-04-07

#### Test Case Name:

Expand Welcome Message Field

#### Test Case Tags:

Regression, functional testing, welcome-message, ui-interaction, collapse-expand

#### Test Case Priority:

Low

#### Test Case Description

Verify that expanding a collapsed welcome message reveals the full content and makes it available for reading
and editing.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with collapsed welcome message for expand functionality:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent to open it
   - Navigate to **Configuration** tab
   - Add a welcome message: "Welcome! I'm here to help you with your questions and tasks."
   - Click the **Save** button
   - Click the **Collapse** button for the welcome message to set up collapsed state

### Test Steps

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Locate the welcome message in collapsed state
7. Click the **Expand** button for the welcome message
8. Verify the welcome message content is fully visible
9. Verify the message is available for editing

### Expected Results

- The **Expand** button is visible and clickable when the welcome message is collapsed
- After clicking expand, the welcome message body content becomes fully visible
- The complete welcome message text is displayed for reading
- The message content is available for editing
- All control buttons remain accessible in expanded state
- The interface clearly shows the expanded state

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-04-08

#### Test Case Name:

Edit Welcome Message Content

#### Test Case Tags:

Smoke, Regression, functional testing, welcome-message, edit-functionality

#### Test Case Priority:

High

#### Test Case Description

Verify that an existing welcome message can be successfully edited and the updated content is saved and
persisted.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with welcome message for editing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent to open it
   - Navigate to **Configuration** tab
   - Add a welcome message: "Welcome! How can I assist you today?"
   - Click the **Save** button

### Test Steps

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Locate the welcome message with existing content
7. Click in the welcome message field to edit
8. Change the text to: "Hello! I'm your AI assistant. How may I help you today?"
9. Click the **Save** button to save changes
10. Verify the updated message appears correctly
11. Navigate away and return to verify persistence

### Expected Results

- The welcome message field is editable when clicked
- New text can be entered to replace the existing content
- The **Save** button is active and functional
- Updated welcome message content is displayed correctly
- Changes are persisted after saving and reopening the agent
- No data loss or corruption occurs during the edit process

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-04-09

#### Test Case Name:

Leave Welcome Message Empty During Edit

#### Test Case Tags:

Regression, negative testing, welcome-message, validation, edge-case

#### Test Case Priority:

High

#### Test Case Description

Verify system behavior and validation when a welcome message is cleared (left empty) during editing process.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with welcome message for empty validation:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent to open it
   - Navigate to **Configuration** tab
   - Add a welcome message: "Welcome! How can I assist you today?"
   - Click the **Save** button

### Test Steps

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Locate the welcome message with existing content
7. Click in the welcome message field to edit
8. Select all text and delete it (clear the welcome message completely)
9. Verify the field is now empty
10. Click the **Save** button to attempt saving
11. Observe system behavior and validation messages

### Expected Results

- The welcome message field can be cleared successfully
- Empty welcome message can be saved without validation errors
- The system handles empty welcome message gracefully
- After saving, the welcome message field shows empty state
- No system errors or crashes occur with empty content
- The agent configuration remains stable with empty welcome message

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-04-10

#### Test Case Name:

Verify Empty Welcome Message UI Behavior

#### Test Case Tags:

Regression, functional testing, welcome-message, ui-behavior, empty-state

#### Test Case Priority:

Medium

#### Test Case Description

Verify that when a welcome message is empty or not yet created, only the full screen button is displayed and
other action buttons are appropriately hidden or disabled.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent without welcome message for empty state testing:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Locate the empty welcome message placeholder/field
7. Inspect the available action buttons for the empty welcome message
8. Verify which buttons are visible, enabled, or disabled
9. Verify the absence of content-dependent action buttons

### Expected Results

- The welcome message field shows empty or placeholder state
- Only the **Full Screen** button is visible for the empty welcome message
- Copy button is hidden or disabled (no content to copy)
- Edit button functionality is limited to full screen mode only
- Delete button is not applicable or disabled for empty content
- The UI clearly indicates the empty state with appropriate messaging
- No errors occur when interacting with the empty welcome message field

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-04-11

#### Test Case Name:

Delete Welcome Message

#### Test Case Tags:

Smoke, Regression, functional testing, welcome-message, delete-functionality

#### Test Case Priority:

High

#### Test Case Description

Verify that a welcome message can be successfully deleted from the agent configuration and the deletion
persists after saving.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with welcome message for deletion:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent to open it
   - Navigate to **Configuration** tab
   - Add a welcome message: "Welcome! How can I assist you today?"
   - Click the **Save** button

### Test Steps

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Locate the welcome message with existing content
7. Click the **Delete** button near the Welcome Message section
8. Confirm deletion if prompted
9. Click the **Save** button to save the agent configuration
10. Verify the welcome message has been removed from the UI
11. Navigate away and return to verify the deletion persists

### Expected Results

- The **Delete** button is visible and clickable next to the welcome message
- Clicking delete removes the welcome message from the configuration immediately
- Confirmation dialog may appear to prevent accidental deletion
- After deletion, the welcome message is no longer visible in the UI
- The **Save** button successfully saves the configuration without the welcome message
- After refresh or reopening, the welcome message remains deleted
- No errors occur during the deletion process

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-
