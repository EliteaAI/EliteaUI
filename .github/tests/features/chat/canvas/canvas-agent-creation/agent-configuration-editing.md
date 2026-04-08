# Scenario ID: CANVAS-004-3

#### Scenario Name:

Agent configuration and editing via canvas

#### Scenario Tags:

chat,canvas,agent,modify,configuration,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the agent configuration and editing functionality via the canvas interface. It covers
accessing edit mode, configuring LLM models and settings, and managing agent lifecycle through the
PARTICIPANTS section including agent removal operations.

## Test Case ID: AG-007

#### Test Case Name:

Access agent edit mode via canvas

#### Test Case Tags:

chat,canvas,agent,modify,smoke,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can access agent edit mode by hovering over an existing agent card in the PARTICIPANTS
section and clicking the pencil (edit) icon that appears. This test validates the hover interaction and edit
mode access functionality.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list, agent.update
6. A test agent exists in the system (complete creation flow):
   - Navigate to the **Chat** page (sidebar or main menu)
   - In the **PARTICIPANTS** section, locate **Agents**
   - Click on the **Create new agent** button
   - In the **GENERAL** section:
     - Enter a name in the **Name\*** field: "Test Agent"
     - Enter a description in the **Description\*** field: "Test agent for validation"
   - Click **Save** button to proceed to the next interface
   - Click **X** button to close the canvas interface
   - Confirm agent appears in PARTICIPANTS sidebar under **Agents** section

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Agents**
3. Find the "Test Agent" in the agents list
4. Hover the mouse cursor over the "Test Agent" card
5. Locate the pencil (edit) icon that appears during hover
6. Click on the pencil (edit) icon
7. Edit the agent configuration (e.g., add "You are a helpful AI assistant" in the INSTRUCTIONS)
8. Click **Save** button
9. Hover the mouse cursor over the "Test Agent" card
10. Click on the pencil (edit) icon that appears during hover
11. Verify all configured data is properly displayed in edit mode
12. Click **Discard** to close the edit canvas without making changes

### Expected Results

- When hovering over the agent card, the pencil (edit) icon becomes visible
- Clicking the pencil icon opens the agent edit canvas interface
- The canvas opens with all existing agent configuration pre-populated:
  - **LLM Model and Settings** section with current model selection
  - **GENERAL** section shows current name "Test Agent", description, and tags
  - **INSTRUCTIONS** section shows current guidelines text
  - **WELCOME MESSAGE** section shows current message
  - **TOOLKITS** section displays:
    - **+ Toolkit** button for adding toolkits
    - **+ MCP** button for adding MCP connections
    - **+ Agent** button for adding agent integrations
    - **+ Pipeline** button for adding pipeline configurations
    - **Allow attachments** toggle switch
  - **CONVERSATION STARTERS** section shows any existing starters
  - **ADVANCED** section shows current step limit
- All sections are editable and maintain the same functionality as creation mode
- After saving changes (step 8), modifications are successfully applied
- When reopening agent edit mode (steps 9-12):
  - The pencil (edit) icon appears again on hover
  - Edit canvas opens with updated configuration
  - **INSTRUCTIONS** section shows the newly added text "You are a helpful AI assistant"
  - All previously entered data remains intact and properly displayed
  - Changes made in the previous edit session are preserved and visible

### Postconditions

1. Click **Discard** to close the edit canvas without making changes
2. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **Test Agent** and click on the **3 dots** (ellipsis menu) under the Actions
     column
   - Click Delete from the contextual menu
   - Enter **Test Agent** in the Name input field and click **Delete** on the confirmation dialog
   - Verify that the agent named **Test Agent** is not available in the agents list
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates hover interaction functionality for agent cards
- Ensures edit mode access via UI hover controls
- Verifies seamless transition from agent list to edit mode
- Requires existing agent from AG-003 as precondition

## Test Case ID: AG-008

#### Test Case Name:

Configure LLM model and settings during agent creation

#### Test Case Tags:

chat,canvas,agent,create,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can select different LLM models and configure model settings (temperature, top P, max
completion tokens) via the canvas interface during agent creation. This test validates the model selection
dropdown and the model settings dialog functionality.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list, agent.update

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Agents**
3. Click on the **Create new agent** button
4. Configure General agent information:
   - Enter **Name**: "Model Settings Test Agent"
   - Enter **Description**: "Agent for testing model configuration"
5. Click **Save**
6. Locate the **Select LLM Model** button at the top of the form
7. Click on the **Select LLM Model** button
8. Select a different model from the dropdown (e.g., "gpt-4o-mini")
9. Locate and click the **Model Settings** button (gear icon)
10. Adjust the **Temperature** slider to 0.1
11. Adjust the **Top P** slider to 0.2
12. Modify **Max Completion Tokens** to 4096
13. Click **Apply** button to save the settings
14. Click **Save** to create the agent
15. In the **PARTICIPANTS** section under **Agents**, locate the newly created "Model Settings Test Agent"
16. Hover the mouse cursor over the "Model Settings Test Agent" card
17. Click on the pencil (edit) icon that appears during hover
18. Click on the **Model Settings** button (gear icon) to open settings dialog
19. Click **Cancel** to close the model settings dialog
20. Click **Discard** to close the edit canvas without making changes

### Expected Results

- Canvas is closed and the Agent is added to the PARTICIPANTS Sidebar under Agent section with the selected
  LLM model and settings
- Model selection and configuration works correctly
- Agent is created successfully with custom model settings
- When opening agent edit mode (steps 15-20):
  - The pencil (edit) icon appears on hover
  - Edit canvas opens with all existing configuration pre-populated
  - **Select LLM Model** button displays the selected model "gpt-4o-mini"
  - **Model Settings** When opening Model Settings dialog (gear icon)
    - **Temperature** slider shows the configured value of 0.1
    - **Top P** slider shows the configured value of 0.2
    - **Max Completion Tokens** field shows the configured value of 4096

### Postconditions

1. Click **Discard** to close the edit canvas without making changes
2. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **Model Settings Test Agent** and click on the **3 dots** (ellipsis menu) under
     the Actions column
   - Click Delete from the contextual menu
   - Enter **Test Agent** in the Name input field and click **Delete** on the confirmation dialog
   - Verify that the agent named **Model Settings Test Agent** is not available in the agents list
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates LLM model selection and configuration capabilities

## Test Case ID: AG-012

#### Test Case Name:

Remove created agent from PARTICIPANTS section

#### Test Case Tags:

chat,canvas,agent,modify,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can remove a created agent from the PARTICIPANTS section using the remove/delete
functionality. This test validates the agent removal workflow including confirmation dialog and proper cleanup
of agent data.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list, agent.delete
6. A test agent exists in the system (complete creation flow):
   - Navigate to the **Chat** page (sidebar or main menu)
   - In the **PARTICIPANTS** section, locate **Agents**
   - Click on the **Create new agent** button
   - In the **GENERAL** section:
     - Enter a name in the **Name\*** field: "Agent To Remove"
     - Enter a description in the **Description\*** field: "Test agent for removal validation"
   - Click **Save** button to proceed to the next interface
   - Click **X** button to close the canvas interface
   - Confirm agent appears in PARTICIPANTS sidebar under **Agents** section

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Agents**
3. Find the "Agent To Remove" in the agents list
4. Hover the mouse cursor over the "Agent To Remove" card
5. Locate the remove/delete icon (trash can) that appears during hover
6. Click on the remove/delete icon
7. In the "Remove agent?" confirmation dialog:
   - Read the confirmation message "Are you sure to remove the [agent name] agent?"
   - Click **Cancel** to test cancellation
8. Hover the mouse cursor over the "Agent To Remove" card again
9. Click the remove/delete icon that appears during hover
10. In the "Remove agent?" confirmation dialog:
    - Click **Remove** to confirm deletion
11. Verify the agent is removed from the PARTICIPANTS section

### Expected Results

- When hovering over the agent card, the remove/delete icon (trash can) becomes visible
- Remove/delete icon is clickable when visible during hover
- Clicking the remove icon opens a confirmation dialog with:
  - Title: "Remove agent?"
  - Message: "Are you sure to remove the [agent name] agent?" (showing actual agent name)
  - **Cancel** button to abort the removal
  - **Remove** button to confirm deletion
- When clicking **Cancel** (step 7):
  - Dialog closes without removing the agent
  - Agent remains in the PARTICIPANTS section
  - No changes are made to the agent data
- When clicking **Remove** (step 10):
  - Dialog closes immediately
  - Agent is removed from the PARTICIPANTS section
  - Agent no longer appears in the agents list
  - Agent data is properly deleted from the system
- Removal process completes without errors
- UI updates correctly to reflect the removed agent

### Postconditions

1. Click **Discard** to close the edit canvas without making changes
2. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **Agent To Remove** and click on the **3 dots** (ellipsis menu) under the
     Actions column
   - Click Delete from the contextual menu
   - Enter **Test Agent** in the Name input field and click **Delete** on the confirmation dialog
   - Verify that the agent named **Agent To Remove** is not available in the agents list
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes
