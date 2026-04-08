# Scenario ID: CHAT-005-2

#### Scenario Name:

Assistant and participant management in chat conversations

#### Scenario Tags:

chat,smoke,regression,assistants,participants

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the functionality for managing assistants and participants in chat conversations. It
covers accessing frequently used assistants, selecting various participant types (agents, pipelines, toolkits,
MCP servers), and executing chat conversations with different combinations of participants. The tests ensure
proper participant selection, display, and interaction management.

## Test Case ID: SC-005

#### Test Case Name:

Access and display Frequently Used assistants via switch assistant functionality

#### Test Case Tags:

chat,smoke

#### Test Case Priority:

High

#### Test Case Description

Verify that users can access and view the "Frequently Used" assistants section by clicking the switch
assistant functionality in the chat interface

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click on the **+Create** button to start a new conversation
3. Locate the chat interface with the message input area
4. Click on the **switch assistant** button/icon (typically near the chat input or assistant selector)
5. Verify that the **"Frequently Used"** section appears/opens
6. Confirm that the frequently used assistants are displayed (e.g., "Agent UI Testing", "Pipeline UI Testing")

### Expected Results

- Switch assistant button/icon is visible and accessible in the chat interface
- Switch assistant functionality responds when clicked
- "Frequently Used" section opens and displays correctly when switch assistant is clicked
- Frequently used assistants are displayed correctly with proper names (e.g., "Agent UI Testing", "Pipeline UI
  Testing")

### Postconditions

1. Clean up the test conversation:
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

## Test Case ID: SC-006

#### Test Case Name:

Execute chat with agent assistant

#### Test Case Tags:

chat,smoke

#### Test Case Priority:

High

#### Test Case Description

Verify that users can select an agent assistant and successfully execute a chat conversation with the selected
agent

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click on the **+Create** button to start a new conversation
3. Locate the chat interface with the message input area
4. Click on the **switch assistant** button/icon (typically near the chat input or assistant selector)
5. Verify that the **"Frequently Used"** section appears/opens
6. Locate an agent in the frequently used list (e.g., "Agent UI Testing")
7. **Click/Select** the agent from the frequently used list
8. Verify the selected agent is applied and displayed in the chat interface and on the **PARTICIPANTS**
   section
9. Type a test message in the chat input field (e.g., "Run")
10. Click the **Run** button to execute the chat with the selected agent
11. Verify the agent responds appropriately according to its configuration

### Expected Results

- Switch assistant functionality is accessible and functional
- Agent selection from frequently used list works properly (clickable/selectable)
- Selected agent is applied and displayed correctly in the chat interface and on the **PARTICIPANTS** section
- Agent name and icon appears on the **switch assistant** button/element showing it's active
- Chat execution works successfully with the selected agent
- Agent responds according to its specific configuration and capabilities

### Postconditions

1. Clean up the test conversation:
   - Click on the **3 dots** (ellipsis menu) next to the conversation name (Run) in the CONVERSATIONS sidebar
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the deleted conversation
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

## Test Case ID: SC-007

#### Test Case Name:

Execute chat with pipeline participant

#### Test Case Tags:

chat,smoke

#### Test Case Priority:

High

#### Test Case Description

Verify that users can select a pipeline participant and successfully execute a chat conversation with the
selected pipeline

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click on the **+Create** button to start a new conversation
3. Locate the chat interface with the message input area
4. Click on the **switch assistant** button/icon (typically near the chat input or assistant selector)
5. Verify that the **"Frequently Used"** section appears/opens
6. Locate a pipeline in the frequently used list (e.g., "Pipeline UI Testing")
7. **Click/Select** the pipeline from the frequently used list
8. Verify the selected pipeline is applied and displayed in the chat interface and on the **PARTICIPANTS**
   section
9. Type a test message in the chat input field (e.g., "Run")
10. Click the **Run** button to execute the chat with the selected pipeline
11. Verify the pipeline responds appropriately according to its configuration

### Expected Results

- Switch assistant functionality is accessible and functional
- Pipeline selection from frequently used list works properly (clickable/selectable)
- Selected pipeline is applied and displayed correctly in the chat interface and on the **PARTICIPANTS**
  section
- Pipeline name and icon appears on the **switch assistant** button/element showing it's active
- Chat execution works successfully with the selected pipeline
- Pipeline responds according to its specific configuration and capabilities

### Postconditions

1. Clean up the test conversation:
   - Click on the **3 dots** (ellipsis menu) next to the conversation name(`Run`) in the CONVERSATIONS sidebar
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the deleted conversation
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

## Test Case ID: SC-008

#### Test Case Name:

Execute chat with toolkit participant

#### Test Case Tags:

chat,smoke

#### Test Case Priority:

High

#### Test Case Description

Verify that users can add an existing toolkit from the Participants section and successfully execute a chat
conversation with the selected toolkit

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click on the **+Create** button to start a new conversation
3. In the **PARTICIPANTS** section, locate **Toolkits**
4. Click on the **+Add toolkit** icon
5. Select the github toolkit from the Toolkits list
6. Verify the toolkit is added as a participant under the **Toolkits** section in the **PARTICIPANTS** sidebar
7. Type a test message in the chat input field (e.g., "Run")
8. Click the **Run** button to execute the chat with the selected toolkit
9. Verify the toolkit responds appropriately according to its configuration

### Expected Results

- Toolkit selection works properly and toolkit is added as participant
- Selected toolkit is displayed correctly in the **PARTICIPANTS** section
- Chat execution works successfully with the selected toolkit
- Toolkit responds according to its specific configuration and capabilities

### Postconditions

1. Clean up the test conversation:
   - Click on the **3 dots** (ellipsis menu) next to the conversation name(`Run`) in the CONVERSATIONS sidebar
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the deleted conversation
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

## Test Case ID: SC-009

#### Test Case Name:

Execute chat with MCP server participant

#### Test Case Tags:

chat,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can add an existing MCP server from the Participants section and successfully execute a chat
conversation with the selected MCP server

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click on the **+Create** button to start a new conversation
3. In the **PARTICIPANTS** section, locate **MCPs**
4. Click on the **+Add MCP** icon
5. Select an available MCP server from the MCPs list
6. Verify the MCP server is added as a participant under the **MCPs** section in the **PARTICIPANTS** sidebar
7. Type a test message in the chat input field (e.g., "Run")
8. Click the **Run** button to execute the chat with the selected MCP server
9. Verify the MCP server responds appropriately according to its configuration

### Expected Results

- MCP server selection works properly and server is added as participant
- Selected MCP server is displayed correctly in the **PARTICIPANTS** section
- Chat execution works successfully with the selected MCP server
- MCP server responds according to its specific configuration and capabilities

### Postconditions

1. Clean up the test conversation:
   - Click on the **3 dots** (ellipsis menu) next to the conversation name(`Run`) in the CONVERSATIONS sidebar
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the deleted conversation
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test validates MCP server participant selection and execution functionality
- Focus is on successful MCP integration and protocol-based functionality

## Test Case ID: SC-010

#### Test Case Name:

Execute chat with multiple participants (3+ different types)

#### Test Case Tags:

chat,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can add multiple participants from the Participants section (agent, pipeline, and toolkit)
and successfully execute a chat conversation with multiple selected participants

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click on the **+Create** button to start a new conversation
3. Add Agent participant:
   - Click on the **switch assistant** button/icon (typically near the chat input or assistant selector)
   - Verify that the **"Frequently Used"** section appears/opens
   - Locate an agent in the frequently used list (e.g., "Agent UI Testing")
   - **Click/Select** the agent from the frequently used list
   - Verify the selected agent is applied and displayed in the **PARTICIPANTS** section
4. Add Pipeline participant:
   - Click on the **switch assistant** button/icon (typically near the chat input or assistant selector)
   - Verify that the **"Frequently Used"** section appears/opens
   - Locate a pipeline in the frequently used list (e.g., "Pipeline UI Testing")
   - **Click/Select** the pipeline from the frequently used list
   - Verify the selected pipeline is applied and displayed in the **PARTICIPANTS** section
5. Add Toolkit participant:
   - In the **PARTICIPANTS** section, locate **Toolkits**
   - Click on the **+Add toolkit** icon
   - Select the github toolkit from the Toolkits list
   - Verify the toolkit is added as a participant under the **Toolkits** section in the **PARTICIPANTS**
     sidebar
6. Verify all participants (agent, pipeline, toolkit) are displayed in the **PARTICIPANTS** section
7. Verify that the selected/active participants are highlighted in the **PARTICIPANTS** section
8. Type a test message in the chat input field (e.g., "Run")
9. Click the **Run** button to execute the chat with multiple participants
   - Pipeline returns and displays a list of commits in the chat interface
10. Select/click on the "Agent UI Testing" in the **PARTICIPANTS** section to highlight it
11. Click the **Run** button to execute the chat
    - Agent returns and displays a list of branches in the chat interface
12. Click on the "Agent UI Testing" one more time in the **PARTICIPANTS** section to unselect/deselect the
    Agent
13. Verify the Agent is no longer highlighted/selected in the **PARTICIPANTS** section

### Expected Results

- Switch assistant functionality works for agent selection from frequently used list
- Agent selection is applied and displayed correctly in the **PARTICIPANTS** section
- Pipeline selection works properly and pipeline is added as participant
- Toolkit selection works properly and toolkit is added as participant
- All three participant types (agent, pipeline, toolkit) are displayed correctly in the **PARTICIPANTS**
  section
- Selected/active participants are visually highlighted in the **PARTICIPANTS** section
- Chat execution works successfully with multiple participants
- Agent participant returns a list of branches that is displayed in the chat interface
- Pipeline participant returns a list of commits that is displayed in the chat interface
- Participants can be selected/clicked in the **PARTICIPANTS** section for highlighting
- Visual feedback shows when participants are selected or unselected in the **PARTICIPANTS** section
- Conversation appears in the CONVERSATIONS sidebar

### Postconditions

1. Clean up the test conversation:
   - Click on the **3 dots** (ellipsis menu) next to the conversation name(`Run`) in the CONVERSATIONS sidebar
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the deleted conversation
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test validates multi-participant conversation execution functionality
