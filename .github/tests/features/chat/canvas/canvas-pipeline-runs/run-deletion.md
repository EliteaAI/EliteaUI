# Scenario ID: CANVAS-PIPE-RUN-005

#### Scenario Name:

Pipeline run deletion in Canvas

#### Scenario Tags:

canvas,pipelines,runs,delete,validation,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the deletion functionality for pipeline runs in Canvas Flow Editor. It ensures users
can delete completed runs from both current view and history list, with separate test coverage for in-progress
run deletion restrictions.

## Test Case ID: CPR-006

#### Test Case Name:

Verify run deletion from Canvas Flow Editor (history list and current view)

#### Test Case Tags:

canvas,pipelines,runs,delete,validation,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can delete completed pipeline runs from Canvas Flow Editor, including deletion from both
history list and current view.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: conversations.create, conversations.read, conversations.delete, pipelines.list,
   pipelines.create, pipelines.execute, pipelines.read, pipelines.delete, pipelines.stop
6. Create a test pipeline for Canvas deletion:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for Canvas Run Deletion"
   - Fill in **Description** field: "Pipeline for testing run deletion in Canvas"
   - Add LLM node:
     - Click the **+ button** (plus button at top right corner)
     - Select **LLM** from node types
     - Configure the LLM node:
       - In **System** field enter: "You must create story"
       - In **Task** field enter: "Create some interesting long story"
       - Leave **Chat history** with default value
       - Leave Input/Output fields empty (or as default)
     - Click on the **3 dots** button (node-menu-action) on the created LLM node
       - **Note:** If the node is minimized and you cannot see the 3 dots button, first click the **maximize
         button** (located at the right side of the minimized node header) to expand the node, then the 3 dots
         button will be visible
     - Select **Make entrypoint** from the menu
     - Verify that a **path icon** (SVG) appears at the top left corner of the LLM node (this indicates the
       node is now an entrypoint)
     - Connect LLM node to END node (Optional - system does this automatically):
       - Drag from the output port of LLM node to the END node
   - Click **Save** button (top right)
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Verify "Test Pipeline for Canvas Run Deletion" appears in the pipelines list
7. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a message in the chat input field: "test conversation for deletion"
   - Click **Run** button
   - Wait for system to automatically name the conversation
   - Verify conversation appears in the CONVERSATIONS sidebar
8. Add pipeline to conversation and open Canvas:
   - In the conversation, locate the **PIPELINES** section in the right panel
   - Click the **Add pipeline** button
   - Select "Test Pipeline for Canvas Run Deletion" from the list
   - **Click on the added pipeline block** to select/activate it (pipeline becomes active participant)
9. Open Canvas of added pipeline
   - Hover over the pipeline block
   - Click the **Edit pipeline** button (pencil icon)
   - Verify Canvas opens with the pipeline in Flow Editor

### Test Steps

1. **Test Deletion from History List:**
2. **IMPORTANT:** Keep Canvas open during all pipeline executions - do not close it
3. Navigate to the chat interface (left panel) while keeping Canvas visible on the right side
4. Verify Canvas Flow Editor is open and visible on the right side of the screen
5. Execute pipeline twice from chat:
   - In the chat interface (left panel), type: "run first"
   - Click **Run** button (Run 1)
   - Wait for Run 1 to complete
   - **Keep Canvas open.** In the chat interface (left panel), type: "run second"
   - Click **Run** button (Run 2)
   - Wait for Run 2 to complete
6. Verify in Canvas Flow Editor:
   - History Icon is displayed
   - Run 2 chipset is displayed as current run
7. Click the **History Icon**
8. Verify the history list shows Run 1
9. Locate the **Delete icon** next to Run 1 in the history list
10. Click the **Delete icon** for Run 1
11. Confirm deletion if prompted
12. Verify Run 1 is immediately removed from the history list
13. Verify the history list is now empty (only Run 2 remains as current)
14. Close the history list
15. Verify History Icon disappears (only 1 run remains)
16. **Test Deletion from Current View:**
17. **Keep Canvas open.** Navigate to the chat interface (left panel)
18. Verify Canvas Flow Editor is still open and visible on the right side
19. Execute one more run to test current view deletion:

- In the chat interface (left panel), type: "run third"
- Click **Run** button (Run 1)
- Wait for Run 1 to complete

18. Verify Run 1 is now the current run and History Icon reappears
19. Locate the **Delete icon** next to Run 1 (current run)
20. Click the **Delete icon** for Run 1
21. Confirm deletion if prompted
22. Verify Run 1 chipset is removed from Canvas Flow Editor
23. Verify Run 2 now becomes the current run (previously in history)
24. Verify only Run 2 is visible now
25. Verify History Icon disappears (only 1 run remains)

### Expected Results

- **Deletion from History List:**
  - Runs 1 and 2 execute successfully from chat
  - History Icon appears when 2 runs exist
  - Delete icon is visible in history list
  - Run 1 is successfully deleted from history
  - History list becomes empty after deleting Run 1 (only Run 2 as current remains)
  - History Icon disappears when only 1 run remains
- **Deletion from Current View:**
  - Run 1 executes successfully, History Icon reappears
  - Delete icon is visible for current run (Run 1)
  - Clicking delete icon prompts for confirmation (if applicable)
  - Run 1 is removed from Canvas Flow Editor
  - Run 2 is promoted from history to current run
  - History Icon disappears when only 1 run remains
- All deletions persist correctly in Canvas
- No error messages occur for valid deletions

### Postconditions

1. Close the Canvas (if still open)
2. Delete the test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - If the CONVERSATIONS sidebar is collapsed, click the **>>** button (chevron icon) to expand it and show
     the conversations list
   - Hover over the test conversation in the CONVERSATIONS sidebar (the 3 dots menu will appear on hover)
   - Click on the **3 dots** (ellipsis menu) next to the test conversation
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
3. Delete the test pipeline:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline for Canvas Run Deletion**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for Canvas Run Deletion" is removed from the pipelines list
4. Verify no residual data remains from the test
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Deletion functionality in Canvas matches Pipelines Flow View behavior
- Clear user feedback is essential when deletion is blocked
- Two deletion scenarios covered: history list and current view
- **CRITICAL:** Canvas must remain open during all pipeline executions from chat
- **DO NOT** close Canvas when navigating to chat interface to execute pipelines
- Keep Canvas visible (side-by-side or separate window) throughout the test
- If Canvas closes accidentally, deletion testing cannot be performed

---

## Test Case ID: CPR-007

#### Test Case Name:

Verify in-progress run deletion restrictions in Canvas Flow Editor

#### Test Case Tags:

canvas,pipelines,runs,delete,validation,regression,in-progress

#### Test Case Priority:

High

#### Test Case Description

Verify that in-progress pipeline runs cannot be deleted from Canvas Flow Editor, and that deletion becomes
available after the run completes.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: conversations.create, conversations.read, conversations.delete, pipelines.list,
   pipelines.create, pipelines.execute, pipelines.read, pipelines.delete, pipelines.stop
6. Create a test pipeline for Canvas deletion restrictions:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for Canvas Deletion Restrictions"
   - Fill in **Description** field: "Pipeline for testing in-progress run deletion restrictions in Canvas"
   - Add LLM node:
     - Click the **+ button** (plus button at top right corner)
     - Select **LLM** from node types
     - Configure the LLM node:
       - In **System** field enter: "You must create story"
       - In **Task** field enter: "Create some interesting long story"
       - Leave **Chat history** with default value
       - Leave Input/Output fields empty (or as default)
     - Click on the **3 dots** button (node-menu-action) on the created LLM node
       - **Note:** If the node is minimized and you cannot see the 3 dots button, first click the **maximize
         button** (located at the right side of the minimized node header) to expand the node, then the 3 dots
         button will be visible
     - Select **Make entrypoint** from the menu
     - Verify that a **path icon** (SVG) appears at the top left corner of the LLM node (this indicates the
       node is now an entrypoint)
     - Connect LLM node to END node (Optional - system does this automatically):
       - Drag from the output port of LLM node to the END node
   - Click **Save** button (top right)
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Verify "Test Pipeline for Canvas Deletion Restrictions" appears in the pipelines list
7. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a message in the chat input field: "test conversation for deletion restrictions"
   - Click **Run** button
   - Wait for system to automatically name the conversation
   - Verify conversation appears in the CONVERSATIONS sidebar
8. Add pipeline to conversation and open Canvas:
   - In the conversation, locate the **PIPELINES** section in the right panel
   - Click the **Add pipeline** button
   - Select "Test Pipeline for Canvas Deletion Restrictions" from the list
   - **Click on the added pipeline block** to select/activate it (pipeline becomes active participant)
9. Open Canvas of added pipeline
   - Hover over the pipeline block
   - Click the **Edit pipeline** button (pencil icon)
   - Verify Canvas opens with the pipeline in Flow Editor

### Test Steps

1. **Test In-Progress Run Cannot Be Deleted:**
2. **IMPORTANT:** Keep Canvas open during all pipeline executions - do not close it
3. Navigate to the chat interface (left panel) while keeping Canvas visible on the right side
4. Verify Canvas Flow Editor is open and visible on the right side of the screen
5. In the chat interface (left panel), type: "run delete"
6. Click **Run** button (Run 1)
7. While Run 1 is in progress (blue loading icon), attempt to delete it:
   - Locate the **Delete icon** next to Run 1
   - Verify the delete icon is either hidden, disabled, or grayed out
8. If delete icon is visible and appears clickable, click it
9. Verify one of the following:
   - The deletion is blocked/prevented
   - An error message or warning is displayed indicating the run cannot be deleted while in progress
10. Wait for Run 1 to complete (green checkmark icon appears)
11. Verify the **Delete icon** is now enabled/available for Run 1
12. Click the **Delete icon** for Run 1
13. Confirm deletion if prompted
14. Verify Run 1 is successfully deleted after completion

### Expected Results

- **In-Progress Run Deletion Restrictions:**
  - Run 1 starts with blue loading icon (in-progress state)
  - Delete icon is hidden, disabled, or grayed out for in-progress runs
  - If deletion is attempted, an appropriate error/warning is displayed
  - System prevents deletion of active/running pipelines
  - After Run 1 completes (green checkmark), deletion becomes available
  - Completed runs can be deleted successfully
- Deletion restrictions protect active executions
- Clear visual feedback indicates when deletion is unavailable
- No error messages occur when deleting completed runs

### Postconditions

1. Close the Canvas (if still open)
2. Delete the test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - If the CONVERSATIONS sidebar is collapsed, click the **>>** button (chevron icon) to expand it and show
     the conversations list
   - Hover over the test conversation in the CONVERSATIONS sidebar (the 3 dots menu will appear on hover)
   - Click on the **3 dots** (ellipsis menu) next to the test conversation
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
3. Delete the test pipeline:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline for Canvas Deletion Restrictions**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for Canvas Deletion Restrictions" is removed from the pipelines list
4. Verify no residual data remains from the test
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Deletion restrictions prevent accidental removal of active runs
- Clear user feedback is essential when deletion is blocked
- **CRITICAL:** Canvas must remain open during pipeline execution from chat
- **DO NOT** close Canvas when navigating to chat interface to execute pipeline
- Keep Canvas visible (side-by-side or separate window) throughout the test
- If Canvas closes accidentally, deletion restriction testing cannot be performed
- This test validates critical safety feature preventing disruption of active pipeline executions

---
