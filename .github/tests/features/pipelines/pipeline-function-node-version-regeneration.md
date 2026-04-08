# Test Case: Function Node Regeneration Respects Version Configuration

# Test ID: PIPE-REGEN-001

# Priority: High

# Area: Pipelines > Versions

# Tag: Bug, Pipeline

## Test Description

Verify that function node behavior (execute/regenerate) uses the configuration of the currently selected
pipeline version. Changes saved in one version must not affect other versions, and regeneration should reflect
the selected version’s configuration.

## Preconditions

1. User navigates to {URL}
2. User logs in with {Username} / {Password}
3. User switches to {Project}
4. A pipeline exists (or can be created) with at least two versions
5. If the versions do not already differ in a function node’s configuration (e.g., toolkit or function
   selection), create a new version and modify its function node configuration so that the versions differ.

## Test Steps

1. Navigate to Pipelines
2. Open the target pipeline
3. If the pipeline does not have at least two versions with differing function node configurations: a. Create
   a new version (Version Y) from the current pipeline. b. In Version Y, modify the function node
   configuration (e.g., change toolkit or function) and Save.
4. Select Version X
5. Modify the function node configuration (e.g., change toolkit or function) and Save (if not already
   different from Version Y)
6. Switch to Version Y
7. Execute Version Y of the pipeline
8. Verify execution behavior matches Version Y’s function node configuration
9. Switch back to Version X
10. Regenerate the output for Version X
11. Verify regenerated output reflects Version X’s function node configuration

## Expected Results

- Execution under Version Y uses Version Y’s function node configuration (no bleed from Version X)
- Regeneration under Version X uses Version X’s function node configuration
- Version switching does not require duplicate edits; no cross-version configuration leakage
- No unexpected errors or unsaved-changes prompts specific to version switching/regeneration

## Postconditions

- Revert the edit made in Version X to restore original settings
- If a new pipeline or node was created for this test, delete it to remove artifacts
