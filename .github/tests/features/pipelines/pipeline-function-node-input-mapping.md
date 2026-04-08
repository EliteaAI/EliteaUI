# Test Case: Function Node Input Mapping – Auto Persist

# Test ID: PIPE-IMAP-001

# Priority: High

# Area: Pipelines > Function Node

# Tag: Bug, Pipeline

## Test Description

Verify that changing a function node input mapping (e.g., Fixed → F-string) is applied automatically and
persists without manual Save.

## Preconditions

1. User navigates to {URL}
2. User logs in with {Username} / {Password}
3. User switches to {Project}
4. A pipeline exists or can be created; at least one toolkit and function tool are available

## Test Steps

1. Open the target pipeline
2. Add a Function node (or open an existing one)
3. Select Toolkit and Tool for the node
4. In Inputs, set key (e.g., `message`) to type Fixed with value "Hello, World!"
5. Change mapping type to F-string and enter "Hello, {user.name}!"
6. Blur the field (click outside) and switch away/back to the node
7. Reload the page and re-open the pipeline and node

## Expected Results

- Mapping type is F-string and value "Hello, {user.name}!" remains after blur, node switch, and reload
- No manual Save is required; no unsaved-changes warning appears due to this change
- If validation fails (invalid template), mapping is not persisted and a clear inline error is shown

## Postconditions

- If this test created a pipeline or node, delete it to remove test artifacts
- If the pipeline pre-existed, revert the node input mapping to its original configuration

## Notes

- Use environment-specific toolkit/tool names; the above values are examples.
- Cleanup only if the pipeline/node was created by this test.
