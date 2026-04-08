# Scenario ID: CHAT-001-4

#### Scenario Name:

Conversation movement and organization operations.

#### Scenario Tags:

chat,regression,move

#### Scenario Priority:

High

#### Scenario Description

This scenario validates conversation movement functionality including moving conversations between folders,
moving to main list, and creating new folders during the move process. It covers all conversation organization
features using both drag-and-drop and context menu methods.

## Test Case ID: CH-015

#### Test Case Name

Move conversation to existing folder using drag and drop

#### Test Case Tags

chat, regression, move

#### Test Case Priority

High

#### Test Case Description

Verify that users can move a conversation from the main conversation list to an existing folder using drag and
drop functionality.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update, folders.get,
   folders.create
6. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "test move")
   - Click **Run** button
   - Wait for system to automatically name the conversation
7. Create a test folder:
   - Click the **folder icon** button (📁) at the top of the **CONVERSATIONS** sidebar
   - Enter folder name: "Test Folder"
   - Click the **✓** (checkmark) button

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate the test conversation
3. Click and hold the conversation card
4. Drag the conversation over the "Test Folder"
5. Release the mouse button to drop the conversation into the folder

### Expected Results

- The conversation is moved into the "Test Folder"
- The conversation no longer appears in the main conversation list
- The conversation is now visible when the "Test Folder" is expanded

### Postconditions

1. Delete the test conversation:
   - Right-click on the test conversation within the "Test Folder"
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Delete the "Test Folder":
   - Right-click on the "Test Folder" in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
3. Verify both the conversation and folder are completely removed from the sidebar
4. Check that no residual data remains in the interface
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: CH-016

#### Test Case Name

Move conversation to existing folder using Move To menu

#### Test Case Tags

chat, regression, move

#### Test Case Priority

High

#### Test Case Description

Verify that users can move a conversation from the main conversation list to an existing folder using the
"Move To" context menu option.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update, folders.get,
   folders.create
6. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "test move menu")
   - Click **Run** button
   - Wait for system to automatically name the conversation
7. Create a test folder:
   - Click the **folder icon** button (📁) at the top of the **CONVERSATIONS** sidebar
   - Enter folder name: "Destination Folder"
   - Click the **✓** (checkmark) button

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate the test conversation
3. Click on the **3 dots** (ellipsis menu) next to the conversation
4. Select **Move to** from the contextual menu
5. Select "Destination Folder" from the submenu

### Expected Results

- The conversation is moved into the "Destination Folder"
- The conversation no longer appears in the main conversation list
- The conversation is now visible when the "Destination Folder" is expanded

### Postconditions

1. Delete the test conversation:
   - Right-click on the test conversation within the "Destination Folder"
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Delete the "Destination Folder":
   - Right-click on the "Destination Folder" in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
3. Verify both the conversation and folder are completely removed from the sidebar
4. Check that no residual data remains in the interface
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: CH-017

#### Test Case Name

Move conversation to new folder using Move To menu

#### Test Case Tags

chat, regression, move, create

#### Test Case Priority

High

#### Test Case Description

Verify that users can move a conversation from the main conversation list to a new folder by creating the
folder during the move process using the "Move To" context menu.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update, folders.get,
   folders.create
6. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "test new folder")
   - Click **Run** button
   - Wait for system to automatically name the conversation

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate the test conversation
3. Click on the **3 dots** (ellipsis menu) next to the conversation
4. Select **Move to** from the contextual menu
5. Select **Create folder** from the submenu
6. Enter a new folder name: "New Project Folder"
7. Click the **✓** (checkmark) button to create the folder and move the conversation

### Expected Results

- A new folder "New Project Folder" is created
- The conversation is moved into the newly created folder
- The conversation no longer appears in the main conversation list
- The conversation is now visible when the "New Project Folder" is expanded
- The new folder appears in the CONVERSATIONS sidebar

### Postconditions

1. Delete the test conversation:
   - Right-click on the test conversation within the "New Project Folder"
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Delete the "New Project Folder":
   - Right-click on the "New Project Folder" in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
3. Verify both the conversation and folder are completely removed from the sidebar
4. Check that no residual data remains in the interface
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: CH-018

#### Test Case Name

Move conversation back to main list using drag and drop

#### Test Case Tags

chat, regression, move

#### Test Case Priority

High

#### Test Case Description

Verify that users can move a conversation from a folder back to the main conversation list using drag and drop
functionality.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update, folders.get,
   folders.create
6. Create a test conversation and folder setup:
   - Create a conversation (follow standard conversation creation steps)
   - Create a folder: "Source Folder"
   - Move the conversation into "Source Folder" (e.g., drag and drop )

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, expand "Source Folder"
3. Locate the test conversation inside the folder
4. Click and hold the conversation item
5. Drag the conversation card out of the folder to the main conversation list area
6. Release the mouse button to drop the conversation

### Expected Results

- The conversation is moved out of "Source Folder"
- The conversation appears in the main conversation list
- The conversation is no longer visible inside "Source Folder"
- The folder shows updated content (empty if no other conversations)

### Postconditions

1. Delete the test conversation:
   - Right-click on the test conversation in the main conversation list
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Delete the "Source Folder":
   - Right-click on the "Source Folder" in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
3. Verify both the conversation and folder are completely removed from the sidebar
4. Check that no residual data remains in the interface
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: CH-019

#### Test Case Name

Move conversation back to main list using Move To menu

#### Test Case Tags

chat, regression, move

#### Test Case Priority

High

#### Test Case Description

Verify that users can move a conversation from a folder back to the main conversation list using the "Move
To > Back to the list" context menu option.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update, folders.get,
   folders.create
6. Create a test conversation and folder setup:
   - Create a conversation (follow standard conversation creation steps)
   - Create a folder: "Test Container"
   - Move the conversation into "Test Container" (e.g., drag and drop )

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, expand "Test Container"
3. Locate the test conversation inside the folder
4. Click on the **3 dots** (ellipsis menu) next to the conversation
5. Select **Move to** from the contextual menu
6. Select **Back to the list** from the submenu

### Expected Results

- The conversation is moved out of "Test Container"
- The conversation appears in the main conversation list
- The conversation is no longer visible inside "Test Container"
- The folder shows updated content (empty if no other conversations)

### Postconditions

1. Delete the test conversation:
   - Right-click on the test conversation in the main conversation list
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Delete the "Test Container" folder:
   - Right-click on the "Test Container" in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
3. Verify both the conversation and folder are completely removed from the sidebar
4. Check that no residual data remains in the interface
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: CH-020

#### Test Case Name

Move conversation from one folder to another using drag and drop

#### Test Case Tags

chat, regression, move

#### Test Case Priority

Medium

#### Test Case Description

Verify that users can move a conversation from one folder to another folder using drag and drop functionality.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update, folders.get,
   folders.create
6. Create test setup:
   - Create a conversation (follow standard conversation creation steps)
   - Create first folder: "Source Folder"
   - Create second folder: "Target Folder"
   - Move the conversation into "Source Folder" (e.g., drag and drop)

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, expand "Source Folder"
3. Locate the test conversation inside "Source Folder"
4. Click and hold the conversation item
5. Drag the conversation over "Target Folder"
6. Release the mouse button to drop the conversation into "Target Folder"

### Expected Results

- The conversation is moved from "Source Folder" to "Target Folder"
- The conversation no longer appears in "Source Folder"
- The conversation is now visible when "Target Folder" is expanded

### Postconditions

1. Delete the test conversation:
   - Right-click on the test conversation within the "Target Folder"
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Delete both test folders:
   - Right-click on the "Source Folder" in the sidebar and select "Delete", confirm deletion
   - Right-click on the "Target Folder" in the sidebar and select "Delete", confirm deletion
3. Verify the conversation and both folders are completely removed from the sidebar
4. Check that no residual data remains in the interface
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: CH-021

#### Test Case Name

Move conversation from one folder to another using Move To menu

#### Test Case Tags

chat, regression, move

#### Test Case Priority

Medium

#### Test Case Description

Verify that users can move a conversation from one folder to another folder using the "Move To" context menu
option.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update, folders.get,
   folders.create
6. Create test setup:
   - Create a conversation (follow standard conversation creation steps)
   - Create first folder: "Original Folder"
   - Create second folder: "Destination Folder"
   - Move the conversation into "Original Folder" (e.g., drag and drop)

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, expand "Original Folder"
3. Locate the test conversation inside "Original Folder"
4. Click on the **3 dots** (ellipsis menu) next to the conversation
5. Select **Move to** from the contextual menu
6. Select "Destination Folder" from the submenu

### Expected Results

- The conversation is moved from "Original Folder" to "Destination Folder"
- The conversation no longer appears in "Original Folder"
- The conversation is now visible when "Destination Folder" is expanded

### Postconditions

1. Delete the test conversation:
   - Right-click on the test conversation within the "Destination Folder"
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Delete both test folders:
   - Right-click on the "Original Folder" in the sidebar and select "Delete", confirm deletion
   - Right-click on the "Destination Folder" in the sidebar and select "Delete", confirm deletion
3. Verify the conversation and both folders are completely removed from the sidebar
4. Check that no residual data remains in the interface
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test verifies Move To menu functionality between existing folders

## Test Case ID: CH-022

#### Test Case Name

Move conversation from folder to new folder using Move To menu

#### Test Case Tags

chat, regression, move, create

#### Test Case Priority

Medium

#### Test Case Description

Verify that users can move a conversation from an existing folder to a new folder by creating the destination
folder during the move process using the "Move To" context menu.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update, folders.get,
   folders.create
6. Create test setup:
   - Create a conversation (follow standard conversation creation steps)
   - Create a folder: "Source Folder"
   - Move the conversation into "Source Folder" (e.g., drag and drop)

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, expand "Source Folder"
3. Locate the test conversation inside "Source Folder"
4. Click on the **3 dots** (ellipsis menu) next to the conversation
5. Select **Move to** from the contextual menu
6. Select **Create folder** from the submenu
7. Enter a new folder name: "New Destination Folder"
8. Click the **✓** (checkmark) button to create the folder and move the conversation

### Expected Results

- A new folder "New Destination Folder" is created
- The conversation is moved from "Source Folder" to the newly created folder
- The conversation no longer appears in "Source Folder"
- The conversation is now visible when "New Destination Folder" is expanded
- The new folder appears in the CONVERSATIONS sidebar
- "Source Folder" shows updated content (empty if no other conversations)

### Postconditions

1. Delete the test conversation:
   - Right-click on the test conversation within the "New Destination Folder"
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Delete both test folders:
   - Right-click on the "Source Folder" in the sidebar and select "Delete", confirm deletion
   - Right-click on the "New Destination Folder" in the sidebar and select "Delete", confirm deletion
3. Verify the conversation and both folders are completely removed from the sidebar
4. Check that no residual data remains in the interface
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates creating new folders during move operations
- Verifies seamless workflow for organizing conversations into new categories
