# Scenario ID: CHAT-003-3

#### Scenario Name:

Removing users from chat conversations

#### Scenario Tags:

chat,smoke,regression,users,remove-users

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the functionality for removing users from chat conversations. It covers the complete
removal process including confirmation dialogs, successful removal actions, and the ability to cancel removal
operations. The tests ensure proper permission handling and user interface behavior during removal operations.

## Test Case ID: USR-005

#### Test Case Name:

Remove user from chat conversation

#### Test Case Tags:

chat,smoke,regression,users

#### Test Case Priority:

High

#### Test Case Description

Verify that conversation owners/admins can remove users from chat conversations and that the removal is
handled properly.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials (conversation owner/admin account)
3. User logs in with {Owner_Username} / {Owner_Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update, users.remove
6. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "Team collaboration discussion")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response
7. Add a test user to the conversation:
   - Look for the **"Add users"** button on the **PARTICIPANTS** sidebar
   - Click on the **"Add users"** button to open the user addition interface
   - Click on the **Search users...** input field
   - Enter the username of the target user: (e.g., Liana Gevorgyan)
   - Select the user from the filtered list
   - Click **Add** button to add the user
   - Verify the test user is successfully added to the conversation

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Open the conversation containing the test user
3. Click on the **participants icon**(_users icon_) in the users dropdown
4. Locate the test user in the participants dropdown list
5. **Hover over the test user entry** to reveal the remove icon
6. **Click on the remove (trash/delete) icon** that appears on hover
7. In the removal confirmation dialog, verify the message and click **Remove**

### Expected Results

- Clicking the remove icon shows a confirmation dialog with warning message with **Remove** and **Cancel**
  options
- After confirming removal the user is immediately removed from the participants list

### Postconditions

1. Clean up test data:
   - Delete the test conversation:
     - Click on the **3 dots** (ellipsis menu) next to the conversation name in the CONVERSATIONS sidebar
     - Select **Delete** from the contextual menu
     - Confirm deletion in the dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual user addition data remains
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates hover-based user removal from participants dropdown

## Test Case ID: USR-006

#### Test Case Name:

Cancel user removal from chat conversation

#### Test Case Tags:

chat,smoke,regression,users

#### Test Case Priority:

Medium

#### Test Case Description

Verify that users can cancel the user removal process and that no changes occur when the removal is
interrupted.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials (conversation owner/admin account)
3. User logs in with {Owner_Username} / {Owner_Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update, users.remove
6. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "Team collaboration discussion")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response
7. Add a test user to the conversation:
   - Look for the **"Add users"** button on the **PARTICIPANTS** sidebar
   - Click on the **"Add users"** button to open the user addition interface
   - Click on the **Search users...** input field
   - Enter the username of the target user: (e.g., Liana Gevorgyan)
   - Select the user from the filtered list
   - Click **Add** button to add the user
   - Verify the test user is successfully added to the conversation

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Open the conversation containing the test user
3. Click on the **participants icon**(_users icon_) in the users dropdown
4. Locate the test user in the participants dropdown list
5. **Hover over the test user entry** to reveal the remove icon
6. **Click on the remove (trash/delete) icon** that appears on hover
7. In the removal confirmation dialog, verify the warning message appears
8. **Click the "Cancel" button** to interrupt the removal process

### Expected Results

- Clicking the remove icon shows a confirmation dialog with warning message with **Remove** and **Cancel**
  options
- After clicking **Cancel** the confirmation dialog closes and no removal action is performed
- Test user remains in the participants list unchanged

### Postconditions

1. Clean up test data:
   - Delete the test conversation:
     - Click on the **3 dots** (ellipsis menu) next to the conversation name in the CONVERSATIONS sidebar
     - Select **Delete** from the contextual menu
     - Confirm deletion in the dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual user addition data remains
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes
