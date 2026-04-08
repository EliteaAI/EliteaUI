# Scenario ID: CANVAS-004-6

#### Scenario Name:

Advanced integrations - nested agents and pipelines in canvas agent creation

#### Scenario Tags:

chat,canvas,agent,nested,pipeline,integration,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the advanced integration functionality during agent creation via the canvas interface,
focusing on nested agent and pipeline integrations. It covers adding nested agents and pipelines to main
agents, managing version configurations, and removing advanced integrations from agent configurations.

## Test Case ID: AG-019

#### Test Case Name:

Create an agent using canvas and add a nested agent

#### Test Case Tags:

chat,canvas,agent,create,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can create a complete agent using the canvas interface and successfully add a nested agent
to enhance the main agent's capabilities. This test covers the full agent creation workflow including basic
configuration and nested agent integration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list, agent.update
6. At least one existing agent is available in the system for selection (e.g., "Agent UI Testing")

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Agents**
3. Click on the **Create new agent** button
4. In the **GENERAL** section:
   - Enter a name in the **Name\*** field (e.g., "Nested Agent Test")
   - Enter a description in the **Description\*** field (e.g., "Agent with nested agent integration")
5. Click **Save** button to proceed to the next interface
6. In the **TOOLKITS** section:
   - Click the **+ Agent** button
   - Select "Agent UI Testing" from the available options
7. Click **X** to close canvas interface
8. Verify the agent appears in the **PARTICIPANTS** section under **Agents**
9. Hover the mouse cursor over the "Nested Agent Test" card
10. Click on the pencil (edit) icon that appears during hover
11. Verify the **TOOLKITS** section shows "Agent UI Testing" has been added
12. Click **X** to close the edit canvas without making changes

### Expected Results

- Clicking **+ Agent** opens a selection interface showing available agents
- "Agent UI Testing" is selected successfully and added to the agent configuration
- Selected nested agent appears in the agent's toolkit list with proper status indicators
- Newly created agent "Nested Agent Test" appears in the **PARTICIPANTS** sidebar
- When opening agent edit mode (steps 9-11):
  - The pencil (edit) icon appears on hover
  - Edit canvas opens with all existing configuration pre-populated
  - **TOOLKITS** section displays "Agent UI Testing" as an added nested agent

### Postconditions

1. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **Nested Agent Test** and click on the **3 dots** (ellipsis menu) under the
     Actions column
   - Click Delete from the contextual menu
   - Enter **Nested Agent Test** in the Name input field and click **Delete** on the confirmation dialog
   - Verify that the agent named **Nested Agent Test** is not available in the agents list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates complete agent creation workflow with nested agent integration

## Test Case ID: AG-020

#### Test Case Name:

Manage nested agent version configuration

#### Test Case Tags:

chat,canvas,agent,modify,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can manage version settings for a nested agent after adding it to a main agent. This test
covers accessing nested agent version options, selecting different agent versions, and ensuring proper version
management within the agent configuration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list, agent.update
6. At least one existing agent is available in the system for selection (e.g., "Agent UI Testing")
7. Complete agent creation with nested agent (steps from AG-019):
   - Navigate to the **Chat** page (sidebar or main menu)
   - In the **PARTICIPANTS** section, locate **Agents**
   - Click on the **Create new agent** button
   - In the **GENERAL** section:
     - Enter a name in the **Name\*** field (e.g., "Nested Agent Test")
     - Enter a description in the **Description\*** field (e.g., "Agent with nested agent integration")
   - Click **Save** button to proceed to the nested agent configuration interface
   - In the **TOOLKITS** section:
     - Click the **+ Agent** button
     - Select "Agent UI Testing" from the available options
   - Click **X** to close canvas interface
   - Verify the agent appears in the **PARTICIPANTS** section under **Agents**
   - Hover the mouse cursor over the "Nested Agent Test" card

### Test Steps

1. Click on the pencil (edit) icon that appears during hover
2. Navigate to the **TOOLKITS** section in the edit canvas
3. Locate the "Agent UI Testing" that was previously added
4. Click on the **latest** dropdown on the "Agent UI Testing" card
5. Review the list of individual tools available within the Agent that are displayed
6. Select another version (e.g., **v1**)
7. Click **Save**
8. Click **X** to close the edit canvas
9. Locate the "Nested Agent Test" card in the **PARTICIPANTS** sidebar

### Expected Results

- Version dropdown shows all available agent versions
- Version changes are properly applied and saved
- **v1** is displayed on the "Nested Agent Test" card in the **PARTICIPANTS** sidebar

### Postconditions

1. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **Nested Agent Test** and click on the **3 dots** (ellipsis menu) under the
     Actions column
   - Click Delete from the contextual menu
   - Enter **Nested Agent Test** in the Name input field and click **Delete** on the confirmation dialog
   - Verify that the agent named **Nested Agent Test** is not available in the agents list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates nested agent version management capabilities
- Verifies version selection and persistence functionality
- Ensures proper version control for nested agent integration

## Test Case ID: AG-021

#### Test Case Name:

Remove nested agent from agent

#### Test Case Tags:

chat,canvas,agent,modify,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can remove a nested agent from a main agent after it has been added. This test covers
accessing the nested agent removal functionality, confirming the removal process, and ensuring the nested
agent is properly removed from the main agent configuration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list, agent.update
6. At least one existing agent is available in the system for selection (e.g., "Agent UI Testing")
7. Complete agent creation with nested agent (steps from AG-019):
   - Navigate to the **Chat** page (sidebar or main menu)
   - In the **PARTICIPANTS** section, locate **Agents**
   - Click on the **Create new agent** button
   - In the **GENERAL** section:
     - Enter a name in the **Name\*** field (e.g., "Nested Agent Removal Test")
     - Enter a description in the **Description\*** field (e.g., "Agent for testing nested agent removal")
   - Click **Save** button to proceed to the nested agent configuration interface
   - In the **TOOLKITS** section:
     - Click the **+ Agent** button
     - Select "Agent UI Testing" from the available options
   - Click **X** to close canvas interface
   - Verify the agent appears in the **PARTICIPANTS** section under **Agents**
   - Hover the mouse cursor over the "Nested Agent Removal Test" card

### Test Steps

1. Click on the pencil (edit) icon that appears during hover
2. Navigate to the **TOOLKITS** section in the edit canvas
3. Locate the "Agent UI Testing" that was previously added
4. Hover the mouse cursor over the "Agent UI Testing" card
5. Verify the **Remove** button (trash icon) appears during hover
6. Click on the **Remove** button (trash icon) that appears during hover
7. In the "Remove toolkit?" confirmation dialog:
   - Verify the dialog title is "Remove toolkit?"
   - Verify the dialog message shows "Are you sure to remove the "Agent UI Testing" toolkit?"
   - Click **Cancel** to test cancellation of removal
8. Click on the **Remove** button (trash icon) again
9. In the "Remove?" confirmation dialog, click **Remove** to confirm the removal
10. Verify that the "Agent UI Testing" is no longer displayed in the **TOOLKITS** section
11. Click **X** to close the edit canvas

### Expected Results

- When hovering over the nested agent card, the **Remove** button (trash icon) becomes visible
- Clicking **Remove** (trash icon) opens a confirmation dialog with:
  - Title: "Remove toolkit?"
  - Message: "Are you sure to remove the "Agent UI Testing" toolkit?"
  - **Cancel** button to abort the removal
  - **Remove** button to confirm deletion
- When clicking **Cancel** (step 7):
  - Dialog closes without removing the nested agent
  - Nested agent remains in the **TOOLKITS** section
  - No changes are made to the main agent configuration
- When clicking **Remove** (step 9):
  - Dialog closes immediately
  - Nested agent is removed from the **TOOLKITS** section
- After removal, the nested agent is immediately removed from the **TOOLKITS** section
- The **TOOLKITS** section shows the empty state or only the add buttons (+ Toolkit, + MCP, + Agent, +
  Pipeline)

### Postconditions

1. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **Nested Agent Removal Test** and click on the **3 dots** (ellipsis menu) under
     the Actions column
   - Click Delete from the contextual menu
   - Enter **Nested Agent Removal Test** in the Name input field and click **Delete** on the confirmation
     dialog
   - Verify that the agent named **Nested Agent Removal Test** is not available in the agents list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: AG-022

#### Test Case Name:

Create an agent using canvas and add a pipeline

#### Test Case Tags:

chat,canvas,agent,create,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can create a complete agent using the canvas interface and successfully add a pipeline to
enhance the agent's capabilities. This test covers the full agent creation workflow including basic
configuration and pipeline integration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list, agent.update
6. At least one pipeline is available in the system for selection (e.g., "Pipeline UI Testing")

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Agents**
3. Click on the **Create new agent** button
4. In the **GENERAL** section:
   - Enter a name in the **Name\*** field (e.g., "Pipeline Test Agent")
   - Enter a description in the **Description\*** field (e.g., "Agent with pipeline integration")
5. Click **Save** button to proceed to the pipeline configuration interface
6. In the **TOOLKITS** section:
   - Click the **+ Pipeline** button
   - Select "Pipeline UI Testing" from the available options
7. Click **X** to close canvas interface
8. Verify the agent appears in the **PARTICIPANTS** section under **Agents**
9. Hover the mouse cursor over the "Pipeline Test Agent" card
10. Click on the pencil (edit) icon that appears during hover
11. Verify the **TOOLKITS** section shows "Pipeline UI Testing" has been added
12. Click **X** to close the edit canvas without making changes

### Expected Results

- When opening agent edit mode (steps 9-11):
  - The pencil (edit) icon appears on hover
  - Edit canvas opens with all existing configuration pre-populated
  - **TOOLKITS** section displays "Pipeline UI Testing" as an added pipeline

### Postconditions

1. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **Pipeline Test Agent** and click on the **3 dots** (ellipsis menu) under the
     Actions column
   - Click Delete from the contextual menu
   - Enter **Pipeline Test Agent** in the Name input field and click **Delete** on the confirmation dialog
   - Verify that the agent named **Pipeline Test Agent** is not available in the agents list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates complete agent creation workflow with pipeline integration
- Verifies pipeline selection and configuration functionality
- Ensures agent-pipeline integration works correctly in chat interface
- Tests both agent creation and pipeline management capabilities

## Test Case ID: AG-023

#### Test Case Name:

Manage pipeline version configuration

#### Test Case Tags:

chat,canvas,agent,modify,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can manage version settings for a pipeline after adding it to an agent. This test covers
accessing pipeline version options, selecting different pipeline versions, and ensuring proper version
management within the agent configuration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list, agent.update
6. At least one pipeline is available in the system for selection (e.g., "Pipeline UI Testing")
7. Complete agent creation with pipeline (steps from AG-022):
   - Navigate to the **Chat** page (sidebar or main menu)
   - In the **PARTICIPANTS** section, locate **Agents**
   - Click on the **Create new agent** button
   - In the **GENERAL** section:
     - Enter a name in the **Name\*** field (e.g., "Pipeline Test Agent")
     - Enter a description in the **Description\*** field (e.g., "Agent with pipeline integration")
   - Click **Save** button to proceed to the pipeline configuration interface
   - In the **TOOLKITS** section:
     - Click the **+ Pipeline** button
     - Select "Pipeline UI Testing" from the available options
   - Click **X** to close canvas interface
   - Verify the agent appears in the **PARTICIPANTS** section under **Agents**
   - Hover the mouse cursor over the "Pipeline Test Agent" card

### Test Steps

1. Click on the pencil (edit) icon that appears during hover
2. Navigate to the **TOOLKITS** section in the edit canvas
3. Locate the "Pipeline UI Testing" that was previously added
4. Click on the **latest** dropdown on the "Pipeline UI Testing" card
5. Review the list of individual tools available within the Pipeline that are displayed
6. Select another version (e.g., **v1**)
7. Click **Save** to apply all pipeline version changes
8. Click **X** to close the edit canvas
9. Locate the "Pipeline Test Agent" card in the **PARTICIPANTS** sidebar

### Expected Results

- Version dropdown shows all available pipeline versions
- Version changes are properly applied and saved
- **v1** is displayed on the "Pipeline Test Agent" card in the **PARTICIPANTS** sidebar

### Postconditions

1. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **Pipeline Test Agent** and click on the **3 dots** (ellipsis menu) under the
     Actions column
   - Click Delete from the contextual menu
   - Enter **Pipeline Test Agent** in the Name input field and click **Delete** on the confirmation dialog
   - Verify that the agent named **Pipeline Test Agent** is not available in the agents list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: AG-024

#### Test Case Name:

Remove pipeline from agent

#### Test Case Tags:

chat,canvas,agent,modify,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can remove a pipeline from an agent after it has been added. This test covers accessing the
pipeline removal functionality, confirming the removal process, and ensuring the pipeline is properly removed
from the agent configuration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list, agent.update
6. At least one pipeline is available in the system for selection (e.g., "Pipeline UI Testing")
7. Complete agent creation with pipeline (steps from AG-022):
   - Navigate to the **Chat** page (sidebar or main menu)
   - In the **PARTICIPANTS** section, locate **Agents**
   - Click on the **Create new agent** button
   - In the **GENERAL** section:
     - Enter a name in the **Name\*** field (e.g., "Pipeline Removal Test Agent")
     - Enter a description in the **Description\*** field (e.g., "Agent for testing pipeline removal")
   - Click **Save** button to proceed to the pipeline configuration interface
   - In the **TOOLKITS** section:
     - Click the **+ Pipeline** button
     - Select "Pipeline UI Testing" from the available options
   - Click **X** to close canvas interface
   - Verify the agent appears in the **PARTICIPANTS** section under **Agents**
   - Hover the mouse cursor over the "Pipeline Removal Test Agent" card

### Test Steps

1. Click on the pencil (edit) icon that appears during hover
2. Navigate to the **TOOLKITS** section in the edit canvas
3. Locate the "Pipeline UI Testing" that was previously added
4. Hover the mouse cursor over the "Pipeline UI Testing" card
5. Verify the **Remove** button (trash icon) appears during hover
6. Click on the **Remove** button (trash icon) that appears during hover
7. In the "Remove toolkit?" confirmation dialog:
   - Verify the dialog title is "Remove toolkit?"
   - Verify the dialog message shows "Are you sure to remove the "Pipeline UI Testing" toolkit?"
   - Click **Cancel** to test cancellation of removal
8. Click on the **Remove** button (trash icon) again
9. In the "Remove toolkit?" confirmation dialog, click **Remove** to confirm the removal
10. Verify that the "Pipeline UI Testing" is no longer displayed in the **TOOLKITS** section
11. Click **X** to close the edit canvas

### Expected Results

- When hovering over the pipeline card, the **Remove** button (trash icon) becomes visible
- **Remove** button (trash icon) is clickable when visible during hover
- Clicking **Remove** (trash icon) opens a confirmation dialog with:
  - Title: "Remove toolkit?"
  - Message: "Are you sure to remove the "Pipeline UI Testing" toolkit?"
  - **Cancel** button to abort the removal
  - **Remove** button to confirm deletion
- When clicking **Cancel** (step 7):
  - Dialog closes without removing the pipeline
  - Pipeline remains in the **TOOLKITS** section
  - No changes are made to the agent configuration
- When clicking **Remove** (step 9):
  - Dialog closes immediately
  - Pipeline is removed from the **TOOLKITS** section
- After removal, the pipeline is immediately removed from the **TOOLKITS** section
- The **TOOLKITS** section shows the empty state or only the add buttons (+ Toolkit, + MCP, + Agent, +
  Pipeline)
- Changes are properly saved when clicking **Save**
- Reopening the agent edit mode confirms the pipeline has been permanently removed
- Agent functionality is not affected by pipeline removal
- No errors or broken UI elements after pipeline removal

### Postconditions

1. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **Pipeline Removal Test Agent** and click on the **3 dots** (ellipsis menu)
     under the Actions column
   - Click Delete from the contextual menu
   - Enter **Pipeline Removal Test Agent** in the Name input field and click **Delete** on the confirmation
     dialog
   - Verify that the agent named **Pipeline Removal Test Agent** is not available in the agents list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates pipeline removal functionality in agent configuration
- Verifies proper cleanup and persistence after pipeline removal
- Ensures agent remains functional after pipeline removal
- Tests both UI interaction and data persistence for pipeline management
