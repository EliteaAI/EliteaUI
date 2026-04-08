# Scenario ID: CANVAS-004-4

#### Scenario Name:

Toolkit integration and management in agent creation

#### Scenario Tags:

chat,canvas,agent,toolkit,integration,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the toolkit integration and management functionality during agent creation via the
canvas interface. It covers accessing toolkit configuration options, adding toolkits to agents, managing
individual toolkit tools, and removing toolkits from agent configurations.

## Test Case ID: AG-011

#### Test Case Name:

Verify TOOLKITS section functionality

#### Test Case Tags:

chat,canvas,agent,create,regression

#### Test Case Priority:

High

#### Test Case Description

Verify the complete functionality of the TOOLKITS section during agent creation, including testing all toolkit
buttons (+ Toolkit, + Agent, + MCP, + Pipeline) and the Allow attachments toggle. This test validates that
users can access and interact with all toolkit configuration options available in the agent creation
interface.

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
6. Locate the **TOOLKITS** section
7. Test **+ Toolkit** button:
   - Click the **+ Toolkit** button
8. Test **+ MCP** button:
   - Click the **+ MCP** button
9. Test **+ Agent** button:
   - Click the **+ Agent** button
10. Test **+ Pipeline** button:
    - Click the **+ Pipeline** button

### Expected Results

- **TOOLKITS** section is visible and accessible in the agent creation interface
- **+ Toolkit** button:
  - Button is clickable and opens toolkit selection interface
  - Dropdown/selection interface displays:
    - Search field for filtering toolkits (functional search)
    - **+ Create new** button for creating new toolkits
    - List of available toolkits
  - User can browse, search, and select from available toolkit options
  - Selected toolkit appears in the TOOLKITS section
- **+ MCP** button:
  - Button is clickable and opens MCP selection interface
  - Dropdown/selection interface displays:
    - Search field for filtering MCP options (functional search)
    - **+ Create new** button for creating new MCP connections
    - List of available MCP options
  - User can browse, search, and select from available MCP choices
  - Selected MCP appears in the TOOLKITS section
- **+ Agent** button:
  - Button is clickable and opens agent selection interface
  - Dropdown/selection interface displays:
    - Search field for filtering agents (functional search)
    - List of available agents
  - User can browse, search, and select from available agent options
  - Selected agent appears in the TOOLKITS section
- **+ Pipeline** button:
  - Button is clickable and opens pipeline selection interface
  - Dropdown/selection interface displays:
    - Search field for filtering pipelines (functional search)
    - List of available pipelines
  - User can browse, search, and select from available pipeline options
  - Selected pipeline appears in the TOOLKITS section

### Postconditions

1. Click the **X** (close) button or **Discard** to close the canvas interface
2. Verify the canvas is dismissed and returns to chat view
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: AG-013

#### Test Case Name:

Create an agent using canvas and add a toolkit

#### Test Case Tags:

chat,canvas,agent,create,smoke,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can create a complete agent using the canvas interface and successfully add a toolkit to
enhance the agent's capabilities. This test covers the full agent creation workflow including basic
configuration and toolkit integration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. At least one toolkit is available in the system for selection (e.g., "UI Testing Toolkit")

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Agents**
3. Click on the **Create new agent** button
4. In the **GENERAL** section:
   - Enter a name in the **Name\*** field (e.g., "Toolkit Test Agent")
   - Enter a description in the **Description\*** field (e.g., "Agent with toolkit integration")
5. Click **Save** button to proceed to the toolkit configuration interface
6. In the **TOOLKITS** section:
   - Click the **+ Toolkit** button
   - Select "UI Testing Toolkit" from the available options
7. Click **X** to close canvas interface
8. Verify the agent appears in the **PARTICIPANTS** section under **Agents**
9. Hover the mouse cursor over the "Toolkit Test Agent" card
10. Click on the pencil (edit) icon that appears during hover
11. Verify the **TOOLKITS** section shows "UI Testing Toolkit" has been added
12. Click **X** to close the edit canvas without making changes

### Expected Results

- Clicking **+ Toolkit** opens a selection interface showing available toolkits
- "UI Testing Toolkit" is selected successfully and added to the agent configuration
- Selected toolkit appears in the agent's toolkit list with proper status indicators
- Newly created agent "Toolkit Test Agent" appears in the **PARTICIPANTS** sidebar
- When opening agent edit mode (steps 9-11):
  - The pencil (edit) icon appears on hover
  - Edit canvas opens with all existing configuration pre-populated
  - **TOOLKITS** section displays "UI Testing Toolkit" as an added toolkit

### Postconditions

1. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **Toolkit Test Agent** and click on the **3 dots** (ellipsis menu) under the
     Actions column
   - Click Delete from the contextual menu
   - Enter **Toolkit Test Agent** in the Name input field and click **Delete** on the confirmation dialog
   - Verify that the agent named **Toolkit Test Agent** is not available in the agents list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates complete agent creation workflow with toolkit integration
- Verifies toolkit selection and configuration functionality
- Ensures agent-toolkit integration works correctly in chat interface
- Tests both agent creation and toolkit management capabilities

## Test Case ID: AG-014

#### Test Case Name:

Manage nested toolkit tools

#### Test Case Tags:

chat,canvas,agent,modify,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can manage individual tools within a toolkit after adding it to an agent. This test covers
accessing nested toolkit tools, enabling/disabling specific tools, and configuring tool-specific settings
within the agent's toolkit configuration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. At least one toolkit is available in the system for selection (e.g., "UI Testing Toolkit")
6. Navigate to the **Chat** page (sidebar or main menu)
7. In the **PARTICIPANTS** section, locate **Agents**
8. Click on the **Create new agent** button
9. In the **GENERAL** section:
   - Enter a name in the **Name\*** field (e.g., "Toolkit Test Agent")
   - Enter a description in the **Description\*** field (e.g., "Agent with toolkit integration")
10. Click **Save** button
11. Click the **+ Toolkit** button the **TOOLKITS** section
    - Select "UI Testing Toolkit" from the available options
12. Click **X** to close canvas interface

### Test Steps

1. Click on the pencil (edit) icon that appears during hover
2. Navigate to the **TOOLKITS** section in the edit canvas
3. Locate the "UI Testing Toolkit" that was previously added
4. Click on the **Show tools** button on the "UI Testing Toolkit" card
5. Review the list of individual tools available within the toolkit that are displayed
6. Select/deselect specific tools within the toolkit:
   - Click on "Index data" to deselect it
   - Click on "Remove index" to deselect it
7. Click **Save** to apply all toolkit tool changes
8. Click **X** to close the edit canvas

### Expected Results

- Clicking on the **Show tools** button reveals the individual tools within the toolkit
- Individual tools within the toolkit are displayed as clickable items with visual indicators showing their
  current status (selected/unselected)
- Users can successfully select/deselect individual tools by clicking on their names
- Selected tools appear with visual confirmation (e.g., checkmarks, highlighting,)
- Unselected tools appear grayed out with no check mark indicating they are not active

### Postconditions

1. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **Toolkit Test Agent** and click on the **3 dots** (ellipsis menu) under the
     Actions column
   - Click Delete from the contextual menu
   - Enter **Toolkit Test Agent** in the Name input field and click **Delete** on the confirmation dialog
   - Verify that the agent named **Toolkit Test Agent** is not available in the agents list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates granular control over individual tools within toolkits
- Verifies tool configuration and persistence functionality
- Ensures users can customize toolkit behavior at the tool level
- Tests both tool selection and configuration management capabilities

## Test Case ID: AG-015

#### Test Case Name:

Remove toolkit from agent

#### Test Case Tags:

chat,canvas,agent,modify,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can remove a toolkit from an agent after it has been added. This test covers accessing the
toolkit removal functionality, confirming the removal process, and ensuring the toolkit is properly removed
from the agent configuration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list, agent.update
6. At least one toolkit is available in the system for selection (e.g., "UI Testing Toolkit")
7. Complete agent creation with toolkit (steps from AG-013):
   - Navigate to the **Chat** page (sidebar or main menu)
   - In the **PARTICIPANTS** section, locate **Agents**
   - Click on the **Create new agent** button
   - In the **GENERAL** section:
     - Enter a name in the **Name\*** field (e.g., "Toolkit Removal Test Agent")
     - Enter a description in the **Description\*** field (e.g., "Agent for testing toolkit removal")
   - Click **Save** button to proceed to the toolkit configuration interface
   - In the **TOOLKITS** section:
     - Click the **+ Toolkit** button
     - Select "UI Testing Toolkit" from the available options
   - Click **X** to close canvas interface
   - Verify the agent appears in the **PARTICIPANTS** section under **Agents**
   - Hover the mouse cursor over the "Toolkit Removal Test Agent" card

### Test Steps

1. Click on the pencil (edit) icon that appears during hover
2. Navigate to the **TOOLKITS** section in the edit canvas
3. Locate the "UI Testing Toolkit" that was previously added
4. Hover the mouse cursor over the "UI Testing Toolkit" card
5. Verify the **Remove toolkit** button (trash icon) appears during hover
6. Click on the **Remove toolkit** button (trash icon) that appears during hover
7. In the "Remove toolkit?" confirmation dialog:
   - Click **Cancel** to test cancellation of removal
8. Click on the **Remove toolkit** button (trash icon) again
9. In the "Remove toolkit?" confirmation dialog, click **Remove** to confirm the removal
10. Verify that the "UI Testing Toolkit" is no longer displayed in the **TOOLKITS** section
11. Click **X** to close the edit canvas

### Expected Results

- When hovering over the toolkit card, the **Remove toolkit** button (trash icon) becomes visible
- **Remove toolkit** button (trash icon) is clickable when visible during hover
- Clicking **Remove toolkit** (trash icon) opens a confirmation dialog with:
  - Title: "Remove toolkit?"
  - Message: "Are you sure to remove the [toolkit name] toolkit?" (showing actual toolkit name)
  - **Cancel** button to abort the removal
  - **Remove** button to confirm deletion
- When clicking **Cancel** (step 7):
  - Dialog closes without removing the toolkit
  - Toolkit remains in the **TOOLKITS** section
  - No changes are made to the agent configuration
- When clicking **Remove** (step 9):
  - Dialog closes immediately
  - Toolkit is removed from the **TOOLKITS** section
- After removal, the toolkit is immediately removed from the **TOOLKITS** section
- The **TOOLKITS** section shows the empty state or only the add buttons (+ Toolkit, + MCP, + Agent, +
  Pipeline)

### Postconditions

1. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **Toolkit Removal Test Agent** and click on the **3 dots** (ellipsis menu) under
     the Actions column
   - Click Delete from the contextual menu
   - Enter **Toolkit Removal Test Agent** in the Name input field and click **Delete** on the confirmation
     dialog
   - Verify that the agent named **Toolkit Removal Test Agent** is not available in the agents list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates toolkit removal functionality in agent configuration
- Verifies proper cleanup and persistence after toolkit removal
- Ensures agent remains functional after toolkit removal
- Tests both UI interaction and data persistence for toolkit management
