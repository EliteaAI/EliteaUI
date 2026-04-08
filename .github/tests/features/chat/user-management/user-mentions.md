# Scenario ID: CHAT-003-4

#### Scenario Name:

User mentions in chat conversations

#### Scenario Tags:

chat,smoke,regression,users,mentions

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the user mention functionality in chat conversations. It covers mentioning individual
participants and all users directly from the participants dropdown using the @ (mention) functionality. The
tests ensure that mentions are properly inserted into the chat input field and work correctly for both
individual users and group mentions.

## Test Case ID: USR-007

#### Test Case Name:

Mention individual users and ALL users from participants dropdown

#### Test Case Tags:

chat,smoke,regression,users

#### Test Case Priority:

High

#### Test Case Description

Verify that users can mention individual participants and "ALL users" directly from the participants dropdown
using the @ (mention) functionality.

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
2. Open the test conversation with multiple participants
3. Click on the **participants icon**(_users icon_) in the users dropdown
4. Locate a specific user entry in the participants dropdown list
5. **Hover over the user entry** to reveal the @ (mention) icon
6. **Click on the @ (mention) icon** that appears on hover
7. **Hover over the "All users" option** to reveal the @ (mention) icon
8. **Click on the @ (mention) icon** for "All users"

### Expected Results

- Clicking @ (mention) icon for individual user inserts their mention (**@Liana Gevorgyan**) in chat input
  field
- Clicking @ (mention) icon for "All users" inserts the **@Everyone** mention in chat input field

### Postconditions

1. Clean up test data:
   - Delete the test conversation:
     - Click on the **3 dots** (ellipsis menu) next to the conversation name in the CONVERSATIONS sidebar
     - Select **Delete** from the contextual menu
     - Confirm deletion in the dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual user data remains
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates @ (mention) functionality from participants dropdown hover interface
- Both individual user mentions and ALL users mentions should work correctly
