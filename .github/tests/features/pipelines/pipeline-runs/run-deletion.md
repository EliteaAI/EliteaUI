# Scenario ID: PIPE-RUN-003

#### Scenario Name:

Pipeline run deletion operations and restrictions

#### Scenario Tags:

pipelines,runs,delete,ui,smoke

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the deletion functionality for pipeline runs, including proper restrictions on
deleting in-progress runs and successful removal of eligible runs from both Flow View and History list.

## Test Case ID: PR-006

#### Test Case Name:

Verify successful deletion of completed runs from both current view and history list

#### Test Case Tags:

pipelines,runs,delete,smoke

#### Test Case Priority:

High

#### Test Case Description

Verify that users can successfully delete completed runs from both the current run display and the history
list, and the runs are removed from the Flow View.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: pipelines.list, pipelines.create, pipelines.execute, pipelines.delete
6. Create a test pipeline for run deletion:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for Run Deletion"
   - Fill in **Description** field: "Pipeline for testing run deletion"
   - Add LLM node:
     - Click the **+ button** (plus button at top right corner)
     - Select **LLM** from node types
     - Configure the LLM node:
       - In **System** field enter: "You must create story"
       - In **Task** field enter: "Create some interesting long story"
       - Leave **Chat history** with default value
       - Leave Input/Output fields empty (or as default)
     - Click on the **3 dots** button (node-menu-action) on the created LLM node
     - Select **Make entrypoint** from the menu
     - Connect LLM node to END node (Optional - system does this automatically):
       - Drag from the output port of LLM node to the END node
   - Click **Save** button (top right)
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Verify "Test Pipeline for Run Deletion" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline for Run Deletion"
3. Click on the pipeline to open it
4. Open the **Configuration** page:
   - Click on the **Configuration** tab in the top menu bar
5. Execute the pipeline multiple times:
   - Open the pipeline in Flow View
   - Execute the pipeline via chat input:
   - Ensure you are on the pipeline **Configuration** page (Flow View)
   - Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration**
     page
   - Type a message in the chat field (e.g., "run" or "go")
   - Press **Enter** or click the **arrow button** (send icon) on the right side of the input field to execute
     (Run 1)
   - Wait for Run 1 to complete successfully
   - Execute the pipeline via chat input:
   - Ensure you are on the pipeline **Configuration** page (Flow View)
   - Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration**
     page
   - Type a message in the chat field (e.g., "run" or "go")
   - Press **Enter** or click the **arrow button** (send icon) on the right side of the input field to execute
     (Run 2)
   - Wait for Run 2 to complete successfully
   - Execute the pipeline via chat input:
   - Ensure you are on the pipeline **Configuration** page (Flow View)
   - Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration**
     page
   - Type a message in the chat field (e.g., "run" or "go")
   - Press **Enter** or click the **arrow button** (send icon) on the right side of the input field to execute
     (Run 3)
   - Wait for Run 3 to complete successfully
6. Verify the **History Icon** is displayed inside **Flow View** (**Configuration** page) (3 runs exist)
7. Verify Run 3 is displayed as the current run with a green checkmark
8. Click the **History Icon** inside **Flow View** (**Configuration** page) to open the history list
9. Verify the history list shows Run 1 and Run 2
10. Locate the **Delete Icon** next to Run 1 in the history list
11. Click the **Delete Icon** for Run 1
12. If a confirmation dialog appears, confirm the deletion
13. Verify Run 1 is removed from the history list
14. Verify the history list now only shows Run 2
15. Close the history list
16. Click the **History Icon** inside **Flow View** (**Configuration** page) again to reopen
17. Verify Run 1 is not present (deletion persisted)
18. Verify only Run 2 is shown in the history list
19. Close the history list
20. Verify Run 3 is still displayed as the current run
21. Locate the **Delete Icon** next to Run 3 (current run)
22. Click the **Delete Icon** for Run 3
23. If a confirmation dialog appears, confirm the deletion
24. Verify Run 3 chipset is removed from the Flow View
25. Verify only Run 2 remains visible (previously in history, now current)
26. Verify no **History Icon** is present inside **Flow View** (**Configuration** page) (only 1 run exists)

### Expected Results

- Delete icon is visible for runs in both history list and current view
- Clicking the delete icon prompts for confirmation (if applicable)
- After confirmation, the run is immediately removed
- Deleting from history list: Run is removed from history, other runs remain
- Deleting from current view: Run is removed, next most recent run becomes visible
- The history list updates dynamically after deletion
- History Icon disappears when only 1 run remains after deletion
- Deletion persists after closing and reopening the history list
- Deletion is permanent and cannot be undone
- No error messages are displayed during successful deletion

### Postconditions

1. Delete the test pipeline created during preconditions:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline for Run Deletion**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for Run Deletion" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Run deletion should provide user confirmation
- Deletion should be immediate and visible
- This test covers deletion from both locations (current view and history list)
- **IMPORTANT**: All pipeline executions must be done via chat input in the Configuration tab (Flow View).
  Never use the Run tab for testing pipeline runs functionality

---

## Test Case ID: PR-007

#### Test Case Name:

Verify in-progress run cannot be deleted without stopping first

#### Test Case Tags:

pipelines,runs,delete,validation,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users cannot delete a pipeline run that is currently in progress, and must first manually stop the
run before deletion is allowed.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: pipelines.list, pipelines.create, pipelines.execute, pipelines.delete, pipelines.stop
6. Create a test pipeline with longer execution time:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for In-Progress Deletion Block"
   - Fill in **Description** field: "Pipeline for testing in-progress deletion restriction"
   - Add LLM node:
     - Click the **+ button** (plus button at top right corner)
     - Select **LLM** from node types
     - Configure the LLM node:
       - In **System** field enter: "You must create story"
       - In **Task** field enter: "Create some interesting long story"
       - Leave **Chat history** with default value
       - Leave Input/Output fields empty (or as default)
     - Click on the **3 dots** button (node-menu-action) on the created LLM node
     - Select **Make entrypoint** from the menu
     - Connect LLM node to END node (Optional - system does this automatically):
       - Drag from the output port of LLM node to the END node
   - Click **Save** button (top right)
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Verify "Test Pipeline for In-Progress Deletion Block" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline for In-Progress Deletion Block"
3. Click on the pipeline to open it
4. Open the **Configuration** page:
   - Click on the **Configuration** tab in the top menu bar
   - Verify the **Flow View** (visual pipeline editor) is displayed
5. Start pipeline execution (without leaving the Configuration page):
   - Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration**
     page
   - Type a message in the chat field (e.g., "run" or "go")
   - Press **Enter** or click the **arrow button** (send icon) on the right side of the input field (Run 1)
6. Observe the run chipset displays a blue loading icon (in-progress)
7. Look for a **Delete Icon** next to the in-progress run
8. Verify the delete icon is either:
   - Not displayed at all, OR
   - Displayed but disabled/grayed out
9. If the delete icon is present and clickable, attempt to click it
10. Verify one of the following behaviors:

- An error message appears stating the run must be stopped first, OR
- A confirmation dialog appears warning that the run is in progress, OR
- The delete action is prevented/blocked entirely

11. Manually stop the pipeline run:

- Click the **Stop** button or icon
- Confirm the stop action if prompted
- Wait for the run to stop (orange stop icon appears)

12. After the run is stopped, verify the **Delete Icon** is now enabled/available
13. Click the **Delete Icon**
14. Confirm deletion if prompted
15. Verify the stopped run is successfully deleted from the Flow View

### Expected Results

- In-progress runs (blue loading icon) cannot be deleted directly
- The delete icon is either hidden or disabled for in-progress runs
- If deletion is attempted, an appropriate error message or warning is displayed
- The error message indicates the run must be stopped before deletion
- After manually stopping the run, the delete icon becomes available/enabled
- Stopped runs can be successfully deleted
- The deletion restriction protects active executions from accidental removal
- No system errors occur when trying to delete an in-progress run

### Postconditions

1. Delete the test pipeline created during preconditions:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline for In-Progress Deletion Block**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for In-Progress Deletion Block" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- This restriction prevents data loss and execution interruption
- Clear user feedback is essential when deletion is blocked
- **IMPORTANT**: All pipeline executions must be done via chat input in the Configuration tab (Flow View).
  Never use the Run tab for testing pipeline runs functionality
