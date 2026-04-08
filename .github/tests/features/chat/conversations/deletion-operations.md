# Scenario ID: CHAT-001-5

#### Scenario Name:

Conversation and folder deletion operations.

#### Scenario Tags:

chat,regression,delete

#### Scenario Priority:

High

#### Scenario Description

This scenario validates deletion functionality for both conversations and folders. It covers deleting
conversations from main list and folders, canceling deletion operations, and managing folder deletion with
various states (empty folders and folders containing conversations).

## Test Case ID: CH-023

#### Test Case Name

Delete conversation using context menu

#### Test Case Tags

chat, regression, delete

#### Test Case Priority

High

#### Test Case Description

Verify that users can delete a conversation using the context menu.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.delete
6. Create test setup:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "test delete")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response
   - Ensure the conversation is visible in the CONVERSATIONS sidebar

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate the test conversation
3. Click on the **3 dots** (ellipsis menu) next to the conversation
4. Select **Delete** from the contextual menu
5. In the "Delete conversation?" confirmation dialog, verify the message: "Are you sure to delete
   conversation? It can't be restored."
6. Click the **Delete** button to confirm deletion

### Expected Results

- The confirmation dialog appears with appropriate warning message
- After clicking Delete, the conversation is permanently removed from the sidebar
- The conversation no longer appears in the CONVERSATIONS list

### Postconditions

1. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: CH-024

#### Test Case Name

Cancel conversation deletion using context menu

#### Test Case Tags

chat, regression, delete

#### Test Case Priority

Medium

#### Test Case Description

Verify that users can cancel the deletion process when prompted with the confirmation dialog, ensuring the
conversation remains intact.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.delete
6. Create test setup:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "test cancel delete")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response
   - Ensure the conversation is visible in the CONVERSATIONS sidebar

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate the test conversation
3. Click on the **3 dots** (ellipsis menu) next to the conversation
4. Select **Delete** from the contextual menu
5. In the "Delete conversation?" confirmation dialog, verify the message appears
6. Click the **Cancel** button to cancel deletion

### Expected Results

- The confirmation dialog appears with appropriate warning message
- After clicking Cancel, the dialog closes
- The conversation remains visible in the CONVERSATIONS sidebar
- The conversation is not deleted and remains accessible
- No changes are made to the conversation or its location

### Postconditions

1. Delete the test conversation that was preserved during the test:
   - Right-click on the test conversation in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Verify the conversation is completely removed from the sidebar
3. Check that no residual conversation data remains in the interface
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: CH-025

#### Test Case Name

Delete conversation from within a folder

#### Test Case Tags

chat, regression, delete

#### Test Case Priority

High

#### Test Case Description

Verify that users can delete a conversation that is located within a folder using the context menu and
confirmation dialog.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.delete, folders.get,
   folders.create
6. Create test setup:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "test folder delete")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response
   - Create a folder: "Test Folder"
   - Move the conversation into "Test Folder" (e.g., drag and drop)

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, expand "Test Folder"
3. Locate the test conversation inside "Test Folder"
4. Click on the **3 dots** (ellipsis menu) next to the conversation
5. Select **Delete** from the contextual menu
6. In the "Delete conversation?" confirmation dialog, verify the message appears
7. Click the **Delete** button to confirm deletion

### Expected Results

- The confirmation dialog appears with appropriate warning message
- After clicking Delete, the conversation is permanently removed from "Test Folder"
- The conversation no longer appears when "Test Folder" is expanded
- The conversation is not displayed in the main CONVERSATIONS list
- "Test Folder" remains but shows updated content (empty if no other conversations)
- The folder structure is preserved

### Postconditions

1. Delete the "Test Folder":
   - Right-click on the "Test Folder" in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Verify the folder is completely removed from the sidebar
3. Confirm the test conversation was successfully deleted during the test
4. Check that no residual data remains in the interface
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: CH-026

#### Test Case Name

Delete empty folder using context menu

#### Test Case Tags

chat, regression, delete

#### Test Case Priority

High

#### Test Case Description

Verify that users can delete an empty folder using the context menu and confirm the deletion through the
confirmation dialog.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, folders.get, folders.create, folders.delete
6. Create test setup:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click the **folder icon** button (📁) located at the top of the **CONVERSATIONS** sidebar
   - Enter folder name: "Empty Test Folder"
   - Click the **✓** (checkmark) button to create the folder
   - Ensure the folder contains no conversations

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate "Empty Test Folder"
3. Click on the **3 dots** (ellipsis menu) next to the folder
4. Select **Delete** from the contextual menu
5. In the "Delete folder?" confirmation dialog, verify the message: "Are you sure to delete folder? It can't
   be restored."
6. Click the **Delete** button to confirm deletion

### Expected Results

- The confirmation dialog appears with appropriate warning message for folder deletion
- After clicking Delete, the folder is permanently removed from the sidebar
- The folder no longer appears in the CONVERSATIONS list
- Other folders and conversations remain unaffected

### Postconditions

1. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test verifies folder deletion functionality for empty folders
- Confirms proper warning message for folder deletion

## Test Case ID: CH-027

#### Test Case Name

Cancel folder deletion using context menu

#### Test Case Tags

chat, regression, delete

#### Test Case Priority

Medium

#### Test Case Description

Verify that users can cancel the folder deletion process when prompted with the confirmation dialog, ensuring
the folder remains intact.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, folders.get, folders.create, folders.delete
6. Create test setup:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click the **folder icon** button (📁) located at the top of the **CONVERSATIONS** sidebar
   - Enter folder name: "Test Folder to Cancel"
   - Click the **✓** (checkmark) button to create the folder
   - Ensure the folder is visible in the CONVERSATIONS sidebar

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate "Test Folder to Cancel"
3. Click on the **3 dots** (ellipsis menu) next to the folder
4. Select **Delete** from the contextual menu
5. In the "Delete folder?" confirmation dialog, verify the message appears
6. Click the **Cancel** button to cancel deletion

### Expected Results

- The confirmation dialog appears with appropriate warning message
- After clicking Cancel, the dialog closes
- The folder remains visible in the CONVERSATIONS sidebar
- The folder is not deleted and remains accessible
- No changes are made to the folder or its contents

### Postconditions

1. Delete the "Test Folder to Cancel" that was preserved during the test:
   - Right-click on the "Test Folder to Cancel" in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Verify the folder is completely removed from the sidebar
3. Check that no residual folder data remains in the interface
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: CH-028

#### Test Case Name

Delete folder containing conversations

#### Test Case Tags

chat, regression, delete

#### Test Case Priority

High

#### Test Case Description

Verify that users can delete a folder that contains conversations, and confirm that all conversations within
the folder are also deleted along with the folder.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.delete, folders.get,
   folders.create, folders.delete
6. Create test setup:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click the **folder icon** button (📁) located at the top of the **CONVERSATIONS** sidebar
   - Enter folder name: "Folder with Conversations"
   - Click the **✓** (checkmark) button to create the folder
   - Create 2-3 test conversations:
     - Navigate to the **Chat** page (sidebar or main menu)
     - Click on the **+Create** button (sidebar or main menu)
     - Type a question/query in the chat input field (e.g., "test conversation 1")
     - Click **Run** button
     - Wait for system to automatically name the conversation based on response

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate "Folder with Conversations"
3. Expand the folder to verify it contains conversations
4. Click on the **3 dots** (ellipsis menu) next to the folder
5. Select **Delete** from the contextual menu
6. In the "Delete folder?" confirmation dialog, verify the message appears
7. Click the **Delete** button to confirm deletion

### Expected Results

- The confirmation dialog appears with appropriate warning message
- After clicking Delete, the folder and all its contents are permanently removed
- The folder no longer appears in the CONVERSATIONS sidebar
- All conversations that were inside the folder are moved to the main CONVERSATIONS list
- No conversations are lost or deleted
- All conversations remain accessible in the main conversation list

### Postconditions

1. Delete the test conversations that were moved to the main conversation list:
   - Right-click on each test conversation in the main conversation list
   - Select "Delete" from the context menu for each conversation
   - Confirm deletion in the dialog for each conversation
2. Verify all test conversations are completely removed from the sidebar
3. Check that no residual data remains in the interface
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates that folder deletion preserves conversation data by moving them to main list
- Confirms safe deletion practices for organized conversations
