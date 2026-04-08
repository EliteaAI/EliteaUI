# Scenario ID: A-03

#### Scenario Name:

Setup Conversation Starters for an Agent

#### Scenario Tags:

Agent Conversation Starters, UI Testing, Functional

#### Scenario Priority:

High

#### Scenario Description

This scenario verifies adding, editing, deleting and interacting with conversation starters for agents. Tests
include valid inputs, exceeding limits, multiple starters (max 4), UI interactions (full screen, copy,
collapse/expand), and validation for empty starters.

## Test Case ID: TC-03-01

#### Test Case Name:

Add Conversation Starter with Valid Values

#### Test Case Tags:

Smoke, Regression, functional testing, conversation-starter

#### Test Case Priority:

High

#### Test Case Description

Verify a conversation starter can be added by clicking the "+Starter" button and entering valid content.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for conversation starter setup:
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

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Click the **+ Starter** button
3. Enter a valid starter text (e.g., "Hello, please run the task")
4. Click **Save** button to confirm the starter entry

### Expected Results

- The **+ Starter** button is active and clickable
- A new conversation starter input field is displayed
- Text can be entered in the starter field
- The conversation starter is added and visible in the conversation starters list
- The starter is saved successfully when agent configuration is saved

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

## Test Case ID: TC-03-02

#### Test Case Name:

Add Conversation Starter with Exceeding Character Limit

#### Test Case Tags:

Regression, functional testing, negative, conversation-starter

#### Test Case Priority:

Medium

#### Test Case Description

Verify behavior when entering a starter that exceeds the maximum allowed characters.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for conversation starter setup:
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

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Click the **+ Starter** button
3. Enter a starter text that exceeds the configured maximum (e.g., 2348+ chars or product limit)
4. Attempt to save the starter by clicking **Save** button

### Expected Results

- The input is either rejected with validation error or truncated to the maximum allowed length
- If truncated, the saved value equals the truncated value
- An appropriate error message is displayed if the limit is exceeded
- No conversation starter is saved if validation fails

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-03-03

#### Test Case Name:

Add Multiple Conversation Starters (Max 4)

#### Test Case Tags:

Smoke, Regression, functional testing, conversation-starter

#### Test Case Priority:

High

#### Test Case Description

Verify that up to 4 conversation starters can be added successfully.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for conversation starter setup:
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

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Click **+ Starter** and add starter #1 with valid text (e.g., "What can you help me with?")
3. Click **+ Starter** and add starter #2 with valid text (e.g., "Show me your capabilities")
4. Click **+ Starter** and add starter #3 with valid text (e.g., "Help me get started")
5. Click **+ Starter** and add starter #4 with valid text (e.g., "What are your main features?")
6. Click **Save** button to save agent configuration

### Expected Results

- All four starters are successfully added
- Four starters appear in the starter list in the order added
- Each starter displays its text and available actions (delete, full screen, copy, collapse/expand)
- The configuration is saved successfully with all 4 starters
- Starters persist after saving the agent configuration

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-03-04

#### Test Case Name:

Prevent Adding More Than 4 Conversation Starters

#### Test Case Tags:

Regression, functional testing, negative, conversation-starter

#### Test Case Priority:

High

#### Test Case Description

Verify it is impossible to add more than 4 starters — "+ Starter" button becomes inactive and not clickable.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for conversation starter setup:
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

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Click **+ Starter** and add starter #1 with valid text (e.g., "Starter 1")
3. Click **+ Starter** and add starter #2 with valid text (e.g., "Starter 2")
4. Click **+ Starter** and add starter #3 with valid text (e.g., "Starter 3")
5. Click **+ Starter** and add starter #4 with valid text (e.g., "Starter 4")
6. Attempt to click **+ Starter** button again

### Expected Results

- The first 4 starters are added successfully
- After adding 4 starters, the **+ Starter** button is inactive and not clickable (disabled state visible)
- No additional starter entry can be created
- The button visually indicates it's disabled (grayed out or similar visual state)

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-03-05

#### Test Case Name:

Enlarge Conversation Starter to Full Screen View

#### Test Case Tags:

Regression, functional testing, conversation-starter, ui

#### Test Case Priority:

Medium

#### Test Case Description

Verify clicking "full screen" enlarges the starter editor to full-screen view.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with conversation starter:
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
   - Navigate to the **Conversation Starters** section
   - Click **+ Starter** and add starter with text "Test starter for full screen"

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Locate the created starter
3. Click the **full screen** (expand) button for that starter
4. Verify the full-screen editor functionality
5. Close the full-screen view

### Expected Results

- The **full screen** button is visible and clickable
- The starter editor opens in full-screen mode (modal or takeover view)
- The editor allows editing and shows actions (save/cancel)
- The full-screen view can be closed properly
- Changes can be made in full-screen mode

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-03-06

#### Test Case Name:

Copy Conversation Starter to Clipboard

#### Test Case Tags:

Regression, functional testing, conversation-starter, ui

#### Test Case Priority:

Medium

#### Test Case Description

Verify the "copy to clipboard" action copies the starter text.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with conversation starter:
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
   - Navigate to the **Conversation Starters** section
   - Click **+ Starter** and add starter with text "Test starter for copy"

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Locate the created starter
3. Click the **copy** button on the starter
4. Verify the copy functionality

### Expected Results

- The **copy** button is visible and clickable
- Starter text is copied to the system clipboard
- A transient message is displayed: "The content has been copied to the clipboard"
- The clipboard contains the exact starter text

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-03-07

#### Test Case Name:

Collapse Conversation Starter Field

#### Test Case Tags:

Regression, functional testing, conversation-starter, ui

#### Test Case Priority:

Low

#### Test Case Description

Verify collapsing a starter hides its content while keeping title/controls visible.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with conversation starter:
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
   - Navigate to the **Conversation Starters** section
   - Click **+ Starter** and add starter with text "Test starter for collapse"
   - Click expand button for conversation starter

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Locate the expanded starter
3. Click the **collapse** control
4. Verify the collapse functionality

### Expected Results

- The **collapse** button is visible and clickable when starter is expanded
- Starter body is collapsed and content is hidden
- Title and controls remain visible
- The starter can be identified even when collapsed

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-03-08

#### Test Case Name:

Expand Conversation Starter Field

#### Test Case Tags:

Regression, functional testing, conversation-starter, ui

#### Test Case Priority:

Low

#### Test Case Description

Verify expanding a collapsed starter reveals full content.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with collapsed conversation starter:
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
   - Navigate to the **Conversation Starters** section
   - Click **+ Starter** and add starter with text "Test starter for expand"
   - Click collapse button for conversation starter

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Locate the collapsed starter
3. Click the **expand** button
4. Verify the expand functionality

### Expected Results

- The **expand** button is visible and clickable when starter is collapsed
- Starter body is fully visible for reading/editing
- All starter content is displayed
- Edit functionality is available when expanded

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-03-09

#### Test Case Name:

Edit Conversation Starter

#### Test Case Tags:

Smoke, Regression, functional testing, conversation-starter

#### Test Case Priority:

High

#### Test Case Description

Verify editing an existing starter saves updated content.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with conversation starter:
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
   - Navigate to the **Conversation Starters** section
   - Click **+ Starter** and add starter with text "Original starter text"

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Locate the created starter
3. Click in conversation starter field and change the text to "Updated starter text"
4. Click **Save** button to save changes
5. Verify the changes are persisted

### Expected Results

- The starter field is editable and accepts input
- Text can be modified successfully
- Changes are saved when **Save** button is clicked
- Starter text is updated in UI and persisted after saving
- Updated content is visible after page refresh

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-03-10

#### Test Case Name:

Validate Empty Conversation Starter

#### Test Case Tags:

Regression, functional testing, negative, conversation-starter

#### Test Case Priority:

High

#### Test Case Description

Verify validation when a starter is left empty during edit.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with conversation starter:
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
   - Navigate to the **Conversation Starters** section
   - Click **+ Starter** and add starter with text "Original text"

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Locate the created starter
3. Clear the starter text (make it empty)
4. Attempt to save the changes by clicking **Save** button
5. Verify validation behavior

### Expected Results

- The starter field can be cleared
- Empty starter validation is triggered
- Appropriate error message is displayed
- Empty starter is not saved
- Original content is retained if save fails

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-03-11

#### Test Case Name:

Verify Empty Starters Show Limited Actions

#### Test Case Tags:

Regression, functional testing, conversation-starter, ui

#### Test Case Priority:

Medium

#### Test Case Description

Verify that for empty (unsaved/placeholder) starters only the "full screen view" button is displayed and other
actions are hidden/disabled.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent:
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
   - Navigate to the **Conversation Starters** section
   - Click **+ Starter** to create an empty starter placeholder

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Locate the empty starter row/placeholder
3. Inspect visible action buttons for that starter
4. Verify which actions are available vs. disabled/hidden

### Expected Results

- Only the **full screen view** button is visible for the empty starter
- Other actions (copy, edit inline, delete) are hidden or disabled until the starter has content
- The UI clearly indicates which actions are available for empty starters
- Buttons are properly styled to show their disabled/unavailable state

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-03-12

#### Test Case Name:

Delete Conversation Starter

#### Test Case Tags:

Smoke, Regression, functional testing, conversation-starter

#### Test Case Priority:

High

#### Test Case Description

Verify deleting a starter removes it from the list and persists after save.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with conversation starter:
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
   - Navigate to the **Conversation Starters** section
   - Click **+ Starter** and add starter with text "Starter to be deleted"

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Locate the created starter
3. Click the **Delete** button near the conversation starter
4. Confirm deletion if prompted
5. Click **Save** button to save agent configuration
6. Verify the deletion is persisted

### Expected Results

- The **Delete** button is visible and clickable
- Starter is immediately removed from the UI list
- After saving agent configuration, starter remains deleted
- After refresh or reopen, starter is permanently deleted
- No traces of the deleted starter remain in the configuration

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-03-13

#### Test Case Name:

Save Empty Conversation Starter

#### Test Case Tags:

Regression, functional testing, conversation-starter, validation

#### Test Case Priority:

Medium

#### Test Case Description

Verify that the system allows saving an empty conversation starter and handles it appropriately without
validation errors.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent:
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

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Click the **+ Starter** button to create a new starter
3. Leave the starter text field completely empty (do not enter any text)
4. Click the **Save** button
5. Observe the system response and any messages displayed
6. Verify the empty starter appears in the conversation starters list

### Expected Results

- The system accepts the empty starter without validation errors
- A success message is displayed indicating the starter was saved
- The empty starter appears in the conversation starters list
- The empty starter can be identified (possibly with placeholder text or special styling)
- The system maintains the empty starter in the agent's configuration
- No error messages or validation warnings are displayed

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-03-14

#### Test Case Name:

Test Conversation Starter with Special Characters

#### Test Case Tags:

Regression, functional testing, conversation-starter, validation, unicode

#### Test Case Priority:

Medium

#### Test Case Description

Verify that conversation starters accept special characters, emojis, and Unicode text without issues and
display correctly in the interface.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent:
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

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Click the **+ Starter** button to create a new starter
3. Enter text with special characters: "Hello! 🚀 What's your question? @#$%^&\*()[]{}|;:',.<>?/~`"
4. Click the **Save** button
5. Verify the starter is saved successfully
6. Create another starter with Unicode text: "Здравствуйте! こんにちは 你好 🌟✨🎯"
7. Click the **Save** button
8. Verify both starters display correctly in the list
9. Click on each starter to expand and verify text renders properly

### Expected Results

- System accepts special characters without validation errors
- Emojis and Unicode characters are properly saved and displayed
- Text rendering is correct in both collapsed and expanded views
- No character encoding issues or display corruption occurs
- Success messages appear for both saves
- All special characters remain intact after save/reload

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-03-15

#### Test Case Name:

Test Conversation Starter Usage in Chat

#### Test Case Tags:

Integration, functional testing, conversation-starter, chat, end-to-end

#### Test Case Priority:

High

#### Test Case Description

Verify that conversation starters appear and function correctly in the chat interface when interacting with
the agent.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent:
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
   - Add 2-3 conversation starters with distinct text
   - Save the agent configuration

### Test Steps

1. Navigate to the chat interface for the created agent
2. Verify that conversation starters are displayed in the chat interface
3. Click on the first conversation starter
4. Verify the starter text appears in the chat input field
5. Send the message and verify agent responds appropriately
6. Clear the chat or start a new conversation
7. Click on a different conversation starter
8. Verify it also functions correctly
9. Test clicking multiple starters in sequence

### Expected Results

- Conversation starters are visible in the chat interface
- Clicking a starter populates the chat input with the starter text
- Starters are properly formatted and styled in the chat UI
- All configured starters appear and are clickable
- Agent responds appropriately to starter messages
- Multiple starters work independently
- UI remains responsive during starter interactions

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-03-16

#### Test Case Name:

Test Conversation Starter Order/Sequence

#### Test Case Tags:

Functional testing, conversation-starter, ui, ordering

#### Test Case Priority:

Low

#### Test Case Description

Verify that conversation starters maintain their display order and can be reordered if the functionality is
supported by the system.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent:
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

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Create 4 conversation starters with distinct, numbered text:
   - "First starter"
   - "Second starter"
   - "Third starter"
   - "Fourth starter"
3. Note the order in which they appear in the list
4. Save the agent configuration
5. Refresh the page or navigate away and back
6. Verify the starters maintain their original order
7. If drag-and-drop reordering is available, test reordering functionality
8. If reordering buttons exist, test moving starters up/down

### Expected Results

- Starters display in the order they were created
- Order persists after page refresh or navigation
- If reordering is supported, drag-and-drop works smoothly
- If reorder buttons exist, they function correctly
- Order changes are saved and persist
- Visual indicators show the current order (if applicable)
- No UI glitches occur during reordering operations

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-03-17

#### Test Case Name:

Test Undo/Redo for Conversation Starter Changes

#### Test Case Tags:

Functional testing, conversation-starter, undo-redo, user-experience

#### Test Case Priority:

Low

#### Test Case Description

Verify undo/redo functionality when editing conversation starters, if such functionality is available in the
system.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent:
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

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Create a conversation starter with text "Original starter text"
3. Save the starter
4. Edit the starter to change text to "Modified starter text"
5. Test keyboard shortcuts for undo (Ctrl+Z) if available
6. Test undo button/menu option if available in the UI
7. Verify the text reverts to "Original starter text"
8. Test redo functionality (Ctrl+Y) if available
9. Verify the text changes back to "Modified starter text"
10. Test multiple undo/redo operations in sequence

### Expected Results

- If undo/redo is supported, Ctrl+Z undoes the last change
- If undo/redo is supported, Ctrl+Y redoes the undone change
- UI undo/redo buttons function correctly (if present)
- Multiple undo operations work in reverse chronological order
- Redo functionality restores previously undone changes
- Undo/redo state is maintained during the editing session
- If not supported, keyboard shortcuts have no unexpected effects

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-03-18

#### Test Case Name:

Test Conversation Starter with Very Long Text

#### Test Case Tags:

Performance, functional testing, conversation-starter, validation, boundary-testing

#### Test Case Priority:

Medium

#### Test Case Description

Test performance and display behavior when creating conversation starters with maximum allowed character
length to validate UI layout and system performance.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent:
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

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Click the **+ Starter** button to create a new starter
3. Enter a very long text (close to maximum character limit if known, or approximately 1000+ characters)
4. Monitor system performance during text entry
5. Click the **Save** button
6. Verify the save operation completes successfully
7. Check how the long text is displayed in the collapsed view
8. Expand the starter to view full text
9. Verify text truncation and "show more/less" functionality if available
10. Test scrolling behavior within the expanded starter view

### Expected Results

- System handles long text input without performance degradation
- Character count indicator works correctly (if present)
- Text is saved completely without truncation
- Collapsed view shows appropriate preview (truncated with ellipsis)
- Expanded view displays full text with proper formatting
- UI layout remains intact and doesn't break with long content
- Scrolling works smoothly within text areas
- Save operation completes within reasonable time
- No memory leaks or browser performance issues occur

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-03-19

#### Test Case Name:

Test Conversation Starter Persistence After Agent Restart

#### Test Case Tags:

Integration, functional testing, conversation-starter, persistence, data-integrity

#### Test Case Priority:

Medium

#### Test Case Description

Verify that conversation starters persist correctly after closing and reopening the agent, ensuring data
integrity and proper storage.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent:
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

### Test Steps

1. Navigate to the **Conversation Starters** section
2. Create 3 conversation starters with distinct content:
   - "Starter 1: How can you help me today?"
   - "Starter 2: What are your capabilities?"
   - "Starter 3: Can you explain this topic in detail?"
3. Save each starter individually
4. Verify all 3 starters appear in the list
5. Navigate away from the agent (go to Agents list)
6. Close the browser tab or navigate to a different page
7. Reopen the browser/tab and log in again
8. Navigate back to the same agent
9. Open the **Configuration** tab
10. Verify all conversation starters are still present and unchanged

### Expected Results

- All 3 conversation starters persist after browser restart
- Starter content remains exactly as entered (no data corruption)
- Starter order is maintained after restart
- No duplicate starters are created during restart
- All starter functionality remains intact after restart
- No errors occur when accessing persisted starters
- Data consistency is maintained across sessions

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-
