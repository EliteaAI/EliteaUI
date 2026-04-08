# Scenario ID: PIPE-RUN-005

#### Scenario Name:

Pipeline runs persistence during tab switching

#### Scenario Tags:

pipelines,runs,ui,tabs,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates that pipeline run chipsets, History Icon, and run numbers persist correctly when
switching between Flow View and YAML View tabs. It ensures no loss of run data during tab navigation.

## Test Case ID: PR-010

#### Test Case Name:

Verify runs persist when switching between Flow and YAML tabs

#### Test Case Tags:

pipelines,runs,ui,tabs,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that pipeline run chipsets, History Icon, and run numbers remain visible and accessible when switching
between Flow View and YAML View tabs, ensuring no data loss during tab navigation.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: pipelines.list, pipelines.create, pipelines.execute, pipelines.read
6. Create a test pipeline for tab switching testing:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for Tab Switching"
   - Fill in **Description** field: "Pipeline for testing run persistence during tab switching"
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
   - Verify "Test Pipeline for Tab Switching" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline for Tab Switching"
3. Click on the pipeline to open it
4. Open the **Configuration** page:
   - Click on the **Configuration** tab in the top menu bar
   - Verify the **Flow View** (visual pipeline editor) is displayed
5. Execute the pipeline multiple times to create runs with history:
   - Ensure you are on the pipeline **Configuration** page (Flow View)
   - Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration**
     page
   - Type a message in the chat field (e.g., "run" or "go")
   - Press **Enter** or click the **arrow button** (send icon) on the right side of the input field to execute
     (Run 1)
   - Wait for Run 1 to complete successfully
   - Ensure you are on the pipeline **Configuration** page (Flow View)
   - Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration**
     page
   - Type a message in the chat field (e.g., "run" or "go")
   - Press **Enter** or click the **arrow button** (send icon) on the right side of the input field to execute
     (Run 2)
   - Wait for Run 2 to complete successfully
6. Verify in **Flow View** tab:
   - **History Icon** is displayed inside **Flow View** on the top-left side
   - **Run 2** chipset is displayed separately next to the History Icon
   - Run 2 shows status icon (green checkmark) and run number
7. Note the state of run displays in Flow View:
   - Count of visible run chipsets (1 current run: Run 2)
   - Presence of History Icon
   - Run numbers displayed
8. Switch to **YAML View**:
   - Click on the **YAML View** tab in the Configuration page tabs
   - Verify YAML content is displayed
9. Verify in **YAML View** tab:
   - **History Icon** remains visible inside **YAML View** on the top-left side
   - **Run 2** chipset remains displayed separately next to the History Icon
   - Run 2 shows status icon (green checkmark) and run number
   - All run information persists correctly
10. Click on the **History Icon** inside **YAML View**
11. Verify the history list opens and displays:

- **Run 1** with status icon
- **Run 2** is NOT in the history list (current run)

12. Close the history list
13. Switch back to **Flow View**:

- Click on the **Flow View** tab in the Configuration page tabs
- Verify Flow View visual editor is displayed

14. Verify in **Flow View** tab (after returning):

- **History Icon** is still displayed inside **Flow View** on the top-left side
- **Run 2** chipset is still displayed separately next to the History Icon
- Run 2 still shows status icon (green checkmark) and run number
- All run information matches the state before switching tabs

15. Click on the **History Icon** inside **Flow View**
16. Verify the history list opens and displays:

- **Run 1** with status icon
- **Run 2** is NOT in the history list (current run)

17. Close the history list

### Expected Results

- Pipeline run chipsets persist when switching from Flow View to YAML View
- History Icon remains visible inside both **Flow View** and **YAML View** on the top-left side
- Current run chipset (Run 2) is displayed separately in both views
- Run numbers and status icons remain accurate in both views
- History list accessible from both Flow View and YAML View
- History list displays correct grouped runs (Run 1) in both views
- Current run (Run 2) is NOT included in history list in either view
- Switching back to Flow View preserves all run information
- Run information matches exactly before and after tab switching
- No runs are lost during tab navigation
- No duplicate runs appear during tab navigation
- All visual elements (chipsets, icons, numbers) render correctly in both views
- No error messages are displayed

### Postconditions

1. Delete the test pipeline created during preconditions:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline for Tab Switching**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for Tab Switching" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Tab switching should not affect run data persistence
- Both Flow View and YAML View must display identical run information
- History Icon functionality must work consistently across both views
- **IMPORTANT**: All pipeline executions must be done via chat input in the Configuration tab (Flow View).
  Never use the Run tab for testing pipeline runs functionality
