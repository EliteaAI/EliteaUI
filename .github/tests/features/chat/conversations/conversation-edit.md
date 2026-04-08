# Scenario ID: CHAT-001-2

#### Scenario Name:

Conversation management operations.

#### Scenario Tags:

chat,regression,edit

#### Scenario Priority:

High

#### Scenario Description

This scenario validates conversation management functionality including renaming conversations, name
validation rules, cancellation operations, and pinning conversations. It covers all conversation editing and
organizational features that help users manage their conversation lists effectively.

## Test Case ID: CH-002

#### Test Case Name

Rename existing chat conversation with valid name formats

#### Test Case Tags

chat, regression, edit

#### Test Case Priority

Medium

#### Test Case Description

Verify that users can rename an existing chat conversation with a valid name and that the new name is properly
displayed in the CONVERSATIONS sidebar.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update
6. Create a conversation for testing:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "hi")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate an existing conversation
3. Click on the **3 dots** (ellipsis menu) next to the conversation
4. Select **Edit** from the contextual menu
5. Enter a valid conversation name: "AI Development Chat"
6. Click the **✓** (checkmark) button to save the name

### Expected Results

The conversation is renamed successfully and the new name "AI Development Chat" is displayed in the
CONVERSATIONS sidebar

### Postconditions

1. Clean up test conversations by deleting the created conversation:
   - Click on the **3 dots** (ellipsis menu) next to the conversation "AI Development Chat"
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the test.
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- The conversation content and participants should remain unchanged
- `The conversation name should be 3 to 64 characters long. It can include letters (a-z, A-Z), numbers (0-9), underscores (_), brackets ([]), parentheses (()), dots (.), hyphen(-), and spaces. Please note that the first character should not be a space`.

## Test Case ID: CH-003

#### Test Case Name

Validate conversation name length requirements (minimum and maximum)

#### Test Case Tags

chat, regression, edit

#### Test Case Priority

Medium

#### Test Case Description

Verify that conversation names must be between 3 and 64 characters long, rejecting names shorter than 3
characters or longer than 64 characters.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update
6. Create a conversation for testing:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "hi")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate an existing conversation
3. Click on the **3 dots** (ellipsis menu) next to the conversation
4. Select **Edit** from the contextual menu
5. Test minimum length validation:
   - Try to enter a name with 2 characters (e.g., "Hi")
   - Click the **✓** (checkmark) button to save
6. Test maximum length validation:
   - Try to enter a name with 65 characters (e.g., "This is a very long conversation name that exceeds the
     maximum limit")
   - Click the **✓** (checkmark) button to save

### Expected Results

- Names with 2 characters or less: The **✓** (checkmark) button becomes inactive and displays a tooltip with
  name requirements when hovering over it
- Names with 65 characters or more: The **✓** (checkmark) button becomes inactive and displays a tooltip with
  name requirements when hovering over it

### Postconditions

1. Clean up test conversations by deleting the created conversation:
   - Click on the **3 dots** (ellipsis menu) next to the test conversation
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the test.
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- `The conversation name should be 3 to 64 characters long. It can include letters (a-z, A-Z), numbers (0-9), underscores (_), brackets ([]), parentheses (()), dots (.), hyphen(-), and spaces. Please note that the first character should not be a space`.

## Test Case ID: CH-004

#### Test Case Name

Validate conversation name character and format restrictions

#### Test Case Tags

chat, regression, edit

#### Test Case Priority

Medium

#### Test Case Description

Verify that conversation names reject invalid characters and invalid formatting rules (special characters,
Unicode, emojis, and names starting with space).

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update
6. Create a conversation for testing:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "hi")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate an existing conversation
3. Click on the **3 dots** (ellipsis menu) next to the conversation
4. Select **Edit** from the contextual menu
5. Test invalid character restrictions:
   - Special characters: "Chat@#$%"
   - Unicode characters: "Chat™®"
   - Emojis: "Chat😊🚀"
6. Test invalid format restrictions:
   - Name starting with space: " Project Chat"
   - Name with multiple leading spaces: " Meeting Notes"
7. Click the **✓** (checkmark) button to save each attempt

### Expected Results

For all invalid character and format attempts, the **✓** (checkmark) button becomes inactive and displays a
tooltip with name requirements when hovering over it

### Postconditions

1. Clean up test conversations by deleting the created conversation:
   - Click on the **3 dots** (ellipsis menu) next to the test conversation
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the test.
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test covers both invalid characters and invalid formatting rules
- `The conversation name should be 3 to 64 characters long. It can include letters (a-z, A-Z), numbers (0-9), underscores (_), brackets ([]), parentheses (()), dots (.), hyphen(-), and spaces. Please note that the first character should not be a space`

## Test Case ID: CH-005

#### Test Case Name

Cancel conversation renaming process

#### Test Case Tags

chat, regression, edit

#### Test Case Priority

Medium

#### Test Case Description

Verify that users can cancel the conversation renaming process and the original name is preserved.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update
6. Create a conversation for testing:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "hi")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response (e.g., "Hi")

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate the existing conversation
3. Note the original conversation name (e.g., "Hi")
4. Click on the **3 dots** (ellipsis menu) next to the conversation
5. Select **Edit** from the contextual menu
6. Update the conversation name in the input field (e.g., change "Hi" to "Canceled Test")
7. Click the **X** (cancel) button instead of the checkmark

### Expected Results

- The edit mode is canceled and the input field disappears
- The conversation retains its original name (e.g., "Hi")
- No changes are saved to the conversation name
- The conversation appears in the CONVERSATIONS sidebar with the original name

### Postconditions

1. Delete the test conversation that was created during the test:
   - Right-click on the test conversation in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Verify the conversation is completely removed from the sidebar
3. Check that no residual conversation data remains in the interface
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test verifies that canceling the rename operation properly discards changes
- Original conversation name should be preserved exactly
- The conversation name should be 3 to 64 characters long. It can include letters (a-z, A-Z), numbers (0-9),
  underscores (\_), brackets ([]), parentheses (()), dots (.), hyphen(-), and spaces. Please note that the
  first character should not be a space.

## Test Case ID: CH-006

#### Test Case Name

Pin conversation on top

#### Test Case Tags

chat, regression, edit

#### Test Case Priority

Low

#### Test Case Description

Verify that users can pin a conversation to the top of the CONVERSATIONS sidebar and that it appears at the
very top of the list.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update
6. Create a conversation for testing:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "pin test")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate the existing conversation
3. Note the current position of the conversation in the list
4. Click on the **3 dots** (ellipsis menu) next to the conversation
5. Select **Pin on top** from the contextual menu

### Expected Results

- The conversation is immediately moved to the top of the CONVERSATIONS sidebar
- The conversation appears above all other unpinned conversations
- A pin indicator or visual cue shows the conversation is pinned
- The **Pin on top** option changes to **Unpin** in the context menu

### Postconditions

1. Unpin the conversation to clean up test state:
   - Click on the **3 dots** (ellipsis menu) next to the pinned conversation
   - Select **Unpin** from the contextual menu
   - Verify the conversation returns to its normal position based on time-based sorting
   - Verify the **Unpin** option changes back to **Pin on top** in the context menu
2. Delete the test conversation that was created during the test:
   - Right-click on the test conversation in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
3. Verify the conversation is completely removed from the sidebar
4. Check that no residual conversation data remains in the interface
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Pinned conversations should always appear at the very top regardless of their creation date
