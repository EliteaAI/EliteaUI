# Scenario ID: PIPE-RUN-004

#### Scenario Name:

Pipeline run details popup display and content

#### Scenario Tags:

pipelines,runs,popup,ui,smoke

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the run details popup functionality that displays comprehensive information about a
selected pipeline run. It ensures proper modal display, content completeness, and handling of various run
states and data types.

## Test Case ID: PR-008

#### Test Case Name:

Verify run details popup opens from both current run and history list

#### Test Case Tags:

pipelines,runs,popup,ui,smoke

#### Test Case Priority:

High

#### Test Case Description

Verify that clicking on run chipsets opens a popup window displaying detailed information about the selected
run, whether accessed from the current run display or from the history list.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: pipelines.list, pipelines.create, pipelines.execute, pipelines.read
6. Create a test pipeline for popup testing:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline for Run Details Popup"
   - Fill in **Description** field: "Pipeline for testing run details popup"
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
   - Verify "Test Pipeline for Run Details Popup" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline for Run Details Popup"
3. Click on the pipeline to open it
4. Open the **Configuration** page:
   - Click on the **Configuration** tab in the top menu bar
5. Execute the pipeline multiple times with different inputs:
   - Open the pipeline in Flow View
   - Execute the pipeline via chat input:
   - Ensure you are on the pipeline **Configuration** page (Flow View)
   - Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration**
     page
   - Type a message in the chat field: "First run data"
   - Press **Enter** or click the **arrow button** (send icon) on the right side of the input field (Run 1)
   - Wait for Run 1 to complete successfully
   - Execute the pipeline via chat input:
   - Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration**
     page
   - Type a message in the chat field: "Second run data"
   - Press **Enter** or click the **arrow button** (send icon) on the right side of the input field (Run 2)
   - Wait for Run 2 to complete successfully
   - Execute the pipeline via chat input:
   - Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration**
     page
   - Type a message in the chat field: "Third run data"
   - Press **Enter** or click the **arrow button** (send icon) on the right side of the input field (Run 3)
   - Wait for Run 3 to complete successfully
6. Verify the **History Icon** is displayed inside **Flow View** (**Configuration** tab) (3 runs exist)
7. Verify Run 3 is displayed as the current run with a green checkmark (success)
8. Click on the **Run 3 chipset** (anywhere on the chipset area)
9. Verify a popup window or modal opens
10. Verify the popup displays a title or header indicating "Run 3" details
11. Verify the popup contains the following information sections:

- Run status (Success with green checkmark)
- Run number (Run 3)
- Timestamps (start time, end time, or duration)
- Input data section showing the input provided ("Third run data")
- Output data section showing the results/output

12. Verify the popup has a close button (X icon or Close button)
13. Click the close button to dismiss the popup
14. Verify the popup closes and the Flow View is visible again
15. Click the **History Icon** inside **Flow View** (**Configuration** tab) to open the history list
16. Verify the history list shows Run 1 and Run 2
17. Click on **Run 1** in the history list
18. Verify a popup window opens displaying details for Run 1
19. Verify the popup shows:

- Title indicating "Run 1 Details"
- Status icon (green checkmark for success)
- Input data: "First run data"
- Output data from Run 1
- Timestamps for Run 1

20. Close the Run 1 details popup
21. Click on **Run 2** in the history list
22. Verify a popup opens displaying details for Run 2
23. Verify the popup shows different data (input: "Second run data")
24. Verify the popup correctly identifies the run as "Run 2"
25. Close the popup

### Expected Results

- Clicking the current run chipset opens a popup window immediately
- Clicking a run in the history list opens the run details popup
- The popup is centered on the screen or positioned appropriately
- The popup has a clear title indicating which run is being displayed (e.g., "Run 3 Details")
- The popup displays the run's **status** with the corresponding status icon
- The popup shows **timestamps** (start time, end time, or duration)
- The popup includes an **Input Data** section with the input values used
- The popup includes an **Output Data** section with the execution results
- All data is formatted clearly and is readable
- The popup displays details specific to the selected run (different data for each run)
- Input and output data matches what was provided/generated for that specific run
- Users can open details for multiple different runs sequentially
- The popup has a close mechanism (X button, Close button, or click outside)
- Closing the popup returns the user to the Flow View
- No error messages are displayed

### Postconditions

1. Delete the test pipeline created during preconditions:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline for Run Details Popup**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for Run Details Popup" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Popup must display correct data for the selected run
- Users should be able to review both current and historical run details easily
- This test covers popup access from both the current run chipset and history list
- **IMPORTANT**: All pipeline executions must be done via chat input in the Configuration tab (Flow View).
  Never use the Run tab for testing pipeline runs functionality

---

## Test Case ID: PR-009

#### Test Case Name:

Verify run details popup displays error information for failed runs

#### Test Case Tags:

pipelines,runs,popup,error,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that the run details popup properly displays error information and details when opened for a run that
encountered an error during execution.

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
   - Fill in **Name** field: "Test Pipeline for Error Popup"
   - Fill in **Description** field: "Pipeline for testing error details in popup"
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
   - Verify "Test Pipeline for Error Popup" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline for Error Popup"
3. Click on the pipeline to open it
4. Open the **Configuration** page:
   - Click on the **Configuration** tab in the top menu bar
5. Execute the pipeline to generate an error:
   - Open the pipeline in Flow View
   - Make sure **Task** field of LLM node is: "" and then **Save**
   - Execute the pipeline via chat input:
   - Ensure you are on the pipeline **Configuration** page (Flow View)
   - Locate the **chat input field** (textarea) at the right side (bottom corner) of the **Configuration**
     page
   - Type a message in the chat field (e.g., "run" or "go")
   - Press **Enter** or click the **arrow button** (send icon) on the right side of the input field
   - Provide input that will trigger the error
   - Wait for Run 1 to fail with an error (red info icon)
6. Verify Run 1 chipset is displayed with a red info icon (error state)
7. Click on the **Run 1 chipset** to open the details popup
8. Verify the popup opens displaying error details
9. Verify the popup shows:
   - Title indicating "Run 1 Details"
   - Status icon (red info icon for error)
   - Status label indicating "Error" or "Failed"
10. Look for an error details section in the popup
11. Verify the error section displays:

- Error message or description
- Error type or code (if available)
- Stack trace or error details (if applicable)
- Timestamp when the error occurred

11. Verify the popup still shows input data (if provided)
12. Verify the popup indicates no output was generated (due to error)
13. Verify the error information is clearly formatted and readable
14. Close the popup

### Expected Results

- The popup opens when clicking on a run with error status
- The popup displays the **red info icon** indicating error state
- The popup clearly indicates the run failed or encountered an error
- An **Error Details** section is present in the popup
- The error section displays relevant error information:
  - Error message explaining what went wrong
  - Error type or category
  - Technical details like stack trace (if available)
  - Timestamp of when the error occurred
- Input data is still displayed (if applicable)
- Output data section indicates no output was produced or shows partial output
- Error information is formatted clearly and is useful for debugging
- The popup can be closed normally
- No additional errors are generated when viewing error details

### Postconditions

1. Delete the test pipeline created during preconditions:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline for Error Popup**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline for Error Popup" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Error details are critical for debugging failed runs
- Error messages should be clear and actionable

---
