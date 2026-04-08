# Scenario ID: CHAT-001-1

#### Scenario Name:

Create new chat conversations.

#### Scenario Tags:

chat,smoke,create

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the fundamental chat conversation creation functionality. It focuses specifically on
creating new conversations with automatic naming and verifying the basic conversation creation workflow.

## Test Case ID: CH-001

#### Test Case Name:

Create new chat conversation with automatic naming

#### Test Case Tags:

chat, smoke, create

#### Test Case Priority:

High

#### Test Case Description

Verify that users can create a new chat conversation and that the system automatically names the conversation
based on the first response.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click on the **+Create** button (sidebar or main menu)
3. Type a question/query in the chat input field (e.g., hi)
4. Click **Run** button

### Expected Results

After receiving the first response the system names the conversation based on that response (e.g., Hi)

### Postconditions

1. Clean up test conversations by deleting the created conversation.
   - Click on the **3 dots** (ellipsis menu) next to the conversation name in the CONVERSATIONS sidebar
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the deleted conversation.
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates the core conversation creation workflow
- Automatic naming feature ensures conversations are properly labeled
- Clean-up ensures test environment remains pristine
