# Scenario ID: CHAT-003-5

#### Scenario Name:

Access control for user management in chat conversations

#### Scenario Tags:

chat,smoke,regression,users,access-control,private-projects

#### Scenario Priority:

Medium

#### Scenario Description

This scenario validates the access control restrictions for user management functionality in different project
types. It ensures that user management features like "Add users" are properly restricted in private projects
and that access control is enforced according to project privacy settings and user permissions.

## Test Case ID: USR-008

#### Test Case Name:

Verify "Add users" option is not available in private projects

#### Test Case Tags:

chat,smoke,regression,users

#### Test Case Priority:

Medium

#### Test Case Description

Verify that the "Add users" option is not available or accessible in private projects, ensuring proper access
control for private project conversations.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to a **Private** Project (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create for private projects
6. Create a test conversation in the private project:

- Navigate to the **Chat** page (sidebar or main menu)
- Click on the **+Create** button (sidebar or main menu)
- Type a question/query in the chat input field (e.g., "Private project discussion")
- Click **Run** button
- Wait for system to automatically name the conversation based on response

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Open the test conversation created in the private project
3. Locate the **PARTICIPANTS** section in the sidebar
4. Check for the **"Add users"** button or option
5. Click on the **participants icon** or **users dropdown** to open the participants list

### Expected Results

- The **"Add users"** button is not visible in the PARTICIPANTS section
- The participants dropdown/list does not contain "Add users" option at the top

### Postconditions

1. Clean up test data:
   - Delete the test conversation:
     - Click on the **3 dots** (ellipsis menu) next to the conversation name in the CONVERSATIONS sidebar
     - Select **Delete** from the contextual menu
     - Confirm deletion in the dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual conversation data remains
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates access control restrictions for private projects
- "Add users" functionality should be completely unavailable in private project contexts
