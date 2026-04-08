# Scenario ID: CHAT-001-3

#### Scenario Name:

Folder management operations.

#### Scenario Tags:

chat,smoke,regression,create,edit

#### Scenario Priority:

High

#### Scenario Description

This scenario validates folder management functionality including creating new folders with default and custom
names, folder name validation rules, renaming folders, and canceling folder operations. It covers all folder
creation and management features that help users organize their conversations effectively.

## Test Case ID: CH-007

#### Test Case Name

Create folder with default name

#### Test Case Tags

chat, smoke, create

#### Test Case Priority

Medium

#### Test Case Description

Verify that users can create a new conversation folder using the default name "New Folder" without providing a
custom name.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: folders.get, folders.create

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click the **folder icon** button (📁) located at the top of the **CONVERSATIONS** sidebar
3. Observe that the input field is pre-populated with "New Folder"
4. Without changing the default name, click the **✓** (checkmark) button to create the folder

### Expected Results

- The new folder is created with the name "New Folder"
- The folder appears in the **CONVERSATIONS** sidebar with the default name "New Folder"
- The folder is available for organizing conversations
- No validation errors are displayed

### Postconditions

1. Delete the created "New Folder" folder:
   - Right-click on the "New Folder" folder in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Verify the folder is completely removed from the sidebar
3. Check that no residual folder data remains in the interface
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test verifies the default naming behavior works correctly
- Default name "New Folder" meets the validation requirements (3-64 characters, valid characters, no leading
  space)

## Test Case ID: CH-008

#### Test Case Name

Create new conversation folder

#### Test Case Tags

chat, smoke, create

#### Test Case Priority

High

#### Test Case Description

Verify that users can create a new conversation folder with a valid name and that the folder appears in the
CONVERSATIONS sidebar.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: folders.get, folders.create

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click the **folder icon** button (📁) located at the top of the **CONVERSATIONS** sidebar
3. Enter a valid folder name: "Project Documents"
4. Click the **✓** (checkmark) button to create the folder

### Expected Results

The new folder is created successfully and appears in the CONVERSATIONS sidebar with the name "Project
Documents"

### Postconditions

1. Delete the created "Project Documents" folder:
   - Right-click on the "Project Documents" folder in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Verify the folder is completely removed from the sidebar
3. Check that no residual folder data remains in the interface
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Tooltip text:
  `The folder name should be 3 to 64 characters long. It can include letters (a-z, A-Z), numbers (0-9), underscores (_), brackets ([]), parentheses (()), dots (.), hyphen(-), and spaces. Please note that the first character should not be a space.`

## Test Case ID: CH-009

#### Test Case Name

Validate folder creation name length requirements (minimum and maximum)

#### Test Case Tags

chat, regression, create

#### Test Case Priority

High

#### Test Case Description

Verify that folder creation enforces the 3-64 character length requirement and rejects names that are too
short or too long during the creation process.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: folders.get, folders.create

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click the **folder icon** button (📁) located at the top of the **CONVERSATIONS** sidebar
3. Test minimum length validation:
   - Clear the default name and enter "AB" (2 characters)
   - Attempt to click the **✓** (checkmark) button
4. Test maximum length validation:
   - Clear the name and enter a 65-character string:
     "Test_Folder_Name_That_Is_Exactly_Sixty_Five_Characters_Long_ABCD"
   - Attempt to click the **✓** (checkmark) button

### Expected Results

- Names with 2 characters or less: The **✓** (checkmark) button becomes inactive and displays a tooltip with
  name requirements when hovering over it
- Names with 65 characters or more: The **✓** (checkmark) button becomes inactive and displays a tooltip with
  name requirements when hovering over it

### Postconditions

1. Click the **X** (cancel) button to close the folder creation dialog
2. Verify the folder creation interface is dismissed
3. Confirm no folders were created during the validation testing
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates length requirements during folder creation process
- Tooltip text:
  `The folder name should be 3 to 64 characters long. It can include letters (a-z, A-Z), numbers (0-9), underscores (_), brackets ([]), parentheses (()), dots (.), hyphen(-), and spaces. Please note that the first character should not be a space.`

## Test Case ID: CH-010

#### Test Case Name

Validate folder creation character and format restrictions

#### Test Case Tags

chat, regression, create

#### Test Case Priority

High

#### Test Case Description

Verify that folder creation rejects invalid characters and invalid formatting rules (special characters,
Unicode, emojis, and names starting with space) during the creation process.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: folders.get, folders.create

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click the **folder icon** button (📁) located at the top of the **CONVERSATIONS** sidebar
3. Test invalid character restrictions:
   - Special characters: "Test@Folder#123$" (contains @, #, $)
   - Unicode characters: "Test™Folder®"
   - Emojis: "Test😊Folder🚀"
4. Test invalid format restrictions:
   - Name starting with space: " Leading Space Test"
   - Name with multiple leading spaces: " Multiple Spaces"
5. Test special characters:
   - Enter "Invalid/Folder\\Name*%" (contains /, \, *, %)
   - Attempt to click the **✓** (checkmark) button for each attempt

### Expected Results

For all invalid character and format attempts, the **✓** (checkmark) button becomes inactive and displays a
tooltip with name requirements when hovering over it

### Postconditions

1. Click the **X** (cancel) button to close the folder creation dialog
2. Verify the folder creation interface is dismissed
3. Confirm no folders were created during the validation testing
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates character restrictions during folder creation process
- Tooltip text:
  `The folder name should be 3 to 64 characters long. It can include letters (a-z, A-Z), numbers (0-9), underscores (_), brackets ([]), parentheses (()), dots (.), hyphen(-), and spaces. Please note that the first character should not be a space.`

## Test Case ID: CH-011

#### Test Case Name

Rename folder with valid name formats

#### Test Case Tags

chat, regression, edit

#### Test Case Priority

High

#### Test Case Description

Verify that users can successfully rename a folder using various valid name formats that meet the validation
requirements and that the new name is properly displayed in the CONVERSATIONS sidebar.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: folders.get, folders.create, folders.update
6. Create a test folder:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click the **folder icon** button (📁) at the top of the **CONVERSATIONS** sidebar
   - Leave default name "New Folder" and click the **✓** (checkmark) button

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate the "New Folder"
3. Click on the **3 dots** (ellipsis menu) next to the folder
4. Select **Edit** from the contextual menu
5. Enter a valid folder name: "Project Documents"
6. Click the **✓** (checkmark) button to save the name

### Expected Results

The folder is renamed successfully and the new name "Project Documents" is displayed in the CONVERSATIONS
sidebar

### Postconditions

1. Delete the renamed "Project Documents" folder:
   - Right-click on the "Project Documents" folder in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Verify the folder is completely removed from the sidebar
3. Check that no residual folder data remains in the interface
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test uses valid characters: letters, numbers, underscore, hyphen, parentheses, dots, and spaces
- Name length is within the 3-64 character requirement
- First character is not a space
- The folder content and organization should remain unchanged
- `The folder name should be 3 to 64 characters long. It can include letters (a-z, A-Z), numbers (0-9), underscores (_), brackets ([]), parentheses (()), dots (.), hyphen(-), and spaces. Please note that the first character should not be a space.`

## Test Case ID: CH-012

#### Test Case Name

Validate folder renaming name length requirements (minimum and maximum)

#### Test Case Tags

chat, regression, edit

#### Test Case Priority

High

#### Test Case Description

Verify that folder renaming enforces the 3-64 character length requirement and rejects names that are too
short or too long during the renaming process.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: folders.get, folders.create, folders.update
6. Create a test folder:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click the **folder icon** button (📁) at the top of the **CONVERSATIONS** sidebar
   - Leave default name "New Folder" and click the **✓** (checkmark) button

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate the "New Folder"
3. Click on the **3 dots** (ellipsis menu) next to the folder
4. Select **Edit** from the contextual menu
5. Test minimum length validation:
   - Clear the current name and enter "AB" (2 characters)
   - Attempt to click the **✓** (checkmark) button
6. Test maximum length validation:
   - Clear the name and enter a 65-character string:
     "Test_Folder_Name_That_Is_Exactly_Sixty_Five_Characters_Long_ABCD"
   - Attempt to click the **✓** (checkmark) button

### Expected Results

- Names with 2 characters or less: The **✓** (checkmark) button becomes inactive and displays a tooltip with
  name requirements when hovering over it
- Names with 65 characters or more: The **✓** (checkmark) button becomes inactive and displays a tooltip with
  name requirements when hovering over it

### Postconditions

1. Click the **X** (cancel) button to close the folder renaming dialog
2. Delete the test "New Folder":
   - Right-click on the "New Folder" in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
3. Verify the folder is completely removed from the sidebar
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- `The folder name should be 3 to 64 characters long. It can include letters (a-z, A-Z), numbers (0-9), underscores (_), brackets ([]), parentheses (()), dots (.), hyphen(-), and spaces. Please note that the first character should not be a space.`

## Test Case ID: CH-013

#### Test Case Name

Validate folder renaming character and format restrictions

#### Test Case Tags

chat, regression, edit

#### Test Case Priority

High

#### Test Case Description

Verify that folder renaming rejects invalid characters and invalid formatting rules (special characters,
Unicode, emojis, and names starting with space) during the renaming process.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: folders.get, folders.create, folders.update
6. Create a test folder:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click the **folder icon** button (📁) at the top of the **CONVERSATIONS** sidebar
   - Leave default name "New Folder" and click the **✓** (checkmark) button

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate the "New Folder"
3. Click on the **3 dots** (ellipsis menu) next to the folder
4. Select **Edit** from the contextual menu
5. Test invalid character restrictions:
   - Special characters: "Test@Folder#123$" (contains @, #, $)
   - Unicode characters: "Test™Folder®"
   - Emojis: "Test😊Folder🚀"
6. Test invalid format restrictions:
   - Name starting with space: " Leading Space Test"
   - Name with multiple leading spaces: " Multiple Spaces"
7. Test special characters:
   - Enter "Invalid/Folder\\Name*%" (contains /, \, *, %)
   - Attempt to click the **✓** (checkmark) button for each attempt

### Expected Results

For all invalid character and format attempts, the **✓** (checkmark) button becomes inactive and displays a
tooltip with name requirements when hovering over it

### Postconditions

1. Click the **X** (cancel) button to close the folder renaming dialog
2. Delete the test "New Folder":
   - Right-click on the "New Folder" in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
3. Verify the folder is completely removed from the sidebar
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- `The folder name should be 3 to 64 characters long. It can include letters (a-z, A-Z), numbers (0-9), underscores (_), brackets ([]), parentheses (()), dots (.), hyphen(-), and spaces. Please note that the first character should not be a space.`

## Test Case ID: CH-014

#### Test Case Name

Cancel folder renaming process

#### Test Case Tags

chat, regression, edit

#### Test Case Priority

Medium

#### Test Case Description

Verify that users can cancel the folder renaming process and the original folder name is preserved.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: folders.get, folders.create, folders.update
6. Create a test folder:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click the **folder icon** button (📁) at the top of the **CONVERSATIONS** sidebar
   - Change the default name to "Original Folder Name" and click the **✓** (checkmark) button

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **CONVERSATIONS** sidebar, locate the "Original Folder Name"
3. Note the current folder name: "Original Folder Name"
4. Click on the **3 dots** (ellipsis menu) next to the folder
5. Select **Edit** from the contextual menu
6. Update the folder name in the input field to "Canceled Rename Test"
7. Click the **X** (cancel) button

### Expected Results

- The edit mode is canceled and the input field disappears
- The folder retains its original name "Original Folder Name"
- No changes are saved to the folder name
- The folder appears in the CONVERSATIONS sidebar with the original name

### Postconditions

1. Delete the test "Original Folder Name" folder:
   - Right-click on the "Original Folder Name" folder in the sidebar
   - Select "Delete" from the context menu
   - Confirm deletion in the dialog
2. Verify the folder is completely removed from the sidebar
3. Check that no residual folder data remains in the interface
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test verifies that canceling the rename operation properly discards changes
- Original folder name should be preserved exactly
