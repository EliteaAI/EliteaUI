# Scenario ID: PIPE-AI-ASSIST-FUNC-005

#### Scenario Name:

Input AI Assistant user experience and workflow validation

#### Scenario Tags:

pipelines,ai-assistant,llm-node,ux,workflow,regression

#### Scenario Priority:

Medium

#### Scenario Description

This scenario validates the AI Assistant's user experience features including the ability to edit AI-generated
content before applying, processing indicators, and user control over content application.

## Test Case ID: PAAF-005

#### Test Case Name:

Verify users can edit AI-generated content before applying

#### Test Case Tags:

pipelines,ai-assistant,llm-node,edit-content,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can make manual edits to the AI-generated "Improved Option" content before applying it to
the field, ensuring full user control over final content.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: pipelines.create, pipelines.read, pipelines.update, pipelines.delete
6. Create a test pipeline with LLM node:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline AI Edit Content"
   - Fill in **Description** field: "Pipeline for testing editing AI-generated content"
   - Add LLM node:
     - Click the **+ button** (plus button at top right corner)
     - Select **LLM** from node types
     - Configure the LLM node:
       - In **System** field enter: "Be helpful"
       - Leave **Task** field empty
       - Leave **Chat history** with default value
       - Leave Input/Output fields empty (or as default)
   - Click **Save** button (top right)
   - Verify "Test Pipeline AI Edit Content" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline AI Edit Content"
3. Click on the **Configuration tab** to open it in Flow Editor
4. Click the **Fit View** button (button with icon showing square corners, like a camera lens/frame corners)
   to ensure all nodes are visible
5. Click on the **LLM node** to open its configuration panel
6. **Generate content with AI Assistant:**
7. Hover over the **System** field (contains "Be helpful")
8. Click the **AI Assistant icon**
9. In the AI Assistant input field, type: "Make this more professional"
10. Click the **Send** button
11. Wait for AI processing to complete
12. Verify "Current Option" shows "Be helpful"
13. Verify "Improved Option" shows AI-generated professional version
14. **Edit the improved content before applying:**
15. Click into the "Improved Option" text area/field to edit it
16. Make manual edits to the AI-generated content (e.g., add ", concise," after "professional")
17. Verify the text in "Improved Option" can be edited
18. Verify your manual changes are preserved in the "Improved Option" field
19. Click the **Apply** button
20. Verify the **edited version** (with your manual changes) is applied to the System field
21. Verify the System field contains your edited content, not just the original AI suggestion
22. **Test editing on Task field:**
23. Hover over the **Task** field (empty)
24. Click the **AI Assistant icon**
25. In the AI Assistant input field, type: "Create a task for answering technical questions"
26. Click **Send** and wait for completion
27. Verify AI-generated content appears (auto-applied since field was empty)
28. Click the **AI Assistant icon** on Task field again
29. Request improvement: "Make it more specific"
30. Wait for generation
31. Verify "Improved Option" appears
32. Click into "Improved Option" and edit the content manually
33. Add specific modifications (e.g., add "about Python programming")
34. Click **Apply**
35. Verify the Task field contains your edited version
36. Click **Save** button to save all changes

### Expected Results

- AI-generated content in "Improved Option" is editable
- Users can click into the "Improved Option" text area and modify content
- Manual edits made to "Improved Option" are preserved
- When Apply button is clicked, the **edited version** is applied to the field (not the original AI
  suggestion)
- Applied content reflects both AI generation and manual user edits
- This works for both System and Task fields
- Editing capability provides users full control over final content
- Users can refine AI suggestions before committing them
- No loss of manual edits when clicking Apply
- Pipeline saves successfully with manually-edited AI-assisted content

### Postconditions

1. Delete the test pipeline:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline AI Edit Content**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline AI Edit Content" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Editing AI-generated content provides users with full control over final output
- Users can use AI as a starting point and then refine manually
- This feature combines AI assistance with human judgment
- Both "Current Option" and "Improved Option" should be editable

---

## Test Case ID: PAAF-006

#### Test Case Name:

Verify AI Assistant processing indicators and user control

#### Test Case Tags:

pipelines,ai-assistant,llm-node,processing-indicators,user-control,regression

#### Test Case Priority:

Medium

#### Test Case Description

Verify that the AI Assistant provides clear processing indicators during content generation and preserves user
control over content application, ensuring users can review and selectively apply AI suggestions.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: pipelines.create, pipelines.read, pipelines.update, pipelines.delete
6. Create a test pipeline with LLM node:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline AI User Control"
   - Fill in **Description** field: "Pipeline for testing AI processing indicators and user control"
   - Add LLM node:
     - Click the **+ button** (plus button at top right corner)
     - Select **LLM** from node types
     - Configure the LLM node:
       - In **System** field enter: "Original system prompt"
       - In **Task** field enter: "Original task prompt"
       - Leave **Chat history** with default value
       - Leave Input/Output fields empty (or as default)
     - Click on the **3 dots** button (node-menu-action) on the created LLM node
       - **Note:** If the node is minimized, click the **maximize button** first
     - Select **Make entrypoint** from the menu
     - Verify that a **path icon** (SVG) appears at the top left corner
   - Click **Save** button (top right)
   - Verify "Test Pipeline AI User Control" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline AI User Control"
3. Click on the **Configuration tab** to open it in Flow Editor
4. Click the **Fit View** button (button with icon showing square corners, like a camera lens/frame corners)
   to ensure all nodes are visible
5. Click on the **LLM node** to open its configuration panel
6. **Test processing indicators:**
7. Hover over the **System** field
8. Click the **AI Assistant icon**
9. In the AI Assistant input field, type: "Improve this prompt"
10. Click the **Send** button
11. Immediately observe the interface during processing
12. Verify a processing indicator appears (loading spinner, progress bar, or status message)
13. Verify the interface shows "generating" or "processing" state
14. Wait for processing to complete
15. Verify the processing indicator disappears when content is ready
16. **Test user control - reject AI suggestions:**
17. Verify the AI-generated content appears in "Improved Option"
18. Verify the original content "Original system prompt" is still shown in "Current Option"
19. Verify the **Apply** button is available but not auto-applied
20. Close the AI Assistant interface WITHOUT clicking Apply (click outside or close button)
21. Verify the System field still contains "Original system prompt" (unchanged)
22. Verify AI suggestions were not applied without user consent
23. **Test user control - selective application:**
24. Hover over the **System** field again
25. Click the **AI Assistant icon**
26. Request improvement: "Make this more detailed"
27. Click **Send** and wait for completion
28. Review the "Improved Option"
29. Click the **Apply** button
30. Verify System field now contains the new improved content
31. **Test preserving original content:**
32. Hover over the **Task** field (contains "Original task prompt")
33. Click the **AI Assistant icon**
34. Request generation: "Create a completely different task"
35. Click **Send** and wait for completion
36. Review the suggestion but do NOT click Apply
37. Close the AI Assistant
38. Verify the Task field still contains "Original task prompt" (preserved)
39. Click **Save** button to save (only if changes were applied)

### Expected Results

- Processing indicators appear during AI content generation:
  - Loading spinner, progress bar, or "Generating..." message
  - Visual feedback that AI is working
  - Interface is responsive during processing
- Original content is preserved until user explicitly clicks Apply:
  - "Current Option" always shows original/current content
  - Field content remains unchanged without Apply action
  - Closing AI Assistant without Apply preserves original content
- Apply button provides explicit user control:
  - Changes only apply when user clicks Apply
  - No auto-application of AI suggestions (when field has content)
  - User can review before deciding to apply
- Workflow integration is seamless:
  - AI Assistant does not disrupt normal editing flow
  - Users can cancel or abandon AI assistance at any time
  - Interface returns to normal state after closing AI Assistant
- No data loss occurs when canceling or closing AI Assistant

### Postconditions

1. Delete the test pipeline:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline AI User Control**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline AI User Control" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- User control is paramount - no auto-application of AI suggestions when field has content
- Processing indicators provide transparency during AI operations
- Original content must always be preserved until explicit user action
- This test uses fields with existing content, so side-by-side comparison with Apply button is shown
- **Important:** Fields with content require manual Apply (no auto-apply)

---
