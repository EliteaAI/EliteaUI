# Scenario ID: CHAT-003-1

#### Scenario Name:

Adding users to chat conversations

#### Scenario Tags:

chat,smoke,regression,users,add-users

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the functionality for adding users to chat conversations. It covers basic user
addition, searching and filtering users, adding multiple users simultaneously, and handling scenarios when no
search results are found. The tests ensure that the "Add users" interface works correctly in various contexts.

## Test Case ID: USR-001

#### Test Case Name:

Add user to chat conversation using the "Add users" interface

#### Test Case Tags:

chat,smoke,regression,users

#### Test Case Priority:

High

#### Test Case Description

Verify that user can add other user to an existing chat conversation using the "Add users" button/interface.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update, users.add
6. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "Team collaboration discussion")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response
7. Target user account exists in the system for adding

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Open the test conversation created in preconditions
3. Look for the **"Add users"** button or interface element on the **PARTICIPANTS** sidebar
4. Click on the **"Add users"** button to open the user addition interface (if prompted)
5. Click on the **Search users...** input field
6. Select the user from the list
7. Click **Add** button to complete the process

### Expected Results

- The "Add users" interface opens in a modal dialog
- Clicking on the **Search users...** field opens the users list dropdown
- Selected user appears as a tag/chip in the search field
- After clicking **Add** button:
  - User icon is added to the users section/participants list
  - Modal dialog closes
  - User receives notification about being added to the conversation

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

- Test validates the "Add users" functionality
- Interface should transition between default and opened states
- User addition permissions may vary based on user role and project settings

## Test Case ID: USR-002

#### Test Case Name:

Search and filter users in "Add users" interface

#### Test Case Tags:

chat,smoke,regression,users

#### Test Case Priority:

High

#### Test Case Description

Verify that users can search and filter available users in the "Add users" interface to find specific users to
add to the conversation.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update, users.add
6. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "Team collaboration discussion")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response
7. Target user account exists in the system for adding

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Open the test conversation created in preconditions
3. Look for the **"Add users"** button or interface element on the **PARTICIPANTS** sidebar
4. Click on the **"Add users"** button to open the user addition interface(if prompted)
5. Click on the **Search users...** input field
6. Enter the username of the target user: e.g., (Liana Gevorgyan)
7. Select the user from the filtered list
8. Click **Add** button to complete the process

### Expected Results

- Clicking **Search users...** field opens complete users dropdown list
- Typing in search field filters users in real-time
- Search matches user names (case-insensitive)
- Search results update as you type and display matching users only
- Selected users appear as tags in search field

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

- Test validates user search functionality within the Add users interface
- Search works by user name only, not email addresses

## Test Case ID: USR-003

#### Test Case Name:

Add multiple users to chat conversation simultaneously

#### Test Case Tags:

chat,smoke,regression,users

#### Test Case Priority:

High

#### Test Case Description

Verify that users can add multiple users simultaneously to an existing chat conversation using the "Add users"
interface.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update, users.add
6. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "Team collaboration discussion")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response
7. Multiple target user accounts exist in the system for adding:

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Open the test conversation created in preconditions
3. Look for the **"Add users"** button on the **PARTICIPANTS** sidebar
4. Click on the **"Add users"** button to open the user addition interface
5. Click on the **Search users...** input field
6. **Add first user**:
   - Enter the username of the first target user: (e.g., Liana Gevorgyan)
   - Select the user from the filtered list
   - Verify user appears as tag in search field with X icon
7. **Add second user**:
   - Enter the username of the second target user: (e.g.,Samvel Simonyan)
   - Select the user from the filtered list
   - Verify user appears as additional tag in search field with X icon
8. **Add third user**:
   - Enter the username of the third target user: {Mariam Hakobyan}
   - Select the user from the filtered list
   - Verify user appears as additional tag in search field with X icon
9. Click on the x icon on the (Mariam Hakobyan) tag
10. Click **Add** button to add all selected users simultaneously

### Expected Results

- Each selected user appears as a separate tag in the search field
- Multiple users can be selected before clicking Add
- Selected users can be removed by clicking X on their tags
- Search field clears after each user selection to allow searching for next user
- All selected users are added simultaneously when clicking Add button

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

- Test validates adding multiple users simultaneously using the Add users interface
- Multiple users can be selected and added in a single operation
- Search functionality works for each individual user selection

## Test Case ID: USR-009

#### Test Case Name:

Handle no search results in "Add users" interface

#### Test Case Tags:

chat,smoke,regression,users

#### Test Case Priority:

Medium

#### Test Case Description

Verify that the "Add users" interface properly handles scenarios when search queries return no matching
results and displays appropriate feedback to users.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create, conversations.update, users.add
6. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field (e.g., "Team collaboration discussion")
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Open the test conversation created in preconditions
3. Look for the **"Add users"** button on the **PARTICIPANTS** sidebar
4. Click on the **"Add users"** button to open the user addition interface
5. Click on the **Search users...** input field
6. Enter a non-existent username that will return no results (e.g., "NonExistentUser999")
7. Observe the search results dropdown behavior
8. Verify the **Add** button behavior when no users are found
9. Clear the search field and verify dropdown returns to normal state

### Expected Results

- Typing non-existent usernames shows empty dropdown
- **Add** button remains disabled when no users are selected/found
- Interface handles empty search results gracefully without errors
- Clearing search field returns dropdown to normal state with available users

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

- Test validates search functionality handles empty results appropriately
- User interface should provide clear feedback when no matching users are found
