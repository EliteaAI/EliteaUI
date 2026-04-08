# Scenario ID: PIPE-AI-ASSIST-NODE-002

#### Scenario Name:

Input AI Assistant availability for Router node

#### Scenario Tags:

pipelines,ai-assistant,router-node,availability,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates that the Input AI Assistant is available and functional for the Router node's
Condition field. It ensures the AI Assistant icon appears, can be activated, and provides content generation
capabilities.

## Test Case ID: PAAN-002

#### Test Case Name:

Verify AI Assistant availability for Router node Condition field

#### Test Case Tags:

pipelines,ai-assistant,router-node,availability,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that the AI Assistant is available for the Router node's Condition field, icon is visible on hover, and
can generate/improve content.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: pipelines.create, pipelines.read, pipelines.update, pipelines.delete
6. Create a test pipeline with Router node:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline AI Assistant Router"
   - Fill in **Description** field: "Pipeline for testing AI Assistant on Router node"
   - Add Router node:
     - Click the **+ button** (plus button at top right corner)
     - Select **Router** from node types
     - Configure the Router node:
       - Leave **Input** field with default value
       - In **Condition** field enter: "user.type == 'premium'"
   - Click **Save** button (top right)
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Verify "Test Pipeline AI Assistant Router" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline AI Assistant Router"
3. Click on the **Configuration tab** to open it in Flow Editor
4. Click the **Fit View** button (button with icon showing square corners, like a camera lens/frame corners)
   to ensure all nodes are visible
5. Click on the **Router node** to open its configuration panel
6. Locate the **Condition** field
7. Hover over the **Condition** field
8. Verify the **AI Assistant icon** (pencil icon) appears on the right side of the field
9. Click the **AI Assistant icon** (pencil icon)
10. Verify the AI Assistant interface opens with:

- Input field with placeholder text "Describe your idea to generate or rewrite the value"
- Send button
- Content type selector (e.g., "Text")

11. In the AI Assistant input field, type: "Create a condition that routes based on message sentiment being
    positive or negative"
12. Click the **Send** button
13. Wait for AI processing to complete
14. Verify the side-by-side comparison is displayed:
    - "Current Option" shows the original content: "user.type == 'premium'"
    - "Improved Option" shows the AI-generated content on the right side
15. Verify the **Apply** button is available
16. Click the **Apply** button
17. Verify the AI-generated content is applied to the **Condition** field
18. Verify the original content is replaced with the improved content

### Expected Results

- AI Assistant icon (pencil) is visible when hovering over the Condition field
- AI Assistant interface opens with input field and Send button
- Content type selector shows "Text" option
- AI processes the request and generates improved content
- Side-by-side comparison is displayed with "Current Option" and "Improved Option"
- "Current Option" shows the original content: "user.type == 'premium'"
- "Improved Option" displays AI-generated content on the right side
- Apply button is available and functional
- Apply button successfully applies the generated content to the Condition field
- No error messages are displayed during the process
- AI-generated content is contextually appropriate for routing conditions

### Postconditions

1. Delete the test pipeline:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline AI Assistant Router**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline AI Assistant Router" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- AI Assistant uses the pipeline's configured LLM model
- Only Condition field supports AI Assistant for Router nodes
- Content must be contextually appropriate for conditional routing logic

---
