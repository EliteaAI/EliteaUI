# Scenario ID: CANVAS-PIPE-RUN-001

#### Scenario Name:

Pipeline run display in Canvas Flow Editor from chat execution

#### Scenario Tags:

canvas,pipelines,runs,chat,ui,smoke

#### Scenario Priority:

High

#### Scenario Description

This scenario validates that pipeline runs executed from chat conversations appear in the Canvas Flow Editor
when the same pipeline is open in Canvas. It ensures proper chipset display, History Icon grouping, and
context awareness for matching pipelines.

## Test Case ID: CPR-001

#### Test Case Name:

Verify pipeline run appears in Canvas Flow Editor when executed from chat

#### Test Case Tags:

canvas,pipelines,runs,chat,smoke

#### Test Case Priority:

High

#### Test Case Description

Verify that when a pipeline is executed from a chat conversation and the same pipeline is open in Canvas Flow
Editor, the run information appears in the Canvas with proper chipset display.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: conversations.create, conversations.read, conversations.delete, pipelines.list,
   pipelines.create, pipelines.execute, pipelines.read, pipelines.delete
6. Create a test pipeline for Canvas run display:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for Canvas Run Display"
   - Fill in **Description** field: "Pipeline for testing run display in Canvas from chat"
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
   - Verify "Test Pipeline for Canvas Run Display" appears in the pipelines list
7. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a message in the chat input field: "test conversation"
   - Click **Run** button
   - Wait for system to automatically name the conversation
   - Verify conversation appears in the CONVERSATIONS sidebar

### Test Steps

1. In the conversation, locate the **PIPELINES** section in the right panel
2. Click the **Add pipeline** button
3. Select "Test Pipeline for Canvas Run Display" from the pipeline list
4. Verify the pipeline block appears in the PIPELINES section
5. **Click on the added pipeline block** to select/activate it (pipeline becomes active participant)
6. Hover over the pipeline block (do NOT click the block itself again)
7. Observe the **Edit pipeline** button (pencil icon) appears on hover
8. Click the **Edit pipeline** button (pencil icon)
9. Verify Canvas opens in a new view with the pipeline
10. Verify the **Flow Editor** tab is active (showing the visual pipeline editor)
11. Verify no run chipsets are visible initially (no runs executed yet)
12. Verify no **History Icon** is present in the Flow Editor
13. Keep the Canvas window open and visible
14. **IMPORTANT:** Do NOT close Canvas. Navigate back to chat interface (left panel) while keeping Canvas
    visible on the right side or in a separate window
15. Verify Canvas Flow Editor is open and visible on the right side of the screen
16. In the chat interface (left panel), type a message: "run test"
17. Click **Run** button to execute the pipeline
18. Switch focus back to Canvas Flow Editor (right side)
19. Observe the Flow Editor as the pipeline executes
20. Verify a run chipset appears in the Flow Editor during execution
21. Verify the chipset displays:

- **Blue loading icon** (indicating in-progress state)
- **Run number**: "Run 1"

20. Wait for the pipeline execution to complete
21. Verify the status icon updates to **green checkmark** (success)
22. Verify the run chipset remains visible with "Run 1" and green checkmark
23. Verify the chipset is positioned on the right side of the Flow Editor
24. Verify no **History Icon** appears yet (only 1 run exists)

### Expected Results

- Pipeline can be added to chat conversation participants successfully
- Hovering over pipeline block reveals the **Edit pipeline** button (pencil icon)
- Clicking the pencil icon opens Canvas with the pipeline
- Canvas displays the pipeline in **Flow Editor** tab
- Initially, no run chipsets or History Icon are visible in Flow Editor
- When pipeline is executed from chat, run information appears in Canvas Flow Editor
- Run chipset appears immediately when execution starts
- Chipset displays **blue loading icon** during execution
- Chipset displays **Run 1** (run number)
- After completion, status icon changes to **green checkmark**
- Run chipset remains visible after execution completes
- Run information only appears because executed pipeline matches opened pipeline in Canvas
- No **History Icon** is displayed when only 1 run exists
- The run display in Canvas matches the design from Pipelines Flow View
- No error messages are displayed

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
   - Locate the pipeline with name **Test Pipeline for Canvas Run Display**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for Canvas Run Display" is removed from the pipelines list
4. Verify no residual data remains from the test
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Canvas must remain open to see run information appear
- **CRITICAL:** Do NOT close Canvas when switching to chat interface - keep both visible
- If Canvas closes accidentally during test, run information will not appear
- Execution must be from chat interface, not from Canvas
- Run information only appears if executed pipeline matches opened pipeline in Canvas
- Canvas can be positioned side-by-side with chat or in a separate browser tab/window

---

## Test Case ID: CPR-002

#### Test Case Name:

Verify multiple runs display with History Icon grouping and tab persistence in Canvas

#### Test Case Tags:

canvas,pipelines,runs,chat,history,tabs,smoke

#### Test Case Priority:

High

#### Test Case Description

Verify that when multiple pipeline runs are executed from chat while Canvas is open, the History Icon appears,
completed runs are grouped under it, the current run is displayed separately, and all run information persists
when switching between Flow Editor and YAML tabs.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: conversations.create, conversations.read, conversations.delete, pipelines.list,
   pipelines.create, pipelines.execute, pipelines.read, pipelines.delete
6. Create a test pipeline for Canvas multiple runs:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for Canvas Multiple Runs"
   - Fill in **Description** field: "Pipeline for testing multiple runs and History Icon in Canvas"
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
   - Verify "Test Pipeline for Canvas Multiple Runs" appears in the pipelines list
7. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a message in the chat input field: "test conversation for multiple runs"
   - Click **Run** button
   - Wait for system to automatically name the conversation
   - Verify conversation appears in the CONVERSATIONS sidebar
8. Add pipeline to conversation and open Canvas:
   - In the conversation, locate the **PIPELINES** section in the right panel
   - Click the **Add pipeline** button
   - Select "Test Pipeline for Canvas Multiple Runs" from the list
   - **Click on the added pipeline block** to select/activate it (pipeline becomes active participant)
   - Hover over the pipeline block
   - Click the **Edit pipeline** button (pencil icon)
   - Verify Canvas opens with the pipeline in Flow Editor

### Test Steps

1. **IMPORTANT:** Keep Canvas Flow Editor open throughout the entire test - do not close it
2. With Canvas Flow Editor visible, verify no runs are visible initially
3. Navigate to the chat interface (left panel) while keeping Canvas visible on the right side
4. Verify Canvas Flow Editor is open and visible on the right side of the screen
5. In the chat interface (left panel), type a message: "run test"
6. Click **Run** button to execute the pipeline (Run 1)
7. Observe Canvas Flow Editor and wait for Run 1 to complete
8. Verify Run 1 chipset appears with green checkmark
9. Verify no **History Icon** is present yet (only 1 run)
10. **Keep Canvas open.** In the chat interface (left panel), type another message: "run second"
11. Click **Run** button to execute the pipeline (Run 2)
12. Wait for Run 2 to complete successfully
13. Verify in Canvas Flow Editor:

- **History Icon** now appears on the top-left side of Flow Editor
- **Run 2** chipset is displayed separately next to the History Icon
- Run 2 shows green checkmark and "Run 2" label

11. Verify **Run 1** is no longer visible on the main view (grouped in history)
12. Click the **History Icon** in Canvas Flow Editor
13. Verify a history list/dropdown opens
14. Verify the history list displays:

- **Run 1** with green checkmark and "Run 1" label

15. Verify **Run 2** is NOT included in the history list (it's the current run)
16. Close the history list
17. **Keep Canvas open.** Verify Canvas is still visible on the right side
18. In the chat interface (left panel), type a third message: "run third"
19. Click **Run** button to execute the pipeline (Run 3)
20. Wait for Run 3 to complete successfully
21. Verify in Canvas Flow Editor:

- **History Icon** remains visible on the top-left
- **Run 3** chipset is now displayed separately (current run)
- Run 3 shows green checkmark and "Run 3" label

21. Click the **History Icon**
22. Verify the history list now displays:

- **Run 1** with status icon
- **Run 2** with status icon

23. Verify **Run 3** is NOT in the history list (current run)
24. Verify each run in the history shows its run number and status icon clearly
25. Close the history list
26. **Test Tab Persistence:**
27. In Canvas, click the **YAML** tab
28. Verify the Canvas switches to YAML view showing YAML code
29. Switch back to **Flow Editor** tab in Canvas
30. Verify the Canvas returns to Flow Editor visual view
31. Verify in **Flow Editor** tab (after returning from YAML):

- **History Icon** is still displayed on the top-left side
- **Run 3** chipset is still displayed separately next to the History Icon
- Run 3 still shows green checkmark and "Run 3" label
- All run information is preserved (nothing lost during tab switch)

32. Click the **History Icon**
33. Verify the history list still shows Run 1 and Run 2 with correct status icons
34. Close the history list

### Expected Results

- First run (Run 1) appears in Canvas Flow Editor after execution
- No History Icon appears when only 1 run exists
- After Run 2 completes, **History Icon** appears on the top-left of Flow Editor
- History Icon appears immediately when the 2nd run completes
- **Run 2** (current run) is displayed separately next to History Icon
- Previous run (Run 1) is no longer visible on main view
- Clicking History Icon opens a list of grouped runs
- History list displays **Run 1** with its status icon and run number
- Current run (Run 2) is NOT included in the history list
- After Run 3 completes, Run 3 becomes the current run displayed separately
- History list updates to show both Run 1 and Run 2
- Current run (Run 3) is NOT in the history list
- All runs show proper status icons (green checkmark for success)
- Run numbers are clearly labeled (Run 1, Run 2, Run 3)
- History Icon remains accessible for viewing grouped runs
- The UI matches the design specifications from Pipelines Flow View
- **Tab Persistence:**
  - Switching to YAML tab works successfully
  - Switching back to Flow Editor tab works successfully
  - After returning to Flow Editor from YAML tab, all run information is preserved:
    - History Icon remains visible on the top-left side
    - Current run chipset (Run 3) is still displayed separately
    - Run 3 shows correct status (green checkmark) and label
    - History list is still accessible and functional
    - History list still contains Run 1 and Run 2 with correct status icons
    - Current run (Run 3) is NOT included in history list
    - No runs are lost during tab navigation
    - No duplicate runs appear during tab navigation
- No error messages are displayed

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
   - Locate the pipeline with name **Test Pipeline for Canvas Multiple Runs**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for Canvas Multiple Runs" is removed from the pipelines list
4. Verify no residual data remains from the test
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- History Icon threshold is 2 runs (appears when 2nd run completes)
- Current run is always displayed separately, never grouped in history
- History Icon functionality in Canvas matches Pipelines Flow View behavior
- Tab persistence test verifies that run information survives Flow ↔ YAML tab switching
- The focus is on Flow Editor tab showing runs after returning from YAML tab
- **CRITICAL:** Canvas must remain open during all pipeline executions from chat
- **DO NOT** close Canvas when navigating to chat interface to execute pipelines
- If Canvas closes, run information will not appear and test will fail
- Keep Canvas visible (side-by-side or separate window) throughout the test

---
