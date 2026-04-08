# Scenario ID: PIPE-AI-ASSIST-FUNC-001

#### Scenario Name:

Input AI Assistant content generation and improvement functionality

#### Scenario Tags:

pipelines,ai-assistant,llm-node,content-generation,smoke

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the core functionality of the Input AI Assistant for generating new content and
improving existing content for LLM node fields. It covers content generation from prompts, side-by-side
comparison, apply functionality, and iterative improvements.

## Test Case ID: PAAF-001

#### Test Case Name:

Verify AI Assistant generates new content from user prompts

#### Test Case Tags:

pipelines,ai-assistant,llm-node,content-generation,smoke

#### Test Case Priority:

High

#### Test Case Description

Verify that the AI Assistant can generate new content based on user prompts for LLM node System field,
displays results in side-by-side comparison, and allows users to apply generated content.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: pipelines.create, pipelines.read, pipelines.update, pipelines.delete,
   pipelines.execute
6. Create a test pipeline with LLM node:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline AI Content Generation"
   - Fill in **Description** field: "Pipeline for testing AI Assistant content generation"
   - Add LLM node:
     - Click the **+ button** (plus button at top right corner)
     - Select **LLM** from node types
     - Configure the LLM node:
       - Leave **System** field empty
       - In **Task** field enter: "Answer user questions"
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
   - Verify "Test Pipeline AI Content Generation" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline AI Content Generation"
3. Click on the **Configuration tab** to open it in Flow Editor
4. Click the **Fit View** button (button with icon showing square corners, like a camera lens/frame corners)
   to ensure all nodes are visible
5. Click on the **LLM node** to open its configuration panel
6. Locate the **System** field (should be empty)
7. Hover over the **System** field
8. Verify the **AI Assistant icon** (pencil icon) appears
9. Click the **AI Assistant icon**
10. Verify the AI Assistant interface opens with input field showing placeholder "Describe your idea to
    generate or rewrite the value"
11. In the AI Assistant input field, type: "Create a system prompt for a coding assistant that helps
    developers write clean, efficient Python code"
12. Click the **Send** button
13. Wait for AI processing indicator to appear and complete
14. **Verify auto-apply behavior for empty field:**
15. Verify the generated content is **automatically applied** to the **System** field (no "Improved Option"
    section)
16. Verify the System field now contains the AI-generated content
17. Verify no **Apply** button is shown (content was auto-applied)
18. Verify the content is relevant to the prompt (coding assistant, Python, clean code)
19. **Test second generation with side-by-side comparison:**
20. Hover over the **System** field again (which now has content)
21. Click the **AI Assistant icon** again
22. In the AI Assistant input field, type: "Make this more detailed and add guidelines about code readability"
23. Click the **Send** button
24. Wait for AI processing to complete
25. Verify the side-by-side comparison is displayed:
    - "Current Option" section on the left shows the previously generated content
    - "Improved Option" section on the right shows the newly generated content
26. Verify the **Apply** button is visible and enabled
27. Click the **Apply** button
28. Verify the newly generated content is now displayed in the **System** field
29. Verify the content is updated with the improvements
30. Click **Save** button (top right) to save the pipeline
31. Execute the pipeline to verify it works with AI-generated content:
    - Navigate to **Configuration** tab
    - In the chat input at the bottom, type: "test run"
    - Click **Run** button
    - Wait for execution to complete
    - Verify the pipeline executes successfully with green checkmark status
    - Verify no errors occurred during execution

### Expected Results

- AI Assistant icon appears when hovering over empty System field
- AI Assistant interface opens with appropriate placeholder text
- Send button triggers AI content generation
- Processing indicator shows during AI processing
- **Auto-apply behavior for empty fields:**
  - When System field is empty, generated content is automatically applied
  - No side-by-side comparison is shown
  - No Apply button is displayed
  - Content appears directly in the field
- **Manual apply behavior for fields with content:**
  - When System field has content, side-by-side comparison is displayed
  - "Current Option" shows existing content
  - "Improved Option" shows AI-generated content
  - Apply button is visible and functional
  - User must explicitly click Apply to update field
- AI-generated content is contextually relevant to the user's prompt
- AI-generated content is appropriate for a system prompt (clear instructions for AI behavior)
- Applied content persists in the field after closing AI Assistant
- Pipeline saves successfully with AI-generated content
- Pipeline executes successfully with the AI-generated system prompt
- No error messages are displayed during the entire process

### Postconditions

1. Delete the test pipeline:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline AI Content Generation**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline AI Content Generation" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- AI Assistant uses the pipeline's configured LLM model for content generation
- Generated content quality depends on the LLM model configuration
- Pipeline execution validates that AI-generated content is functional
- **Important:** AI Assistant behavior differs based on field state:
  - **Empty field:** Content is auto-applied immediately (no Apply button)
  - **Field with content:** Side-by-side comparison shown with Apply button required
- This test covers both auto-apply (first generation) and manual-apply (second generation) scenarios

---

## Test Case ID: PAAF-002

#### Test Case Name:

Verify AI Assistant improves existing content

#### Test Case Tags:

pipelines,ai-assistant,llm-node,content-improvement,smoke

#### Test Case Priority:

High

#### Test Case Description

Verify that the AI Assistant can improve existing field content, displays original vs improved versions
side-by-side, and allows users to apply improvements.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: pipelines.create, pipelines.read, pipelines.update, pipelines.delete,
   pipelines.execute
6. Create a test pipeline with LLM node:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline AI Content Improvement"
   - Fill in **Description** field: "Pipeline for testing AI Assistant content improvement"
   - Add LLM node:
     - Click the **+ button** (plus button at top right corner)
     - Select **LLM** from node types
     - Configure the LLM node:
       - In **System** field enter: "You are assistant"
       - In **Task** field enter: "help user"
       - Leave **Chat history** with default value
       - Leave Input/Output fields empty (or as default)
     - Click on the **3 dots** button (node-menu-action) on the created LLM node
       - **Note:** If the node is minimized, click the **maximize button** first
     - Select **Make entrypoint** from the menu
     - Verify that a **path icon** (SVG) appears at the top left corner of the LLM node
     - Connect LLM node to END node (Optional - system does this automatically)
   - Click **Save** button (top right)
   - Verify "Test Pipeline AI Content Improvement" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline AI Content Improvement"
3. Click on the **Configuration tab** to open it in Flow Editor
4. Click the **Fit View** button (button with icon showing square corners, like a camera lens/frame corners)
   to ensure all nodes are visible
5. Click on the **LLM node** to open its configuration panel
6. **Test improving System field content:**
7. Locate the **System** field (contains "You are assistant")
8. Hover over the **System** field
9. Click the **AI Assistant icon** (pencil icon)
10. In the AI Assistant input field, type: "Make this more professional and detailed for a technical support
    assistant"
11. Click the **Send** button
12. Wait for AI processing to complete
13. Verify the interface displays:
    - "Current Option" on the left showing: "You are assistant"
    - "Improved Option" on the right showing enhanced version
14. Verify the improved content is more professional and detailed than the original
15. Click the **Apply** button
16. Verify the improved content replaces "You are assistant" in the **System** field
17. **Test improving Task field content:**
18. Locate the **Task** field (contains "help user")
19. Hover over the **Task** field
20. Click the **AI Assistant icon** (pencil icon)
21. In the AI Assistant input field, type: "Expand this into a clear instruction with specific guidelines"
22. Click the **Send** button
23. Wait for AI processing to complete
24. Verify "Current Option" shows "help user" and "Improved Option" shows expanded version
25. Click the **Apply** button
26. Verify the improved content replaces "help user" in the **Task** field
27. Click **Save** button to save the pipeline
28. Execute the pipeline to verify improvements work correctly:
    - Navigate to **Configuration** tab
    - In the chat input, type: "test improved prompts"
    - Click **Run** button
    - Wait for execution to complete
    - Verify the pipeline executes successfully
    - Verify the output reflects the improved prompts quality

### Expected Results

- AI Assistant icon appears when hovering over fields with existing content
- AI Assistant processes improvement requests successfully
- Side-by-side comparison clearly shows original vs improved content
- "Current Option" displays the exact original content
- "Improved Option" displays enhanced, more detailed, and professional version
- Improved content maintains the original intent while enhancing quality
- Apply button successfully replaces original content with improved version
- Both System and Task fields can be improved independently
- Pipeline saves successfully with all improvements
- Pipeline execution works correctly with improved prompts
- Improved prompts produce better quality outputs compared to original simple prompts
- No error messages during improvement process

### Postconditions

1. Delete the test pipeline:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline AI Content Improvement**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline AI Content Improvement" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Improvement quality depends on the LLM model configuration
- Original content is preserved until user explicitly clicks Apply
- Improvements should enhance clarity, professionalism, and detail while maintaining intent

---
