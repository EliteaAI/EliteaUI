# Scenario ID: CANVAS-PIPE-RUN-003

#### Scenario Name:

Pipeline runs cleanup operations in Canvas

#### Scenario Tags:

canvas,pipelines,runs,cleanup,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates that pipeline run information is properly cleaned up when users close the Canvas or
navigate to the Configuration tab. It ensures no run data persists after cleanup operations.

## Test Case ID: CPR-004

#### Test Case Name:

Verify run information is cleaned when Canvas is closed or when navigating to Configuration tab

#### Test Case Tags:

canvas,pipelines,runs,cleanup,tabs,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that all pipeline run information (chipsets, History Icon, run data) is removed when the user closes
the Canvas or navigates to the Configuration tab within Canvas.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: conversations.create, conversations.read, conversations.delete, pipelines.list,
   pipelines.create, pipelines.execute, pipelines.read, pipelines.delete
6. Create a test pipeline for Canvas cleanup:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for Canvas Cleanup"
   - Fill in **Description** field: "Pipeline for testing run cleanup on Canvas close"
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
   - Verify "Test Pipeline for Canvas Cleanup" appears in the pipelines list
7. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a message in the chat input field: "test conversation for cleanup"
   - Click **Run** button
   - Wait for system to automatically name the conversation
   - Verify conversation appears in the CONVERSATIONS sidebar
8. Add pipeline to conversation and open Canvas:
   - In the conversation, locate the **PIPELINES** section in the right panel
   - Click the **Add pipeline** button
   - Select "Test Pipeline for Canvas Cleanup" from the list
   - **Click on the added pipeline block** to select/activate it (pipeline becomes active participant)
9. Open Canvas of added pipeline
   - Hover over the pipeline block
   - Click the **Edit pipeline** button (pencil icon)
   - Verify Canvas opens with the pipeline in Flow Editor

### Test Steps

1. **Test Canvas Close Cleanup:**
2. **IMPORTANT:** Keep Canvas open during pipeline executions - do not close it until instructed
3. With Canvas Flow Editor visible, verify no runs are visible initially
4. Navigate to the chat interface (left panel) while keeping Canvas visible
5. Verify Canvas Flow Editor is open and visible on the right side of the screen
6. Execute pipeline twice from chat to create runs:
   - In the chat interface (left panel), type: "run first"
   - Click **Run** button (Run 1)
   - Wait for Run 1 to complete
   - **Keep Canvas open.** In the chat interface (left panel), type: "run second"
   - Click **Run** button (Run 2)
   - Wait for Run 2 to complete
7. Verify in Canvas Flow Editor:
   - **History Icon** is displayed on the top-left side
   - **Run 2** chipset is displayed as current run
   - Run 2 shows green checkmark and "Run 2" label
8. Click the **History Icon**
9. Verify the history list shows Run 1
10. Close the history list
11. **NOW** close the Canvas window or tab (first time closing Canvas in this test)
12. Verify the Canvas is closed and user returns to chat view
13. Wait a few seconds for cleanup to process
14. Reopen the Canvas for the same pipeline:

- In the conversation, locate the **PIPELINES** section in the right panel
- Hover over the pipeline block
- Click the **Edit pipeline** button (pencil icon)

13. Verify Canvas opens with the pipeline in Flow Editor
14. Verify in Flow Editor:

- **No run chipsets** are visible
- **No History Icon** is present
- The Flow Editor is in a clean state (as if no runs were executed)

16. Verify the pipeline structure itself is preserved (nodes, connections)
17. **Test Configuration Tab Cleanup:**
18. **Keep Canvas open.** Navigate to the chat interface (left panel) while keeping Canvas visible
19. Verify Canvas Flow Editor is still open and visible on the right side
20. Execute pipeline once from chat to create a new run:

- In the chat interface (left panel), type: "run config"
- Click **Run** button (Run 3)
- Wait for execution to complete

19. Verify in Canvas Flow Editor:

- **Run 3** chipset is displayed as current run
- Run 3 shows green checkmark and "Run 3" label
- **No History Icon** is present (only 1 run exists after Canvas was reopened)

20. In Canvas, locate and click the **Configuration** tab
21. Verify Canvas switches to Configuration tab view
22. Verify in **Configuration** tab:

- **No run chipsets** are visible
- **No History Icon** is present
- Only pipeline configuration settings are displayed

23. Navigate back to **Flow Editor** tab in Canvas
24. Verify in **Flow Editor** tab:

- **No run chipsets** are visible
- **No History Icon** is present
- The run information has been cleared

25. Verify the pipeline visual structure (nodes, connections) is still intact

### Expected Results

- **Canvas Close Cleanup:**
  - Runs 1 and 2 execute successfully from chat
  - Before closing Canvas, run information is visible (History Icon, Run 2 chipset)
  - History list contains previous run (Run 1)
  - Canvas closes successfully
  - After reopening Canvas, all run information is cleared:
    - No run chipsets are displayed
    - No History Icon is present
    - Flow Editor shows clean state
  - Pipeline structure (nodes, connections) is preserved after cleanup
  - Run data cleanup is complete and permanent
- **Configuration Tab Cleanup:**
  - Run 3 executes successfully from chat
  - Before navigating to Configuration tab, Run 3 is visible in Flow Editor (no History Icon - only 1 run
    after Canvas reopen)
  - Navigation to Configuration tab is successful
  - Configuration tab does NOT display any run information
  - Configuration tab only shows pipeline configuration settings
  - After returning to Flow Editor from Configuration tab, run information is cleared:
    - No run chipsets are displayed
    - No History Icon is present
  - Pipeline visual structure (nodes, connections) is preserved
  - Run data cleanup occurs when navigating TO Configuration tab
- No residual run data from previous Canvas session or before cleanup
- Navigating to Configuration tab clears runs (even single run without History Icon)
- Run cleanup is permanent (does not restore on tab switch back or reopen)
- No error messages are displayed during cleanup, reopening, or tab navigation

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
   - Locate the pipeline with name **Test Pipeline for Canvas Cleanup**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for Canvas Cleanup" is removed from the pipelines list
4. Verify no residual data remains from the test
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Closing Canvas triggers complete cleanup of run information
- Configuration tab navigation also triggers run cleanup
- Pipeline structure is preserved, only run data is cleaned
- This behavior is intentional to prevent clutter and confusion
- Flow ↔ YAML navigation preserves runs, but Configuration tab navigation clears them
- This is intentional design to separate execution view from configuration view
- **CRITICAL:** Canvas must remain open during pipeline executions from chat (until instructed to close)
- **DO NOT** close Canvas accidentally when executing pipelines from chat interface
- Keep Canvas visible (side-by-side or separate window) to observe run information appearing
- First time Canvas is closed should be in step 10 (after verifying runs are displayed)

---
