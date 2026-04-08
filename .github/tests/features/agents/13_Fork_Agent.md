# Scenario ID: 13_Fork_Agent

#### Scenario Name:

Fork Agent - Complete fork functionality from agent details page and table view

#### Scenario Tags:

functional testing, regression, agents, fork, cross-project

#### Scenario Priority:

High

#### Scenario Description:

This scenario verifies forking agents from both agent details page and table view, including fork parameter
validation, project selection, toolkit configuration during fork, version selection, and cancellation
behaviors. Tests cover agents with various configurations including multiple versions, different toolkit types
(Agent, Toolkit, Pipeline, MCP), and proper cleanup after fork operations.

---

## Test Case ID: TC-13-01

#### Test Case Name:

Fork Agent from Details Page - Cancel Fork Process

#### Test Case Tags:

functional testing, fork, cancel, negative

#### Test Case Priority:

High

#### Test Case Description:

Verify that clicking **Cancel** button in the **Fork parameters** window cancels the fork process and closes
the dialog without creating a fork.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Ensure target project {Project1} is available and accessible for fork operations
7. Create a test agent for fork operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Fork Source"
     - Agent's description: "Test agent for fork functionality verification"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Fork Source" agent in the agents list

### Test Steps

1. Click on the "Test Agent Fork Source" agent to open its details page
2. Navigate to the **Configuration** tab
3. Locate the **Fork Agent** button in the top right corner of the agent details page
4. Click the **Fork Agent** button
5. Observe that the **Fork parameters** window opens
6. Verify the **Fork parameters** window displays:
   - {Project1} selection dropdown
   - Agent's name "Test Agent Fork Source"
   - **FORK** button (initially inactive/disabled)
   - **Cancel** button (active/enabled)
7. Click the **Cancel** button in the **Fork parameters** window
8. Observe the **Fork parameters** window behavior
9. Navigate back to the **Agents** section in the {Project}
10. Click on **Table view** button and verify the agents list
11. Switch to {Project1} (sidebar project switcher)
12. Navigate to the **Agents** section in the {Project1}
13. Click on **Table view** button and verify no forked agent appears in the agents list

### Expected Results

- Fork Agent button is visible and clickable in the agent details page
- **Fork parameters** window opens successfully when clicking Fork Agent button
- **Fork parameters** window displays all required elements
- **Cancel** button is active and clickable
- **FORK** button is initially inactive/disabled when no project is selected
- Clicking **Cancel** button closes the **Fork parameters** window immediately
- No fork operation is performed
- Original agent remains unchanged in the agents list in {Project}
- No new forked agent appears in {Project1} or any other project

### Postconditions

1. Switch back to {Project} (sidebar project switcher)
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Fork Source" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent Fork Source" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
3. Verify no residual data remains from the deleted agent
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Ensure no forked agents were created in {Project1} or any other target projects

---

## Test Case ID: TC-13-02

#### Test Case Name:

Fork Agent from Details Page - Fork Button State Based on Project Selection

#### Test Case Tags:

functional testing, fork, ui-state, validation

#### Test Case Priority:

High

#### Test Case Description:

Verify that the **FORK** button remains inactive until a target {Project1} project is selected, and becomes
active when a project is selected.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Ensure multiple projects are available for selection
7. Create a test agent for fork operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Fork UI State"
     - Agent's description: "Test agent for fork UI state verification"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Fork UI State" agent in the agents list

### Test Steps

1. Click on the "Test Agent Fork UI State" agent to open its details page
2. Navigate to the **Configuration** tab
3. Click the **Fork Agent** button in the top right corner
4. Observe the initial state of the **Fork parameters** window:
   - Verify **FORK** button state (should be inactive/disabled)
   - Verify **Cancel** button state (should be active/enabled)
5. Attempt to click the **FORK** button while no project is selected
6. Click on the Project selection dropdown
7. Observe the available projects in the dropdown list
8. Select a target {Project1} project from the dropdown
9. Observe the **FORK** button state after project selection
10. Verify the **FORK** button becomes active/enabled
11. Click the **Cancel** button to close the dialog

### Expected Results

- **Fork parameters** window opens with project dropdown empty
- **FORK** button is initially inactive/disabled and not clickable
- **Cancel** button is always active/enabled and clickable
- Clicking inactive **FORK** button has no effect
- Project dropdown displays available projects for selection
- After selecting a project, **FORK** button becomes active/enabled
- **FORK** button visual appearance changes to indicate it's now clickable
- **Cancel** button functionality remains unchanged throughout the process

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Fork UI State" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent Fork UI State" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document which projects appear in the dropdown for future test reference

---

## Test Case ID: TC-13-03

#### Test Case Name:

Fork Agent from Details Page - Successful Fork with Fork Icon

#### Test Case Tags:

functional testing, fork, positive, icon-verification

#### Test Case Priority:

High

#### Test Case Description:

Verify successful agent forking from details page, including navigation to target {Project1} project and
verification that the forked agent displays a fork icon.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Ensure at least one target {Project1} project is available (different from current project)
7. Create a test agent for fork operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Fork Success"
     - Agent's description: "Test agent for successful fork verification"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Fork Success" agent in the agents list

### Test Steps

1. Click on the "Test Agent Fork Success" agent to open its details page
2. Navigate to the **Configuration** tab
3. Click the **Fork Agent** button in the top right corner
4. In the **Fork parameters** window, click on the Project selection dropdown
5. Select a target {Project1} project from the available projects list
6. Verify the **FORK** button becomes active/enabled
7. Click the **FORK** button
8. Wait for the fork operation to complete
9. Observe if the system automatically navigates to the target {Project1} project
10. Navigate to the **Agents** section in the target {Project1} project
11. Click on **Table view** button
12. Locate the forked agent in the agents list
13. Verify the forked agent displays a fork icon
14. Click on the forked agent to open its details
15. Verify the agent configuration matches the original agent

### Expected Results

- **Fork parameters** window opens successfully
- Target {Project1} project can be selected from dropdown
- **FORK** button becomes active after project selection
- Fork operation completes without errors
- System shows success notification for fork completion
- User is automatically navigated to the target {Project1} project (or navigation instructions are provided)
- Forked agent appears in the target {Project1} project's agents list
- Forked agent displays a distinctive fork icon in the list view
- Forked agent configuration matches the original agent's configuration
- Forked agent name includes appropriate suffix or prefix indicating it's a fork

### Postconditions

1. Clean up test data by deleting the forked agent in the target {Project1} project:
   - Ensure you are in the target {Project1} project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent Fork Success" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Fork Success" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent Fork Success" name
   - Verify the agent is removed from the agents list and not present
4. Verify no residual data remains from both original and forked agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Record the target {Project1} project name for cleanup reference
- Document the fork icon appearance for future verification

---

## Test Case ID: TC-13-04

#### Test Case Name:

Fork Agent with Multiple Versions - All Versions Selected

#### Test Case Tags:

functional testing, fork, versions, multi-version

#### Test Case Priority:

High

#### Test Case Description:

Verify forking an agent that has multiple versions with all versions selected in the fork operation.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with multiple versions:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Multiple Versions"
     - Agent's description: "Test agent for multi-version fork verification"
   - Click the **Save** button
   - Navigate to **Configuration** tab
   - Add some text in **Instructions** field: "Version 1 instructions"
   - Click **Save as version** button
   - Enter version name: "v1.0"
   - Click **Save** button
   - Modify **Instructions** field: "Version 2 instructions"
   - Click **Save as version** button
   - Enter version name: "v2.0"
   - Click **Save** button
   - Modify **Instructions** field: "Version 3 instructions"
   - Click **Save as version** button
   - Enter version name: "v3.0"
   - Click **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Multiple Versions" agent in the agents list

### Test Steps

1. Click on the "Test Agent Multiple Versions" agent to open its details page
2. Navigate to the **Configuration** tab
3. Verify the agent has multiple versions in the version dropdown
4. Click the **Fork Agent** button in the top right corner
5. In the **Fork parameters** window, observe the version selection options
6. Verify that all versions are selected by default or select all versions manually
7. Click on the Project selection dropdown
8. Select a target {Project1} project from the available projects list
9. Verify the **FORK** button becomes active/enabled
10. Click the **FORK** button
11. Wait for the fork operation to complete
12. Navigate to the target {Project1} project
13. Navigate to the **Agents** section in the target {Project1} project
14. Click on **Table view** button
15. Locate the forked agent in the agents list
16. Click on the forked agent to open its details
17. Navigate to **Configuration** tab
18. Verify all versions are present in the version dropdown
19. Switch between versions and verify each version's content matches the original

### Expected Results

- Agent with multiple versions is created successfully
- **Fork parameters** window displays version selection options
- All versions are available for selection in fork dialog
- All versions are selected (either by default or manually)
- Fork operation completes successfully with all versions
- Forked agent appears in target {Project1} project with fork icon
- Forked agent contains all versions from the original agent
- Each version in the forked agent matches the corresponding version in the original
- Version switching works correctly in the forked agent
- All version-specific configurations are preserved

### Postconditions

1. Clean up test data by deleting the forked agent in the target {Project1} project:
   - Ensure you are in the target {Project1} project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent Multiple Versions" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent with all versions:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Multiple Versions" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent Multiple Versions" name
   - Verify the agent is removed from the agents list and not present
4. Verify no residual data remains from both original and forked agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document the number of versions created for verification
- Verify version naming conventions are maintained in fork

---

## Test Case ID: TC-13-05

#### Test Case Name:

Fork Agent with Selective Version - 2 Versions Selected

#### Test Case Tags:

functional testing, fork, versions, selective-version

#### Test Case Priority:

High

#### Test Case Description:

Verify forking an agent with selective version choice - selecting only 2 versions out of multiple available
versions.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with multiple versions (at least 3):
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Selective Versions"
     - Agent's description: "Test agent for selective version fork verification"
   - Click the **Save** button
   - Navigate to **Configuration** tab
   - Add text in **Instructions** field: "Original version instructions"
   - Click **Save as version** button
   - Enter version name: "v1.0"
   - Click **Save** button
   - Modify **Instructions** field: "Version 2 - updated instructions"
   - Click **Save as version** button
   - Enter version name: "v2.0"
   - Click **Save** button
   - Modify **Instructions** field: "Version 3 - latest instructions"
   - Click **Save as version** button
   - Enter version name: "v3.0"
   - Click **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Selective Versions" agent in the agents list

### Test Steps

1. Click on the "Test Agent Selective Versions" agent to open its details page
2. Navigate to the **Configuration** tab
3. Verify the agent has multiple versions (at least 3) in the version dropdown
4. Click the **Fork Agent** button in the top right corner
5. In the Fork parameters window, observe the version selection options
6. Unselect all versions first (if all are selected by default)
7. Select only 2 specific versions (e.g., "v1.0" and "v3.0", skipping "v2.0")
8. Verify only the selected 2 versions are marked for forking
9. Click on the Project selection dropdown
10. Select a target project from the available projects list
11. Verify the FORK button becomes active/enabled
12. Click the **FORK** button
13. Wait for the fork operation to complete
14. Navigate to the target project
15. Navigate to the **Agents** section in the target project
16. Click on **Table view** button
17. Locate the forked agent in the agents list
18. Click on the forked agent to open its details
19. Navigate to **Configuration** tab
20. Verify only the selected 2 versions are present in the version dropdown
21. Switch between the available versions and verify content matches original versions

### Expected Results

- Agent with multiple versions (3+) is created successfully
- Fork parameters window allows individual version selection/deselection
- Only the 2 selected versions are marked for forking
- Fork operation completes successfully with only selected versions
- Forked agent appears in target project with fork icon
- Forked agent contains only the 2 selected versions (v1.0 and v3.0)
- The skipped version (v2.0) is not present in the forked agent
- Each selected version in the forked agent matches the corresponding version in the original
- Version switching works correctly between the 2 available versions
- Latest version indicator is correctly updated in the forked agent

### Postconditions

1. Clean up test data by deleting the forked agent in the target project:
   - Ensure you are in the target project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent Selective Versions" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent with all versions:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Selective Versions" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent Selective Versions" name
   - Verify the agent is removed from the agents list and not present
4. Verify no residual data remains from both original and forked agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document which versions were selected and verify they match in the forked agent
- Confirm that unselected versions are completely absent from the fork

---

## Test Case ID: TC-13-06

#### Test Case Name:

Fork Agent - Empty Project Field Validation

#### Test Case Tags:

functional testing, fork, validation, negative

#### Test Case Priority:

High

#### Test Case Description:

Verify that the FORK button remains inactive when project field is empty and the fork operation cannot be
completed without selecting a target project.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent for fork validation:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Fork Validation"
     - Agent's description: "Test agent for fork validation verification"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Fork Validation" agent in the agents list

### Test Steps

1. Click on the "Test Agent Fork Validation" agent to open its details page
2. Navigate to the **Configuration** tab
3. Click the **Fork Agent** button in the top right corner
4. In the Fork parameters window, observe the initial state:
   - Project field should be empty
   - FORK button should be inactive/disabled
5. Leave the project field empty
6. Attempt to click the FORK button multiple times
7. Observe the button behavior and any error messages
8. Click on the project dropdown and then click elsewhere without selecting a project
9. Verify the project field remains empty
10. Attempt to click the FORK button again
11. Observe the system behavior
12. Click the Cancel button to close the dialog

### Expected Results

- Fork parameters window opens with empty project field
- FORK button is inactive/disabled when project field is empty
- Clicking inactive FORK button has no effect (no action performed)
- No error messages are displayed when clicking inactive button
- Button remains visually disabled/inactive
- Project dropdown opens and closes without affecting button state when no selection is made
- System prevents fork operation when no target project is selected
- Cancel button works correctly to close the dialog
- No fork operation is initiated or completed

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Fork Validation" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent Fork Validation" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify that no partial fork data is created when validation fails

---

## Test Case ID: TC-13-07

#### Test Case Name:

Fork Agent with Agent Toolkit - Complete Configuration

#### Test Case Tags:

functional testing, fork, toolkit, agent-toolkit

#### Test Case Priority:

High

#### Test Case Description:

Verify forking an agent that has an Agent toolkit added, including proper configuration of the toolkit during
the fork process.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a secondary agent to be used as toolkit:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Helper Agent Toolkit"
     - Agent's description: "Helper agent to be used as toolkit"
   - Click the **Save** button
7. Create a test agent with Agent toolkit:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent With Agent Toolkit"
     - Agent's description: "Test agent with Agent toolkit for fork verification"
   - Click the **Save** button
   - Navigate to **Configuration** tab
   - Scroll down to **Toolkits** section
   - Click **+Agent** in toolkit section
   - Type "Helper Agent Toolkit" in search field
   - Select "Helper Agent Toolkit" agent from suggestions
   - Click **Add** button to add the toolkit
   - Click **Save** button to save the agent
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent With Agent Toolkit" agent in the agents list

### Test Steps

1. Click on the "Test Agent With Agent Toolkit" agent to open its details page
2. Navigate to the **Configuration** tab
3. Verify the Agent toolkit is properly configured in the Toolkits section
4. Click the **Fork Agent** button in the top right corner
5. In the **Fork parameters** window, observe the toolkit configuration options
6. Verify the Agent toolkit appears in the fork configuration
7. For the Agent toolkit, configure the required fields:
   - Select model from dropdown
   - Select "Helper Agent Toolkit" from available agents
   - Select version from available versions
8. Click on the Project selection dropdown
9. Select a target {Project1} project from the available projects list
10. Verify the **FORK** button becomes active/enabled
11. Click the **FORK** button
12. Wait for the fork operation to complete
13. Navigate to the target {Project1} project
14. Navigate to the **Agents** section in the target {Project1} project
15. Click on **Table view** button
16. Locate the forked agent in the agents list
17. Click on the forked agent to open its details
18. Navigate to **Configuration** tab
19. Verify the Agent toolkit is present and properly configured
20. Verify the toolkit configuration matches the original agent's toolkit setup

### Expected Results

- Agent with Agent toolkit is created successfully
- **Fork parameters** window displays the Agent toolkit for configuration
- Agent toolkit configuration fields are properly displayed (model, agent name, version)
- All required fields can be configured during fork process
- Fork operation completes successfully with toolkit configuration
- Forked agent appears in target {Project1} project with fork icon
- Forked agent contains the Agent toolkit with proper configuration
- Toolkit configuration in forked agent matches the original configuration
- Agent toolkit functionality is preserved in the forked agent

### Postconditions

1. Clean up test data by deleting the forked agent in the target {Project1} project:
   - Ensure you are in the target {Project1} project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent With Agent Toolkit" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent With Agent Toolkit" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Clean up the helper agent:
   - Locate the "Helper Agent Toolkit" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
5. Verify no residual data remains from all deleted agents
6. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document the Agent toolkit configuration for verification
- Ensure the helper agent is available in both projects if needed

---

## Test Case ID: TC-13-08

#### Test Case Name:

Fork Agent with Artifact Toolkit - Complete Configuration

#### Test Case Tags:

functional testing, fork, toolkit, artifact-toolkit

#### Test Case Priority:

High

#### Test Case Description:

Verify forking an agent that has an Artifact toolkit added, including proper configuration of the toolkit
during the fork process.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with Artifact toolkit:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent With Artifact Toolkit"
     - Agent's description: "Test agent with Artifact toolkit for fork verification"
   - Click the **Save** button
   - Navigate to **Configuration** tab
   - Scroll down to **Toolkits** section
   - Click **+Toolkit** button
   - Select **Artifact** from the toolkit type options
   - In the Artifact toolkit configuration:
     - Select model from dropdown
     - Enter bucket name (e.g., "test-artifacts-bucket")
     - Configure any other required fields
   - Click **Add** button to add the toolkit
   - Click **Save** button to save the agent
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent With Artifact Toolkit" agent in the agents list

### Test Steps

1. Click on the "Test Agent With Artifact Toolkit" agent to open its details page
2. Navigate to the **Configuration** tab
3. Verify the Artifact toolkit is properly configured in the Toolkits section
4. Note the bucket name and other configuration details
5. Click the **Fork Agent** button in the top right corner
6. In the Fork parameters window, observe the toolkit configuration options
7. Verify the Artifact toolkit appears in the fork configuration
8. For the Artifact toolkit, configure the required fields:
   - Select model from dropdown
   - Enter or verify bucket name
   - Configure any other required fields
9. Click on the Project selection dropdown
10. Select a target project from the available projects list
11. Verify the FORK button becomes active/enabled
12. Click the **FORK** button
13. Wait for the fork operation to complete
14. Navigate to the target project
15. Navigate to the **Agents** section in the target project
16. Click on **Table view** button
17. Locate the forked agent in the agents list
18. Click on the forked agent to open its details
19. Navigate to **Configuration** tab
20. Verify the Artifact toolkit is present and properly configured
21. Verify the toolkit configuration matches the original agent's toolkit setup

### Expected Results

- Agent with Artifact toolkit is created successfully
- Fork parameters window displays the Artifact toolkit for configuration
- Artifact toolkit configuration fields are properly displayed (model, bucket name, etc.)
- All required fields can be configured during fork process
- Fork operation completes successfully with toolkit configuration
- Forked agent appears in target project with fork icon
- Forked agent contains the Artifact toolkit with proper configuration
- Toolkit configuration in forked agent matches the original configuration
- Bucket name and other settings are preserved correctly

### Postconditions

1. Clean up test data by deleting the forked agent in the target project:
   - Ensure you are in the target project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent With Artifact Toolkit" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent With Artifact Toolkit" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document the bucket name and configuration details for verification
- Verify bucket accessibility in the target project if applicable

---

## Test Case ID: TC-13-09

#### Test Case Name:

Fork Agent with Multiple Toolkits - Navigation Between Toolkits

#### Test Case Tags:

functional testing, fork, toolkit, multi-toolkit, navigation

#### Test Case Priority:

High

#### Test Case Description:

Verify forking an agent that has multiple toolkits added, including navigation between toolkits using arrow
buttons in the fork parameters window.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with multiple toolkits:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Multiple Toolkits"
     - Agent's description: "Test agent with multiple toolkits for fork navigation verification"
   - Click the **Save** button
   - Navigate to **Configuration** tab
   - Scroll down to **Toolkits** section
   - Add first toolkit (Artifact):
     - Click **+Toolkit** button
     - Select **Artifact** from options
     - Configure: model, bucket name "artifacts-bucket-1"
     - Click **Add** button
   - Add second toolkit (GitHub):
     - Click **+Toolkit** button
     - Select **GitHub** from options
     - Configure: model, GitHub configuration, repository
     - Click **Add** button
   - Add third toolkit (Pipeline):
     - Click **+Toolkit** button
     - Select **Pipeline** from options
     - Configure required fields
     - Click **Add** button
   - Click **Save** button to save the agent
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Multiple Toolkits" agent in the agents list

### Test Steps

1. Click on the "Test Agent Multiple Toolkits" agent to open its details page
2. Navigate to the **Configuration** tab
3. Verify multiple toolkits are properly configured in the Toolkits section
4. Count the number of toolkits added (should be 3)
5. Click the **Fork Agent** button in the top right corner
6. In the Fork parameters window, observe the toolkit configuration area
7. Verify the first toolkit is displayed for configuration
8. Look for navigation arrows (left and right arrows) in the toolkit section
9. Click the **right arrow** to navigate to the next toolkit
10. Verify the second toolkit configuration is displayed
11. Click the **right arrow** again to navigate to the third toolkit
12. Verify the third toolkit configuration is displayed
13. Click the **left arrow** to navigate back to the second toolkit
14. Click the **left arrow** again to navigate back to the first toolkit
15. Configure each toolkit properly by navigating through them:
    - First toolkit: verify/set configuration
    - Second toolkit: verify/set configuration
    - Third toolkit: verify/set configuration
16. Click on the Project selection dropdown
17. Select a target project from the available projects list
18. Verify the FORK button becomes active/enabled
19. Click the **FORK** button
20. Wait for the fork operation to complete

### Expected Results

- Agent with multiple toolkits (3) is created successfully
- Fork parameters window displays toolkit configuration area
- First toolkit is displayed by default in the configuration area
- Navigation arrows (left/right) are visible and functional
- Right arrow navigates to next toolkit in sequence
- Left arrow navigates to previous toolkit in sequence
- All toolkits can be accessed through navigation
- Each toolkit displays its specific configuration fields
- Navigation preserves configuration changes made to each toolkit
- Fork operation completes successfully with all toolkit configurations
- Navigation arrows are disabled appropriately (left arrow disabled on first toolkit, right arrow disabled on
  last toolkit)

### Postconditions

1. Navigate to the target project and verify the forked agent
2. Clean up test data by deleting the forked agent in the target project:
   - Navigate to the **Agents** section in target project
   - Click on **Table view** button
   - Locate the forked "Test Agent Multiple Toolkits" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion and verify removal
3. Switch back to the original project
4. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent Multiple Toolkits" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion by entering agent's name
   - Verify the agent is removed from the agents list
5. Verify no residual data remains from deleted agents
6. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document the order of toolkits and verify navigation sequence
- Verify that all toolkit configurations are preserved during navigation

---

## Test Case ID: TC-13-10

#### Test Case Name:

Fork Agent from Table View - Using Context Menu

#### Test Case Tags:

functional testing, fork, table-view, context-menu

#### Test Case Priority:

High

#### Test Case Description:

Verify forking an agent from the agents table view using the three dots (ellipsis) context menu and selecting
Fork Agent option.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent for fork from table view:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Table Fork"
     - Agent's description: "Test agent for fork from table view verification"
   - Add some configuration for verification:
     - Navigate to **Configuration** tab
     - Add text in **Instructions** field: "Test instructions for table fork"
     - Add tag: "table-test"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Table Fork" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project}
2. Click on **Table view** button to display agents in table format
3. Locate the "Test Agent Table Fork" agent in the agents list
4. Find the three dots (ellipsis) button on the right side of the agent row
5. Click on the three dots (ellipsis) button to open the context menu
6. Verify the context menu options are displayed
7. Locate and click on **Fork Agent** option from the dropdown menu
8. Verify the Fork parameters window opens
9. Observe the Fork parameters window contents:
   - Project selection dropdown
   - Version selection (if applicable)
   - FORK button (initially inactive)
   - Cancel button (active)
10. Click on the Project selection dropdown
11. Select a target project from the available projects list
12. Verify the FORK button becomes active/enabled
13. Click the **FORK** button
14. Wait for the fork operation to complete
15. Navigate to the target project
16. Navigate to the **Agents** section in the target project
17. Click on **Table view** button
18. Locate the forked agent in the agents list
19. Verify the forked agent displays with fork icon
20. Click on the forked agent to verify configuration matches original

### Expected Results

- Agents table view displays correctly with all agents
- Three dots (ellipsis) button is visible on each agent row
- Context menu opens when clicking the ellipsis button
- Fork Agent option is available in the context menu
- Fork Agent option is clickable and functional
- Fork parameters window opens from table view context menu
- Fork parameters window functions identically to details page fork
- Project selection and validation work correctly
- Fork operation completes successfully from table view initiation
- Forked agent appears in target project with fork icon
- Forked agent configuration matches the original agent
- All agent properties are preserved in the fork

### Postconditions

1. Clean up test data by deleting the forked agent in the target project:
   - Ensure you are in the target project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent Table Fork" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent Table Fork" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify that fork functionality is identical whether initiated from details page or table view
- Document any differences in user experience between the two fork initiation methods

---

## Test Case ID: TC-13-11

#### Test Case Name:

Fork Agent from Table View - Cancel Fork Process

#### Test Case Tags:

functional testing, fork, table-view, cancel, negative

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that clicking Cancel button in the Fork parameters window (initiated from table view) cancels the fork
process and closes the dialog without creating a fork.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent for cancel fork from table view:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Table Cancel"
     - Agent's description: "Test agent for cancel fork from table view verification"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Table Cancel" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project}
2. Click on **Table view** button to display agents in table format
3. Locate the "Test Agent Table Cancel" agent in the agents list
4. Click on the three dots (ellipsis) button on the right side of the agent row
5. Select **Fork Agent** from the context menu dropdown
6. Verify the Fork parameters window opens
7. Observe the Fork parameters window initial state:
   - Project field should be empty
   - FORK button should be inactive/disabled
   - Cancel button should be active/enabled
8. Optionally select a project to test cancel with project selected
9. Click the **Cancel** button in the Fork parameters window
10. Observe the Fork parameters window behavior
11. Verify the window closes immediately
12. Check that no fork operation was initiated
13. Remain in the current project and verify agent list
14. Check other projects to ensure no fork was created

### Expected Results

- Table view displays agents correctly
- Context menu opens from ellipsis button
- Fork Agent option is available and clickable
- Fork parameters window opens from table view
- Cancel button is visible and active in the Fork parameters window
- Clicking Cancel button closes the Fork parameters window immediately
- No fork operation is performed or initiated
- Original agent remains unchanged in the current project
- No forked agent appears in any target project
- User remains on the current agents table view
- System returns to normal state after cancellation

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the "Test Agent Table Cancel" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Verify no forked agents were created in any projects
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Confirm that cancel behavior is identical whether initiated from details page or table view
- Verify no partial fork data or temporary files are created during cancellation

---

## Test Case ID: TC-13-12

#### Test Case Name:

Fork Agent with Conversation Starters - Complete Transfer Verification

#### Test Case Tags:

functional testing, fork, conversation-starters, configuration

#### Test Case Priority:

High

#### Test Case Description:

Verify that when forking an agent with configured conversation starters, all conversation starters are
correctly transferred to the forked agent with proper display and functionality.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with conversation starters:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Conversation Starters"
     - Agent's description: "Test agent with conversation starters for fork verification"
   - Navigate to **Configuration** tab
   - Scroll down to **Conversation starters** section
   - Add multiple conversation starters:
     - Click **+ Add conversation starter** button
     - Enter starter 1: "How can you help me with data analysis?"
     - Click **Add** button
     - Click **+ Add conversation starter** button
     - Enter starter 2: "What are your main capabilities?"
     - Click **Add** button
     - Click **+ Add conversation starter** button
     - Enter starter 3: "Can you provide project recommendations?"
     - Click **Add** button
   - Click **Save** button to save the agent
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Conversation Starters" agent in the agents list

### Test Steps

1. Click on the "Test Agent Conversation Starters" agent to open its details page
2. Navigate to the **Configuration** tab
3. Verify all conversation starters are properly configured:
   - "How can you help me with data analysis?"
   - "What are your main capabilities?"
   - "Can you provide project recommendations?"
4. Click the **Fork Agent** button in the top right corner
5. In the Fork parameters window, click on the Project selection dropdown
6. Select a target project from the available projects list
7. Verify the FORK button becomes active/enabled
8. Click the **FORK** button
9. Wait for the fork operation to complete
10. Navigate to the target project
11. Navigate to the **Agents** section in the target project
12. Click on **Table view** button
13. Locate the forked agent in the agents list
14. Click on the forked agent to open its details
15. Navigate to **Configuration** tab
16. Scroll down to **Conversation starters** section
17. Verify all conversation starters are present and correctly displayed:
    - Count the number of conversation starters (should be 3)
    - Verify text content matches original starters exactly
    - Verify each starter is properly formatted and editable
18. Navigate to the **Chat** tab of the forked agent
19. Verify conversation starters are displayed in the chat interface
20. Click on each conversation starter to test functionality

### Expected Results

- Agent with conversation starters is created successfully
- All 3 conversation starters are properly configured in original agent
- Fork operation completes successfully
- Forked agent appears in target project with fork icon
- Forked agent contains all conversation starters from the original
- All conversation starter text content matches exactly
- Conversation starters are properly formatted in the configuration
- Conversation starters are displayed correctly in the chat interface
- Each conversation starter is clickable and functional in the forked agent
- No conversation starters are lost or duplicated during fork

### Postconditions

1. Clean up test data by deleting the forked agent in the target project:
   - Ensure you are in the target project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent Conversation Starters" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent Conversation Starters" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document exact conversation starter text for verification
- Verify conversation starters functionality in chat interface

---

## Test Case ID: TC-13-13

#### Test Case Name:

Fork Agent with Welcome Message - Complete Message Transfer

#### Test Case Tags:

functional testing, fork, welcome-message, configuration

#### Test Case Priority:

High

#### Test Case Description:

Verify that when forking an agent with a configured welcome message, the welcome message is correctly
transferred to the forked agent and displays properly in both configuration and chat interface.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with welcome message:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Welcome Message"
     - Agent's description: "Test agent with welcome message for fork verification"
   - Navigate to **Configuration** tab
   - Scroll down to **Welcome message** section
   - Enter welcome message: "Hello! I'm your AI assistant ready to help you with various tasks. I can provide
     data analysis, answer questions, and offer project recommendations. How can I assist you today?"
   - Click **Save** button to save the agent
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Welcome Message" agent in the agents list

### Test Steps

1. Click on the "Test Agent Welcome Message" agent to open its details page
2. Navigate to the **Configuration** tab
3. Scroll down to **Welcome message** section
4. Verify the welcome message is properly configured and displays the full text
5. Navigate to the **Chat** tab
6. Verify the welcome message is displayed in the chat interface
7. Return to **Configuration** tab
8. Click the **Fork Agent** button in the top right corner
9. In the Fork parameters window, click on the Project selection dropdown
10. Select a target project from the available projects list
11. Verify the FORK button becomes active/enabled
12. Click the **FORK** button
13. Wait for the fork operation to complete
14. Navigate to the target project
15. Navigate to the **Agents** section in the target project
16. Click on **Table view** button
17. Locate the forked agent in the agents list
18. Click on the forked agent to open its details
19. Navigate to **Configuration** tab
20. Scroll down to **Welcome message** section
21. Verify the welcome message is present and matches the original exactly
22. Navigate to the **Chat** tab of the forked agent
23. Verify the welcome message is displayed correctly in the chat interface
24. Compare the welcome message display with the original agent

### Expected Results

- Agent with welcome message is created successfully
- Welcome message is properly configured in original agent Configuration tab
- Welcome message displays correctly in original agent Chat tab
- Fork operation completes successfully
- Forked agent appears in target project with fork icon
- Welcome message is transferred completely to the forked agent
- Welcome message text in forked agent matches original exactly (character-by-character)
- Welcome message formatting is preserved in the forked agent
- Welcome message displays correctly in forked agent Configuration tab
- Welcome message displays correctly in forked agent Chat tab
- No truncation or alteration of welcome message content occurs

### Postconditions

1. Clean up test data by deleting the forked agent in the target project:
   - Ensure you are in the target project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent Welcome Message" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent Welcome Message" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document exact welcome message text for character-by-character comparison
- Verify message formatting and line breaks are preserved

---

## Test Case ID: TC-13-14

#### Test Case Name:

Fork Agent with Instructions - Complete Instructions Transfer

#### Test Case Tags:

functional testing, fork, instructions, configuration

#### Test Case Priority:

High

#### Test Case Description:

Verify that when forking an agent with configured instructions, all instructions content is correctly
transferred to the forked agent and displays properly with correct formatting.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with detailed instructions:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Instructions"
     - Agent's description: "Test agent with detailed instructions for fork verification"
   - Navigate to **Configuration** tab
   - In the **Instructions** field, enter detailed instructions:

     ```
     You are a specialized AI assistant with the following capabilities:

     1. Data Analysis
        - Analyze datasets and provide insights
        - Create visualizations and reports
        - Identify patterns and trends

     2. Project Management
        - Help organize tasks and timelines
        - Provide project recommendations
        - Track progress and milestones

     3. Communication Guidelines
        - Always be professional and helpful
        - Provide clear and concise answers
        - Ask clarifying questions when needed

     Important: Always maintain confidentiality and follow security protocols.
     ```

   - Click **Save** button to save the agent
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Instructions" agent in the agents list

### Test Steps

1. Click on the "Test Agent Instructions" agent to open its details page
2. Navigate to the **Configuration** tab
3. Verify the **Instructions** field contains the full detailed instructions
4. Note the formatting, line breaks, and numbered list structure
5. Click the **Fork Agent** button in the top right corner
6. In the Fork parameters window, click on the Project selection dropdown
7. Select a target project from the available projects list
8. Verify the FORK button becomes active/enabled
9. Click the **FORK** button
10. Wait for the fork operation to complete
11. Navigate to the target project
12. Navigate to the **Agents** section in the target project
13. Click on **Table view** button
14. Locate the forked agent in the agents list
15. Click on the forked agent to open its details
16. Navigate to **Configuration** tab
17. Verify the **Instructions** field in the forked agent
18. Compare the instructions content with the original agent:
    - Verify all text content is identical
    - Verify formatting is preserved (line breaks, numbering, bullet points)
    - Verify no content is truncated or missing
    - Verify special characters and formatting are maintained
19. Check the character count and structure match exactly

### Expected Results

- Agent with detailed instructions is created successfully
- Instructions field contains all specified content with proper formatting
- Fork operation completes successfully
- Forked agent appears in target project with fork icon
- Instructions content is transferred completely to the forked agent
- All text content in instructions matches original exactly
- Formatting is preserved including:
  - Line breaks and paragraph structure
  - Numbered lists (1, 2, 3)
  - Sub-bullet points with proper indentation
  - Special formatting characters
- No content truncation or alteration occurs
- Instructions field is fully editable in the forked agent
- All sections of instructions are properly maintained

### Postconditions

1. Clean up test data by deleting the forked agent in the target project:
   - Ensure you are in the target project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent Instructions" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent Instructions" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document exact instructions content for verification
- Pay special attention to formatting preservation during fork

---

## Test Case ID: TC-13-15

#### Test Case Name:

Fork Agent with Variables - Default Values Transfer

#### Test Case Tags:

functional testing, fork, variables, default-values

#### Test Case Priority:

High

#### Test Case Description:

Verify that when forking an agent with configured variables and their default values, all variables with their
default values are correctly transferred to the forked agent.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with variables and default values:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Variables"
     - Agent's description: "Test agent with variables for fork verification"
   - Navigate to **Configuration** tab
   - Scroll down to **Variables** section
   - Add multiple variables with default values:
     - Click **+ Add variable** button
     - Variable 1: Name: "project_name", Default value: "Sample Project", Description: "Name of the current
       project"
     - Click **Add** button
     - Click **+ Add variable** button
     - Variable 2: Name: "user_role", Default value: "Data Analyst", Description: "User's role in the
       organization"
     - Click **Add** button
     - Click **+ Add variable** button
     - Variable 3: Name: "max_results", Default value: "50", Description: "Maximum number of results to
       return"
     - Click **Add** button
   - Click **Save** button to save the agent
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Variables" agent in the agents list

### Test Steps

1. Click on the "Test Agent Variables" agent to open its details page
2. Navigate to the **Configuration** tab
3. Scroll down to **Variables** section
4. Verify all variables are properly configured with their default values:
   - project_name: "Sample Project"
   - user_role: "Data Analyst"
   - max_results: "50"
5. Note the variable descriptions and any additional settings
6. Click the **Fork Agent** button in the top right corner
7. In the Fork parameters window, click on the Project selection dropdown
8. Select a target project from the available projects list
9. Verify the FORK button becomes active/enabled
10. Click the **FORK** button
11. Wait for the fork operation to complete
12. Navigate to the target project
13. Navigate to the **Agents** section in the target project
14. Click on **Table view** button
15. Locate the forked agent in the agents list
16. Click on the forked agent to open its details
17. Navigate to **Configuration** tab
18. Scroll down to **Variables** section
19. Verify all variables are present with correct default values:
    - Count the number of variables (should be 3)
    - Verify variable names match exactly
    - Verify default values match exactly
    - Verify descriptions match exactly
20. Test variable functionality by modifying default values temporarily
21. Verify variables are editable and functional in the forked agent

### Expected Results

- Agent with variables and default values is created successfully
- All 3 variables are properly configured in original agent
- Fork operation completes successfully
- Forked agent appears in target project with fork icon
- All variables are transferred to the forked agent
- Variable names are preserved exactly:
  - project_name
  - user_role
  - max_results
- Default values are preserved exactly:
  - "Sample Project"
  - "Data Analyst"
  - "50"
- Variable descriptions are preserved exactly
- All variable settings and configurations are maintained
- Variables are fully functional and editable in the forked agent
- No variables are lost, duplicated, or corrupted during fork

### Postconditions

1. Clean up test data by deleting the forked agent in the target project:
   - Ensure you are in the target project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent Variables" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent Variables" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document exact variable names and default values for verification
- Test variable functionality after fork to ensure they work properly

---

## Test Case ID: TC-13-16

#### Test Case Name:

Fork Agent - LLM Model Transfer Verification

#### Test Case Tags:

functional testing, fork, llm-model, model-settings

#### Test Case Priority:

High

#### Test Case Description:

Verify that when forking an agent with a specific LLM model configured, the LLM model selection is correctly
transferred to the forked agent and displays properly in the model dropdown.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with specific LLM model:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent LLM Model"
     - Agent's description: "Test agent with LLM model for fork verification"
   - Navigate to **Configuration** tab
   - In the **Model** section, click on the model dropdown
   - Select a specific LLM model (e.g., "GPT-4", "Claude-3", or other available model)
   - Note the selected model name for verification
   - Click **Save** button to save the agent
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent LLM Model" agent in the agents list

### Test Steps

1. Click on the "Test Agent LLM Model" agent to open its details page
2. Navigate to the **Configuration** tab
3. In the **Model** section, verify the selected LLM model is displayed correctly
4. Note the exact model name and version (if applicable)
5. Click the **Fork Agent** button in the top right corner
6. In the Fork parameters window, click on the Project selection dropdown
7. Select a target project from the available projects list
8. Verify the FORK button becomes active/enabled
9. Click the **FORK** button
10. Wait for the fork operation to complete
11. Navigate to the target project
12. Navigate to the **Agents** section in the target project
13. Click on **Table view** button
14. Locate the forked agent in the agents list
15. Click on the forked agent to open its details
16. Navigate to **Configuration** tab
17. In the **Model** section, verify the LLM model selection:
    - Verify the same model is selected in the dropdown
    - Verify the model name matches the original exactly
    - Verify the model version (if applicable) matches
18. Click on the model dropdown to verify it's functional
19. Verify other available models are still selectable
20. Return to the original model selection to confirm it's preserved

### Expected Results

- Agent with specific LLM model is created successfully
- LLM model is properly selected and displayed in original agent
- Fork operation completes successfully
- Forked agent appears in target project with fork icon
- LLM model selection is transferred correctly to the forked agent
- Model dropdown displays the same model as selected in original
- Model name and version match exactly between original and forked agent
- Model dropdown is functional in the forked agent
- Other available models are still accessible in the dropdown
- No model configuration is lost or changed during fork
- Model selection is preserved and editable in the forked agent

### Postconditions

1. Clean up test data by deleting the forked agent in the target project:
   - Ensure you are in the target project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent LLM Model" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent LLM Model" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document exact LLM model name and version for verification
- Verify model availability in target project matches source project

---

## Test Case ID: TC-13-17

#### Test Case Name:

Fork Agent - LLM Settings Transfer Verification

#### Test Case Tags:

functional testing, fork, llm-settings, model-configuration

#### Test Case Priority:

High

#### Test Case Description:

Verify that when forking an agent with specific LLM settings configured, all LLM settings are correctly
transferred to the forked agent and display properly.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with configured LLM settings:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent LLM Settings"
     - Agent's description: "Test agent with LLM settings for fork verification"
   - Navigate to **Configuration** tab
   - In the **Model** section, select an LLM model
   - Configure LLM settings (expand settings if needed):
     - Set Temperature: 0.7
     - Set Top P: 0.9
     - Set Maximum tokens: 2048
     - Configure any other available settings
   - Click **Save** button to save the agent
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent LLM Settings" agent in the agents list

### Test Steps

1. Click on the "Test Agent LLM Settings" agent to open its details page
2. Navigate to the **Configuration** tab
3. In the **Model** section, verify all LLM settings are configured:
   - Temperature: 0.7
   - Top P: 0.9
   - Maximum tokens: 2048
   - Any other configured settings
4. Note all the settings values for comparison
5. Click the **Fork Agent** button in the top right corner
6. In the Fork parameters window, click on the Project selection dropdown
7. Select a target project from the available projects list
8. Verify the FORK button becomes active/enabled
9. Click the **FORK** button
10. Wait for the fork operation to complete
11. Navigate to the target project
12. Navigate to the **Agents** section in the target project
13. Click on **Table view** button
14. Locate the forked agent in the agents list
15. Click on the forked agent to open its details
16. Navigate to **Configuration** tab
17. In the **Model** section, verify all LLM settings are transferred:
    - Verify Temperature value matches (0.7)
    - Verify Top P value matches (0.9)
    - Verify Maximum tokens value matches (2048)
    - Verify any other settings match exactly
18. Test that settings are editable and functional
19. Verify settings sliders/inputs respond correctly

### Expected Results

- Agent with configured LLM settings is created successfully
- All LLM settings are properly configured in original agent
- Fork operation completes successfully
- Forked agent appears in target project with fork icon
- All LLM settings are transferred correctly to the forked agent
- Temperature setting matches exactly (0.7)
- Top P setting matches exactly (0.9)
- Maximum tokens setting matches exactly (2048)
- All other configured settings are preserved
- Settings controls are functional in the forked agent
- Settings can be modified in the forked agent
- No settings are lost, reset to defaults, or corrupted during fork

### Postconditions

1. Clean up test data by deleting the forked agent in the target project:
   - Ensure you are in the target project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent LLM Settings" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent LLM Settings" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document exact settings values for verification
- Verify all settings controls are functional after fork

---

## Test Case ID: TC-13-18

#### Test Case Name:

Fork Agent - Temperature Setting Transfer

#### Test Case Tags:

functional testing, fork, temperature, llm-parameter

#### Test Case Priority:

High

#### Test Case Description:

Verify that when forking an agent with a specific temperature setting configured, the temperature value is
correctly transferred to the forked agent and functions properly.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with specific temperature setting:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Temperature"
     - Agent's description: "Test agent with temperature setting for fork verification"
   - Navigate to **Configuration** tab
   - In the **Model** section, select an LLM model
   - Configure Temperature setting:
     - Locate the Temperature slider/input field
     - Set Temperature to 0.3 (a specific non-default value)
   - Click **Save** button to save the agent
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Temperature" agent in the agents list

### Test Steps

1. Click on the "Test Agent Temperature" agent to open its details page
2. Navigate to the **Configuration** tab
3. In the **Model** section, locate the Temperature setting
4. Verify the Temperature is set to 0.3
5. Note the exact temperature value and slider position
6. Click the **Fork Agent** button in the top right corner
7. In the Fork parameters window, click on the Project selection dropdown
8. Select a target project from the available projects list
9. Verify the FORK button becomes active/enabled
10. Click the **FORK** button
11. Wait for the fork operation to complete
12. Navigate to the target project
13. Navigate to the **Agents** section in the target project
14. Click on **Table view** button
15. Locate the forked agent in the agents list
16. Click on the forked agent to open its details
17. Navigate to **Configuration** tab
18. In the **Model** section, locate the Temperature setting
19. Verify the Temperature value in the forked agent:
    - Verify the value is exactly 0.3
    - Verify the slider position matches the original
    - Verify the input field displays the correct value
20. Test the Temperature control functionality:
    - Move the slider to verify it's responsive
    - Return to 0.3 to confirm the setting is preserved
21. Save the agent to verify the temperature setting persists

### Expected Results

- Agent with temperature setting 0.3 is created successfully
- Temperature setting is properly configured and displayed in original agent
- Fork operation completes successfully
- Forked agent appears in target project with fork icon
- Temperature setting is transferred correctly to the forked agent
- Temperature value in forked agent is exactly 0.3
- Temperature slider position matches the original agent
- Temperature input field displays the correct value (0.3)
- Temperature control is functional in the forked agent
- Slider and input field are responsive and editable
- Temperature setting persists when agent is saved
- No temperature value is lost, reset, or changed during fork

### Postconditions

1. Clean up test data by deleting the forked agent in the target project:
   - Ensure you are in the target project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent Temperature" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent Temperature" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document exact temperature value (0.3) for verification
- Verify temperature control responsiveness after fork

---

## Test Case ID: TC-13-19

#### Test Case Name:

Fork Agent - Top P Setting Transfer

#### Test Case Tags:

functional testing, fork, top-p, llm-parameter

#### Test Case Priority:

High

#### Test Case Description:

Verify that when forking an agent with a specific Top P setting configured, the Top P value is correctly
transferred to the forked agent and functions properly.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with specific Top P setting:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Top P"
     - Agent's description: "Test agent with Top P setting for fork verification"
   - Navigate to **Configuration** tab
   - In the **Model** section, select an LLM model
   - Configure Top P setting:
     - Locate the Top P slider/input field
     - Set Top P to 0.8 (a specific non-default value)
   - Click **Save** button to save the agent
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Top P" agent in the agents list

### Test Steps

1. Click on the "Test Agent Top P" agent to open its details page
2. Navigate to the **Configuration** tab
3. In the **Model** section, locate the Top P setting
4. Verify the Top P is set to 0.8
5. Note the exact Top P value and slider position
6. Click the **Fork Agent** button in the top right corner
7. In the Fork parameters window, click on the Project selection dropdown
8. Select a target project from the available projects list
9. Verify the FORK button becomes active/enabled
10. Click the **FORK** button
11. Wait for the fork operation to complete
12. Navigate to the target project
13. Navigate to the **Agents** section in the target project
14. Click on **Table view** button
15. Locate the forked agent in the agents list
16. Click on the forked agent to open its details
17. Navigate to **Configuration** tab
18. In the **Model** section, locate the Top P setting
19. Verify the Top P value in the forked agent:
    - Verify the value is exactly 0.8
    - Verify the slider position matches the original
    - Verify the input field displays the correct value
20. Test the Top P control functionality:
    - Move the slider to verify it's responsive
    - Return to 0.8 to confirm the setting is preserved
21. Save the agent to verify the Top P setting persists

### Expected Results

- Agent with Top P setting 0.8 is created successfully
- Top P setting is properly configured and displayed in original agent
- Fork operation completes successfully
- Forked agent appears in target project with fork icon
- Top P setting is transferred correctly to the forked agent
- Top P value in forked agent is exactly 0.8
- Top P slider position matches the original agent
- Top P input field displays the correct value (0.8)
- Top P control is functional in the forked agent
- Slider and input field are responsive and editable
- Top P setting persists when agent is saved
- No Top P value is lost, reset, or changed during fork

### Postconditions

1. Clean up test data by deleting the forked agent in the target project:
   - Ensure you are in the target project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent Top P" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent Top P" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document exact Top P value (0.8) for verification
- Verify Top P control responsiveness after fork

---

## Test Case ID: TC-13-20

#### Test Case Name:

Fork Agent - Maximum Tokens Setting Transfer

#### Test Case Tags:

functional testing, fork, maximum-tokens, llm-parameter

#### Test Case Priority:

High

#### Test Case Description:

Verify that when forking an agent with a specific Maximum Tokens setting configured, the Maximum Tokens value
is correctly transferred to the forked agent and functions properly.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with specific Maximum Tokens setting:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Max Tokens"
     - Agent's description: "Test agent with Maximum Tokens setting for fork verification"
   - Navigate to **Configuration** tab
   - In the **Model** section, select an LLM model
   - Configure Maximum Tokens setting:
     - Locate the Maximum Tokens slider/input field
     - Set Maximum Tokens to 1500 (a specific non-default value)
   - Click **Save** button to save the agent
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Max Tokens" agent in the agents list

### Test Steps

1. Click on the "Test Agent Max Tokens" agent to open its details page
2. Navigate to the **Configuration** tab
3. In the **Model** section, locate the Maximum Tokens setting
4. Verify the Maximum Tokens is set to 1500
5. Note the exact Maximum Tokens value and control position
6. Click the **Fork Agent** button in the top right corner
7. In the Fork parameters window, click on the Project selection dropdown
8. Select a target project from the available projects list
9. Verify the FORK button becomes active/enabled
10. Click the **FORK** button
11. Wait for the fork operation to complete
12. Navigate to the target project
13. Navigate to the **Agents** section in the target project
14. Click on **Table view** button
15. Locate the forked agent in the agents list
16. Click on the forked agent to open its details
17. Navigate to **Configuration** tab
18. In the **Model** section, locate the Maximum Tokens setting
19. Verify the Maximum Tokens value in the forked agent:
    - Verify the value is exactly 1500
    - Verify the slider/control position matches the original
    - Verify the input field displays the correct value
20. Test the Maximum Tokens control functionality:
    - Modify the value to verify it's responsive
    - Return to 1500 to confirm the setting is preserved
21. Save the agent to verify the Maximum Tokens setting persists

### Expected Results

- Agent with Maximum Tokens setting 1500 is created successfully
- Maximum Tokens setting is properly configured and displayed in original agent
- Fork operation completes successfully
- Forked agent appears in target project with fork icon
- Maximum Tokens setting is transferred correctly to the forked agent
- Maximum Tokens value in forked agent is exactly 1500
- Maximum Tokens control position matches the original agent
- Maximum Tokens input field displays the correct value (1500)
- Maximum Tokens control is functional in the forked agent
- Control and input field are responsive and editable
- Maximum Tokens setting persists when agent is saved
- No Maximum Tokens value is lost, reset, or changed during fork

### Postconditions

1. Clean up test data by deleting the forked agent in the target project:
   - Ensure you are in the target project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent Max Tokens" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent Max Tokens" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document exact Maximum Tokens value (1500) for verification
- Verify Maximum Tokens control responsiveness after fork

---

## Test Case ID: TC-13-21

#### Test Case Name:

Fork Agent with Toolkit - Pipeline Toolkit Configuration

#### Test Case Tags:

functional testing, fork, toolkit, pipeline-toolkit

#### Test Case Priority:

High

#### Test Case Description:

Verify forking an agent that has a Pipeline toolkit added, including proper configuration of the toolkit
during the fork process.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with Pipeline toolkit:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Pipeline Toolkit"
     - Agent's description: "Test agent with Pipeline toolkit for fork verification"
   - Click the **Save** button
   - Navigate to **Configuration** tab
   - Scroll down to **Toolkits** section
   - Click **+Toolkit** button
   - Select **Pipeline** from the toolkit type options
   - Configure Pipeline toolkit settings:
     - Select model from dropdown
     - Configure pipeline-specific settings
     - Set any required parameters
   - Click **Add** button to add the toolkit
   - Click **Save** button to save the agent
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Pipeline Toolkit" agent in the agents list

### Test Steps

1. Click on the "Test Agent Pipeline Toolkit" agent to open its details page
2. Navigate to the **Configuration** tab
3. Verify the Pipeline toolkit is properly configured in the Toolkits section
4. Note the pipeline configuration details
5. Click the **Fork Agent** button in the top right corner
6. In the Fork parameters window, observe the toolkit configuration options
7. Verify the Pipeline toolkit appears in the fork configuration
8. For the Pipeline toolkit, configure the required fields:
   - Select model from dropdown
   - Configure pipeline-specific parameters
   - Set any required settings
9. Click on the Project selection dropdown
10. Select a target project from the available projects list
11. Verify the FORK button becomes active/enabled
12. Click the **FORK** button
13. Wait for the fork operation to complete
14. Navigate to the target project
15. Navigate to the **Agents** section in the target project
16. Click on **Table view** button
17. Locate the forked agent in the agents list
18. Click on the forked agent to open its details
19. Navigate to **Configuration** tab
20. Verify the Pipeline toolkit is present and properly configured
21. Verify the toolkit configuration matches the original agent's toolkit setup

### Expected Results

- Agent with Pipeline toolkit is created successfully
- Fork parameters window displays the Pipeline toolkit for configuration
- Pipeline toolkit configuration fields are properly displayed
- All required fields can be configured during fork process
- Fork operation completes successfully with toolkit configuration
- Forked agent appears in target project with fork icon
- Forked agent contains the Pipeline toolkit with proper configuration
- Toolkit configuration in forked agent matches the original configuration
- Pipeline toolkit functionality is preserved in the forked agent

### Postconditions

1. Clean up test data by deleting the forked agent in the target project:
   - Ensure you are in the target project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent Pipeline Toolkit" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent Pipeline Toolkit" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document the Pipeline toolkit configuration for verification
- Verify pipeline-specific settings are preserved correctly

---

## Test Case ID: TC-13-22

#### Test Case Name:

Fork Agent with MCP Toolkit - Complete Configuration

#### Test Case Tags:

functional testing, fork, toolkit, mcp-toolkit

#### Test Case Priority:

High

#### Test Case Description:

Verify forking an agent that has an MCP (Model Context Protocol) toolkit added, including proper configuration
of the toolkit during the fork process.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with MCP toolkit:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent MCP Toolkit"
     - Agent's description: "Test agent with MCP toolkit for fork verification"
   - Click the **Save** button
   - Navigate to **Configuration** tab
   - Scroll down to **Toolkits** section
   - Click **+Toolkit** button
   - Select **MCP** from the toolkit type options
   - Configure MCP toolkit settings:
     - Select model from dropdown
     - Configure MCP-specific parameters
     - Set connection details and protocols
   - Click **Add** button to add the toolkit
   - Click **Save** button to save the agent
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent MCP Toolkit" agent in the agents list

### Test Steps

1. Click on the "Test Agent MCP Toolkit" agent to open its details page
2. Navigate to the **Configuration** tab
3. Verify the MCP toolkit is properly configured in the Toolkits section
4. Note the MCP configuration details and parameters
5. Click the **Fork Agent** button in the top right corner
6. In the Fork parameters window, observe the toolkit configuration options
7. Verify the MCP toolkit appears in the fork configuration
8. For the MCP toolkit, configure the required fields:
   - Select model from dropdown
   - Configure MCP connection parameters
   - Set protocol-specific settings
   - Configure any authentication details
9. Click on the Project selection dropdown
10. Select a target project from the available projects list
11. Verify the FORK button becomes active/enabled
12. Click the **FORK** button
13. Wait for the fork operation to complete
14. Navigate to the target project
15. Navigate to the **Agents** section in the target project
16. Click on **Table view** button
17. Locate the forked agent in the agents list
18. Click on the forked agent to open its details
19. Navigate to **Configuration** tab
20. Verify the MCP toolkit is present and properly configured
21. Verify the toolkit configuration matches the original agent's toolkit setup

### Expected Results

- Agent with MCP toolkit is created successfully
- Fork parameters window displays the MCP toolkit for configuration
- MCP toolkit configuration fields are properly displayed
- All required MCP fields can be configured during fork process
- Fork operation completes successfully with toolkit configuration
- Forked agent appears in target project with fork icon
- Forked agent contains the MCP toolkit with proper configuration
- Toolkit configuration in forked agent matches the original configuration
- MCP toolkit functionality is preserved in the forked agent
- Connection parameters and protocol settings are maintained

### Postconditions

1. Clean up test data by deleting the forked agent in the target project:
   - Ensure you are in the target project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent MCP Toolkit" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent MCP Toolkit" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document the MCP toolkit configuration for verification
- Verify MCP connection parameters are preserved correctly

---

## Test Case ID: TC-13-23

#### Test Case Name:

Fork Agent with GitHub Toolkit - Complete Repository Configuration

#### Test Case Tags:

functional testing, fork, toolkit, github-toolkit

#### Test Case Priority:

High

#### Test Case Description:

Verify forking an agent that has a GitHub toolkit added, including proper configuration of the model, GitHub
configuration, and repository selection during the fork process.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
   models.applications.toolkit_validator.check, models.applications.test_tool.create,
   models.applications.export_import.import, models.applications.version_validator.check,
   models.applications.tool.patch, models.applications.fork.post, models.applications.versions.create,
   models.applications.application.update, models.applications.export_import.export,
   models.applications.trending_authors.list, models.applications.version.details,
   models.applications.attachment_storage.change, models.applications.unpublish.post,
   models.applications.version.delete, models.applications.upload_icon.post, models.applications.tools.create,
   models.applications.tools.list, models.applications.tool.details, models.applications.toolkits.details,
   models.applications.public_applications.list, models.applications.publish.post,
   models.applications.application.details, models.applications.public_application.details,
   models.applications.task.get, models.applications.predict.post, models.applications.export_toolkit.export,
   models.applications.upload_icon.get, models.applications.upload_icon.update,
   models.applications.applications.create, models.applications.application.delete,
   models.applications.task.delete, models.applications.versions.get, models.applications.tool.delete,
   models.applications.applications.list, models.applications.application_relation.patch,
   monitoring.applications.list, models.applications.tool.update
6. Create a test agent with GitHub toolkit:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent GitHub Toolkit"
     - Agent's description: "Test agent with GitHub toolkit for fork verification"
   - Click the **Save** button
   - Navigate to **Configuration** tab
   - Scroll down to **Toolkits** section
   - Click **+Toolkit** button
   - Select **GitHub** from the toolkit type options
   - Configure GitHub toolkit settings:
     - Select model from dropdown
     - Select GitHub configuration from available options
     - Select repository from the repository list
     - Configure any additional settings
   - Click **Save** button to save the agent
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent GitHub Toolkit" agent in the agents list

### Test Steps

1. Click on the "Test Agent GitHub Toolkit" agent to open its details page
2. Navigate to the **Configuration** tab
3. Verify the GitHub toolkit is properly configured in the Toolkits section
4. Note the GitHub configuration details:
   - Model selection
   - GitHub configuration
   - Repository selection
5. Click the **Fork Agent** button in the top right corner
6. In the Fork parameters window, observe the toolkit configuration options
7. Verify the GitHub toolkit appears in the fork configuration
8. For the GitHub toolkit, configure the required fields:
   - Select model from dropdown
   - Select GitHub configuration from available options
   - Select repository from the repository dropdown
   - Configure any additional GitHub-specific settings
9. Click on the Project selection dropdown
10. Select a target project from the available projects list
11. Verify the FORK button becomes active/enabled
12. Click the **FORK** button
13. Wait for the fork operation to complete
14. Navigate to the target project
15. Navigate to the **Agents** section in the target project
16. Click on **Table view** button
17. Locate the forked agent in the agents list
18. Click on the forked agent to open its details
19. Navigate to **Configuration** tab
20. Verify the GitHub toolkit is present and properly configured
21. Verify the toolkit configuration matches the original:
    - Model selection is preserved
    - GitHub configuration is maintained
    - Repository selection is correct

### Expected Results

- Agent with GitHub toolkit is created successfully
- Fork parameters window displays the GitHub toolkit for configuration
- GitHub toolkit configuration fields are properly displayed (model, configuration, repository)
- All required GitHub fields can be configured during fork process
- Model dropdown shows available models and allows selection
- GitHub configuration dropdown shows available configurations
- Repository dropdown shows available repositories for selection
- Fork operation completes successfully with toolkit configuration
- Forked agent appears in target project with fork icon
- Forked agent contains the GitHub toolkit with proper configuration
- Model selection is preserved in the forked agent
- GitHub configuration is maintained in the forked agent
- Repository selection is correct in the forked agent

### Postconditions

1. Clean up test data by deleting the forked agent in the target project:
   - Ensure you are in the target project where the agent was forked
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the forked "Test Agent GitHub Toolkit" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the forked agent's name
   - Verify the forked agent is removed from the agents list
2. Switch back to the original project
3. Clean up test data by deleting the original agent:
   - Navigate to the **Agents** section in the original {Project}
   - Click on **Table view** button
   - Locate the "Test Agent GitHub Toolkit" agent
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document the GitHub configuration and repository details for verification
- Verify GitHub connectivity and repository access in the forked agent
