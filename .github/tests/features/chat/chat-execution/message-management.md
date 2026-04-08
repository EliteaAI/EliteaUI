# Scenario ID: CHAT-005-4

#### Scenario Name:

Message management in chat conversations

#### Scenario Tags:

chat,regression,message-management

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the functionality for managing messages in chat conversations. It covers copying
message content, regenerating assistant responses, and deleting individual messages. The tests ensure that
message-level actions work correctly and provide appropriate user feedback while maintaining conversation
integrity and context.

## Test Case ID: SC-014

#### Test Case Name:

Message management - Copy, Regenerate, and Delete functionality

#### Test Case Tags:

chat,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can manage messages in a conversation by copying message content, regenerating assistant
responses, and deleting individual messages. This test validates the message-level actions available in chat
conversations.

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
8. User executes initial conversation:
   - Type a test message in the chat input field (e.g., "List branches")
   - Click the **Run** button to execute the chat
   - Wait for the agent to respond
   - Verify that both user message and agent response appear in the chat

### Test Steps

1. **Test Copy functionality for user message:**
   - Locate the user message in the chat conversation
   - Click the **Copy** button/icon (clipboard icon) for the user message
   - Verify that the message content is copied to clipboard
   - Click in the chat input field and paste (Ctrl+V) to verify content was copied correctly
   - Clear the input field after verification

2. **Test Copy functionality for agent response:**
   - Locate the agent response message in the chat conversation
   - Click the **Copy** button/icon (clipboard icon) for the agent response
   - Verify that the response content is copied to clipboard
   - Click in the chat input field and paste (Ctrl+V) to verify content was copied correctly
   - Clear the input field after verification

3. **Test Regenerate functionality:**
   - Locate the agent response message in the chat conversation
   - Click the **Regenerate** button/icon (refresh/regenerate icon) for the agent response
   - Verify that the agent starts processing a new response
   - Wait for the regenerated response to complete
   - Verify that the new response appears and replaces the previous response

4. **Test Delete functionality for individual messages:**
   - Locate a message in the conversation (either user or agent message)
   - Click the **Delete** button/icon (trash/delete icon) for the message
   - Verify a confirmation dialog appears asking to confirm deletion
   - Click **Confirm/Yes** in the deletion confirmation dialog
   - Verify that the selected message is removed from the conversation
   - Verify that other messages remain intact in the conversation

### Expected Results

- **Copy functionality:**
  - Copy buttons are visible on messages (both user and agent messages)
  - Clicking copy button successfully copies message content to clipboard
  - Copied content can be pasted elsewhere and matches the original message content
  - Copy action provides visual feedback (e.g., tooltip, notification, or button state change)

- **Regenerate functionality:**
  - Regenerate button is visible on agent response messages
  - Clicking regenerate button initiates a new response generation process
  - Loading indicator appears during regeneration
  - New response replaces the previous response in the same message position
  - Regenerated content shows updated or alternative response from the agent
  - Regenerate action preserves conversation flow and message ordering

- **Delete functionality:**
  - Delete buttons are visible on messages
  - Clicking delete button shows confirmation dialog before deletion
  - Confirming deletion removes the specific message from conversation
  - Other messages in the conversation remain unaffected
  - Delete action updates the conversation view immediately
  - Conversation threading and context remain logical after message deletion

- **Persistence:**
  - All message management actions (copy, regenerate, delete) persist across page refreshes
  - Conversation state is maintained correctly in the sidebar
  - Message management actions are reflected in conversation history

### Postconditions

1. Clean up the test conversation:
   - Click on the **3 dots** (ellipsis menu) next to the conversation name(`Run`) in the CONVERSATIONS sidebar
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the deleted conversation
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test validates core message management functionality essential for chat interaction
- Focus is on individual message actions rather than conversation-level actions
- Copy functionality enables users to reuse and share message content
- Regenerate functionality allows users to get alternative responses from agents
- Delete functionality provides message-level cleanup and conversation management
- All actions should provide appropriate visual feedback and confirmation where needed
