# Scenario ID: CANVAS-PIPE-RUN-006

#### Scenario Name:

Pipeline run details popup in Canvas Flow Editor

#### Scenario Tags:

canvas,pipelines,runs,popup,ui,regression

#### Scenario Priority:

Medium

#### Scenario Description

This scenario validates the run details popup functionality in Canvas Flow Editor, ensuring comprehensive run
information is accessible when clicking run chipsets from both current view and history list.

## Test Case ID: CPR-008

#### Test Case Name:

Verify run details popup opens and displays information in Canvas

#### Test Case Tags:

canvas,pipelines,runs,popup,ui,regression

#### Test Case Priority:

Medium

#### Test Case Description

Verify that clicking on pipeline run chipsets in Canvas Flow Editor opens a popup displaying detailed run
information including input/output data, status, and timestamps, accessible from both current run and history
list.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: conversations.create, conversations.read, conversations.delete, pipelines.list,
   pipelines.create, pipelines.execute, pipelines.read, pipelines.delete
6. Create a test pipeline for Canvas popup testing:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for Canvas Run Details"
   - Fill in **Description** field: "Pipeline for testing run details popup in Canvas"
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
   - Verify "Test Pipeline for Canvas Run Details" appears in the pipelines list
7. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a message in the chat input field: "test conversation for popup"
   - Click **Run** button
   - Wait for system to automatically name the conversation
   - Verify conversation appears in the CONVERSATIONS sidebar
8. Add pipeline to conversation and open Canvas:
   - In the conversation, locate the **PIPELINES** section in the right panel
   - Click the **Add pipeline** button
   - Select "Test Pipeline for Canvas Run Details" from the list
   - **Click on the added pipeline block** to select/activate it (pipeline becomes active participant)
   - Hover over the pipeline block
   - Click the **Edit pipeline** button (pencil icon)
   - Verify Canvas opens with the pipeline in Flow Editor

### Test Steps

1. **IMPORTANT:** Keep Canvas open during all pipeline executions - do not close it
2. Navigate to the chat interface (left panel) while keeping Canvas visible on the right side
3. Verify Canvas Flow Editor is open and visible on the right side of the screen
4. Execute pipeline from chat:
   - In the chat interface (left panel), type: "run first"
   - Click **Run** button (Run 1)
   - Wait for Run 1 to complete
5. Verify in Canvas Flow Editor:
   - Run 1 chipset is displayed with green checkmark
6. **Prepare Error Run:**
7. Modify the pipeline to cause an error:
   - In Canvas, edit the LLM node
   - Clear the **Task** field (leave empty)
   - Save the change using **Save** button
   - Verify the LLM node shows the **Task** field is now empty (changes were applied)
8. **Keep Canvas open.** Navigate to the chat interface (left panel)
9. In the chat interface (left panel), type: "run error"
10. Click **Run** button (Run 2)
11. Wait for Run 2 to fail (red info icon)
12. Verify in Canvas Flow Editor:

- History Icon is displayed
- Run 2 chipset is displayed as current run with red info icon
- Run 1 is now in history

13. **Test Popup from History List (Successful Run):**
14. Click the **History Icon** in Canvas Flow Editor
15. Verify the history list displays Run 1
16. Click on **Run 1** in the history list
17. Verify a popup opens displaying Run 1 details:

- Title: "Run 1 Details"
- **Status**: "Completed" with green checkmark icon
- **Timeline step** showing the LLM node name (e.g., "LLM2")
- **Timestamp** for Run 1
- **States section** with:
  - **Before**: Shows empty state ("" or no data)
  - **After**: Shows the chat message sent ("run first")

18. Verify the data is specific to Run 1 (chat message "run first")
19. Close the Run 1 details popup
20. Close the history list
21. Verify the history list closed.
22. **Test Popup from Current Run (Error Run):**
23. Click on the **Run 2 chipset** in Canvas (current run with red info icon)
24. Verify the popup opens and displays:

- Title: "Run 2 Details"
- **Status**: "Error" or "Failed" with red info icon
- **Timeline step** showing the LLM node name
- **Timestamp** for Run 2
- **Error details section** with error message
- **States section** with:
  - **Before**: Shows empty state
  - **After**: Shows the chat message sent ("run error")

25. Verify error information is clear and useful for debugging
26. Close the popup

### Expected Results

- Clicking run chipsets (current or from history list) opens a popup window
- Popup displays correct title (e.g., "Run 2 Details")
- Popup shows **Status** with corresponding icon (green checkmark for success, red for error)
- Popup shows **Timeline step** with node name (e.g., "LLM2") and **Timestamp**
- Popup includes **States section**:
  - **Before**: Initial state (empty or previous data)
  - **After**: Chat message that triggered the run
- Each popup displays data specific to its run (correct chat message in "After" state)
- For failed runs, popup includes **Error details section** with error message
- Popup can be closed (click outside or close mechanism)
- All data is clearly formatted and readable
- No error messages during normal popup operations

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
   - Locate the pipeline with name **Test Pipeline for Canvas Run Details**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for Canvas Run Details" is removed from the pipelines list
4. Verify no residual data remains from the test
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Run details popup provides essential information for reviewing executions
- Popup must display correct data for each specific run
- Error details are critical for debugging failed runs
- Popup functionality in Canvas should match Pipelines Flow View implementation
- **CRITICAL:** Canvas must remain open during all pipeline executions from chat
- **DO NOT** close Canvas when navigating to chat interface to execute pipelines
- Keep Canvas visible (side-by-side or separate window) throughout the test
- If Canvas closes accidentally, run popups cannot be tested

---
