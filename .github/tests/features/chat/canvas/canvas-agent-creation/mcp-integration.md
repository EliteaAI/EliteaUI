# Scenario ID: CANVAS-004-5

#### Scenario Name:

MCP integration and management in agent creation

#### Scenario Tags:

chat,canvas,agent,mcp,integration,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the Model Context Protocol (MCP) integration and management functionality during agent
creation via the canvas interface. It covers adding MCP connections to agents, managing individual MCP tools,
and removing MCP integrations from agent configurations.

## Test Case ID: AG-016

#### Test Case Name:

Create an agent using canvas and add an MCP as a Toolkit

#### Test Case Tags:

chat,canvas,agent,create,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can create a complete agent using the canvas interface and successfully add an MCP (Model
Context Protocol) connection to enhance the agent's capabilities. This test covers the full agent creation
workflow including basic configuration and MCP integration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list, agent.update
6. At least one MCP connection is available in the system for selection (e.g., "MCP UI Testing")

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Agents**
3. Click on the **Create new agent** button
4. In the **GENERAL** section:
   - Enter a name in the **Name\*** field (e.g., "MCP Test Agent")
   - Enter a description in the **Description\*** field (e.g., "Agent with MCP integration")
5. Click **Save** button to proceed to the MCP configuration interface
6. In the **TOOLKITS** section:
   - Click the **+ MCP** button
   - Select "MCP UI Testing" from the available options
7. Click **X** to close canvas interface
8. Verify the agent appears in the **PARTICIPANTS** section under **Agents**
9. Hover the mouse cursor over the "MCP Test Agent" card
10. Click on the pencil (edit) icon that appears during hover
11. Verify the **TOOLKITS** section shows "MCP UI Testing" has been added
12. Click **X** to close the edit canvas without making changes

### Expected Results

- Clicking **+ MCP** opens a selection interface showing available MCP connections
- "MCP UI Testing" is selected successfully and added to the agent configuration
- Selected MCP appears in the agent's toolkit list with proper status indicators
- Newly created agent "MCP Test Agent" appears in the **PARTICIPANTS** sidebar
- When opening agent edit mode (steps 9-11):
  - The pencil (edit) icon appears on hover
  - Edit canvas opens with all existing configuration pre-populated
  - **TOOLKITS** section displays "MCP UI Testing" as an added MCP

### Postconditions

1. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **MCP Test Agent** and click on the **3 dots** (ellipsis menu) under the Actions
     column
   - Click Delete from the contextual menu
   - Enter **MCP Test Agent** in the Name input field and click **Delete** on the confirmation dialog
   - Verify that the agent named **MCP Test Agent** is not available in the agents list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates complete agent creation workflow with MCP integration
- Verifies MCP selection and configuration functionality
- Ensures agent-MCP integration works correctly in chat interface
- Tests both agent creation and MCP management capabilities

## Test Case ID: AG-017

#### Test Case Name:

Manage nested MCP tools

#### Test Case Tags:

chat,canvas,agent,modify,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can manage individual tools within an MCP after adding it to an agent. This test covers
accessing nested MCP tools, enabling/disabling specific tools, and configuring tool-specific settings within
the agent's MCP configuration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list, agent.update
6. At least one MCP connection is available in the system for selection (e.g., "MCP UI Testing")
7. Complete agent creation with MCP (steps from AG-016):
   - Navigate to the **Chat** page (sidebar or main menu)
   - In the **PARTICIPANTS** section, locate **Agents**
   - Click on the **Create new agent** button
   - In the **GENERAL** section:
     - Enter a name in the **Name\*** field (e.g., "MCP Test Agent")
     - Enter a description in the **Description\*** field (e.g., "Agent with MCP integration")
   - Click **Save** button to proceed to the MCP configuration interface
   - In the **TOOLKITS** section:
     - Click the **+ MCP** button
     - Select "MCP UI Testing" from the available options
   - Click **X** to close canvas interface
   - Verify the agent appears in the **PARTICIPANTS** section under **Agents**
   - Hover the mouse cursor over the "MCP Test Agent" card

### Test Steps

1. Click on the pencil (edit) icon that appears during hover
2. Navigate to the **TOOLKITS** section in the edit canvas
3. Locate the "MCP UI Testing" that was previously added
4. Click on the **Show tools** button on the "MCP UI Testing" card
5. Review the list of individual tools available within the MCP that are displayed
6. Select/deselect specific tools within the toolkit:
   - Click on "Index data" to deselect it
   - Click on "Remove index" to deselect it
7. Click **Save** to apply all MCP tool changes
8. Click **X** to close the edit canvas

### Expected Results

- Clicking on the **Show tools** button reveals the individual tools within the MCP
- Individual tools within the MCP are displayed as clickable items with visual indicators showing their
  current status (selected/unselected)
- Users can successfully select/deselect individual tools by clicking on their names
- Selected tools appear with visual confirmation (e.g., checkmarks, highlighting)
- Unselected tools appear grayed out with no check mark indicating they are not active
- Tools with configuration options allow modification of their parameters
- Tool settings are properly saved when clicking **Save**

### Postconditions

1. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **MCP Test Agent** and click on the **3 dots** (ellipsis menu) under the Actions
     column
   - Click Delete from the contextual menu
   - Enter **MCP Test Agent** in the Name input field and click **Delete** on the confirmation dialog
   - Verify that the agent named **MCP Test Agent** is not available in the agents list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates granular control over individual tools within MCPs
- Verifies tool configuration and persistence functionality
- Ensures users can customize MCP behavior at the tool level
- Tests both tool selection and configuration management capabilities

## Test Case ID: AG-018

#### Test Case Name:

Remove MCP from agent

#### Test Case Tags:

chat,canvas,agent,modify,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can remove an MCP from an agent after it has been added. This test covers accessing the MCP
removal functionality, confirming the removal process, and ensuring the MCP is properly removed from the agent
configuration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list, agent.update
6. At least one MCP connection is available in the system for selection (e.g., "MCP UI Testing")
7. Complete agent creation with MCP (steps from AG-016):
   - Navigate to the **Chat** page (sidebar or main menu)
   - In the **PARTICIPANTS** section, locate **Agents**
   - Click on the **Create new agent** button
   - In the **GENERAL** section:
     - Enter a name in the **Name\*** field (e.g., "MCP Removal Test Agent")
     - Enter a description in the **Description\*** field (e.g., "Agent for testing MCP removal")
   - Click **Save** button to proceed to the MCP configuration interface
   - In the **TOOLKITS** section:
     - Click the **+ MCP** button
     - Select "MCP UI Testing" from the available options
   - Click **X** to close canvas interface
   - Verify the agent appears in the **PARTICIPANTS** section under **Agents**
   - Hover the mouse cursor over the "MCP Removal Test Agent" card

### Test Steps

1. Click on the pencil (edit) icon that appears during hover
2. Navigate to the **TOOLKITS** section in the edit canvas
3. Locate the "MCP UI Testing" that was previously added
4. Hover the mouse cursor over the "MCP UI Testing" card
5. Verify the **Remove** button (trash icon) appears during hover
6. Click on the **Remove** button (trash icon) that appears during hover
7. In the "Remove toolkit?" confirmation dialog:
   - Verify the dialog title is "Remove toolkit?"
   - Verify the dialog message shows "Are you sure to remove the "MCP UI Testing" toolkit?"
   - Click **Cancel** to test cancellation of removal
8. Click on the **Remove** button (trash icon) again
9. In the "Remove toolkit?" confirmation dialog, click **Remove** to confirm the removal
10. Verify that the "MCP UI Testing" is no longer displayed in the **TOOLKITS** section
11. Click **X** to close the edit canvas

### Expected Results

- When hovering over the MCP card, the **Remove** button (trash icon) becomes visible
- Clicking **Remove** (trash icon) opens a confirmation dialog with:
  - Title: "Remove toolkit?"
  - Message: "Are you sure to remove the MCP UI Testing" toolkit?"
  - **Cancel** button to abort the removal
  - **Remove** button to confirm deletion
- When clicking **Cancel** (step 7):
  - Dialog closes without removing the MCP
  - MCP remains in the **TOOLKITS** section
  - No changes are made to the agent configuration
- When clicking **Remove** (step 9):
  - Dialog closes immediately
  - MCP is removed from the **TOOLKITS** section
- After removal, the MCP is immediately removed from the **TOOLKITS** section
- The **TOOLKITS** section shows the empty state or only the add buttons (+ Toolkit, + MCP, + Agent, +
  Pipeline)

### Postconditions

1. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **MCP Removal Test Agent** and click on the **3 dots** (ellipsis menu) under the
     Actions column
   - Click Delete from the contextual menu
   - Enter **MCP Removal Test Agent** in the Name input field and click **Delete** on the confirmation dialog
   - Verify that the agent named **MCP Removal Test Agent** is not available in the agents list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates MCP removal functionality in agent configuration
