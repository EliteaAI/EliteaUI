# Scenario ID: PIPE-AI-ASSIST-NODE-005

#### Scenario Name:

Input AI Assistant availability for Code node

#### Scenario Tags:

pipelines,ai-assistant,code-node,availability,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates that the Input AI Assistant is available and functional for the Code node's Code field
when field type is set to "f-string" or "fixed". It ensures the AI Assistant icon appears, can be activated,
and provides content generation capabilities.

## Test Case ID: PAAN-005

#### Test Case Name:

Verify AI Assistant availability for Code node Code field

#### Test Case Tags:

pipelines,ai-assistant,code-node,availability,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that the AI Assistant is available for the Code node's Code field when field type is "f-string" or
"fixed", icon is visible on hover, and can generate/improve content.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} project:
   - Click on the **project switcher** button in the sidebar (by default shows "Private")
   - Select **{Project}** from the project list (e.g., "UI Testing")
5. User has permissions: pipelines.create, pipelines.read, pipelines.update, pipelines.delete
6. Create a test pipeline with Code node:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Click the **+ Create** button
   - Fill in **Name** field: "Test Pipeline AI Assistant Code"
   - Fill in **Description** field: "Pipeline for testing AI Assistant on Code node"
   - Add Code node:
     - Click the **+ button** (plus button at top right corner)
     - Select **Code** from node types
     - Configure the Code node:
       - In **Code** field enter: "result = x + y"
       - Verify **Code** field type is set to "fixed" (default type, check the field type selector at left of
         field)
       - Leave Input/Output fields with default values
   - Click **Save** button (top right)
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Verify "Test Pipeline AI Assistant Code" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline AI Assistant Code"
3. Click on the **Configuration tab** to open it in Flow Editor
4. Click the **Fit View** button (button with icon showing square corners, like a camera lens/frame corners)
   to ensure all nodes are visible
5. Click on the **Code node** to open its configuration panel
6. **Test AI Assistant with "fixed" field type (default):**
7. Locate the **Code** field
8. Verify the field type is set to "fixed" (default, check the field type selector at left of field)
9. Hover over the **Code** field
10. Verify the **AI Assistant icon** (pencil icon) appears on the right side of the field
11. Click the **AI Assistant icon** (pencil icon)
12. Verify the AI Assistant interface opens with:

- Input field with placeholder text "Describe your idea to generate or rewrite the value"
- Send button
- Content type selector (e.g., "Text")

13. In the AI Assistant input field, type: "Create Python code that processes a list of numbers and returns
    their average"
14. Click the **Send** button
15. Wait for AI processing to complete
16. Verify the side-by-side comparison is displayed:
    - "Current Option" shows the original content: "result = x + y"
    - "Improved Option" shows the AI-generated code on the right side
17. Verify the **Apply** button is available
18. Click the **Apply** button
19. Verify the AI-generated code is applied to the **Code** field
20. Verify the original content is replaced with the improved code
21. **Test AI Assistant with "f-string" field type:**
22. Locate the **Code** field (now contains the AI-generated code from previous steps)
23. Click the field type selector (dropdown at left of Code field)
24. Select **f-string** type from the dropdown
25. Verify the field type changes to "f-string"
26. Hover over the **Code** field
27. Verify the **AI Assistant icon** (pencil icon) still appears on the right side of the field
28. Click the **AI Assistant icon** (pencil icon)
29. Verify the AI Assistant interface opens again
30. In the AI Assistant input field, type: "Add error handling to this code"
31. Click the **Send** button
32. Wait for AI processing to complete
33. Verify the side-by-side comparison is displayed with updated content
34. Verify the **Apply** button is available
35. Click the **Apply** button
36. Verify the improved code with error handling is applied to the **Code** field
37. **Test that AI Assistant does NOT appear for "variable" type:**
38. Click the field type selector (dropdown at left of Code field)
39. Select **variable** type from the dropdown
40. Verify the field type changes to "variable"
41. Hover over the **Code** field
42. Verify the **AI Assistant icon does NOT appear** for variable type
43. Click **Save** button to save the pipeline

### Expected Results

- AI Assistant icon (pencil) is visible when hovering over Code field with "fixed" type (default)
- AI Assistant interface opens and works correctly with "fixed" type
- AI processes requests and generates improved code for "fixed" type
- Side-by-side comparison displays correctly for "fixed" type
- Apply button works correctly for "fixed" type
- Field type can be changed from "fixed" to "f-string"
- AI Assistant icon (pencil) is visible when hovering over Code field with "f-string" type
- AI Assistant interface opens and works correctly with "f-string" type
- AI processes requests and generates improved code for "f-string" type
- Side-by-side comparison displays correctly for "f-string" type
- Apply button works correctly for "f-string" type
- Field type can be changed to "variable"
- AI Assistant icon does NOT appear when field type is set to "variable"
- AI Assistant interface opens with input field and Send button
- Content type selector shows "Text" option
- "Current Option" shows the original/current content
- "Improved Option" displays AI-generated Python code
- No error messages are displayed during the process
- AI-generated code is syntactically valid Python and contextually appropriate

### Postconditions

1. Delete the test pipeline:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline AI Assistant Code**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline AI Assistant Code" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- AI Assistant uses the pipeline's configured LLM model
- Only Code field supports AI Assistant for Code nodes
- AI Assistant only available when field type is "f-string" or "fixed", NOT "variable"
- This test validates BOTH "fixed" (default) and "f-string" types to ensure comprehensive coverage
- Test also verifies AI Assistant does NOT appear for "variable" type
- Generated code must be valid Python syntax

---
