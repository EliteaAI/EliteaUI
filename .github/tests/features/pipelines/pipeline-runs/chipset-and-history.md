# Scenario ID: PIPE-RUN-001

#### Scenario Name:

Pipeline run chipset display and history grouping

#### Scenario Tags:

pipelines,runs,ui,history,smoke

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the redesigned pipeline run chipset display and History Icon grouping functionality on
the Flow View. It ensures proper visualization of run numbers, status icons, chipset design elements, History
Icon visibility conditions, and current run separation according to the new UI specifications.

## Test Case ID: PR-001

#### Test Case Name:

Verify redesigned run chipset, History Icon appearance, and history list functionality

#### Test Case Tags:

pipelines,runs,ui,history,smoke

#### Test Case Priority:

High

#### Test Case Description

Verify that the redesigned run chipset displays with the correct status icon and run number format, that the
History Icon appears inside **Flow View** when 2 or more runs exist, and that clicking the History Icon
displays a list of grouped runs with their status, excluding the current run.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: pipelines.list, pipelines.create, pipelines.execute, pipelines.read
6. Create a test pipeline for run execution:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for Chipset and History"
   - Fill in **Description** field: "Pipeline for testing chipset display and history grouping"
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
   - Verify "Test Pipeline for Chipset and History" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline for Chipset and History"
3. Click on the pipeline to open it
4. Open the **Configuration** page:
   - Click on the **Configuration** tab in the top menu bar
   - Verify the **Flow View** (visual pipeline editor) is displayed
5. Verify no **History Icon** is present inside **Flow View** (**Configuration** page) (no runs executed yet)
6. Execute the pipeline (without leaving the Configuration page):
   - Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration**
     page
   - Type a message in the chat field (e.g., "run" or "go")
   - Press **Enter** or click the **arrow button** (send icon) on the right side of the input field
7. Observe the run chipset that appears on the Flow View
8. Verify the chipset displays the following elements:
   - Status icon (blue loading icon for in-progress state)
   - Run number label (e.g., "Run 1")
9. Wait for the pipeline execution to complete
10. Verify the status icon updates to reflect the completion state (green checkmark for success)
11. Verify the **History Icon** is NOT displayed inside **Flow View** (**Configuration** page) (only 1 run
    exists)
12. Verify only the current run chipset (Run 1) is visible
13. Execute the pipeline via chat input:

- Ensure you are on the pipeline **Configuration** page (Flow View)
- Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration** page
- Type a message in the chat field (e.g., "run" or "go")
- Press **Enter** or click the **arrow button** (send icon) on the right side of the input field again to
  execute the pipeline (Run 2)

14. Wait for Run 2 to complete successfully
15. Verify the **History Icon** NOW appears inside **Flow View** (**Configuration** page) on the top-left side
16. Verify the History Icon is positioned next to the current run (Run 2)
17. Verify **Run 2** (current run) is displayed separately
18. Verify Run 2 is positioned next to the History Icon but outside the history group
19. Execute the pipeline via chat input:

- Ensure you are on the pipeline **Configuration** page (Flow View)
- Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration** page
- Type a message in the chat field (e.g., "run" or "go")
- Press **Enter** or click the **arrow button** (send icon) on the right side of the input field a third time
  to execute the pipeline (Run 3)

20. Wait for Run 3 to complete
21. Verify **Run 3** (now the current run) is displayed separately next to the History Icon
22. Click on the **History Icon** inside **Flow View** (**Configuration** page)
23. Verify a list/dropdown opens showing grouped runs
24. Verify the list displays the following runs:

- **Run 1** with its status icon (green checkmark for success)
- **Run 2** with its status icon (green checkmark for success)

25. Verify each run in the list shows:

- Run number (e.g., "Run 1", "Run 2")
- Status icon indicating completion state

26. Verify **Run 3** (current run) is NOT included in the history list
27. Close the history list
28. Verify the History Icon returns to its normal state

### Expected Results

- The redesigned run chipset appears on the Flow View when pipeline execution starts
- The chipset displays a **Status Icon** on the left side indicating the current run state
- During execution, a **Blue Loading Icon** is displayed
- The chipset displays **Run # Details** (e.g., "Run 1") next to the status icon
- After successful completion, the status icon changes to a **Green Checkmark**
- The chipset layout follows the new design specifications
- No History Icon is displayed inside **Flow View** when 0 runs exist
- No History Icon is displayed inside **Flow View** when only 1 run exists
- History Icon appears immediately inside **Flow View** when the 2nd run completes
- History Icon is positioned on the top-left side inside **Flow View**
- History Icon is positioned next to the current run chipset
- The current run (most recent) is always displayed separately on the Flow View
- The current run chipset appears next to the History Icon
- The current run is NOT grouped under the History Icon
- When multiple runs exist (2 or more), the History Icon appears inside **Flow View** on the top-left
- Previous runs (Run 1, Run 2) are accessible through the History Icon
- The current run remains visible and easily accessible
- Clicking the History Icon opens a list of grouped runs
- The list displays all completed/inactive runs except the current run
- Each run entry shows the run number (e.g., "Run 1", "Run 2")
- Each run entry displays its status icon (green checkmark for successful runs)
- Status icons are visually clear and match the run's completion state
- The current run (Run 3) is not included in the history list
- The list is properly formatted and readable
- Closing the list returns the UI to the normal state
- No error messages are displayed

### Postconditions

1. Delete the test pipeline created during preconditions:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline for Chipset and History**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for Chipset and History" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- This test validates the core redesigned chipset UI elements, History Icon visibility threshold, and history
  list content
- Status icons must be visually distinct and follow the design specifications
- The 2-run threshold is critical for History Icon visibility
- Current run visibility is critical for user workflow
- Run 1 becomes part of history after Run 2 completes
- History list should only contain completed or stopped runs
- Current active run is always excluded from history

---
