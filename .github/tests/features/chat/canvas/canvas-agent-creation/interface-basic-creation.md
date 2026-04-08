# Scenario ID: CANVAS-004-1

#### Scenario Name:

Interface access and basic agent creation via canvas

#### Scenario Tags:

chat,canvas,agent,smoke,regression,create

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the basic agent creation functionality via the canvas interface, focusing on accessing
the interface, configuring basic sections, and successfully creating agents. It covers the fundamental canvas
access, configuration sections functionality, and the complete agent creation workflow.

## Test Case ID: AG-001

#### Test Case Name:

Access canvas agent creation interface

#### Test Case Tags:

chat,canvas,agent,smoke,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can access the agent creation canvas interface via the "Create new agent" button, navigate
through the canvas agent creation form, view all available configuration sections, and interact with specific
agent configuration options.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agents.details

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Agents**
3. Click on the **Create new agent** button
4. Collapse and expand each section by clicking its name

### Expected Results

- The "Create New Agent" canvas interface opens successfully
- All configuration sections are visible and accessible:
  - GENERAL section with Name*, Description*, and Tags fields
  - INSTRUCTIONS section with guidelines text area
  - WELCOME MESSAGE section with message input area
  - CONVERSATION STARTERS section with starter management
  - ADVANCED section with step limit configuration
- All sections can be expanded and collapsed properly
- Save and Discard buttons are properly positioned

### Postconditions

1. Click the **X** (close) button or **Discard** to close the canvas interface
2. Verify the canvas is dismissed and returns to chat view
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates the initial access and layout of the agent creation canvas interface

## Test Case ID: AG-002

#### Test Case Name:

Agent configuration sections functionality

#### Test Case Tags:

chat,canvas,agent,create,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that all agent configuration sections function correctly during agent creation, including input
handling, section navigation, and successful configuration completion with transition to toolkit screen.

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
4. In the **GENERAL** section:
   - Enter a name in the **Name\*** field (e.g., "Test Agent")
   - Enter a description in the **Description\*** field (e.g., "Test agent for validation")
   - Add tags in the **Tags** field (optional)
5. In the **INSTRUCTIONS** section:
   - Enter guidelines text (e.g., "You are a helpful AI assistant")
6. In the **WELCOME MESSAGE** section:
   - Enter a welcome message (e.g., "Hello! How can I assist you today?")
7. In the **CONVERSATION STARTERS** section:
   - Click **+ Starter** button
8. In the **ADVANCED** section:
   - Test entering different numeric values (e.g.,50) in the **Step limit** field

### Expected Results

- All configuration fields accept valid input correctly
- Tags field allows multiple tag entry
- Instructions text area accepts multi-line text input
- Welcome message field accepts text input
- Conversation starters can be added dynamically (starter input field appears)
- The **Step limit** field shows default value of 25 and accepts numeric values
- All field labels are properly aligned and readable
- No broken UI elements or missing components

### Postconditions

1. Click **Discard** to cancel agent creation
2. Confirm no agent data is saved
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates form field behavior and validation rules

## Test Case ID: AG-003

#### Test Case Name:

Create and save agent successfully

#### Test Case Tags:

chat,canvas,agent,create,smoke,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can create and save an agent via the canvas interface, successfully transition to the
toolkit configuration screen, and confirm the agent appears in the PARTICIPANTS sidebar.

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
4. In the **GENERAL** section:
   - Enter a name in the **Name\*** field (e.g., "Test Agent")
   - Enter a description in the **Description\*** field (e.g., "Test agent for validation")
5. In the **INSTRUCTIONS** section:
   - Enter guidelines text (e.g., "You are a helpful AI assistant")
6. In the **WELCOME MESSAGE** section:
   - Enter a welcome message (e.g., "Hello! How can I assist you today?")
7. In the **CONVERSATION STARTERS** section:
   - Click **+ Starter** button
8. In the **ADVANCED** section:
   - Test entering different numeric values (e.g., 50) in the **Step limit** field
9. Click **Save** button to proceed to the next interface
10. Click **X** button to close the canvas interface
11. In the **PARTICIPANTS** section under **Agents**, locate the newly created "Test Agent"

### Expected Results

- After clicking Save button, next canvas interface is opened with additional configuration options:
  - **LLM Model and Settings** section with model selector and Model settings button
  - **TOOLKITS** section displays:
    - **+ Toolkit** button for adding toolkits
    - **+ MCP** button for adding MCP connections
    - **+ Agent** button for adding agent integrations
    - **+ Pipeline** button for adding pipeline configurations
    - **Allow attachments** toggle switch
- After closing canvas, newly created agent is displayed in the **PARTICIPANTS** sidebar under **Agents**
  section

### Postconditions

1. Delete the test agent created during the test:
   - Navigate to the **Agents** page (sidebar or main menu)
   - Switch to the **Table view** (top right)
   - Find the agent with name **Test Agent** and click on the **3 dots** (ellipsis menu) under the Actions
     column
2. Click Delete from the contextual menu
3. Enter **Test Agent** in the Name input field and click **Delete** on the confirmation dialog
4. Verify that the agent named **Test Agent** is not available in the agents list
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates form field behavior and validation rules
