# Scenario ID: 07_Agent_Versions

#### Scenario Name:

Agent Versions - save, switch, create and delete versions

#### Scenario Tags:

functional testing, regression, agents, versions

#### Scenario Priority:

High

#### Scenario Description:

This scenario verifies creating versions of an existing agent (Save as version), switching between versions,
deleting versions, uniqueness and validation of version names, limits when creating multiple versions, and
version name validation including length constraints and input validation.

## Test Case ID: TC-07-01

#### Test Case Name:

Create a version with valid name (up to 20 chars)

#### Test Case Tags:

functional testing, versions, agent_versioning

#### Test Case Priority:

High

#### Test Case Description:

Verify creating a new version by clicking "Save as version", entering a valid name (<=20 chars) and saving.
The version should appear in the versions dropdown with name and creation date.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent for versions setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Make changes in the **Instructions** field (e.g., add some text)
4. Click the **Save as version** button
5. In the version name input field, type "v1" (valid name with ≤20 chars)
6. Click the **Save** button

### Expected Results

- The save action completes without error
- The new version appears in the versions dropdown list with the provided name "v1"
- Version shows creation timestamp/creation date
- The UI shows a success notification "Saved new version successfully" or equivalent
- Version dropdown indicates the newly created version as selected

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify that the creation date format matches product conventions

## Test Case ID: TC-07-02

#### Test Case Name:

Prevent entering >20 chars in version name (input limit)

#### Test Case Tags:

negative testing, versions, validation, input_limit

#### Test Case Priority:

Medium

#### Test Case Description:

Verify the version name input enforces the 20-character limit and prevents typing more characters when
manually entering the version name.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent for versions setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Make changes in the **Instructions** field (e.g., add some text)
4. Click the **Save as version** button
5. Attempt to manually type a name longer than 20 characters (e.g.,
   "ThisIsAVersionNameThatIsLongerThan20Characters")
6. Observe the input field behavior

### Expected Results

- The input field prevents entering more than 20 characters (typing stops at character 20)
- No error message is shown for typing; the field simply enforces the limit
- If user tries to continue typing beyond 20 characters, additional characters are not displayed
- The cursor remains at position 20 and does not advance

### Postconditions

1. Click **Cancel** to close the version creation dialog
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
3. Verify no residual data remains from the deleted agent
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- If the field allows more input but truncates on save, verify saved version name is the first 20 characters

## Test Case ID: TC-07-03

#### Test Case Name:

Save as version then Cancel (no version created)

#### Test Case Tags:

negative testing, versions

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that if a user opens "Save as version", provides a valid name, but clicks "Cancel", the version is not
created.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent for versions setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Make changes in the **Instructions** field (e.g., add some text)
4. Click the **Save as version** button
5. In the version name input field, enter a valid name (<=20 chars)
6. Click the **Cancel** button instead of "Save"

### Expected Results

- The version creation dialog closes without creating a new version
- The versions dropdown does not contain the entered name
- No success or error notifications are displayed
- The UI returns to the previous state without saving any version

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify no partial state is saved

## Test Case ID: TC-07-04

#### Test Case Name:

Prevent duplicate version names

#### Test Case Tags:

negative testing, versions, validation

#### Test Case Priority:

High

#### Test Case Description:

Verify that attempting to save a version with a name that already exists shows an error and does not create
the version.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent for versions setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the "Test Agent" agent to open it
   - Navigate to **Configuration** tab
   - Make changes in the **Instructions** field (e.g., add some text)
   - Click the **Save as version** button
   - Enter "v-existing" in the version name input field
   - Click the **Save** button
   - Verify the version "v-existing" is created and appears in the versions dropdown

### Test Steps

1. In the same "Test Agent" configuration tab
2. Make additional changes in the **Instructions** field (e.g., add different text)
3. Click the **Save as version** button
4. Enter the duplicate name "v-existing" in the version name input field
5. Click the **Save** button

### Expected Results

- The UI displays an inline error message: "A version with that name already exists. Please pick a unique
  name." (or equivalent)
- The version is not created and the versions list is unchanged
- The Save button may become disabled until the name is changed
- The error message appears near the input field with appropriate styling

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify localization/translation of the error message if needed

## Test Case ID: TC-07-05

#### Test Case Name:

Switch between versions (at least 2 exist)

#### Test Case Tags:

functional testing, versions

#### Test Case Priority:

High

#### Test Case Description:

Verify switching the agent's configuration to an older/newer version from the versions dropdown reflects the
selected version's content and marks the selected version in the dropdown.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent with at least 2 versions:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the "Test Agent" agent to open it
   - Navigate to **Configuration** tab
   - Make changes in the **Instructions** field (e.g., add "Version 1 content")
   - Click the **Save as version** button
   - Enter "v1" in the version name input field
   - Click the **Save** button
   - Make different changes in the **Instructions** field (e.g., add "Version 2 content")
   - Click the **Save as version** button
   - Enter "v2" in the version name input field
   - Click the **Save** button

### Test Steps

1. In the "Test Agent" configuration tab
2. Open the versions dropdown and verify both "v1" and "v2" versions are available
3. Select "v1" from the versions dropdown
4. Observe the agent configuration content
5. Open the versions dropdown again and select "v2"
6. Observe the agent configuration content

### Expected Results

- The agent configuration view updates to reflect the content of the selected version (v1 shows "Version 1
  content", v2 shows "Version 2 content")
- The selected version shows a check/tick or visual indicator in the versions dropdown
- A notification may appear indicating "Switched to version v1" or similar
- The version switching happens without requiring a page refresh
- The content changes are immediately visible in the configuration fields

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify that unsaved changes trigger a prompt before switching if applicable

## Test Case ID: TC-07-06

#### Test Case Name:

Delete a version (confirm)

#### Test Case Tags:

functional testing, versions

#### Test Case Priority:

High

#### Test Case Description:

Verify deleting a saved version removes it from the versions dropdown after confirming in the confirmation
dialog.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent with at least 2 versions:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the "Test Agent" agent to open it
   - Navigate to **Configuration** tab
   - Make changes in the **Instructions** field (e.g., add some text)
   - Click the **Save as version** button
   - Enter "v1" in the version name input field
   - Click the **Save** button
   - Verify the agent has at least two versions: "v1" and "latest"

### Test Steps

1. In the "Test Agent" configuration tab
2. Open the versions dropdown and select the target version "v1"
3. Click the **Delete version** button (or equivalent delete action)
4. In the confirmation dialog, click **Confirm** (or **Delete**)

### Expected Results

- The confirmation dialog closes successfully
- The target version "v1" is removed from the versions dropdown list
- A success notification is displayed (e.g., "Version deleted successfully")
- The versions dropdown automatically selects the remaining version
- The UI updates to reflect the deletion without requiring a page refresh

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify audit logs if available

## Test Case ID: TC-07-07

#### Test Case Name:

Delete a version then Cancel

#### Test Case Tags:

negative testing, versions

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that canceling a delete operation leaves the version in the list.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent with at least 2 versions:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the "Test Agent" agent to open it
   - Navigate to **Configuration** tab
   - Make changes in the **Instructions** field (e.g., add some text)
   - Click the **Save as version** button
   - Enter "v1" in the version name input field
   - Click the **Save** button
   - Verify the agent has at least two versions: "v1" and "latest"

### Test Steps

1. In the "Test Agent" configuration tab
2. Open the versions dropdown and select the target version "v1"
3. Click the **Delete version** button (or equivalent delete action)
4. In the confirmation dialog, click **Cancel**

### Expected Results

- The confirmation dialog closes without performing any deletion
- The target version "v1" remains listed in the versions dropdown
- No deletion notification is shown
- The UI state remains unchanged from before the delete attempt
- The selected version remains as it was before the cancel action

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify no partial state change occurs

## Test Case ID: TC-07-08

#### Test Case Name:

Prevent deleting the "latest" version

#### Test Case Tags:

negative testing, versions, constraints

#### Test Case Priority:

High

#### Test Case Description:

Verify that attempting to delete the currently selected/latest version is not allowed and shows a descriptive
error message.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent with at least 2 versions:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the "Test Agent" agent to open it
   - Navigate to **Configuration** tab
   - Make changes in the **Instructions** field (e.g., add some text)
   - Click the **Save as version** button
   - Enter "v1" in the version name input field
   - Click the **Save** button
   - Verify the agent has at least two versions: "v1" and "latest"

### Test Steps

1. In the "Test Agent" configuration tab
2. Open the versions dropdown and ensure the "latest" version is selected
3. Click the **Delete version** button for the latest version
4. If a confirmation dialog appears, click **Confirm** (or **Delete**)

### Expected Results

- The deletion is blocked before or after the confirmation dialog
- A notification/error message is displayed: "You cannot delete latest application version" (or equivalent)
- The versions list remains unchanged with both "v1" and "latest" versions still present
- The "latest" version remains selected in the dropdown
- No success notification for deletion is shown

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify the exact error message and behavior if the app uses localized text

## Test Case ID: TC-07-09

#### Test Case Name:

Create multiple versions (e.g., 10 versions)

#### Test Case Tags:

performance, versions, edge-case

#### Test Case Priority:

Medium

#### Test Case Description:

Verify creating multiple versions in sequence (10 versions) succeeds and all are listed in the versions
dropdown.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent for versions setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. For each version (v1 through v10):
   - Make small changes in the **Instructions** field (e.g., add "Version X content")
   - Click the **Save as version** button
   - Enter unique version name (v1, v2, v3, ... v10)
   - Click the **Save** button
   - Verify success notification appears
4. Open the versions dropdown to verify all versions are listed

### Expected Results

- All 10 created versions appear in the versions dropdown, each with name and creation date
- Application remains responsive during the operations
- Each version creation shows a success notification
- Version names are displayed in the dropdown in the expected order
- No performance degradation or timeout errors occur during creation
- The dropdown can handle displaying all 10 versions appropriately

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Observe UI pagination or scrolling behavior if versions list is long

## Test Case ID: TC-07-10

#### Test Case Name:

Version metadata persists after refresh

#### Test Case Tags:

functional testing, versions, persistence

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that after creating or deleting versions, the versions list persists after page refresh and the version
metadata (name, creation date) remains consistent.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent with at least 1 version:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the "Test Agent" agent to open it
   - Navigate to **Configuration** tab
   - Make changes in the **Instructions** field (e.g., add some text)
   - Click the **Save as version** button
   - Enter "v1" in the version name input field
   - Click the **Save** button
   - Note the creation date/timestamp of the version

### Test Steps

1. Record current versions list and metadata (names, creation dates)
2. Refresh the browser page (F5 or Ctrl+R)
3. Navigate back to the "Test Agent" configuration if needed
4. Open the versions dropdown
5. Compare the versions list and metadata with the recorded information

### Expected Results

- The versions list reflects the saved state (created versions are persisted)
- All version metadata (name and creation date) remain exactly the same as before refresh
- No versions are lost or duplicated after refresh
- The previously selected version remains selected (if applicable)
- Creation timestamps are preserved accurately

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify server-side logs or API responses if available to ensure persistence

## Test Case ID: TC-07-11

#### Test Case Name:

Create version with single character name

#### Test Case Tags:

functional testing, versions, validation, edge-case

#### Test Case Priority:

Medium

#### Test Case Description:

Verify creating a version with a single character name (1 character) is accepted and works correctly.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent for versions setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Make changes in the **Instructions** field (e.g., add some text)
4. Click the **Save as version** button
5. In the version name input field, type "A" (single character)
6. Click the **Save** button

### Expected Results

- The save action completes without error
- The new version appears in the versions dropdown list with the name "A"
- Version shows creation timestamp/creation date
- The UI shows a success notification "Saved new version successfully" or equivalent
- The single character name is properly displayed in the dropdown

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Single character names should be accepted as valid

## Test Case ID: TC-07-12

#### Test Case Name:

Create version with mid-range character name (2-19 chars)

#### Test Case Tags:

functional testing, versions, validation

#### Test Case Priority:

Medium

#### Test Case Description:

Verify creating versions with names between 2 and 19 characters works correctly and validates proper handling
of mid-range length names.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent for versions setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Make changes in the **Instructions** field (e.g., add some text)
4. Click the **Save as version** button
5. In the version name input field, type "v10" (3 characters)
6. Click the **Save** button
7. Make additional changes in the **Instructions** field
8. Click the **Save as version** button
9. In the version name input field, type "MidLengthVersion19" (19 characters)
10. Click the **Save** button

### Expected Results

- Both save actions complete without error
- Both versions ("v10" and "MidLengthVersion19") appear in the versions dropdown
- Both versions show creation timestamps/creation dates
- The UI shows success notifications for both version creations
- Names are displayed correctly in the dropdown without truncation

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Mid-range character names should work without issues

## Test Case ID: TC-07-13

#### Test Case Name:

Create version with exactly 20 character name

#### Test Case Tags:

functional testing, versions, validation, boundary

#### Test Case Priority:

High

#### Test Case Description:

Verify creating a version with exactly 20 characters (maximum limit) works correctly and is accepted as valid.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent for versions setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Make changes in the **Instructions** field (e.g., add some text)
4. Click the **Save as version** button
5. In the version name input field, type "Version20CharsExact" (exactly 20 characters)
6. Click the **Save** button

### Expected Results

- The save action completes without error
- The new version appears in the versions dropdown list with the full name "Version20CharsExact"
- Version shows creation timestamp/creation date
- The UI shows a success notification "Saved new version successfully" or equivalent
- The full 20-character name is displayed correctly in the dropdown without truncation

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- This tests the exact boundary condition for maximum character limit

## Test Case ID: TC-07-14

#### Test Case Name:

Prevent creating version >20 chars via copy-paste

#### Test Case Tags:

negative testing, versions, validation, copy-paste

#### Test Case Priority:

High

#### Test Case Description:

Verify that pasting or attempting to enter a version name longer than 20 characters is properly prevented and
handles copy-paste scenarios.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent for versions setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Prepare a text longer than 20 characters to copy (e.g., "ThisIsAVersionNameThatIsLongerThan20Characters")

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Make changes in the **Instructions** field (e.g., add some text)
4. Click the **Save as version** button
5. Copy the prepared text "ThisIsAVersionNameThatIsLongerThan20Characters" to clipboard
6. Paste (Ctrl+V) into the version name input field
7. Observe the input field behavior
8. Attempt to click the **Save** button if enabled

### Expected Results

- The input field either:
  - Truncates the pasted text to exactly 20 characters ("ThisIsAVersionNameT"), OR
  - Prevents the paste operation entirely, OR
  - Shows the first 20 characters but prevents saving if more than 20 characters
- If truncation occurs, only the first 20 characters are visible in the field
- If an error occurs, an appropriate validation message is displayed
- The Save button behavior is consistent with the validation rules

### Postconditions

1. Click **Cancel** to close the version creation dialog
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
3. Verify no residual data remains from the deleted agent
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- This tests copy-paste behavior which may differ from manual typing validation

## Test Case ID: TC-07-15

#### Test Case Name:

Prevent creating version with whitespace in name

#### Test Case Tags:

negative testing, versions, validation, whitespace

#### Test Case Priority:

High

#### Test Case Description:

Verify that version names containing spaces, tabs, or other whitespace characters are rejected and cannot be
created.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent for versions setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Make changes in the **Instructions** field (e.g., add some text)
4. Click the **Save as version** button
5. Test with spaces: In the version name input field, type "version 1" (with space)
6. Click the **Save** button and observe the result
7. If the previous attempt was blocked, click **Cancel** and try again with "Save as version"
8. Test with leading space: Type " version1" (space at beginning)
9. Click the **Save** button and observe the result
10. If the previous attempt was blocked, click **Cancel** and try again with "Save as version"
11. Test with trailing space: Type "version1 " (space at end)
12. Click the **Save** button and observe the result

### Expected Results

- All attempts to save version names with whitespace are rejected
- Appropriate error messages are displayed such as:
  - "Version name cannot contain spaces" or
  - "Invalid characters in version name" or
  - "Version name format is invalid"
- The Save button may be disabled when whitespace is detected
- No versions with whitespace are created in the versions dropdown
- Error messages appear near the input field with appropriate styling

### Postconditions

1. Click **Cancel** to close any open version creation dialog
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
3. Verify no residual data remains from the deleted agent
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test various types of whitespace: spaces, tabs, leading/trailing spaces
- Verify both manual typing and copy-paste scenarios if possible

## Test Case ID: TC-07-16

#### Test Case Name:

Create version with underscore in name

#### Test Case Tags:

functional testing, versions, validation, special-characters

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that version names containing underscore characters are accepted and can be successfully created.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent for versions setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Make changes in the **Instructions** field (e.g., add some text)
4. Click the **Save as version** button
5. In the version name input field, type "version_1" (with underscore)
6. Click the **Save** button
7. Make additional changes in the **Instructions** field
8. Click the **Save as version** button
9. In the version name input field, type "test_version_2" (multiple underscores)
10. Click the **Save** button
11. Make additional changes in the **Instructions** field
12. Click the **Save as version** button
13. In the version name input field, type "\_version3" (underscore at beginning)
14. Click the **Save** button

### Expected Results

- All save actions complete without error
- All versions with underscores ("version_1", "test_version_2", "\_version3") appear in the versions dropdown
- Versions show creation timestamps/creation dates
- The UI shows success notifications for all version creations
- Underscore characters are properly displayed in the dropdown without any formatting issues
- Version names maintain their underscore formatting when displayed and selected

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Underscores should be accepted as valid characters in version names
- Test various underscore positions: beginning, middle, multiple underscores

## Test Case ID: TC-07-17

#### Test Case Name:

Create version with special characters (allowed symbols)

#### Test Case Tags:

functional testing, versions, validation, special-characters

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that version names containing special characters (such as @, #, %, $, dots, hyphens, etc.) are accepted
and can be successfully created as per system requirements.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent for versions setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Make changes in the **Instructions** field (e.g., add some text)
4. Click the **Save as version** button
5. In the version name input field, type "v1.0" (with dot)
6. Click the **Save** button and observe the result
7. If successful, make additional changes in the **Instructions** field
8. Click the **Save as version** button
9. In the version name input field, type "v2-beta" (with hyphen)
10. Click the **Save** button and observe the result
11. If successful, make additional changes in the **Instructions** field
12. Click the **Save as version** button
13. In the version name input field, type "v3@test" (with at symbol)
14. Click the **Save** button and observe the result
15. If successful, make additional changes in the **Instructions** field
16. Click the **Save as version** button
17. In the version name input field, type "v4#final" (with hash symbol)
18. Click the **Save** button and observe the result

### Expected Results

- All save actions complete without error for versions with special characters
- All versions with special characters (v1.0, v2-beta, v3@test, v4#final) appear in the versions dropdown
- Special characters are displayed intact and correctly formatted in the dropdown
- Versions show creation timestamps/creation dates
- Success notifications are displayed for each version creation
- Version names maintain their special character formatting when displayed and selected
- No error messages are shown as special characters are allowed in version names

### Postconditions

1. Click **Cancel** to close any open version creation dialog
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
3. Verify no residual data remains from the deleted agent
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Special characters including dots (.), hyphens (-), @, #, %, $, etc. are allowed in version names
- This test validates that the system accepts various special characters as per requirements
- All tested special characters should be successfully saved and displayed

## Test Case ID: TC-07-18

#### Test Case Name:

Version creation with empty name

#### Test Case Tags:

negative testing, versions, validation, empty-input

#### Test Case Priority:

High

#### Test Case Description:

Verify that attempting to create a version with an empty or blank name is properly rejected and shows
appropriate validation messages.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent for versions setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Make changes in the **Instructions** field (e.g., add some text)
4. Click the **Save as version** button
5. Leave the version name input field completely empty
6. Click the **Save** button
7. Observe the validation behavior
8. If the previous attempt was blocked, click **Cancel** and try again with "Save as version"
9. Enter only spaces " " in the version name input field
10. Click the **Save** button and observe the result

### Expected Results

- Both empty and spaces-only attempts are rejected
- Appropriate error messages are displayed such as:
  - "Version name is required" or
  - "Version name cannot be empty" or
  - "Please enter a valid version name"
- The Save button may be disabled when the field is empty
- No empty versions are created in the versions dropdown
- Error messages appear near the input field with appropriate styling
- Input field validation occurs both on save attempt and real-time if applicable

### Postconditions

1. Click **Cancel** to close any open version creation dialog
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
3. Verify no residual data remains from the deleted agent
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Empty validation should prevent version creation entirely
- Test both completely empty and whitespace-only scenarios

## Test Case ID: TC-07-19

#### Test Case Name:

Version switching with unsaved changes - Cancel operation

#### Test Case Tags:

functional testing, versions, validation, unsaved-changes, cancel

#### Test Case Priority:

High

#### Test Case Description:

Verify that when switching versions with unsaved changes, clicking "Cancel" in the confirmation modal
preserves the unsaved changes and keeps the user on the current version.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent with at least 2 versions:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the "Test Agent" agent to open it
   - Navigate to **Configuration** tab
   - Make changes in the **Instructions** field (e.g., add "Version 1 content")
   - Click the **Save as version** button
   - Enter "v1" in the version name input field
   - Click the **Save** button
   - Make different changes in the **Instructions** field (e.g., add "Version 2 content")
   - Click the **Save as version** button
   - Enter "v2" in the version name input field
   - Click the **Save** button

### Test Steps

1. In the "Test Agent" configuration tab, ensure "v2" is currently selected
2. Make significant changes in the **Instructions** field (e.g., add "Unsaved changes content that should be
   preserved")
3. Record the exact content of the unsaved changes for verification
4. Do NOT save these changes
5. Open the versions dropdown and attempt to select "v1"
6. Observe that a warning/confirmation dialog appears
7. Click the **Cancel** button in the confirmation dialog
8. Verify that the dialog closes and user remains on the current version
9. Check that the unsaved changes are still present in the **Instructions** field

### Expected Results

- When attempting to switch versions with unsaved changes, a warning dialog appears
- Dialog contains appropriate warning message such as:
  - "You have unsaved changes. Switching versions will discard these changes. Continue?" or
  - "Unsaved changes will be lost. Are you sure you want to switch versions?"
- Dialog provides clear **Cancel** and **Confirm**/**Continue** options
- Clicking **Cancel** closes the dialog without switching versions
- User remains on the current version ("v2")
- All unsaved changes in the **Instructions** field are preserved exactly as they were before the attempt
- The version dropdown still shows "v2" as selected
- User can continue editing or save the changes as normal

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- This prevents accidental data loss and allows users to continue their work
- Verify that no partial state changes occur when canceling the operation

## Test Case ID: TC-07-20

#### Test Case Name:

Version switching with unsaved changes - Confirm operation

#### Test Case Tags:

functional testing, versions, validation, unsaved-changes, confirm

#### Test Case Priority:

High

#### Test Case Description:

Verify that when switching versions with unsaved changes, clicking "Confirm" in the confirmation modal
discards the unsaved changes and successfully switches to the selected version.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent with at least 2 versions:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the "Test Agent" agent to open it
   - Navigate to **Configuration** tab
   - Make changes in the **Instructions** field (e.g., add "Version 1 content")
   - Click the **Save as version** button
   - Enter "v1" in the version name input field
   - Click the **Save** button
   - Make different changes in the **Instructions** field (e.g., add "Version 2 content")
   - Click the **Save as version** button
   - Enter "v2" in the version name input field
   - Click the **Save** button

### Test Steps

1. In the "Test Agent" configuration tab, ensure "v2" is currently selected
2. Record the original content from "v1" version by switching to it temporarily and noting the
   **Instructions** field content
3. Switch back to "v2" version
4. Make significant changes in the **Instructions** field (e.g., add "Unsaved changes that will be lost")
5. Record the content of "v2" for comparison (original + unsaved changes)
6. Do NOT save these changes
7. Open the versions dropdown and attempt to select "v1"
8. Observe that a warning/confirmation dialog appears
9. Click the **Confirm** or **Continue** button in the confirmation dialog
10. Verify that the version switches to "v1" and observe the content changes

### Expected Results

- When attempting to switch versions with unsaved changes, a warning dialog appears
- Dialog contains appropriate warning message such as:
  - "You have unsaved changes. Switching versions will discard these changes. Continue?" or
  - "Unsaved changes will be lost. Are you sure you want to switch versions?"
- Dialog provides clear **Cancel** and **Confirm**/**Continue** options
- Clicking **Confirm** or **Continue** closes the dialog and switches to the selected version
- The version dropdown now shows "v1" as selected
- The **Instructions** field shows the content from "v1" version (not the unsaved changes from "v2")
- All unsaved changes from "v2" are completely discarded
- The agent configuration reflects the "v1" version state exactly
- No data corruption or mixing of version content occurs

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- This ensures proper version switching functionality and data integrity
- Verify that version switching is complete and consistent

## Test Case ID: TC-07-21

#### Test Case Name:

Version deletion with dependencies and constraints

#### Test Case Tags:

functional testing, versions, deletion, constraints

#### Test Case Priority:

High

#### Test Case Description:

Verify proper handling of version deletion when there are constraints, dependencies, or special conditions
that might prevent deletion.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent with multiple versions:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the "Test Agent" agent to open it
   - Navigate to **Configuration** tab
   - Create at least 3 versions: "v1", "v2", "v3" with different content

### Test Steps

1. In the "Test Agent" configuration tab
2. Verify there are multiple versions available (v1, v2, v3, latest)
3. Select the currently active/latest version
4. Attempt to delete the currently selected version using the delete action
5. Observe the system behavior and any restrictions
6. If deletion is prevented, note the error message
7. Switch to a non-current version (e.g., "v1")
8. Attempt to delete this non-current version
9. Confirm deletion if prompted
10. Verify the version is removed and system remains stable
11. Test deleting versions until only one remains
12. Attempt to delete the last remaining version

### Expected Results

- Deleting currently selected/active version may be restricted with appropriate message
- Deleting non-current versions succeeds with proper confirmation
- System prevents deletion of the last remaining version to maintain data integrity
- Appropriate error messages are shown for restricted deletions such as:
  - "Cannot delete the currently active version" or
  - "Cannot delete the last remaining version" or
  - "At least one version must remain"
- After successful deletion, the versions dropdown updates correctly
- If a currently selected version is deleted, system automatically switches to another available version
- No data corruption or orphaned references occur after deletion

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- This ensures data integrity and prevents system inconsistencies
- Verify proper cleanup of related data and references

## Test Case ID: TC-07-22

#### Test Case Name:

Version ordering and sorting in dropdown

#### Test Case Tags:

functional testing, versions, UI, sorting

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that versions appear in the dropdown in the correct and consistent order, regardless of creation
sequence or naming patterns.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent for versions setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Create versions with mixed naming patterns in the following order:
   - Create version "zebra" (alphabetically last)
   - Create version "alpha" (alphabetically first)
   - Create version "v2.0" (numeric pattern)
   - Create version "beta" (alphabetically middle)
   - Create version "v1.0" (numeric pattern, lower number)
   - Create version "v10.0" (numeric pattern, higher number)
4. Open the versions dropdown and record the order of all versions
5. Refresh the page and navigate back to the agent
6. Open the versions dropdown again and verify the order remains consistent
7. Delete one version and verify the remaining versions maintain their order
8. Create a new version "gamma" and verify where it appears in the list

### Expected Results

- Versions appear in a consistent, predictable order in the dropdown
- Order follows a logical pattern such as:
  - Chronological (newest first or oldest first) OR
  - Alphabetical (A-Z or Z-A) OR
  - Custom priority order (latest at top, then others)
- Order remains consistent after page refresh
- Order is maintained after version deletion
- New versions appear in the correct position according to the sorting logic
- Mixed naming patterns (alphabetic, numeric, alphanumeric) are handled consistently

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Consistent ordering improves user experience and version management
- Document the actual sorting behavior observed for future reference

## Test Case ID: TC-07-23

#### Test Case Name:

Version name case sensitivity validation

#### Test Case Tags:

functional testing, versions, validation, case-sensitivity

#### Test Case Priority:

Medium

#### Test Case Description:

Verify whether version names are case-sensitive for duplicate detection and how case differences are handled
in version management.

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
   monitoring.applications.list, models.applications.tool.update,
6. Create a test agent for versions setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Make changes in the **Instructions** field (e.g., add some text)
4. Click the **Save as version** button
5. Create first version with name "Version1" (capital V, capital V)
6. Click the **Save** button and verify success
7. Make additional changes in the **Instructions** field
8. Click the **Save as version** button
9. Attempt to create version with name "version1" (lowercase v, lowercase v)
10. Click the **Save** button and observe the result
11. If successful, make additional changes and try "VERSION1" (all uppercase)
12. Click the **Save** button and observe the result
13. Test mixed case scenarios: "Version1", "version1", "vErSiOn1"
14. Observe how each case variation is handled

### Expected Results

- System behavior is consistent regarding case sensitivity:
  - Either treats "Version1" and "version1" as duplicates (case-insensitive) OR
  - Allows both as separate versions (case-sensitive)
- If case-insensitive: Duplicate error messages appear for different case variations
- If case-sensitive: All case variations are accepted as unique versions
- Version names display exactly as entered (preserving original case)
- Case handling is consistent across all version operations (create, display, select)
- Dropdown shows versions with their exact case formatting

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Case sensitivity behavior should be clearly defined and consistent
- Document the observed behavior for system specification clarity
