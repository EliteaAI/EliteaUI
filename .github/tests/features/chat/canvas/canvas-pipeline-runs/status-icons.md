# Scenario ID: CANVAS-PIPE-RUN-004

#### Scenario Name:

Pipeline run status indicators in Canvas

#### Scenario Tags:

canvas,pipelines,runs,status,ui,smoke

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the status indicator icons for pipeline runs in Canvas Flow Editor. It ensures proper
visual representation for different run states: blue loading (in-progress), green checkmark (success), red
info icon (error), and orange stop icon (stopped).

## Test Case ID: CPR-005

#### Test Case Name:

Verify status icons display correctly in Canvas Flow Editor

#### Test Case Tags:

canvas,pipelines,runs,status,ui,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that pipeline runs executed from chat display the correct status icons in Canvas Flow Editor for
different run states: blue loading (in-progress), green checkmark (success), red info icon (error), and orange
stop icon (stopped).

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: conversations.create, conversations.read, conversations.delete, pipelines.list,
   pipelines.create, pipelines.execute, pipelines.read, pipelines.delete, pipelines.stop
6. Create a test pipeline for Canvas status testing:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for Canvas Status Icons"
   - Fill in **Description** field: "Pipeline for testing status indicators in Canvas"
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
   - Verify "Test Pipeline for Canvas Status Icons" appears in the pipelines list
7. Create a test conversation:
   - Navigate to the **Chat** page (sidebar or main menu)
   - Click on the **+Create** button (sidebar or main menu)
   - Type a message in the chat input field: "test conversation for status"
   - Click **Run** button
   - Wait for system to automatically name the conversation
   - Verify conversation appears in the CONVERSATIONS sidebar
8. Add pipeline to conversation and open Canvas:
   - In the conversation, locate the **PIPELINES** section in the right panel
   - Click the **Add pipeline** button
   - Select "Test Pipeline for Canvas Status Icons" from the list
   - **Click on the added pipeline block** to select/activate it (pipeline becomes active participant)
   - Hover over the pipeline block
   - Click the **Edit pipeline** button (pencil icon)
   - Verify Canvas opens with the pipeline in Flow Editor

### Test Steps

1. **Test Blue Loading Icon (In-Progress):**
2. **IMPORTANT:** Keep Canvas open during all pipeline executions - do not close it
3. Navigate to the chat interface (left panel) while keeping Canvas visible on the right side
4. Verify Canvas Flow Editor is open and visible on the right side of the screen
5. In the chat interface (left panel), type a message: "run test"
6. Click **Run** button to start execution
7. Immediately switch focus to Canvas Flow Editor
8. Observe the run chipset that appears during execution
9. Verify the chipset displays:
   - **Blue loading icon** (indicating in-progress state)
   - Run number "Run 1"
10. Verify the blue loading icon may be animated (spinning/pulsing)
11. Wait for Run 1 to complete
12. **Test Green Checkmark Icon (Success):**
13. Verify after completion, the status icon updates to **green checkmark**
14. Verify the chipset now shows:

- **Green checkmark icon** (indicating success)
- Run number "Run 1"

14. Verify the green checkmark is clearly visible and recognizable
15. **Test Red Info Icon (Error):**
16. Navigate to the pipeline in Canvas Flow Editor
17. Modify the LLM node to cause an error:

- Click on the LLM node to edit it
- Clear the **Task** field (leave it empty)
- **Save** the change using button "Save" at top right
- Verify the LLM node shows the **Task** field is now empty (changes were applied)

18. **Keep Canvas open.** Navigate to the chat interface (left panel)
19. Verify Canvas Flow Editor is still open and visible on the right side
20. In the chat interface (left panel), type: "run error"
21. Click **Run** button (Run 2)
22. Wait for execution to fail
23. Observe Canvas Flow Editor
24. Verify the chipset displays:

- **Red info icon** (indicating error)
- Run number "Run 2"

24. Verify the red icon clearly indicates an error state
25. **Test Orange Stop Icon (Manually Stopped):**
26. Fix the pipeline configuration:

- In Canvas, edit the LLM node
- Re-enter the **Task** field: "Create some interesting long story"
- **Save** the change using button "Save" at top right
- Verify the LLM node shows the **Task** field has the new value (changes were applied)

27. **Keep Canvas open.** Navigate to the chat interface (left panel)
28. Verify Canvas Flow Editor is still open and visible on the right side
29. In the chat interface (left panel), type: "run stop"
30. Click **Run** button (Run 3)
31. While Run 3 is in progress (blue loading icon), locate the **Stop** button in Canvas or chat
32. Click the **Stop** button to manually stop the execution
33. Confirm the stop action if prompted
34. Wait for the run to stop
35. Verify the chipset displays:

- **Orange stop icon** (indicating manually stopped)
- Run number "Run 3"

31. Verify the orange color is distinct from other status colors

### Expected Results

- **Blue Loading Icon:**
  - Appears immediately when pipeline execution starts from chat
  - Clearly indicates in-progress state
  - May be animated (spinning, pulsing)
  - Displayed with run number in Canvas Flow Editor
- **Green Checkmark Icon:**
  - Appears after successful pipeline completion
  - Clearly indicates success state
  - Green color is visually distinct
  - Replaces blue loading icon after completion
- **Red Info Icon:**
  - Appears when pipeline execution encounters an error
  - Clearly indicates error state
  - Red color is visually distinct and associated with errors
  - Displayed with run number for failed runs
- **Orange Stop Icon:**
  - Appears when pipeline run is manually stopped by user
  - Clearly indicates stopped state
  - Orange color is distinct from other status colors
  - Differentiates manual stops from errors
- All status icons are clearly visible in Canvas Flow Editor
- Status icons in Canvas match the design from Pipelines Flow View
- Icons update dynamically as run state changes
- Each icon is easily recognizable and unambiguous
- No error messages interfere with icon display

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
   - Locate the pipeline with name **Test Pipeline for Canvas Status Icons**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for Canvas Status Icons" is removed from the pipelines list
4. Verify no residual data remains from the test
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Status icons provide critical visual feedback for run states
- Icons must be clearly distinguishable and match design specifications
- Canvas status indicators match Pipelines Flow View design
- All four status states are tested: in-progress, success, error, and stopped
- **CRITICAL:** Canvas must remain open during all pipeline executions from chat
- **DO NOT** close Canvas when navigating to chat interface to execute pipelines
- Keep Canvas visible (side-by-side or separate window) throughout the test
- If Canvas closes accidentally, status icons will not be visible and test will fail

---
