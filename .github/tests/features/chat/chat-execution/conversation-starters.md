# Scenario ID: CHAT-005-3

#### Scenario Name:

Conversation starters in chat conversations

#### Scenario Tags:

chat,regression,conversation-starters

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the functionality for using conversation starters in chat conversations. It covers the
display of conversation starter buttons that appear after adding participants, the interaction with these
buttons, and the execution of predefined commands through conversation starters. The tests ensure that
conversation starters provide a streamlined way to execute common participant actions.

## Test Case ID: SC-011

#### Test Case Name:

Execute chat using conversation starter

#### Test Case Tags:

chat,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can add an agent participant and then execute chat using conversation starter buttons that
appear under the input field, specifically the "List branches" conversation starter

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User navigates to the **Chat** page (sidebar or main menu)
6. User clicks on the **+Create** button to start a new conversation
7. User adds Agent participant:
   - Click on the **switch assistant** button/icon (typically near the chat input or assistant selector)
   - Verify that the **"Frequently Used"** section appears/opens
   - Locate an agent in the frequently used list (e.g., "Agent UI Testing")
   - **Click/Select** the agent from the frequently used list
   - Verify the selected agent is applied and displayed in the **PARTICIPANTS** section
   - Click outside the frequently used list to close it

### Test Steps

1. Locate the **"List branches"** conversation starter button under the input field
2. Click on the **"List branches"** conversation starter button
3. Verify that the text "List branches" is added to the chat input field
4. Click the **Run** button to execute the chat
5. Verify that the agent responds with a list of branches based on the conversation starter

### Expected Results

- Conversation starter buttons appear under the chat input field after agent is added and frequently used list
  is closed
- "List branches" conversation starter button is visible and clickable
- Clicking the conversation starter adds the text "List branches" to the chat input field
- User can click Run button to execute the chat after conversation starter text is added

### Postconditions

1. Clean up the test conversation:
   - Click on the **3 dots** (ellipsis menu) next to the conversation name in the CONVERSATIONS sidebar
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the deleted conversation
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test validates conversation starter functionality with agent participants
- Focus is on UI interaction and automated command execution via conversation starters
- Verifies that conversation starters provide a streamlined way to execute common agent actions
