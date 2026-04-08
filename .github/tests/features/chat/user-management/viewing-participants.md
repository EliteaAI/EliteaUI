# Scenario ID: CHAT-003-2

#### Scenario Name:

Managing and viewing participants in chat conversations

#### Scenario Tags:

chat,smoke,regression,users,participants

#### Scenario Priority:

Medium

#### Scenario Description

This scenario validates the functionality for viewing and managing conversation participants. It covers
viewing the complete participants list, understanding participant roles and permissions, and handling UI
display when there are many participants including overflow indicators.

## Test Case ID: USR-004

#### Test Case Name:

View conversation participants list

#### Test Case Tags:

chat,smoke,regression,users

#### Test Case Priority:

Medium

#### Test Case Description

Verify that users can view the complete list of conversation participants and their roles/permissions.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, users.view
6. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "Team collaboration discussion")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response
7. Multiple target user accounts exist in the system for adding
8. Add multiple users to the conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Open the test conversation created in step 6
   - Look for the **"Add users"** button on the **PARTICIPANTS** sidebar
   - Click on the **"Add users"** button to open the user addition interface
   - Click on the **Search users...** input field
   - **Add first user**:
     - Enter the username of the first target user: (e.g., Liana Gevorgyan)
     - Select the user from the filtered list
   - **Add second user**:
     - Enter the username of the second target user: (e.g.,Samvel Simonyan)
     - Select the user from the filtered list
   - **Add third user**:
     - Enter the username of the third target user: (e.g.,Mariam Hakobyan)
     - Select the user from the filtered list
   - Click **Add** button to add all selected users simultaneously
   - Verify all users are successfully added to the conversation

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Open the test conversation with multiple participants
3. Click on the **participants icon**(_users icon_) in the users dropdown
4. Hover over added User item
5. Hover over **ALL users** Option

### Expected Results

- A participants list opens showing all conversation members in the following format:
  - **"Add users"** option appears at the top of the dropdown
  - **Individual participant entries** display below "Add users":
    - User avatar/profile picture on the left
    - User full name displayed next to avatar
    - Each user appears as a separate selectable item in the dropdown
    - When hovering over a user element, the @ (mention) and a remove (trash/delete icon) icons appear
    - Hovering over "All users" shows @ (mention) icon

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

- Participant information displayed may vary based on user permissions and privacy settings

## Test Case ID: USR-010

#### Test Case Name:

Display more than 5 users with overflow indicator in users element

#### Test Case Tags:

chat,smoke,regression,users

#### Test Case Priority:

Medium

#### Test Case Description

Verify that when a conversation has more than 5 users, the users element displays the first 5 user avatars and
shows an overflow indicator (e.g., "+1", "+2", etc.) for the remaining users.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update, users.add
6. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "Large team collaboration discussion")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response
7. Multiple target user accounts exist in the system for adding

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Open the test conversation created in preconditions
3. Add 6 users to the conversation:
4. Look for the **"Add users"** button on the **PARTICIPANTS** sidebar
5. Click on the **"Add users"** button to open the user addition interface
6. Click on the **Search users...** input field
7. Select 6 Users from the suggested list
8. Click **Add** button to add all selected 6 users simultaneously
9. Locate the **Users** element in the conversation interface (typically displays user avatars)
10. Count the number of visible user avatars
11. Click on the users element or overflow indicator to expand the view (if applicable)

### Expected Results

- The users element displays a maximum of 5 user avatars
- When there are 6+ users, the 6th and subsequent users are represented by an overflow indicator (e.g., "+1"
  for 6 users total)
- User avatars are displayed as small circular profile images
- The overflow indicator clearly shows the count of additional users not displayed
- Clicking on the users element or overflow indicator expands to show all users or open participants dropdown

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

- Test validates UI overflow handling for user display elements
- The exact number of visible avatars may vary based on UI design (typically 4-5 avatars before showing
  overflow)
- Overflow indicator format may vary ("+N", "...+N", etc.)
