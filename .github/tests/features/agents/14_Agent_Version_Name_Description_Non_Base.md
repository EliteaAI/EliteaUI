# Scenario ID: 14_Agent_Version_Name_Description_Non_Base

#### Scenario Name:

Save name and description on a non-base agent version

#### Scenario Tags:

functional testing, regression, agents, versions, bug-fix

#### Scenario Priority:

High

#### Scenario Description:

This scenario verifies that an agent's name and description can be successfully updated and persisted when the
user is viewing a non-base (named) version. Previously, changes to name/description were silently discarded on
non-base versions because the save action used a version-only API endpoint that does not support those fields.
All saves now go through the application update endpoint, which supports name, description, and full tool
validation regardless of which version is active.

---

## Test Case ID: TC-14-01

#### Test Case Name:

Name and Description persist after saving on a non-base version

#### Test Case Tags:

functional testing, regression, versions, name, description, bug-fix

#### Test Case Priority:

High

#### Test Case Description:

Verify that when a user edits the agent's name and description while a non-base version is selected, clicking
**Save** persists both fields. The test directly covers GitHub issue #3076 where changes appeared to succeed
(success toast shown) but the values reverted to the previous state on reload.

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
6. Create a test agent with one named version:
   - Navigate to the **Agents** section in the {Project} of the application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's **Name**: "Base Agent Name"
     - Agent's **Description**: "Base Agent Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Base Agent Name" agent in the agents list
   - Click on the agent to open it
   - Navigate to **Configuration** tab
   - Add some text to the **Instructions** field (e.g., "Initial instructions")
   - Click the **Save as version** button
   - Enter "v1" in the version name input field
   - Click the **Save** button
   - Verify the version "v1" is created and appears in the versions dropdown

### Test Steps

1. In the "Base Agent Name" **Configuration** tab, open the versions dropdown
2. Select the non-base version **"v1"** from the dropdown
3. Verify the form now reflects the content saved under "v1"
4. Modify the **Name** field to "Updated Name on v1"
5. Modify the **Description** field to "Updated Description on v1"
6. Click the **Save** button
7. Observe the success notification
8. Navigate away from the agent (e.g., go to the Agents list)
9. Navigate back to "Updated Name on v1" and open it
10. Open the versions dropdown and select version **"v1"** again

### Expected Results

- At step 6: The **Save** button is active and clickable
- At step 7: A success notification ("The agent has been updated" or equivalent) is displayed
- At step 10: The **Name** field displays **"Updated Name on v1"**
- At step 10: The **Description** field displays **"Updated Description on v1"**
- The saved name and description values are not reverted to the previous "Base Agent Name" / "Base Agent
  Description" values

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering the agent's current name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- This test specifically validates the fix for GitHub issue #3076
- If the name/description revert on reload, the bug is not fixed
- The success toast appearing while data does NOT persist is the original failure mode — make sure to reload
  and verify persistence, not just the presence of a success message

---

## Test Case ID: TC-14-02

#### Test Case Name:

Version-level content (Instructions) still persists after saving on a non-base version

#### Test Case Tags:

functional testing, regression, versions, instructions

#### Test Case Priority:

High

#### Test Case Description:

Verify that saving a non-base version still correctly persists version-level fields (Instructions, system
prompt) after the save logic was unified to use a single API endpoint. This is a regression check to ensure
the fix for name/description did not break the existing ability to save version content.

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
6. Create a test agent with one named version:
   - Navigate to the **Agents** section in the {Project} of the application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's **Name**: "Regression Test Agent"
     - Agent's **Description**: "Regression Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Regression Test Agent" in the agents list
   - Click on the agent to open it
   - Navigate to **Configuration** tab
   - Add text "Original v1 instructions" to the **Instructions** field
   - Click the **Save as version** button
   - Enter "v1" in the version name input field
   - Click the **Save** button
   - Verify the version "v1" is created and appears in the versions dropdown

### Test Steps

1. In the "Regression Test Agent" **Configuration** tab, open the versions dropdown
2. Select the non-base version **"v1"** from the dropdown
3. Verify the **Instructions** field shows "Original v1 instructions"
4. Clear the **Instructions** field and type "Updated v1 instructions"
5. Click the **Save** button
6. Observe the success notification
7. Navigate away from the agent (e.g., go to the Agents list)
8. Navigate back to the agent and open it
9. Open the versions dropdown and select **"v1"** again

### Expected Results

- At step 6: A success notification ("The agent has been updated" or equivalent) is displayed
- At step 9: The **Instructions** field displays **"Updated v1 instructions"**
- The instructions are not reverted to "Original v1 instructions"
- Name and description of the agent remain unchanged ("Regression Test Agent" / "Regression Test Description")

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the "Regression Test Agent" in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Regression Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- The purpose of this test is to confirm that the version content (instructions) path was not broken by the
  fix that unified the save endpoint
- If instructions revert, the unified save hook is not correctly including version-level fields in the payload

---

## Test Case ID: TC-14-03

#### Test Case Name:

Save button is disabled after successfully saving a non-base version

#### Test Case Tags:

functional testing, regression, versions, save-button-state

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that the **Save** button returns to a disabled/inactive state after a successful save on a non-base
version. Previously, `resetForm` was not called after saving a non-base version, leaving the form in a "dirty"
state and keeping the Save button active even though the data was already persisted (or silently discarded).

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
6. Create a test agent with one named version:
   - Navigate to the **Agents** section in the {Project} of the application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's **Name**: "Save Button Test Agent"
     - Agent's **Description**: "Save Button Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Save Button Test Agent" in the agents list
   - Click on the agent to open it
   - Navigate to **Configuration** tab
   - Add text to the **Instructions** field (e.g., "Initial instructions")
   - Click the **Save as version** button
   - Enter "v1" in the version name input field
   - Click the **Save** button
   - Verify the version "v1" is created and appears in the versions dropdown

### Test Steps

1. In the "Save Button Test Agent" **Configuration** tab, open the versions dropdown
2. Select the non-base version **"v1"** from the dropdown
3. Verify the **Save** button is disabled (no changes have been made yet)
4. Modify the **Instructions** field (e.g., append " - modified")
5. Verify the **Save** button becomes active/enabled
6. Click the **Save** button
7. Wait for the success notification to appear

### Expected Results

- At step 3: The **Save** button is disabled before any changes are made
- At step 5: The **Save** button becomes enabled after editing a field
- At step 7: A success notification ("The agent has been updated" or equivalent) is displayed
- After the success notification: The **Save** button returns to a **disabled** state, indicating the form has
  been reset to the persisted values and there are no unsaved changes

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the "Save Button Test Agent" in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Save Button Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the agent is removed from the agents list and not present
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- If the Save button stays active after a successful save, the `resetForm` call is not working correctly
- This test covers a secondary issue from the same bug fix (missing `resetForm` in the old non-base version
  save path)
