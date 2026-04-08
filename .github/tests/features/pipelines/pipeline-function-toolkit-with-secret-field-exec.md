# Test Case: Function Node with Secret Toolkit – Executes Successfully

# Test ID: PIPE-SECR-001

# Priority: High

# Area: Pipelines > Function Node

# Tag: Pipeline, Bug

## Test Description

Verify that a Function node configured with a toolkit field of type Secret (e.g., `openai_token`) resolves the
secret at runtime and executes successfully without secret-related errors.

## Preconditions

1. User navigates to {URL}
2. User logs in with {Username} / {Password}
3. User switches to {Project}
4. A toolkit with a secret field type is available (e.g., "Codex").
   - Verify that the project has a secret option (e.g., "auth_token") configured.
   - If the secret option does not exist, create it in the project's secret management/settings with a valid
     value before proceeding.
5. A pipeline exists or can be created; at least one toolkit and function tool are available

## Test Steps

1. Navigate to Toolkits
2. Create a new "Codex" toolkit (or open existing)
3. Add/verify field `openai_token` with type = Secret and option = "auth_token"
4. Save the toolkit
5. Navigate to Pipelines
6. Create a new pipeline or open an existing one
7. Add a Function node to the pipeline
8. In the node configuration, select Toolkit = "Codex"
9. Select a function tool from the Codex toolkit
10. Save the pipeline (if required by UI)
11. Run the pipeline
12. Observe the Function node execution status/logs

## Expected Results

- The pipeline run completes successfully
- The Function node using the Codex toolkit executes without secret-related errors (resolution/auth succeeds)
- No cleartext secrets are displayed in the UI; secret values remain masked where shown

## Postconditions

- If this test created a pipeline or node, delete it to remove test artifacts
- If the pipeline pre-existed, revert any changes made during the test
