# Scenario ID: PIPE-AI-ASSIST-NODE-004

#### Scenario Name:

Input AI Assistant availability for LLM node

#### Scenario Tags:

pipelines,ai-assistant,llm-node,availability,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates that the Input AI Assistant is available and functional for the LLM node's System and
Task fields when field types are set to "f-string" or "fixed". It ensures the AI Assistant icon appears, can
be activated, and provides content generation capabilities for both fields.

## Test Case ID: PAAN-004

#### Test Case Name:

Verify AI Assistant availability for LLM node System and Task fields

#### Test Case Tags:

pipelines,ai-assistant,llm-node,availability,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that the AI Assistant is available for the LLM node's System and Task fields when field types are
"f-string" or "fixed", icon is visible on hover, and can generate/improve content.

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
   - Fill in **Name** field: "Test Pipeline AI Assistant LLM"
   - Fill in **Description** field: "Pipeline for testing AI Assistant on LLM node"
   - Add LLM node:
     - Click the **+ button** (plus button at top right corner)
     - Select **LLM** from node types
     - Configure the LLM node:
       - In **System** field enter: "You are assistant"
       - Verify **System** field type is set to "fixed" (default type, check the field type selector at left
         of field)
       - In **Task** field enter: "Help user"
       - Verify **Task** field type is set to "fixed" (default type)
       - Leave **Chat history** with default value
       - Leave Input/Output fields empty (or as default)
   - Click **Save** button (top right)
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Verify "Test Pipeline AI Assistant LLM" appears in the pipelines list

### Test Steps

1. Navigate to the **Pipelines** page (sidebar or main menu)
2. Locate the pipeline named "Test Pipeline AI Assistant LLM"
3. Click on the **Configuration tab** to open it in Flow Editor
4. Click the **Fit View** button (button with icon showing square corners, like a camera lens/frame corners)
   to ensure all nodes are visible
5. Click on the **LLM node** to open its configuration panel
6. **Test AI Assistant on System field with "fixed" type (default):**
7. Locate the **System** field
8. Verify the field type is set to "fixed" (default, check the field type selector at left of field)
9. Hover over the **System** field
10. Verify the **AI Assistant icon** (pencil icon) appears on the right side of the field
11. Click the **AI Assistant icon** for the System field
12. Verify the AI Assistant interface opens
13. In the AI Assistant input field, type: "Create a system prompt for a helpful AI assistant that provides
    technical explanations"
14. Click the **Send** button
15. Wait for AI processing to complete
16. Verify the side-by-side comparison is displayed:
    - "Current Option" shows the original content: "You are assistant"
    - "Improved Option" shows the AI-generated content
17. Verify the **Apply** button is available
18. Click the **Apply** button
19. Verify the AI-generated content is applied to the **System** field
20. **Test AI Assistant on System field with "f-string" type:**
21. Locate the **System** field (now contains the AI-generated content from previous steps)
22. Click the field type selector (dropdown at left of System field)
23. Select **f-string** type from the dropdown
24. Verify the field type changes to "f-string"
25. In **System** field enter: "You are assistant"
26. Hover over the **System** field
27. Verify the **AI Assistant icon** (pencil icon) still appears on the right side of the field
28. Click the **AI Assistant icon** for the System field
29. Verify the AI Assistant interface opens again
30. In the AI Assistant input field, type: "Make this more concise"
31. Click the **Send** button
32. Wait for AI processing to complete
33. Verify the side-by-side comparison is displayed with updated content
34. Verify the **Apply** button is available
35. Click the **Apply** button
36. Verify the improved content is applied to the **System** field
37. **Test AI Assistant on Task field with "fixed" type (default):**
38. Locate the **Task** field
39. Verify the field type is set to "fixed" (default, check the field type selector at left of field)
40. Hover over the **Task** field
41. Verify the **AI Assistant icon** (pencil icon) appears on the right side of the field
42. Click the **AI Assistant icon** for the Task field
43. In the AI Assistant input field, type: "Create a task prompt that asks the AI to explain complex topics
    simply"
44. Click the **Send** button
45. Wait for AI processing to complete
46. Verify the side-by-side comparison is displayed:
    - "Current Option" shows the original content: "Help user"
    - "Improved Option" shows the AI-generated content
47. Verify the **Apply** button is available
48. Click the **Apply** button
49. Verify the AI-generated content is applied to the **Task** field
50. **Test AI Assistant on Task field with "f-string" type:**
51. Locate the **Task** field (now contains the AI-generated content from previous steps)
52. Click the field type selector (dropdown at left of Task field)
53. Select **f-string** type from the dropdown
54. Verify the field type changes to "f-string"
55. In **Task** field enter: "Help user"
56. Hover over the **Task** field
57. Verify the **AI Assistant icon** (pencil icon) still appears on the right side of the field
58. Click the **AI Assistant icon** for the Task field
59. Verify the AI Assistant interface opens again
60. In the AI Assistant input field, type: "Add more specific guidelines"
61. Click the **Send** button
62. Wait for AI processing to complete
63. Verify the side-by-side comparison is displayed with updated content
64. Verify the **Apply** button is available
65. Click the **Apply** button
66. Verify the improved content is applied to the **Task** field
67. **Test that AI Assistant does NOT appear for "variable" type:**
68. Click the field type selector for **System** field
69. Select **variable** type from the dropdown
70. Verify the field type changes to "variable"
71. Hover over the **System** field
72. Verify the **AI Assistant icon does NOT appear** for variable type
73. Click the field type selector for **Task** field
74. Select **variable** type from the dropdown
75. Verify the field type changes to "variable"
76. Hover over the **Task** field
77. Verify the **AI Assistant icon does NOT appear** for variable type
78. Click **Save** button to save the pipeline

### Expected Results

- AI Assistant icon (pencil) is visible when hovering over System field with "fixed" type (default)
- AI Assistant interface opens and works correctly with "fixed" type for System field
- AI processes requests and generates improved content for System field with "fixed" type
- Field type can be changed from "fixed" to "f-string" for System field
- AI Assistant icon (pencil) is visible when hovering over System field with "f-string" type
- AI Assistant interface opens and works correctly with "f-string" type for System field
- AI processes requests and generates improved content for System field with "f-string" type
- AI Assistant icon (pencil) is visible when hovering over Task field with "fixed" type (default)
- AI Assistant interface opens and works correctly with "fixed" type for Task field
- AI processes requests and generates improved content for Task field with "fixed" type
- Field type can be changed from "fixed" to "f-string" for Task field
- AI Assistant icon (pencil) is visible when hovering over Task field with "f-string" type
- AI Assistant interface opens and works correctly with "f-string" type for Task field
- AI processes requests and generates improved content for Task field with "f-string" type
- Field types can be changed to "variable" for both System and Task fields
- AI Assistant icon does NOT appear when field type is set to "variable" for either field
- AI Assistant interface opens with input field and Send button
- Content type selector shows "Text" option
- Side-by-side comparison is displayed with "Current Option" and "Improved Option"
- "Current Option" shows original field content
- "Improved Option" displays AI-generated content for each field
- Apply button is available and functional
- Apply button successfully applies generated content to System and Task fields
- No error messages are displayed during the process
- AI-generated content is contextually appropriate for LLM prompts

### Postconditions

1. Delete the test pipeline:
   - Navigate to the **Pipelines** page (sidebar or main menu)
   - Switch to **Table view** (top right)
   - Locate the pipeline with name **Test Pipeline AI Assistant LLM**
   - Click on the **3 dots** (ellipsis menu) under the Actions column
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify "Test Pipeline AI Assistant LLM" is removed from the pipelines list
2. Verify no residual data remains from the test
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- AI Assistant uses the pipeline's configured LLM model
- Only System and Task fields support AI Assistant for LLM nodes
- AI Assistant only available when field type is "f-string" or "fixed", NOT "variable"
- This test validates BOTH "fixed" (default) and "f-string" types for both System and Task fields to ensure
  comprehensive coverage
- Test also verifies AI Assistant does NOT appear for "variable" type
- Content must be contextually appropriate for LLM system and task prompts

---
