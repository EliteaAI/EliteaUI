# Scenario ID: PIPE-RUN-002

#### Scenario Name:

Pipeline run status indicators and icon display

#### Scenario Tags:

pipelines,runs,status,ui,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the status indicator icons for pipeline runs across all possible states. It ensures
proper visual representation and icon updates for in-progress, success, error, and stopped states according to
design specifications.

## Test Case ID: PR-002

#### Test Case Name:

Verify blue loading icon displays for in-progress run

#### Test Case Tags:

pipelines,runs,status,ui,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that a blue loading icon is displayed in the run chipset when a pipeline run is in progress.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: pipelines.list, pipelines.create, pipelines.execute, pipelines.read
6. Create a test pipeline with longer execution time:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for In-Progress Status"
   - Fill in **Description** field: "Pipeline for testing in-progress status icon"
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
   - Verify "Test Pipeline for In-Progress Status" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline for In-Progress Status"
3. Click on the pipeline to open it
4. Open the **Configuration** page:
   - Click on the **Configuration** tab in the top menu bar
   - Verify the **Flow View** (visual pipeline editor) is displayed
5. Start pipeline execution (without leaving the Configuration page):
   - Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration**
     page
   - Type a message in the chat field (e.g., "run" or "go")
   - Press **Enter** or click the **arrow button** (send icon) on the right side of the input field
6. Immediately observe the run chipset that appears
7. Verify the status icon displayed in the chipset
8. Confirm the icon shows a **Blue Loading Icon** (indicating in-progress state)
9. Verify the icon is animated or visually indicates ongoing processing
10. Verify the run chipset shows "Run 1" along with the blue loading icon
11. While the run is in progress, verify the blue loading icon remains visible
12. Wait for the pipeline execution to complete
13. Verify the status icon changes from blue loading to the appropriate completion icon

### Expected Results

- When pipeline execution starts, a run chipset appears immediately
- The chipset displays a **Blue Loading Icon** on the left side
- The blue loading icon clearly indicates the run is in progress
- The icon may be animated (e.g., spinning) to show active processing
- The run number "Run 1" is displayed next to the blue loading icon
- The blue loading icon remains visible throughout the entire execution
- After execution completes, the icon updates to the appropriate completion state
- The blue color is visually distinct from other status colors
- No error messages are displayed

### Postconditions

1. Delete the test pipeline created during preconditions:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline for In-Progress Status**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for In-Progress Status" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Blue loading icon is critical for user awareness of active processing
- Icon should be clearly visible and distinguishable
- **IMPORTANT**: All pipeline executions must be done via chat input in the Configuration tab (Flow View).
  Never use the Run tab for testing pipeline runs functionality

---

## Test Case ID: PR-003

#### Test Case Name:

Verify green checkmark icon displays for successful run

#### Test Case Tags:

pipelines,runs,status,ui,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that a green checkmark icon is displayed in the run chipset when a pipeline run completes successfully.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: pipelines.list, pipelines.create, pipelines.execute, pipelines.read
6. Create a test pipeline that will complete successfully:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for Success Status"
   - Fill in **Description** field: "Pipeline for testing success status icon"
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
   - Verify "Test Pipeline for Success Status" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline for Success Status"
3. Click on the pipeline to open it
4. Open the **Configuration** page:
   - Click on the **Configuration** tab in the top menu bar
   - Verify the **Flow View** (visual pipeline editor) is displayed
5. Execute the pipeline (without leaving the Configuration page):
   - Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration**
     page
   - Type a message in the chat field (e.g., "run" or "go")
   - Press **Enter** or click the **arrow button** (send icon) on the right side of the input field
6. Observe the run chipset initially shows a blue loading icon
7. Wait for the pipeline execution to complete successfully
8. Verify the status icon in the run chipset updates
9. Confirm the icon now shows a **Green Checkmark** (indicating success)
10. Verify the run chipset still displays "Run 1" along with the green checkmark
11. Execute the pipeline again (Run 2) via chat input:

- Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration** page
- Type a message (e.g., "run" or "go") and press **Enter**

12. Wait for Run 2 to complete successfully
13. Verify Run 2 also displays a green checkmark icon
14. Click the **History Icon** inside **Flow View** (**Configuration** page)to view previous runs
15. Verify Run 1 in the history list also displays a green checkmark icon

### Expected Results

- After successful pipeline execution, the status icon updates to a **Green Checkmark**
- The green checkmark is clearly visible and indicates successful completion
- The run number remains displayed next to the green checkmark
- The green checkmark icon persists after completion (does not revert)
- Multiple successful runs all display green checkmark icons
- Runs in the history list also show green checkmark icons for successful executions
- The green color is visually distinct and associated with success
- No error messages are displayed

### Postconditions

1. Delete the test pipeline created during preconditions:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline for Success Status**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for Success Status" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Green checkmark is the primary success indicator
- Icon should be immediately recognizable as positive completion

---

## Test Case ID: PR-004

#### Test Case Name:

Verify red info icon displays for run with error

#### Test Case Tags:

pipelines,runs,status,ui,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that a red info icon is displayed in the run chipset when a pipeline run encounters an error during
execution.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: pipelines.list, pipelines.create, pipelines.execute, pipelines.read
6. Create a test pipeline that will generate an error:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for Error Status"
   - Fill in **Description** field: "Pipeline for testing error status icon"
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
   - Verify "Test Pipeline for Error Status" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline for Error Status"
3. Click on the pipeline to open it
4. Open the **Configuration** page:
   - Click on the **Configuration** tab in the top menu bar
   - Verify the **Flow View** (visual pipeline editor) is displayed
   - Make sure **Task** field of LLM node is: "" and then **Save**
5. Execute the pipeline (without leaving the Configuration page):
   - Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration**
     page
   - Type a message in the chat field (e.g., "run" or "go")
   - Press **Enter** or click the **arrow button** (send icon) on the right side of the input field
6. Observe the run chipset initially shows a blue loading icon
7. Wait for the pipeline execution to fail with an error
8. Verify the status icon in the run chipset updates
9. Confirm the icon now shows a **Red Info Icon** (indicating error)
10. Verify the run chipset displays "Run 1" along with the red info icon
11. Verify the red color clearly indicates an error state
12. Execute the pipeline again (Run 2) via chat input to generate another error:

- Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration** page
- Type a message (e.g., "run" or "go") and press **Enter**

13. Wait for Run 2 to fail
14. Verify Run 2 also displays a red info icon
15. Click the **History Icon** inside **Flow View** (**Configuration** tab) to view previous runs
16. Verify Run 1 in the history list displays a red info icon

### Expected Results

- When pipeline execution encounters an error, the status icon updates to a **Red Info Icon**
- The red info icon is clearly visible and indicates an error state
- The run number remains displayed next to the red info icon
- The red icon persists after the error occurs
- Multiple failed runs all display red info icons
- Runs in the history list show red info icons for failed executions
- The red color is visually distinct and associated with errors
- Users can easily identify failed runs by the red icon
- No additional error messages interfere with the icon display

### Postconditions

1. Delete the test pipeline created during preconditions:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline for Error Status**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for Error Status" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Red info icon helps users quickly identify problematic runs
- Error state must be clearly distinguishable from other states
- All

---

## Test Case ID: PR-005

#### Test Case Name:

Verify orange stop icon displays for manually stopped run

#### Test Case Tags:

pipelines,runs,status,ui,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that an orange stop icon is displayed in the run chipset when a pipeline run is manually stopped by the
user.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: pipelines.list, pipelines.create, pipelines.execute, pipelines.read, pipelines.stop
6. Create a test pipeline with longer execution time:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for Stop Status"
   - Fill in **Description** field: "Pipeline for testing stopped status icon"
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
   - Verify "Test Pipeline for Stop Status" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline for Stop Status"
3. Click on the pipeline to open it
4. Open the **Configuration** page:
   - Click on the **Configuration** tab in the top menu bar
   - Verify the **Flow View** (visual pipeline editor) is displayed
5. Start pipeline execution (without leaving the Configuration page):
   - Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration**
     page
   - Type a message in the chat field (e.g., "run" or "go")
   - Press **Enter** or click the **arrow button** (send icon) on the right side of the input field
6. Observe the run chipset shows a blue loading icon (in-progress)
7. While the pipeline is running, locate and click the **Stop** button or icon
8. Confirm the stop action in any confirmation dialog (if present)
9. Wait for the pipeline execution to stop
10. Verify the status icon in the run chipset updates
11. Confirm the icon now shows an **Orange Stop Icon** (indicating manually stopped)
12. Verify the run chipset displays "Run 1" along with the orange stop icon
13. Execute the pipeline again (Run 2) via chat input:

- Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration** page
- Type a message (e.g., "run" or "go") and press **Enter**

14. Allow Run 2 to run briefly, then manually stop it again
15. Verify Run 2 also displays an orange stop icon after stopping
16. Click the **History Icon** inside **Flow View** (**Configuration** page) to view previous runs
17. Verify Run 1 in the history list displays an orange stop icon

### Expected Results

- When a pipeline run is manually stopped, the status icon updates to an **Orange Stop Icon**
- The orange stop icon is clearly visible and indicates a manually stopped state
- The run number remains displayed next to the orange stop icon
- The orange stop icon persists after the run is stopped
- Multiple stopped runs all display orange stop icons
- Runs in the history list show orange stop icons for stopped executions
- The orange color is visually distinct from blue (in-progress), green (success), and red (error)
- Users can easily identify manually stopped runs by the orange icon
- No error messages are displayed for the stopped state

### Postconditions

1. Delete the test pipeline created during preconditions:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline for Stop Status**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for Stop Status" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Orange stop icon differentiates manual stops from errors
- Users need clear visual feedback that they successfully stopped a run
- **IMPORTANT**: All pipeline executions must be done via chat input in the Configuration tab (Flow View).
  Never use the Run tab for testing pipeline runs functionality
