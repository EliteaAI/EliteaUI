# Scenario ID: CANVAS-002-5

#### Scenario Name:

System synchronization for canvas toolkit operations

#### Scenario Tags:

chat,canvas,toolkit,synchronization,regression,delete,edit

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the synchronization mechanisms between different interfaces when performing toolkit
operations via the canvas interface. It covers ensuring that toolkit deletions and updates are properly
synchronized between the Toolkits menu and conversation interface (PARTICIPANTS section) to maintain
system-wide consistency and data integrity.

## Test Case ID: TK-011

#### Test Case Name

Verify toolkit synchronization between Toolkits menu and conversation interface

#### Test Case Tags

chat, canvas, toolkit, regression, delete

#### Test Case Priority

High

#### Test Case Description

Verify that when a created toolkit is deleted from the Toolkits menu, it is automatically and properly removed
from the conversation interface (PARTICIPANTS section) as well, ensuring system-wide consistency.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: toolkit.create, toolkit.list, toolkit.delete
6. User has valid Elitea Credentials: {credential}

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, click **+Add toolkit**
3. Click on **+ Create new Toolkit**
4. Search for and select **GitHub** from Code Repositories
5. Configure the toolkit:
   - Select a GitHub credential from **Github configuration** \* dropdown: {credential}
   - Enter "sync/test-repo" in **Repository** \* field
   - Input "main" in **Active Branch** field
   - Input "main" in **Base Branch** field
6. Click **Create** button to create the toolkit
7. Click the **X** (close) button to return to the **PARTICIPANTS** section
8. Verify the **sync/test** toolkit appears in the Toolkits section
9. Navigate to the **Toolkits** page (sidebar or main menu)
10. Switch to the **Table view** (top right)
11. Find the toolkit with name **sync/test** and click on the **3 dots** (ellipsis menu) under the Actions
    column
12. Click Delete from the contextual menu
13. Enter **sync/test** in the Name input field and click **Delete** on the confirmation dialog
14. Verify the toolkit is removed from the Toolkits table view
15. Navigate back to the **Chat** page (sidebar or main menu)
16. In the **PARTICIPANTS** section, expand **Toolkits** if collapsed

### Expected Results

- The **sync/test** toolkit is no longer visible in the conversation interface

### Postconditions

4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- This test validates the critical synchronization between toolkit management and conversation interfaces

## Test Case ID: TK-012

#### Test Case Name

Verify toolkit update synchronization between Toolkits menu and conversation interface

#### Test Case Tags

chat, canvas, toolkit, regression, edit

#### Test Case Priority

High

#### Test Case Description

Verify that when a toolkit is updated/modified in the Toolkits menu, those changes are automatically reflected
in the conversation interface (PARTICIPANTS section) as well, ensuring system-wide consistency and real-time
synchronization of toolkit configurations.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: toolkit.create, toolkit.list, toolkit.update, toolkit.delete
6. User has valid Elitea Credentials: {credential}

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, click **+Add toolkit**
3. Click on **+ Create new Toolkit**
4. Search for and select **Confluence** from Documentation
5. Configure the toolkit:
   - Select a Confluence credential from **Confluence configuration** \* dropdown: {credential}
   - Enter "EL" in **Space** \* field
6. Click **Create** button to create the toolkit
7. Click the **X** (close) button to return to the **PARTICIPANTS** section
8. Verify the **EL** toolkit appears in the Toolkits section
9. Navigate to the **Toolkits** page (sidebar or main menu)
10. Switch to the **Table view** (top right)
11. Find the toolkit with name **EL** and click on the it
12. In the configuration section, modify the **Space** field to **AA**
13. Click **Save** button to save the changes
14. Navigate back to the **Chat** page (sidebar or main menu)
15. In the **PARTICIPANTS** section, expand **Toolkits** if collapsed

### Expected Results

- = The toolkit name in the conversation interface (PARTICIPANTS section) automatically updates to **AA**
- No duplicate or orphaned toolkit entries appear in either interface

### Postconditions

1. Delete the test toolkit created during the test:
   - Navigate to the **Toolkits** page (sidebar or main menu) if not already there
   - Switch to the **Table view** (top right)
   - Find the toolkit with name **AA** and click on the **3 dots** (ellipsis menu) under the Actions column
   - Click Delete from the contextual menu
   - Enter **AA\*** in the Name input field and click **Delete** on the confirmation dialog
   - Verify the toolkit is completely removed from the toolkits list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- This test validates critical bi-directional synchronization between toolkit management interface and
  conversation interface
- Focus is on real-time updates and consistency across user interfaces
- Tests both the update mechanism and cross-interface data integrity
