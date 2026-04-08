# Scenario ID: PIPE-AI-ASSIST-FUNC-002

#### Scenario Name:

Input AI Assistant iterative improvements

#### Scenario Tags:

pipelines,ai-assistant,llm-node,iterative,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the AI Assistant's support for iterative improvements through multiple assistance
cycles. It ensures users can refine content progressively through multiple rounds of AI assistance in a
continuous workflow.

## Test Case ID: PAAF-003

#### Test Case Name:

Verify AI Assistant supports iterative content improvements

#### Test Case Tags:

pipelines,ai-assistant,llm-node,iterative,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can perform multiple rounds of AI assistance on the same field to iteratively refine
content, with each round building on or replacing previous improvements.

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
   - Fill in **Name** field: "Test Pipeline AI Iterative Improvements"
   - Fill in **Description** field: "Pipeline for testing iterative AI improvements"
   - Add LLM node:
     - Click the **+ button** (plus button at top right corner)
     - Select **LLM** from node types
     - Configure the LLM node:
       - In **System** field enter: "Be helpful"
       - In **Task** field enter: "Respond to user"
       - Leave **Chat history** with default value
       - Leave Input/Output fields empty (or as default)
     - Click on the **3 dots** button (node-menu-action) on the created LLM node
       - **Note:** If the node is minimized, click the **maximize button** first
     - Select **Make entrypoint** from the menu
     - Verify that a **path icon** (SVG) appears at the top left corner
     - Connect LLM node to END node (Optional - system does this automatically)
   - Click **Save** button (top right)
   - Verify "Test Pipeline AI Iterative Improvements" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline AI Iterative Improvements"
3. Click on the **Configuration tab** to open it in Flow Editor
4. Click the **Fit View** button (button with icon showing square corners, like a camera lens/frame corners)
   to ensure all nodes are visible
5. Click on the **LLM node** to open its configuration panel
6. **First improvement iteration:**
7. Hover over the **System** field (contains "Be helpful")
8. Click the **AI Assistant icon** (pencil icon)
9. Verify the AI Assistant interface opens
10. In the AI Assistant input field, type: "Make this more professional"
11. Click the **Send** button
12. Wait for AI processing to complete
13. Verify "Improved Option" shows a more professional version
14. Click the **Apply** button
15. Verify the improved content is now in the **System** field
16. Verify the AI Assistant popup **remains open** after applying (does not close automatically)
17. Verify the input field is cleared and ready for next prompt
18. **Second improvement iteration (continuing in same session):**
19. In the same AI Assistant popup (still open), type: "Add specific guidelines about being concise and
    accurate"
20. Click the **Send** button
21. Wait for AI processing to complete
22. Verify "Current Option" shows the first improvement (content that was just applied)
23. Verify "Improved Option" shows further refinement with concise and accurate guidelines
24. Click the **Apply** button
25. Verify the System field now contains the second improvement (more refined than the first)
26. Verify the AI Assistant popup **remains open** after applying
27. Verify the input field is cleared and ready for next prompt
28. **Third improvement iteration (continuing in same session with different approach):**
29. In the same AI Assistant popup (still open), type: "Make this more friendly and conversational while
    keeping it professional"
30. Click the **Send** button
31. Wait for AI processing to complete
32. Verify "Current Option" shows the second improvement (most recent applied content)
33. Verify "Improved Option" shows a friendly yet professional version
34. Click the **Apply** button
35. Verify the System field contains the third iteration
36. Verify the AI Assistant popup **remains open** after applying
37. Close the AI Assistant popup manually (click close button or click outside)
38. Click **Save** button to save all improvements
39. Execute the pipeline to verify final improvements work:
    - Navigate to **Configuration** tab
    - In the chat input, type: "test iterative improvements"
    - Click **Run** button
    - Wait for execution to complete
    - Verify the pipeline executes successfully with the final iterative improvements

### Expected Results

- AI Assistant popup opens when clicking the AI Assistant icon
- After clicking Apply button, the AI Assistant popup **remains open** (does not close automatically)
- Input field is cleared after each Apply, ready for next improvement request
- Users can continue requesting improvements in the same session without closing/reopening popup
- Each iteration starts with the current field content (result of previous improvements)
- "Current Option" in each iteration shows the most recently applied content
- Each "Improved Option" reflects the specific improvement request
- Apply button works for each iteration independently
- Content quality improves progressively through iterations
- Users can change improvement direction (professional → friendly) across iterations
- All improvements persist correctly in the field after each Apply
- Final content reflects the cumulative effect of all applied iterations
- User can manually close the AI Assistant popup when finished
- Pipeline saves and executes successfully with final iterative improvements
- No errors or conflicts occur during multiple assistance cycles in same session

### Postconditions

1. Delete the test pipeline:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline AI Iterative Improvements**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline AI Iterative Improvements" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Iterative improvements allow progressive content refinement in a continuous workflow
- AI Assistant popup remains open after applying improvements, enabling seamless iteration
- Input field is automatically cleared after each Apply, ready for next prompt
- Each iteration builds on the previous applied improvement
- Users maintain full control over which improvements to apply
- User must manually close the popup when finished iterating
- This test uses fields with initial content, so all iterations show side-by-side comparison with Apply button
- Continuous session workflow eliminates need to repeatedly hover and click AI icon

---
