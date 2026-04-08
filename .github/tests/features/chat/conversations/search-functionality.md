# Scenario ID: CHAT-001-6

#### Scenario Name:

Conversation search and filtering functionality.

#### Scenario Tags:

chat,smoke,regression,search

#### Scenario Priority:

High

#### Scenario Description

This scenario validates conversation search functionality including basic search operations, clearing search
results, and handling edge cases like no matching results. It covers the complete search workflow to help
users find and filter conversations efficiently.

## Test Case ID: CH-029

#### Test Case Name

Basic conversation search functionality

#### Test Case Tags

chat, smoke, search

#### Test Case Priority

High

#### Test Case Description

Verify that users can access and use the conversation search functionality to find conversations by name.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create
6. Create a test conversation with specific name:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a question/query in the chat input field: "Project Planning Meeting discussion"
   - Click **Run** button
   - Wait for system to automatically name the conversation based on response
   - Rename the conversation to "Project Planning Meeting":
     - Click on the **3 dots** (ellipsis menu) next to the conversation
     - Select **Edit** from the contextual menu
     - Clear the current name and enter "Project Planning Meeting"
     - Click the **✓** (checkmark) button to save the name
   - Verify the conversation appears as "Project Planning Meeting" in the CONVERSATIONS sidebar

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate the search icon (🔍) next to the folder icon
3. Click on the **search icon** (🔍)
4. Verify the search field appears with placeholder text "Search conversations..."
5. Start typing "project" in the search field
6. Observe that search results update in real-time as you type

### Expected Results

- A search input field appears with placeholder text "Search conversations..."
- The search field is focused and ready for input
- As you type "project", the conversation list is filtered in real-time
- Only conversations matching the search term are displayed in the list
- The conversation "Project Planning Meeting" appears in the filtered results
- All non-matching conversations are hidden from view
- The filtered list updates dynamically with each character typed
- The matching conversation remains clickable and functional

### Postconditions

1. Clear the search field to return to the full conversation list
2. Delete the test conversation "Project Planning Meeting":
   - Right-click on the conversation in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
3. Verify the conversation is completely removed from the sidebar
4. Check that no residual conversation data remains in the interface
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Search functionality supports case-insensitive matching (e.g., "project", "PROJECT", "Project" all return
  the same results)
- Search includes conversations within folders (conversations are found regardless of their folder location)

## Test Case ID: CH-030

#### Test Case Name

Clear search and return to full conversation list

#### Test Case Tags

chat, regression, search

#### Test Case Priority

Medium

#### Test Case Description

Verify that users can clear the search field and return to viewing the complete conversation list.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create
6. Create test conversations
   - Create first conversation:
     - Navigate to the **Chat** page (sidebar or main menu)
     - Click on the **+Create** button (sidebar or main menu)
     - Type a question/query in the chat input field: "Marketing strategy discussion"
     - Click **Run** button
     - Wait for system to automatically name the conversation based on response
     - Rename to "Marketing Strategy" using the Edit option
   - Verify the conversations is visible in the CONVERSATIONS sidebar

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click on the **search icon** (🔍) in the CONVERSATIONS sidebar
3. Type "test" in the search field to filter conversations
4. Observe that only matching conversations are displayed
5. Clear the search field by:
   - Either clicking the "X" (clear) button in the search field
   - Or manually deleting all text from the search field
6. Observe the conversation list

### Expected Results

- After clearing the search field, all conversations become visible again
- The full conversation list is restored including:
  - All individual conversations
  - All folders and their contents
  - Proper organization and hierarchy
- No conversations remain filtered or hidden
- The search field returns to its placeholder state
- All conversation management functionality remains available

### Postconditions

1. Clear the search field if not already cleared
2. Delete the test conversation "Marketing Strategy":
   - Right-click on the conversation in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
3. Verify the conversation is completely removed from the sidebar
4. Check that no residual conversation data remains in the interface
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: CH-031

#### Test Case Name

Search with no matching results

#### Test Case Tags

chat, regression, search

#### Test Case Priority

Medium

#### Test Case Description

Verify that the search functionality handles cases where no conversations match the search criteria and
displays appropriate feedback.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: conversation.list, conversations.create
6. Create test conversations
   - Create first conversation:
     - Navigate to the **Chat** page (sidebar or main menu)
     - Click on the **+Create** button (sidebar or main menu)
     - Type a question/query in the chat input field: "Marketing strategy discussion"
     - Click **Run** button
     - Wait for system to automatically name the conversation based on response
     - Rename to "Marketing Strategy" using the Edit option
   - Verify the conversations is visible in the CONVERSATIONS sidebar

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click on the **search icon** (🔍) in the CONVERSATIONS sidebar
3. Type "XyzNoMatchText123" in the search field (text that won't match any conversations)
4. Observe the search results area

### Expected Results

- The conversation list is filtered in real-time but shows no conversations
- The conversation list area displays a "no results" state with the following message:
  - No conversations found Try adjusting your search terms
- All existing conversations are hidden from view during the search
- The search field remains active and functional for trying different search terms
- The search term "XyzNoMatchText123" remains visible in the search field
- No error messages or broken UI elements appear

### Postconditions

1. Clear the search field to return to the full conversation list
2. Delete the test conversation "Marketing Strategy":
   - Right-click on the conversation in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
3. Verify the conversation is completely removed from the sidebar
4. Check that no residual conversation data remains in the interface
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates proper handling of empty search results
- Ensures clear user feedback when no matches are found
- Verifies system stability with edge case search terms
