# Test Case: Agent Self-Toolkit Guard

# Test ID: AGT-SLF-001

# Priority: High

# Area: Agents > Toolkits

# Tag: Bug

## Test Description

Verify that an agent cannot include itself as a toolkit. The agent must not appear in its own Toolkits
selector.

## Preconditions

1. User navigates to {URL}
2. User has valid login credentials: {Username}, {Password}
3. User switches to {Project}
4. User has permissions to create, view, edit, and delete agents

## Test Steps

1. Create an agent named "Self Toolkit Guard – Agent"
2. Click the Save button to create the agent
3. Open the created agent for editing
4. Navigate to the Configuration tab
5. Scroll down to the Toolkits section
6. Click the +Agent button and select the same agent in the Toolkits section
7. Verify that "Self Toolkit Guard – Agent" is NOT listed in the dropdown results
8. Capture a screenshot of the dropdown results
9. Delete the created agent (cleanup)

## Expected Results

- The agent is excluded from its own Toolkits selector and cannot be added as its own toolkit.
- No error message is shown; operation is blocked at the UI level.

## Notes

- This test is also applicable for Pipelines (same logic applies).
- Use consistent naming for reliable search.
- Cleanup step ensures no test artifacts remain.
