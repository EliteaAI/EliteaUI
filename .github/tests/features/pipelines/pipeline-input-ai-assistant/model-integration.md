# Scenario ID: PIPE-AI-ASSIST-FUNC-003

#### Scenario Name:

Input AI Assistant model integration

#### Scenario Tags:

pipelines,ai-assistant,llm-node,model-integration,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates proper integration with pipeline-configured LLM models. It ensures the AI Assistant
uses the correct model and respects model configuration settings.

## Test Case ID: PAAF-004

#### Test Case Name:

Verify AI Assistant uses pipeline-configured LLM model

#### Test Case Tags:

pipelines,ai-assistant,llm-node,model-integration,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that the AI Assistant uses the LLM model configured for the pipeline and handles cases where no model
is configured with appropriate messaging.

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
   - Fill in **Name** field: "Test Pipeline AI Model Integration"
   - Fill in **Description** field: "Pipeline for testing AI model integration"
   - **Ensure pipeline has LLM model configured** (this should be set during pipeline creation or in settings)
   - Add LLM node:
     - Click the **+ button** (plus button at top right corner)
     - Select **LLM** from node types
     - Configure the LLM node:
       - In **System** field enter: "Test assistant"
       - Leave **Task** field empty
       - Leave **Chat history** with default value
       - Leave Input/Output fields empty (or as default)
     - Click on the **3 dots** button (node-menu-action) on the created LLM node
       - **Note:** If the node is minimized, click the **maximize button** first
     - Select **Make entrypoint** from the menu
     - Verify that a **path icon** (SVG) appears at the top left corner
     - Connect LLM node to END node (Optional - system does this automatically)
   - Click **Save** button (top right)
   - Verify "Test Pipeline AI Model Integration" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline AI Model Integration"
3. Click on the **Configuration tab** to open it in Flow Editor
4. Click the **Fit View** button (button with icon showing square corners, like a camera lens/frame corners)
   to ensure all nodes are visible
5. **Verify AI Assistant works with configured model:**
6. Click on the **LLM node** to open its configuration panel
7. Hover over the **Task** field (empty)
8. Click the **AI Assistant icon**
9. Verify the AI Assistant interface opens (confirms model is configured)
10. In the AI Assistant input field, type: "Create a task prompt for data analysis"
11. Click the **Send** button
12. Wait for AI processing to complete
13. Verify AI-generated content appears (auto-applied since field was empty)
14. Verify the content quality indicates proper LLM model usage
15. **Test that model configuration settings are respected:**
16. At the bottom of the **Configuration** tab (right panel where pipelines run), locate the model selector
17. Click the **gear icon button** (Model settings) at the right of the input field (next to model name
    button)
18. In the Model settings dialog, locate the **Max completion tokens** field
19. Change the **Max completion tokens** value to **10** (very low limit)
20. Click **Apply** button to save the model settings
21. Return to the LLM node configuration panel
22. Hover over the **System** field (contains "Test assistant")
23. Click the **AI Assistant icon**
24. In the AI Assistant input field, type: "Create a very detailed and comprehensive system prompt with
    multiple paragraphs"
25. Click the **Send** button
26. Wait for AI processing to complete
27. Verify the generated content in "Improved Option" is **very short** (respects the 10 token limit)
28. Verify the content is truncated/limited due to max completion tokens setting
29. Click the **gear icon button** (Model settings) again
30. Change the **Max completion tokens** back to a higher value (e.g., 1000 or 2000)
31. Click **Apply** button
32. Click the **AI Assistant icon** on System field again (or use the same open popup if still open)
33. Request the same prompt: "Create a very detailed and comprehensive system prompt with multiple paragraphs"
34. Click **Send** and wait for completion
35. Verify the generated content is now **much longer** (respects the increased token limit)
36. Verify content is more detailed and comprehensive than the 10-token limited version
37. Click **Apply** to apply the longer content
38. Click **Save** button to save the pipeline

### Expected Results

- AI Assistant uses the pipeline's configured LLM model for content generation
- AI-generated content reflects the capabilities of the configured model
- Content generation succeeds when valid model is configured
- **Model configuration settings (max completion tokens) are respected by AI Assistant:**
  - When max tokens is set to 10, generated content is very short (≤10 tokens)
  - When max tokens is increased (1000+), generated content is much longer and detailed
  - AI Assistant respects model settings in real-time
- Users can modify model settings through the gear icon in Configuration tab
- Model settings changes take effect immediately for AI Assistant operations
- Content length clearly reflects the configured token limits
- No errors occur when using different token limit configurations

### Postconditions

1. Ensure model settings are reset to reasonable defaults if modified during testing
2. Delete the test pipeline:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline AI Model Integration**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline AI Model Integration" is removed from the pipelines list
3. Verify no residual data remains from the test
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- AI Assistant functionality depends on pipeline-level LLM model configuration
- Model settings (max completion tokens) directly affect AI-generated content length
- Testing with very low token limits (10) clearly demonstrates the setting is respected
- Different token limits produce measurably different content lengths
- This test validates that AI Assistant respects real-time model configuration changes

---
