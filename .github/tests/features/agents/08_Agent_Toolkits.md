# Scenario ID: 08_Agent_Toolkits

# Scenario ID: 08_Agent_Toolkits

#### Scenario Name: Agent Toolkits - add, create, modify, and remove toolkits (includes add Agent/Pipeline/MCP flows)

#### Scenario Name:

Agent Toolkits - add, create, modify, and remove toolkits (includes add Agent/Pipeline/MCP flows)

#### Scenario Tags: functional testing, regression, agents, toolkits, mcp, pipeline

#### Scenario Tags:

functional testing, regression, agents, toolkits, mcp, pipeline

#### Scenario Priority: High

#### Scenario Priority:

High

#### Scenario Description: This scenario validates the UX and correctness of adding existing toolkits to an agent (search/select or pick from list), creating a new toolkit and attaching it to an agent, adding Agents/Pipelines/MCPs as toolkit entries, and removing or modifying existing toolkit links. Covers positive, negative, rare edge cases and interruption/resume flows.

## General Preconditions (apply to all test cases)

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- An Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one using the
  following steps:
  1.  Click "Create Agent".
  2.  Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
      per product conventions.
  3.  Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section. The section contains four action buttons (visible
  near the top/right of the section):
  - "+Toolkit" (for adding an existing or creating new toolkit)
  - "+MCP" (for attaching an MCP instance/config)
  - "+Agent" (for linking another agent as a toolkit entry)
  - "+Pipeline" (for linking a pipeline as a toolkit entry)
- For all "search" flows assume some pre-existing items in the system: at minimum one toolkit named "Existing
  Toolkit A", one agent named "Helper Agent", one pipeline named "Build-Pipeline-1", and one MCP named
  "MCP-Primary". If these do not exist, create them first via the corresponding admin pages.

### Notes about format used below

- Steps are written as end-user actions. When the flow allows either selecting from a dropdown or searching,
  separate test cases cover both.
- For toolkit creation cases specify required fields per toolkit type (e.g., Artifact toolkit requires
  PgVector configuration, Embedding Model, Bucket). For other toolkit types testers must fill all required
  fields.

--

#### Scenario Description:

This scenario validates the UX and correctness of adding existing toolkits to an agent (search/select or pick
from list), creating a new toolkit and attaching it to an agent, adding Agents/Pipelines/MCPs as toolkit
entries, and removing or modifying existing toolkit links. Covers positive, negative, rare edge cases and
interruption/resume flows.

## Test Case ID: TC-08-01

## Test Case ID: TC-08-01

#### Test Case Name: Add existing toolkit via search (paste full name -> select suggestion)

#### Test Case Name:

Add existing toolkit via search (paste full name -> select suggestion)

#### Test Case Tags: positive, toolkit, search

#### Test Case Tags:

positive, toolkit, search

#### Test Case Priority: High

#### Test Case Priority:

High

#### Test Case Description: Verify that a user can add an existing toolkit to the agent by pasting the exact toolkit name into the search field and selecting the suggested match.

#### Test Case Description:

Verify that a user can add an existing toolkit to the agent by pasting the exact toolkit name into the search
field and selecting the suggested match.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- For this test ensure the toolkit "Existing Toolkit A" exists in the global toolkits list.

### Test Steps:

1.  Open "Test Agent" configuration → Configuration tab → Toolkits section.
2.  Click "+Toolkit".
3.  In the search input, paste the exact name "Existing Toolkit A".
4.  Wait for the autosuggest list and click the matching suggestion.
5.  Confirm the selection (click "Add" or equivalent).

### Expected Results:

- The suggestion list shows "Existing Toolkit A" immediately after paste.
- After confirmation, "Existing Toolkit A" appears in the Toolkits list for the agent with correct metadata
  (type, created-by, date).
- A success notification is displayed (e.g., "Toolkit added to agent").

### Postconditions:

- Created association may be removed in cleanup.

### Notes:

- Verify tooltip/hover metadata for the added toolkit.

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
6. Create a test toolkit named "Existing Toolkit A" for testing:
   - Navigate to the **Toolkits** section in the {Project}
   - Click the **+ Create** button to create a new toolkit
   - Select **Artifact** as the toolkit type
   - Click **PgVector Configuration** dropdown and select **elitea-pgvector**
   - Click **Embedding Model** dropdown and select **text-embedding-3-large**
   - In **Bucket** field enter "Existing Toolkit A"
   - Click **Save** button to create the toolkit
   - Verify that "Existing Toolkit A" appears in the toolkits list
7. Create a test agent for toolkit attachment testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Toolkit Search"
     - Agent's description: "Test agent for toolkit search functionality verification"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Toolkit Search" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Click on the "Test Agent Toolkit Search" agent to open its details page
2. Navigate to the **Configuration** tab in the agent details view
3. Scroll down to locate the **Toolkits** section
4. Click the **+Toolkit** button to open the toolkit selection dialog
5. In the toolkit search dialog that opens, locate the search input field
6. Paste the exact name "Existing Toolkit A" into the search input field
7. Wait for the autosuggest dropdown list to appear below the search field
8. Verify that "Existing Toolkit A" appears in the dropdown suggestions
9. Click on the matching "Existing Toolkit A" suggestion from the dropdown list
10. Click the **Add** button to confirm the toolkit selection
11. Observe that "Existing Toolkit A" appears in the Toolkits list for the agent
12. Click the **Save** button to persist the toolkit attachment changes
13. Wait for the save operation to complete
14. Verify that a success notification message is displayed (e.g., "Agent updated successfully" or "Toolkit
    added to agent")

### Expected Results

- The search input field accepts the pasted text
- The autosuggest dropdown shows "Existing Toolkit A" immediately after paste
- The matching suggestion is clickable and highlights when hovered
- After confirmation, "Existing Toolkit A" appears in the agent's Toolkits list
- The toolkit entry displays correct metadata (type, created-by, date)
- A success notification is displayed (e.g., "Toolkit added to agent")
- The toolkit association is saved when the agent is saved

### Postconditions

1. Clean up test data by removing the toolkit association:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Toolkit Search" agent in the agents list
   - Click on "Test Agent Toolkit Search" agent to open its details page
   - Navigate to the **Configuration** tab
   - Locate the **Toolkits** section and find "Existing Toolkit A" in the Toolkits list
   - Click the **Remove toolkit** button (trash icon) next to the "Existing Toolkit A" entry
   - In the opened **Remove toolkit** confirmation window, click **Remove** button
   - Verify that "Existing Toolkit A" is removed from the agent's Toolkits list
   - Click the **Save** button to persist the changes
2. Clean up test data by deleting the created agent:
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Toolkit Search" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Toolkit Search" agent is removed from the agents list and is not present
3. Clean up test data by deleting the created toolkit:
   - Navigate to the **Toolkits** section in the {Project}
   - Locate the created "Existing Toolkit A" toolkit in the toolkits list
   - Click on the toolkit menu (3 dots or ellipsis) next to the "Existing Toolkit A" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the "Existing Toolkit A" toolkit is removed from the toolkits list
4. Verify no residual data remains from the deleted agent and toolkit
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify tooltip/hover metadata for the added toolkit displays correctly
- Ensure the search is case-insensitive if supported by the system

## Test Case ID: TC-08-02

## Test Case ID: TC-08-02

#### Test Case Name: Add existing toolkit via incremental search (type partial name -> select suggestion)

#### Test Case Name:

Add existing toolkit via incremental search (type partial name -> select suggestion)

#### Test Case Tags: positive, toolkit, search-autocomplete

#### Test Case Tags:

positive, toolkit, search-autocomplete

#### Test Case Priority: High

#### Test Case Priority:

High

#### Test Case Description: Verify that typing a partial toolkit name shows matching suggestions and allows selecting the intended toolkit.

#### Test Case Description:

Verify that typing a partial toolkit name shows matching suggestions and allows selecting the intended
toolkit.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- For this test ensure the toolkit "Existing Toolkit A" exists in the global toolkits list.

### Test Steps:

1.  Open the Toolkits section in "Test Agent" configuration.
2.  Click "+Toolkit".
3.  Type "Exist" (or initial substring of existing toolkit names).
4.  From suggestions, click "Existing Toolkit A".
5.  Confirm the selection.

### Expected Results:

- Suggestions are filtered to show relevant matches.
- After selecting, the toolkit is added and visible in the Toolkits list.

### Postconditions:

- Cleanup as appropriate.

### Notes:

- Test also when multiple matches appear; ensure the user can disambiguate by description or metadata in the
  list.

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
6. Create a test toolkit named "Existing Toolkit B" for incremental search testing:
   - Navigate to the **Toolkits** section in the {Project}
   - Click the **+ Create** button to create a new toolkit
   - Select **Artifact** as the toolkit type
   - Click **PgVector Configuration** dropdown and select **elitea-pgvector**
   - Click **Embedding Model** dropdown and select **text-embedding-3-large**
   - In **Bucket** field enter "Existing Toolkit B"
   - Click **Save** button to create the toolkit
   - Verify that "Existing Toolkit B" appears in the toolkits list
7. Create a test agent for incremental search testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Incremental Search"
     - Agent's description: "Test agent for incremental toolkit search functionality"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Incremental Search" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Click on the "Test Agent Incremental Search" agent from the agents list to open its details page
2. Wait for the agent details page to fully load
3. Navigate to **Configuration** tab within the agent details view
4. Scroll down to locate the **Toolkits** section
5. Click the **+Toolkit** button to open the toolkit selection dialog
6. In the toolkit search dialog that opens, locate the search input field
7. Type the first letters "Exist" in the search input field (one character at a time)
8. Wait for the autosuggest system to process the input
9. Observe that a dropdown suggestion list appears below the input field
10. Verify that "Existing Toolkit B" appears in the dropdown suggestions
11. Review any additional matches that might appear for disambiguation
12. Click on the "Existing Toolkit B" suggestion from the dropdown to select it
13. Click the **Add** button to confirm the toolkit selection
14. Wait for the toolkit addition to process
15. Observe that "Existing Toolkit B" appears in the Toolkits list for the agent
16. Click the **Save** button to persist the toolkit attachment changes
17. Wait for the save operation to complete
18. Verify that a success notification message is displayed (e.g., "Agent updated successfully" or "Toolkit
    added to agent")

### Expected Results

- The search input field accepts the typed partial text "Exist" without errors
- The autosuggest dropdown appears immediately after typing "Exist"
- "Existing Toolkit B" appears prominently in the dropdown suggestions
- Multiple matches are shown if they exist, with distinguishable metadata (type, description, created-by)
- The selected suggestion is highlighted when hovered over
- Clicking the suggestion selects it for addition
- After confirmation, "Existing Toolkit B" appears in the agent's Toolkits list
- The toolkit entry displays correct metadata (type, created-by, creation date)
- A success notification is displayed (e.g., "Toolkit added to agent" or "Agent updated successfully")
- The toolkit association is properly saved when the agent is saved
- The incremental search functionality operates smoothly without delays or errors

### Postconditions

1. Clean up test data by removing the toolkit association:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Incremental Search" agent in the agents list
   - Click on "Test Agent Incremental Search" agent to open its details page
   - Navigate to the **Configuration** tab
   - Locate the **Toolkits** section and find "Existing Toolkit B" in the Toolkits list
   - Click the **Remove toolkit** button (trash icon) next to the "Existing Toolkit B" entry
   - In the opened **Remove toolkit** confirmation window, click **Remove** button
   - Verify that "Existing Toolkit B" is removed from the agent's Toolkits list
   - Click the **Save** button to persist the changes
2. Clean up test data by deleting the created agent:
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Incremental Search" to confirm
     deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Incremental Search" agent is removed from the agents list and is not present
3. Clean up test data by deleting the created toolkit:
   - Navigate to the **Toolkits** section in the {Project}
   - Locate the created "Existing Toolkit B" toolkit in the toolkits list
   - Click on the toolkit menu (3 dots or ellipsis) next to the "Existing Toolkit B" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the "Existing Toolkit B" toolkit is removed from the toolkits list
4. Verify no residual data remains from the deleted agent and toolkit
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test with multiple matches to ensure user can disambiguate by description or metadata
- Verify incremental search works with different character combinations

--

## Test Case ID: TC-08-03

## Test Case ID: TC-08-03

#### Test Case Name: Search returns no matches — cannot add non-existent toolkit via search

#### Test Case Name:

Search returns no matches — cannot add non-existent toolkit via search

#### Test Case Tags: negative, toolkit, search

#### Test Case Tags:

negative, toolkit, search

#### Test Case Priority: High

#### Test Case Priority:

High

#### Test Case Description: Verify that entering a non-existent toolkit name into the search yields no suggestions and the UI prevents adding a non-existent toolkit.

#### Test Case Description:

Verify that entering a non-existent toolkit name into the search yields no suggestions and the UI prevents
adding a non-existent toolkit.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure no toolkit exists with name "Toolkit-Does-Not-Exist".

### Test Steps:

1.  Open Toolkits section.
2.  Click "+Toolkit".
3.  Type "Toolkit-Does-Not-Exist" in the search input.
4.  Observe suggestions and any inline messages.

### Expected Results:

- No suggestions are shown.
- The UI does not allow adding an entry with that name via the search (Add button is disabled or no action
  available).
- UI shows "No toolkit found" message is displayed

### Postconditions:

- None.

### Notes:

- If product supports creating a toolkit from search (direct create), that flow is tested separately in the
  Create new toolkit cases.

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
6. Verify no toolkit exists with name "Toolkit-Does-Not-Exist-999":
   - Navigate to the **Toolkits** section in the {Project}
   - Use the search functionality to search for "Toolkit-Does-Not-Exist-999"
   - Verify that no toolkit with this name appears in the search results
   - If any toolkit with a similar name exists, choose a different unique non-existent name
   - Confirm the selected non-existent toolkit name is truly not present in the system
7. Create a test agent for negative search testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Negative Search"
     - Agent's description: "Test agent for verifying non-existent toolkit search behavior"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Negative Search" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Click on the "Test Agent Negative Search" agent from the agents list to open its details page
2. Wait for the agent details page to fully load
3. Navigate to **Configuration** tab within the agent details view
4. Scroll down to locate the **Toolkits** section
5. Click the **+Toolkit** button to open the toolkit selection dialog
6. In the toolkit search dialog that opens, locate the search input field
7. Type "Toolkit-Does-Not-Exist-999" in the search input field
8. Wait for the system to process the search query (allow 2-3 seconds for processing)
9. Observe the suggestions dropdown area below the search input field
10. Verify that no matching suggestions are displayed in the dropdown
11. Look for any system messages such as "No toolkit found", "No results", or similar feedback
12. Attempt to locate an "Add" button or similar action button in the dialog
13. Verify that the "Add" button is either not visible, disabled, or inactive
14. Confirm that no action is available to proceed with adding the non-existent toolkit
15. Try clicking in the dropdown area or pressing Enter to confirm no selection is possible
16. Observe the overall behavior and any error handling messages displayed by the system
17. Click **Cancel** or the close button to exit the toolkit selection dialog without making changes

### Expected Results

- The search input field accepts the typed text "Toolkit-Does-Not-Exist-999" without errors
- No suggestions are shown in the dropdown list after the search completes
- The system displays a clear "No toolkit found", "No results", or similar informative message
- The "Add" button is either not visible, disabled, or inactive due to no valid selection
- The UI prevents adding an entry with the non-existent name via the search mechanism
- No toolkit attachment occurs for the non-existent toolkit name
- The search interface remains functional and responsive for subsequent valid searches
- The dialog can be properly cancelled or closed without making changes
- No error states persist in the UI after cancelling the operation

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Negative Search" agent in the agents list
   - Click on "Test Agent Negative Search" agent to open its details page
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Negative Search" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Negative Search" agent is removed from the agents list and is not present
2. Verify no residual data remains from the deleted agent
3. Confirm no unintended toolkit was created during the negative test scenario
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- If product supports creating a toolkit from search (direct create), that flow is tested separately in the
  Create new toolkit cases
- Verify the search maintains functionality for valid toolkit names after testing non-existent names

--

## Test Case ID: TC-08-04

## Test Case ID: TC-08-04

#### Test Case Name: Create new toolkit (artifact example) and add to agent (+Create new flow -> save)

#### Test Case Name:

Create new toolkit (artifact example) and add to agent (+Create new flow -> save)

#### Test Case Tags: positive, toolkit, create

#### Test Case Tags:

positive, toolkit, create

#### Test Case Priority: High

#### Test Case Priority:

High

#### Test Case Description: Verify that clicking "+Toolkit" → "+Create new" opens toolkit creation page; filling required fields for an Artifact toolkit and saving creates the toolkit and attaches it to the agent.

#### Test Case Description:

Verify that clicking "+Toolkit" → "+Create new" opens toolkit creation page; filling required fields for an
Artifact toolkit and saving creates the toolkit and attaches it to the agent.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".

### Test Steps:

1.  Open Toolkits section for "Test Agent".
2.  Click "+Toolkit" → click "+Create new".
3.  On the toolkit creation page choose Toolkit Type: "Artifact" (or relevant type).
4.  Fill required fields for Artifact type: Select PgVector Configuration, Choose Embedding Model, Enter valid
    value for "Bucket" (e.g., "agent-artifacts-bucket").
5.  Click "Save".
6.  After save completes, return to "Test Agent" configuration or wait for redirect if product automatically
    links new toolkit.

### Expected Results:

- The new toolkit is created and appears in the toolkits list.
- The new toolkit is attached to "Test Agent"'s Toolkits section (either automatically after save or after
  redirect + confirm action).

### Postconditions:

- Optionally remove created toolkit from list to cleanup.

### Notes:

- For other toolkit types (e.g., LLM connector, DB connector) ensure respective required fields are supplied
  in creation.

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
6. Create a test agent for toolkit creation and attachment testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Create Toolkit"
     - Agent's description: "Test agent for toolkit creation and attachment functionality"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Create Toolkit" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Click on the "Test Agent Create Toolkit" agent from the agents list to open its details page
2. Wait for the agent details page to fully load
3. Navigate to **Configuration** tab within the agent details view
4. Scroll down to locate the **Toolkits** section
5. Click the **+Toolkit** button to open the toolkit selection dialog
6. In the toolkit dialog, locate and click the **+Create new** button to initiate toolkit creation
7. Wait for the toolkit creation page to load completely
8. On the toolkit creation page, locate the Toolkit Type selection
9. Choose Toolkit Type: **Artifact** from the available options
10. Fill in the required fields for Artifact type:
    - Click **PgVector Configuration** dropdown and select **elitea-pgvector**
    - Click **Embedding Model** dropdown and select **text-embedding-3-large**
    - In **Bucket** field enter "agent-artifacts-bucket-new"
11. Click the **Save** button to create the toolkit
12. Wait for the save operation to complete and process
13. Verify that a toolkit creation success notification is displayed
14. Observe the page behavior (automatic redirect or manual navigation back to agent)
15. Return to "Test Agent Create Toolkit" configuration page if not automatically redirected
16. Navigate to **Configuration** tab and locate the **Toolkits** section
17. Verify that the newly created toolkit "agent-artifacts-bucket-new" appears in the agent's Toolkits list
18. Click the **Save** button to persist the agent configuration changes
19. Wait for the save operation to complete
20. Verify that a success notification message is displayed for the agent update

### Expected Results

- The toolkit creation page opens successfully after clicking "+Create new"
- All required fields for Artifact type are present and functional
- PgVector Configuration dropdown contains available configuration options
- Embedding Model dropdown contains available embedding models
- Bucket field accepts the entered value "agent-artifacts-bucket-new" without errors
- Save operation completes successfully with a clear confirmation message
- The new toolkit is created and appears in the global toolkits list
- The new toolkit is automatically attached to "Test Agent Create Toolkit"'s Toolkits section
- The toolkit entry displays correct metadata (type, created-by, creation date)
- The agent configuration is properly saved with the new toolkit association
- Success notification is displayed for both toolkit creation and agent update operations

### Postconditions

1. Clean up test data by removing the toolkit association:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Create Toolkit" agent in the agents list
   - Click on "Test Agent Create Toolkit" agent to open its details page
   - Navigate to the **Configuration** tab
   - Locate the **Toolkits** section and find "agent-artifacts-bucket-new" in the Toolkits list
   - Click the **Remove toolkit** button (trash icon) next to the "agent-artifacts-bucket-new" entry
   - In the opened **Remove toolkit** confirmation window, click **Remove** button
   - Verify that "agent-artifacts-bucket-new" is removed from the agent's Toolkits list
   - Click the **Save** button to persist the changes
2. Clean up test data by deleting the created agent:
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Create Toolkit" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Create Toolkit" agent is removed from the agents list and is not present
3. Clean up test data by deleting the created toolkit:
   - Navigate to the **Toolkits** section in the {Project}
   - Locate the created "agent-artifacts-bucket-new" toolkit in the toolkits list
   - Click on the toolkit menu (3 dots or ellipsis) next to the "agent-artifacts-bucket-new" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the "agent-artifacts-bucket-new" toolkit is removed from the toolkits list
4. Verify no residual data remains from the deleted agent and toolkit
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- For other toolkit types (e.g., LLM connector, DB connector) ensure respective required fields are supplied
  in creation
- Verify that the toolkit creation automatically links to the agent without additional confirmation steps

--

## Test Case ID: TC-08-05

## Test Case ID: TC-08-05

#### Test Case Name: Create new toolkit then Cancel (no toolkit added)

#### Test Case Name:

Create new toolkit then Cancel (no toolkit added)

#### Test Case Tags: negative, toolkit, create

#### Test Case Tags:

negative, toolkit, create

#### Test Case Priority: Medium

#### Test Case Priority:

Medium

#### Test Case Description: Verify that if user starts the "+Create new" flow but clicks "Cancel" (or navigates away) the toolkit is not created nor attached to the agent.

#### Test Case Description:

Verify that if user starts the "+Create new" flow but clicks "Cancel" (or navigates away) the toolkit is not
created nor attached to the agent.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".

### Test Steps:

1.  Open Toolkits section.
2.  Click "+Toolkit" → "+Create new".
3.  On the creation page select type and fill required fields partially or fully.
4.  Click "Cancel" or navigate back without saving.

### Expected Results:

- The toolkit is not created in the toolkits list.
- The toolkit is not attached to the agent.
- No partial/inconsistent state is present.

### Postconditions:

- None.

### Notes:

- If auto-draft feature exists, specify expected behavior (draft saved or discarded).

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
6. Create a test agent for toolkit cancellation testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Cancel Toolkit"
     - Agent's description: "Test agent for toolkit creation cancellation functionality"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Cancel Toolkit" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Click on the "Test Agent Cancel Toolkit" agent from the agents list to open its details page
2. Wait for the agent details page to fully load
3. Navigate to **Configuration** tab within the agent details view
4. Scroll down to locate the **Toolkits** section
5. Click the **+Toolkit** button to open the toolkit selection dialog
6. In the toolkit dialog, locate and click the **+Create new** button to initiate toolkit creation
7. Wait for the toolkit creation page to load completely
8. On the toolkit creation page, locate the Toolkit Type selection
9. Choose Toolkit Type: **Artifact** from the available options
10. Partially fill in the required fields for Artifact type:
    - Click **PgVector Configuration** dropdown and select **elitea-pgvector**
    - Click **Embedding Model** dropdown and select **text-embedding-3-large**
    - In **Bucket** field enter "cancelled-toolkit-test"
11. Locate the **Cancel** button or close button on the toolkit creation page
12. Click the **Cancel** button to abort the toolkit creation process
13. Wait for the page to return to the agent configuration view
14. Navigate to the **Toolkits** section in the {Project} to verify global toolkit list
15. Search for "cancelled-toolkit-test" in the global toolkits list
16. Return to the agent configuration and verify the agent's Toolkits section

### Expected Results

- The toolkit creation page opens successfully when clicking "+Create new"
- All form fields accept the entered data during the creation process
- The **Cancel** button is available and functional throughout the process
- Clicking **Cancel** immediately aborts the toolkit creation operation
- The page returns to the agent configuration view without errors
- The toolkit "cancelled-toolkit-test" is NOT created in the global toolkits list
- The toolkit is NOT attached to the "Test Agent Cancel Toolkit" agent
- No partial or inconsistent state is present in the system
- The agent's Toolkits section remains unchanged from the initial state
- No error messages or warnings are displayed after cancellation

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Cancel Toolkit" agent in the agents list
   - Click on "Test Agent Cancel Toolkit" agent to open its details page
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Cancel Toolkit" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Cancel Toolkit" agent is removed from the agents list and is not present
2. Verify no residual data remains from the deleted agent
3. Confirm no unwanted toolkit was created during the cancellation test scenario
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- If auto-draft feature exists, verify expected behavior (draft saved or discarded)
- Ensure the cancellation works consistently across different toolkit types

--

## Test Case ID: TC-08-06

## Test Case ID: TC-08-06

#### Test Case Name: Add Agent as toolkit via dropdown selection

#### Test Case Name:

Add Agent as toolkit via dropdown selection

#### Test Case Tags: positive, agent-as-toolkit

#### Test Case Tags:

positive, agent-as-toolkit

#### Test Case Priority: Medium

#### Test Case Priority:

Medium

#### Test Case Description: Verify adding an existing Agent (e.g., "Helper Agent") to the Toolkits section using the dropdown list.

#### Test Case Description:

Verify adding an existing Agent (e.g., "Helper Agent") to the Toolkits section using the dropdown list.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure the agent "Helper Agent" exists in the Agents list for selection.

### Test Steps:

1.  In Toolkits section click "+Agent".
2.  Open the dropdown and scroll/select "Helper Agent" from the list.
3.  Click "Add"/Confirm.

### Expected Results:

- "Helper Agent" appears in the Toolkits list for "Test Agent" with link to the agent's configuration.
- Success notification shown.

### Postconditions:

- Cleanup by unlinking the agent if necessary.

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
6. Create a helper agent for toolkit attachment:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Helper Agent Toolkit"
     - Agent's description: "Helper agent to be used as a toolkit component"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Helper Agent Toolkit" agent in the agents list
   - Verify the agent appears in the agents table
7. Create a main test agent for agent-as-toolkit testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Add Agent"
     - Agent's description: "Test agent for adding other agents as toolkit components"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Add Agent" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Click on the "Test Agent Add Agent" agent from the agents list to open its details page
2. Wait for the agent details page to fully load
3. Navigate to **Configuration** tab within the agent details view
4. Scroll down to locate the **Toolkits** section
5. Locate the action buttons in the Toolkits section: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
6. Click the **+Agent** button to open the agent selection dialog
7. Wait for the agent selection dialog to load with available agents
8. In the dropdown list, scroll through the available agents
9. Locate and select "Helper Agent Toolkit" from the dropdown list
10. Click **Add** or **Confirm** button to add the selected agent as a toolkit
11. Wait for the operation to complete
12. Observe that "Helper Agent Toolkit" appears in the Toolkits list for "Test Agent Add Agent"
13. Click the **Save** button to persist the agent configuration changes
14. Wait for the save operation to complete
15. Verify that a success notification message is displayed

### Expected Results

- The **+Agent** button is available and functional in the Toolkits section
- The agent selection dialog opens successfully when clicking **+Agent**
- The dropdown list contains available agents including "Helper Agent Toolkit"
- "Helper Agent Toolkit" can be selected from the dropdown list
- The selected agent is properly highlighted when chosen
- "Helper Agent Toolkit" appears in the Toolkits list for "Test Agent Add Agent" after confirmation
- The toolkit entry displays with a link to the agent's configuration
- The agent toolkit entry shows correct metadata (type, created-by, date)
- A success notification is displayed (e.g., "Agent added to toolkit" or "Agent updated successfully")
- The agent configuration is properly saved with the new agent-as-toolkit association

### Postconditions

1. Clean up test data by removing the agent-as-toolkit association:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Add Agent" agent in the agents list
   - Click on "Test Agent Add Agent" agent to open its details page
   - Navigate to the **Configuration** tab
   - Locate the **Toolkits** section and find "Helper Agent Toolkit" in the Toolkits list
   - Click the **Remove toolkit** button (trash icon) next to the "Helper Agent Toolkit" entry
   - In the opened **Remove toolkit** confirmation window, click **Remove** button
   - Verify that "Helper Agent Toolkit" is removed from the agent's Toolkits list
   - Click the **Save** button to persist the changes
2. Clean up test data by deleting the main test agent:
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Add Agent" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Add Agent" agent is removed from the agents list and is not present
3. Clean up test data by deleting the helper agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Helper Agent Toolkit" agent in the agents list
   - Click on "Helper Agent Toolkit" agent to open its details page
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Helper Agent Toolkit" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Helper Agent Toolkit" agent is removed from the agents list and is not present
4. Verify no residual data remains from the deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

## Test Case ID: TC-08-07

## Test Case ID: TC-08-07

#### Test Case Name: Add Agent as toolkit via search and select from suggestions

#### Test Case Name:

Add Agent as toolkit via search and select from suggestions

#### Test Case Tags: positive, agent-as-toolkit, search

#### Test Case Tags:

positive, agent-as-toolkit, search

#### Test Case Priority: Medium

#### Test Case Priority:

Medium

#### Test Case Description: Verify searching for an agent by name and selecting from suggested matches attaches it as a toolkit entry.

#### Test Case Description:

Verify searching for an agent by name and selecting from suggested matches attaches it as a toolkit entry.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure the agent "Helper Agent" exists in the Agents list for selection.

### Test Steps:

1.  Click "+Agent".
2.  Type "Helper" into search box, select "Helper Agent" from suggestions.
3.  Confirm "Add".

### Expected Results:

- "Helper Agent" appears in the Toolkits list linked to the agent.

### Postconditions:

- None.

### Notes:

- Test partial-match suggestions and ranking when multiple results exist.

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
6. Create a helper agent for search-based toolkit attachment:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Helper Agent Search"
     - Agent's description: "Helper agent to be found via search and used as a toolkit component"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Helper Agent Search" agent in the agents list
   - Verify the agent appears in the agents table
7. Create a main test agent for agent search testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Search Helper"
     - Agent's description: "Test agent for searching and adding other agents as toolkit components"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Search Helper" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Click on the "Test Agent Search Helper" agent from the agents list to open its details page
2. Wait for the agent details page to fully load
3. Navigate to **Configuration** tab within the agent details view
4. Scroll down to locate the **Toolkits** section
5. Locate the action buttons in the Toolkits section: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
6. Click the **+Agent** button to open the agent selection dialog
7. Wait for the agent selection dialog to load with search functionality
8. Locate the search input field in the agent selection dialog
9. Type "Helper" into the search box
10. Wait for the autosuggest system to process the search input
11. Observe the dropdown suggestions that appear below the search field
12. Verify that "Helper Agent Search" appears in the suggestions list
13. Click on "Helper Agent Search" from the dropdown suggestions to select it
14. Click the **Add** or **Confirm** button to add the selected agent as a toolkit
15. Wait for the operation to complete
16. Observe that "Helper Agent Search" appears in the Toolkits list for "Test Agent Search Helper"
17. Click the **Save** button to persist the agent configuration changes
18. Wait for the save operation to complete
19. Verify that a success notification message is displayed

### Expected Results

- The **+Agent** button is available and functional in the Toolkits section
- The agent selection dialog opens successfully with search functionality
- The search input field accepts the typed text "Helper" without errors
- The autosuggest system processes the search input and displays matching results
- "Helper Agent Search" appears in the dropdown suggestions based on the partial match
- Multiple matches are shown if they exist, with distinguishable metadata
- The selected suggestion is properly highlighted when clicked
- "Helper Agent Search" appears in the Toolkits list for "Test Agent Search Helper" after confirmation
- The toolkit entry displays with a link to the agent's configuration
- The agent toolkit entry shows correct metadata (type, created-by, date)
- A success notification is displayed (e.g., "Agent added to toolkit" or "Agent updated successfully")
- The agent configuration is properly saved with the new agent-as-toolkit association

### Postconditions

1. Clean up test data by removing the agent-as-toolkit association:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Search Helper" agent in the agents list
   - Click on "Test Agent Search Helper" agent to open its details page
   - Navigate to the **Configuration** tab
   - Locate the **Toolkits** section and find "Helper Agent Search" in the Toolkits list
   - Click the **Remove toolkit** button (trash icon) next to the "Helper Agent Search" entry
   - In the opened **Remove toolkit** confirmation window, click **Remove** button
   - Verify that "Helper Agent Search" is removed from the agent's Toolkits list
   - Click the **Save** button to persist the changes
2. Clean up test data by deleting the main test agent:
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Search Helper" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Search Helper" agent is removed from the agents list and is not present
3. Clean up test data by deleting the helper agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Helper Agent Search" agent in the agents list
   - Click on "Helper Agent Search" agent to open its details page
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Helper Agent Search" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Helper Agent Search" agent is removed from the agents list and is not present
4. Verify no residual data remains from the deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test partial-match suggestions and ranking when multiple results exist
- Verify incremental search works with different character combinations

--

## Test Case ID: TC-08-08

## Test Case ID: TC-08-08

#### Test Case Name: Add Pipeline as toolkit via dropdown or search

#### Test Case Name:

Add Pipeline as toolkit via dropdown or search

#### Test Case Tags: positive, pipeline, toolkit

#### Test Case Tags:

positive, pipeline, toolkit

#### Test Case Priority: Medium

#### Test Case Priority:

Medium

#### Test Case Description: Verify adding a pipeline (e.g., "Build-Pipeline-1") through dropdown selection and via search/autocomplete.

#### Test Case Description:

Verify adding a pipeline (e.g., "Build-Pipeline-1") through dropdown selection and via search/autocomplete.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure the pipeline "Build-Pipeline-1" exists and is available for linking.

### Test Steps:

1.  Click "+Pipeline".
2.  Use dropdown to select "Build-Pipeline-1" and confirm add.
3.  Repeat: click "+Pipeline" → type "Build" → select from suggestions and confirm.

### Expected Results:

- Pipeline is added to Toolkits list and shows pipeline metadata and link.

### Postconditions:

- None.

### Notes:

- Validate behavior when many pipelines exist (scrolling/pagination).

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
6. Ensure a pipeline named "Build-Pipeline-Test" exists and is available for linking:
   - Navigate to the **Pipelines** section in the {Project} (if available)
   - Verify "Build-Pipeline-Test" is present in the pipelines list
   - If not present, create it using the **+ Create** button with required fields
   - Confirm the pipeline is active and available for use
7. Create a test agent for pipeline attachment testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Pipeline"
     - Agent's description: "Test agent for pipeline attachment functionality"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Pipeline" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Click on the "Test Agent Pipeline" agent from the agents list to open its details page
2. Wait for the agent details page to fully load
3. Navigate to **Configuration** tab within the agent details view
4. Scroll down to locate the **Toolkits** section
5. Locate the action buttons in the Toolkits section: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
6. Click the **+Pipeline** button to open the pipeline selection dialog
7. Wait for the pipeline selection dialog to load with available pipelines
8. In the dropdown list, scroll through the available pipelines
9. Locate and select "Build-Pipeline-Test" from the dropdown list
10. Click **Add** or **Confirm** button to add the selected pipeline as a toolkit
11. Wait for the operation to complete
12. Observe that "Build-Pipeline-Test" appears in the Toolkits list for "Test Agent Pipeline"
13. Click the **Save** button to persist the agent configuration changes
14. Wait for the save operation to complete
15. Verify that a success notification message is displayed
16. Test search functionality: Click **+Pipeline** again to open the selection dialog
17. Locate the search input field in the pipeline selection dialog
18. Type "Build" into the search box
19. Wait for the autosuggest system to process the search input
20. Verify that "Build-Pipeline-Test" appears in the search suggestions
21. Click **Cancel** to close the dialog without making changes (since pipeline is already added)

### Expected Results

- The **+Pipeline** button is available and functional in the Toolkits section
- The pipeline selection dialog opens successfully when clicking **+Pipeline**
- The dropdown list contains available pipelines including "Build-Pipeline-Test"
- "Build-Pipeline-Test" can be selected from the dropdown list
- The selected pipeline is properly highlighted when chosen
- "Build-Pipeline-Test" appears in the Toolkits list for "Test Agent Pipeline" after confirmation
- The toolkit entry displays with a link to the pipeline's configuration
- The pipeline toolkit entry shows correct metadata (type, created-by, date)
- A success notification is displayed (e.g., "Pipeline added to toolkit" or "Agent updated successfully")
- The agent configuration is properly saved with the new pipeline-as-toolkit association
- Search functionality works correctly and shows matching pipelines based on partial input
- The search shows "Build-Pipeline-Test" when typing "Build"

### Postconditions

1. Clean up test data by removing the pipeline-as-toolkit association:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Pipeline" agent in the agents list
   - Click on "Test Agent Pipeline" agent to open its details page
   - Navigate to the **Configuration** tab
   - Locate the **Toolkits** section and find "Build-Pipeline-Test" in the Toolkits list
   - Click the **Remove toolkit** button (trash icon) next to the "Build-Pipeline-Test" entry
   - In the opened **Remove toolkit** confirmation window, click **Remove** button
   - Verify that "Build-Pipeline-Test" is removed from the agent's Toolkits list
   - Click the **Save** button to persist the changes
2. Clean up test data by deleting the created agent:
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Pipeline" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Pipeline" agent is removed from the agents list and is not present
3. Clean up test data by removing the test pipeline (if created):
   - Navigate to the **Pipelines** section in the {Project} (if available)
   - Locate the created "Build-Pipeline-Test" pipeline in the pipelines list
   - Click on the pipeline menu (3 dots or ellipsis) next to the "Build-Pipeline-Test" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the "Build-Pipeline-Test" pipeline is removed from the pipelines list
4. Verify no residual data remains from the deleted agent and pipeline
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Validate behavior when many pipelines exist (scrolling/pagination)
- Test search functionality with different pipeline name patterns

--

## Test Case ID: TC-08-09

## Test Case ID: TC-08-09

#### Test Case Name: Add MCP as toolkit via dropdown and search

#### Test Case Name:

Add MCP as toolkit via dropdown and search

#### Test Case Tags: positive, mcp, toolkit

#### Test Case Tags:

positive, mcp, toolkit

#### Test Case Priority: Medium

#### Test Case Priority:

Medium

#### Test Case Description: Verify attaching an MCP instance (e.g., "MCP-Primary") using dropdown selection and search.

#### Test Case Description:

Verify attaching an MCP instance (e.g., "MCP-Primary") using dropdown selection and search.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure the MCP instance "MCP-Primary" exists and is available for linking.

### Test Steps:

1.  Click "+MCP".
2.  From dropdown select "MCP-Primary" and confirm.
3.  Repeat: click "+MCP" → type "MCP" → select suggestion and confirm.

### Expected Results:

- MCP is linked in the Toolkits list with status/connection metadata.

### Postconditions:

- None.

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
6. Ensure an MCP instance named "MCP-Primary-Test" exists and is available for linking:
   - Navigate to the **MCP** section in the {Project} (if available)
   - Verify "MCP-Primary-Test" is present in the MCP instances list
   - If not present, create it using the **+ Create** button with required fields
   - Confirm the MCP instance is active and available for use
7. Create a test agent for MCP attachment testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent MCP"
     - Agent's description: "Test agent for MCP attachment functionality"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent MCP" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Click on the "Test Agent MCP" agent from the agents list to open its details page
2. Wait for the agent details page to fully load
3. Navigate to **Configuration** tab within the agent details view
4. Scroll down to locate the **Toolkits** section
5. Locate the action buttons in the Toolkits section: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
6. Click the **+MCP** button to open the MCP selection dialog
7. Wait for the MCP selection dialog to load with available MCP instances
8. In the dropdown list, scroll through the available MCP instances
9. Locate and select "MCP-Primary-Test" from the dropdown list
10. Click **Add** or **Confirm** button to add the selected MCP as a toolkit
11. Wait for the operation to complete
12. Observe that "MCP-Primary-Test" appears in the Toolkits list for "Test Agent MCP"
13. Click the **Save** button to persist the agent configuration changes
14. Wait for the save operation to complete
15. Verify that a success notification message is displayed
16. Test search functionality: Click **+MCP** again to open the selection dialog
17. Locate the search input field in the MCP selection dialog
18. Type "MCP" into the search box
19. Wait for the autosuggest system to process the search input
20. Verify that "MCP-Primary-Test" appears in the search suggestions
21. Click **Cancel** to close the dialog without making changes (since MCP is already added)

### Expected Results

- The **+MCP** button is available and functional in the Toolkits section
- The MCP selection dialog opens successfully when clicking **+MCP**
- The dropdown list contains available MCP instances including "MCP-Primary-Test"
- "MCP-Primary-Test" can be selected from the dropdown list
- The selected MCP is properly highlighted when chosen
- "MCP-Primary-Test" appears in the Toolkits list for "Test Agent MCP" after confirmation
- The toolkit entry displays with a link to the MCP's configuration
- The MCP toolkit entry shows correct metadata (type, status/connection, created-by, date)
- A success notification is displayed (e.g., "MCP added to toolkit" or "Agent updated successfully")
- The agent configuration is properly saved with the new MCP-as-toolkit association
- Search functionality works correctly and shows matching MCPs based on partial input
- The search shows "MCP-Primary-Test" when typing "MCP"

### Postconditions

1. Clean up test data by removing the MCP-as-toolkit association:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent MCP" agent in the agents list
   - Click on "Test Agent MCP" agent to open its details page
   - Navigate to the **Configuration** tab
   - Locate the **Toolkits** section and find "MCP-Primary-Test" in the Toolkits list
   - Click the **Remove toolkit** button (trash icon) next to the "MCP-Primary-Test" entry
   - In the opened **Remove toolkit** confirmation window, click **Remove** button
   - Verify that "MCP-Primary-Test" is removed from the agent's Toolkits list
   - Click the **Save** button to persist the changes
2. Clean up test data by deleting the created agent:
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent MCP" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent MCP" agent is removed from the agents list and is not present
3. Clean up test data by removing the test MCP (if created):
   - Navigate to the **MCP** section in the {Project} (if available)
   - Locate the created "MCP-Primary-Test" instance in the MCP instances list
   - Click on the MCP menu (3 dots or ellipsis) next to the "MCP-Primary-Test" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the "MCP-Primary-Test" instance is removed from the MCP instances list
4. Verify no residual data remains from the deleted agent and MCP
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

--

## Test Case ID: TC-08-10

#### Test Case Name:

Negative — No matches for Agent search prevents attachment

#### Test Case Tags:

negative, search, agent

#### Test Case Priority:

High

#### Test Case Description:

Verify that searching for a non-existent Agent yields no suggestions and the user cannot attach it via search.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure name "NoAgentX" does not exist in the Agent registry.

### Test Steps:

1. Click "+Agent".
2. Type "NoAgentX" into the search field.
3. Observe suggestions and attempt to select/add if any appear.

### Expected Results:

- No suggestions; UI indicates "No results"; add action is not available for "NoAgentX".

### Postconditions:

- None.

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
6. Verify that agent name "NoAgentX-999" does not exist in the Agent registry:
   - Navigate to the **Agents** section in the {Project}
   - Use the search functionality to search for "NoAgentX-999"
   - Verify that no agent with this name appears in the search results
   - If any agent with a similar name exists, choose a different unique non-existent name
   - Confirm the selected non-existent agent name is truly not present in the system
7. Create a test agent for negative search testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Negative Agent Search"
     - Agent's description: "Test agent for verifying non-existent agent search behavior"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Negative Agent Search" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Click on the "Test Agent Negative Agent Search" agent from the agents list to open its details page
2. Wait for the agent details page to fully load
3. Navigate to **Configuration** tab within the agent details view
4. Scroll down to locate the **Toolkits** section
5. Locate the action buttons in the Toolkits section: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
6. Click the **+Agent** button to open the agent selection dialog
7. Wait for the agent selection dialog to load with search functionality
8. Locate the search input field in the agent selection dialog
9. Type "NoAgentX-999" into the search field
10. Wait for the system to process the search query (allow 2-3 seconds for processing)
11. Observe the suggestions dropdown area below the search input field
12. Verify that no matching suggestions are displayed in the dropdown
13. Look for any system messages such as "No agent found", "No results", or similar feedback
14. Attempt to locate an "Add" button or similar action button in the dialog
15. Verify that the "Add" button is either not visible, disabled, or inactive
16. Confirm that no action is available to proceed with adding the non-existent agent
17. Try clicking in the dropdown area or pressing Enter to confirm no selection is possible
18. Observe the overall behavior and any error handling messages displayed by the system
19. Click **Cancel** or the close button to exit the agent selection dialog without making changes

### Expected Results

- The **+Agent** button is available and functional in the Toolkits section
- The agent selection dialog opens successfully with search functionality
- The search input field accepts the typed text "NoAgentX-999" without errors
- The system processes the search input and finds no matching results
- No suggestions are displayed in the dropdown list after the search completes
- The system displays a clear "No agent found", "No results", or similar informative message
- The "Add" button is either not visible, disabled, or inactive due to no valid selection
- The UI prevents adding an entry with the non-existent agent name via the search mechanism
- No agent attachment occurs for the non-existent agent name
- The search interface remains functional and responsive for subsequent valid searches
- The dialog can be properly cancelled or closed without making changes
- No error states persist in the UI after cancelling the operation

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Negative Agent Search" agent in the agents list
   - Click on "Test Agent Negative Agent Search" agent to open its details page
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Negative Agent Search" to confirm
     deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Negative Agent Search" agent is removed from the agents list and is not present
2. Verify no residual data remains from the deleted agent
3. Confirm no unintended agent was created during the negative test scenario
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

--

## Test Case ID: TC-08-11

#### Test Case Name:

Negative — No matches for Pipeline search prevents attachment

#### Test Case Tags:

negative, search, pipeline

#### Test Case Priority:

High

#### Test Case Description:

Verify that searching for a non-existent Pipeline yields no suggestions and the user cannot attach it via
search.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure name "NoPipelineX" does not exist in the Pipeline registry.

### Test Steps:

1. Click "+Pipeline".
2. Type "NoPipelineX" into the search field.
3. Observe suggestions and attempt to select/add if any appear.

### Expected Results:

- No suggestions; UI indicates "No results"; add action is not available for "NoPipelineX".

### Postconditions:

- None.

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
6. Verify that pipeline name "NoPipelineX-999" does not exist in the Pipeline registry:
   - Navigate to the **Pipelines** section in the {Project} (if available)
   - Use the search functionality to search for "NoPipelineX-999"
   - Verify that no pipeline with this name appears in the search results
   - If any pipeline with a similar name exists, choose a different unique non-existent name
   - Confirm the selected non-existent pipeline name is truly not present in the system
7. Create a test agent for negative pipeline search testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Negative Pipeline Search"
     - Agent's description: "Test agent for verifying non-existent pipeline search behavior"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Negative Pipeline Search" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Click on the "Test Agent Negative Pipeline Search" agent from the agents list to open its details page
2. Wait for the agent details page to fully load
3. Navigate to **Configuration** tab within the agent details view
4. Scroll down to locate the **Toolkits** section
5. Locate the action buttons in the Toolkits section: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
6. Click the **+Pipeline** button to open the pipeline selection dialog
7. Wait for the pipeline selection dialog to load with search functionality
8. Locate the search input field in the pipeline selection dialog
9. Type "NoPipelineX-999" into the search field
10. Wait for the system to process the search query (allow 2-3 seconds for processing)
11. Observe the suggestions dropdown area below the search input field
12. Verify that no matching suggestions are displayed in the dropdown
13. Look for any system messages such as "No pipeline found", "No results", or similar feedback
14. Attempt to locate an "Add" button or similar action button in the dialog
15. Verify that the "Add" button is either not visible, disabled, or inactive
16. Confirm that no action is available to proceed with adding the non-existent pipeline
17. Try clicking in the dropdown area or pressing Enter to confirm no selection is possible
18. Observe the overall behavior and any error handling messages displayed by the system
19. Click **Cancel** or the close button to exit the pipeline selection dialog without making changes

### Expected Results

- The **+Pipeline** button is available and functional in the Toolkits section
- The pipeline selection dialog opens successfully with search functionality
- The search input field accepts the typed text "NoPipelineX-999" without errors
- The system processes the search input and finds no matching results
- No suggestions are displayed in the dropdown list after the search completes
- The system displays a clear "No pipeline found", "No results", or similar informative message
- The "Add" button is either not visible, disabled, or inactive due to no valid selection
- The UI prevents adding an entry with the non-existent pipeline name via the search mechanism
- No pipeline attachment occurs for the non-existent pipeline name
- The search interface remains functional and responsive for subsequent valid searches
- The dialog can be properly cancelled or closed without making changes
- No error states persist in the UI after cancelling the operation

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Negative Pipeline Search" agent in the agents list
   - Click on "Test Agent Negative Pipeline Search" agent to open its details page
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Negative Pipeline Search" to confirm
     deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Negative Pipeline Search" agent is removed from the agents list and is not present
2. Verify no residual data remains from the deleted agent
3. Confirm no unintended pipeline was created during the negative test scenario
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

--

## Test Case ID: TC-08-12

#### Test Case Name:

Negative — No matches for MCP search prevents attachment

#### Test Case Tags:

negative, search, mcp

#### Test Case Priority:

High

#### Test Case Description:

Verify that searching for a non-existent MCP yields no suggestions and the user cannot attach it via search.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure name "NoMCPX" does not exist in the MCP registry.

### Test Steps:

1. Click "+MCP".
2. Type "NoMCPX" into the search field.
3. Observe suggestions and attempt to select/add if any appear.

### Expected Results:

- No suggestions; UI indicates "No results"; add action is not available for "NoMCPX".

### Postconditions:

- None.

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
6. Verify that MCP name "NoMCPX-999" does not exist in the MCP registry:
   - Navigate to the **MCP** section in the {Project} (if available)
   - Use the search functionality to search for "NoMCPX-999"
   - Verify that no MCP instance with this name appears in the search results
   - If any MCP with a similar name exists, choose a different unique non-existent name
   - Confirm the selected non-existent MCP name is truly not present in the system
7. Create a test agent for negative MCP search testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Negative MCP Search"
     - Agent's description: "Test agent for verifying non-existent MCP search behavior"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Negative MCP Search" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Navigate to the **Agents** section in the {Project}
2. Click on the "Test Agent Negative MCP Search" agent row to open its configuration page
3. Switch to the **Configuration** tab if not already selected
4. Locate the **Toolkits** section with action buttons: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
5. Click the **+MCP** button to open the MCP attachment modal
6. Verify that the MCP search modal opens with:
   - Modal title indicating MCP selection/attachment functionality
   - Search input field for typing MCP names
   - Available MCPs list or search results area
   - Add/Attach action button (if any MCPs are found)
   - Cancel/Close button for closing the modal
7. In the MCP search input field, type the non-existent MCP name "NoMCPX-999"
8. Press **Enter** key or wait for the automatic search to execute
9. Verify that the search executes and processes the query for "NoMCPX-999"
10. Observe the search results area to confirm no matching MCPs are displayed
11. Verify that an appropriate empty state message is shown (e.g., "No MCPs found", "No matching results")
12. Check that the **Add** or **Attach** button is disabled, grayed out, or not present when no search results
    exist
13. Attempt to interact with the Add/Attach button (if visible) to verify it's non-functional
14. Try alternative non-existent MCP names to verify consistent empty search behavior
15. Clear the search input and verify that the search state resets appropriately
16. Close the MCP attachment modal by clicking the **Cancel** or **X** button

### Expected Results

- The MCP search modal opens successfully with proper UI elements displayed
- The search input field accepts the non-existent MCP name "NoMCPX-999" for search
- The search functionality executes properly for the entered non-existent MCP name
- The search results area displays an empty state with appropriate messaging (e.g., "No MCPs found matching
  your search", "No results available")
- No MCP entries appear in the search results for the non-existent name "NoMCPX-999"
- The **Add** or **Attach** button is disabled, hidden, or visually indicates that no action can be taken
- Attempts to interact with the Add/Attach button (if visible) have no effect or show appropriate feedback
- Alternative non-existent MCP names produce consistent empty search results
- The search input can be cleared and the interface resets to its initial state
- The modal can be closed without making any changes, returning to the agent configuration view
- The UI prevents adding an MCP entry with the non-existent MCP name via the search mechanism
- No MCP attachment occurs for the non-existent MCP name
- The search interface remains functional and responsive for subsequent valid searches
- The dialog can be properly cancelled or closed without making changes
- No error states persist in the UI after cancelling the operation

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Negative MCP Search" agent in the agents list
   - Click on "Test Agent Negative MCP Search" agent to open its details page
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Negative MCP Search" to confirm
     deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Negative MCP Search" agent is removed from the agents list and is not present
2. Verify no residual data remains from the deleted agent
3. Confirm no unintended MCP was created during the negative test scenario
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

--

## Test Case ID: TC-08-13

#### Test Case Name: Remove toolkit from agent (confirm delete/unlink)

#### Test Case Name:

Remove toolkit from agent (confirm delete/unlink)

#### Test Case Tags: positive, remove, unlink

#### Test Case Tags:

positive, remove, unlink

#### Test Case Priority: High

#### Test Case Priority:

High

#### Test Case Description: Verify removing/unlinking a toolkit from the agent via the Toolkits list and confirming in the confirmation dialog.

#### Test Case Description:

Verify removing/unlinking a toolkit from the agent via the Toolkits list and confirming in the confirmation
dialog.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure "Existing Toolkit A" is already attached to "Test Agent" for this test.

### Test Steps:

1.  In Toolkits list locate "Existing Toolkit A".
2.  Click the "Delete" button for that toolkit.
3.  In confirmation dialog click "Confirm" (or "Delete").

### Expected Results:

- The toolkit is removed from the agent Toolkits list.
- Success notification displayed.

### Postconditions:

- None.

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
6. Ensure a toolkit named "Test Toolkit Remove" is available for attachment:
   - Navigate to the **Toolkits** section in the {Project} (if available)
   - Verify "Test Toolkit Remove" exists in the toolkits list
   - If not present, create it using the **+ Create** button with required fields
   - Confirm the toolkit is active and available for use
7. Create a test agent for toolkit removal testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Toolkit Remove"
     - Agent's description: "Test agent for verifying toolkit removal functionality"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Toolkit Remove" agent in the agents list
   - Verify the agent appears in the agents table
8. Attach the toolkit to the agent for removal testing:
   - Click on the "Test Agent Toolkit Remove" agent row to open its configuration page
   - Switch to the **Configuration** tab if not already selected
   - Locate the **Toolkits** section with action buttons: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
   - Click the **+Toolkit** button to open the toolkit attachment modal
   - Search for and select "Test Toolkit Remove" from the available toolkits
   - Click the **Add** or **Attach** button to attach the toolkit to the agent
   - Verify "Test Toolkit Remove" appears in the agent's toolkits list

### Test Steps

1. Navigate to the **Agents** section in the {Project}
2. Click on the "Test Agent Toolkit Remove" agent row to open its configuration page
3. Switch to the **Configuration** tab if not already selected
4. Locate the **Toolkits** section and verify "Test Toolkit Remove" is present in the toolkits list
5. In the toolkits list, locate the "Test Toolkit Remove" toolkit entry
6. Look for the remove/delete action for the "Test Toolkit Remove" toolkit (this may be a trash icon, X
   button, or "Remove" button)
7. Click the **Delete** or **Remove** button for the "Test Toolkit Remove" toolkit
8. Verify that a confirmation dialog appears asking to confirm the removal/deletion
9. Review the confirmation dialog content to ensure it properly identifies the toolkit being removed
10. In the confirmation dialog, click the **Confirm**, **Delete**, or **Remove** button to proceed with the
    removal
11. Wait for the removal operation to complete
12. Verify that a success notification or message is displayed indicating the toolkit was removed successfully
13. Check that "Test Toolkit Remove" is no longer present in the agent's toolkits list
14. Verify the toolkits list updates properly without the removed toolkit
15. Confirm that other toolkits (if any) remain unaffected by the removal operation
16. Refresh the page or navigate away and back to verify the removal persists

### Expected Results

- The **Delete** or **Remove** button for the "Test Toolkit Remove" toolkit is clearly visible and clickable
- Clicking the remove button triggers a confirmation dialog that properly identifies the toolkit being removed
- The confirmation dialog displays appropriate messaging about the removal action
- Confirming the removal in the dialog executes the removal operation successfully
- A success notification, toast message, or indicator confirms that the toolkit was removed successfully
- The "Test Toolkit Remove" toolkit is immediately removed from the agent's toolkits list
- The toolkits list updates dynamically to reflect the removal without requiring a page refresh
- Other attached toolkits (if any) remain in the list and are not affected by the removal
- The agent's configuration remains intact except for the removed toolkit
- The removal operation completes without errors or system issues
- The UI remains responsive and functional after the toolkit removal
- Navigation and other features continue to work properly after the removal
- The removal persists when refreshing the page or navigating away and back
- No residual references to the removed toolkit remain in the agent configuration

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Toolkit Remove" agent in the agents list
   - Click on "Test Agent Toolkit Remove" agent to open its details page
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Toolkit Remove" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Toolkit Remove" agent is removed from the agents list and is not present
2. Clean up test data by removing the test toolkit (if created):
   - Navigate to the **Toolkits** section in the {Project} (if available)
   - Locate the created "Test Toolkit Remove" toolkit in the toolkits list
   - Click on the toolkit menu (3 dots or ellipsis) next to the "Test Toolkit Remove" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the "Test Toolkit Remove" toolkit is removed from the toolkits list
3. Verify no residual data remains from the deleted agent and toolkit
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

--

## Test Case ID: TC-08-14

#### Test Case Name: Cancel remove toolkit

#### Test Case Tags: negative, remove

#### Test Case Name:

Cancel remove toolkit

#### Test Case Tags:

negative, remove

#### Test Case Priority: Medium

#### Test Case Priority:

Medium

#### Test Case Description: Verify that canceling the remove/unlink confirmation keeps the toolkit attached.

#### Test Case Description:

Verify that canceling the remove/unlink confirmation keeps the toolkit attached.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure at least one toolkit is attached to the agent before running this test.

### Test Steps:

1.  Click "Delete" button on an attached toolkit.
2.  In the confirmation dialog click "Cancel".

### Expected Results:

- Toolkit remains attached; no deletion occurs.

### Postconditions:

- None.

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
6. Ensure a toolkit named "Test Toolkit Cancel Remove" is available for attachment:
   - Navigate to the **Toolkits** section in the {Project} (if available)
   - Verify "Test Toolkit Cancel Remove" exists in the toolkits list
   - If not present, create it using the **+ Create** button with required fields
   - Confirm the toolkit is active and available for use
7. Create a test agent for toolkit removal cancellation testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Toolkit Cancel"
     - Agent's description: "Test agent for verifying toolkit removal cancellation functionality"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Toolkit Cancel" agent in the agents list
   - Verify the agent appears in the agents table
8. Attach the toolkit to the agent for removal cancellation testing:
   - Click on the "Test Agent Toolkit Cancel" agent row to open its configuration page
   - Switch to the **Configuration** tab if not already selected
   - Locate the **Toolkits** section with action buttons: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
   - Click the **+Toolkit** button to open the toolkit attachment modal
   - Search for and select "Test Toolkit Cancel Remove" from the available toolkits
   - Click the **Add** or **Attach** button to attach the toolkit to the agent
   - Verify "Test Toolkit Cancel Remove" appears in the agent's toolkits list

### Test Steps

1. Navigate to the **Agents** section in the {Project}
2. Click on the "Test Agent Toolkit Cancel" agent row to open its configuration page
3. Switch to the **Configuration** tab if not already selected
4. Locate the **Toolkits** section and verify "Test Toolkit Cancel Remove" is present in the toolkits list
5. In the toolkits list, locate the "Test Toolkit Cancel Remove" toolkit entry
6. Look for the remove/delete action for the "Test Toolkit Cancel Remove" toolkit (this may be a trash icon, X
   button, or "Remove" button)
7. Click the **Delete** or **Remove** button for the "Test Toolkit Cancel Remove" toolkit
8. Verify that a confirmation dialog appears asking to confirm the removal/deletion
9. Review the confirmation dialog content to ensure it properly identifies the toolkit being removed
10. In the confirmation dialog, locate the **Cancel** button (or **X** close button)
11. Click the **Cancel** button to cancel the removal operation
12. Verify that the confirmation dialog closes without performing any removal action
13. Check that "Test Toolkit Cancel Remove" remains present in the agent's toolkits list
14. Verify the toolkits list shows the toolkit as still attached and unchanged
15. Confirm that no success notification or removal message is displayed
16. Test the cancellation process multiple times to ensure consistent behavior

### Expected Results

- The **Delete** or **Remove** button for the "Test Toolkit Cancel Remove" toolkit is clearly visible and
  clickable
- Clicking the remove button triggers a confirmation dialog that properly identifies the toolkit being removed
- The confirmation dialog displays appropriate messaging about the removal action and includes a **Cancel**
  button
- The **Cancel** button in the confirmation dialog is clearly visible and functional
- Clicking the **Cancel** button closes the confirmation dialog without performing any removal action
- No removal operation is executed when the cancellation is confirmed
- The "Test Toolkit Cancel Remove" toolkit remains present in the agent's toolkits list after cancellation
- The toolkit attachment status remains unchanged - it stays attached to the agent
- No success notification, removal message, or completion indicator is displayed after cancellation
- The toolkits list continues to show the toolkit as properly attached
- The agent's configuration remains completely intact with no changes
- Other attached toolkits (if any) remain unaffected by the cancelled removal attempt
- The UI remains responsive and functional after the cancellation
- The cancellation can be repeated multiple times with consistent behavior
- No system errors or issues occur during the cancellation process

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Toolkit Cancel" agent in the agents list
   - Click on "Test Agent Toolkit Cancel" agent to open its details page
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Toolkit Cancel" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Toolkit Cancel" agent is removed from the agents list and is not present
2. Clean up test data by removing the test toolkit (if created):
   - Navigate to the **Toolkits** section in the {Project} (if available)
   - Locate the created "Test Toolkit Cancel Remove" toolkit in the toolkits list
   - Click on the toolkit menu (3 dots or ellipsis) next to the "Test Toolkit Cancel Remove" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the "Test Toolkit Cancel Remove" toolkit is removed from the toolkits list
3. Verify no residual data remains from the deleted agent and toolkit
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

--

## Test Case ID: TC-08-15

#### Test Case Name: Modify toolkit configuration from agent (open toolkit edit)

#### Test Case Name:

Modify toolkit configuration from agent (open toolkit edit)

#### Test Case Tags: positive, modify, toolkit

#### Test Case Tags:

positive, modify, toolkit

#### Test Case Priority: Medium

#### Test Case Priority:

Medium

#### Test Case Description: Verify that the tester can navigate from the agent's Toolkits list to the toolkit edit page, change a configurable property, save, and observe updated behavior/metadata for the toolkit when reloaded.

#### Test Case Description:

Verify that the tester can navigate from the agent's Toolkits list to the toolkit edit page, change a
configurable property, save, and observe updated behavior/metadata for the toolkit when reloaded.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure at least one attached toolkit is editable for configuration changes.

### Test Steps:

1.  From Toolkits list click the toolkit's "Open toolkit" button on right top to open toolkit configuration.
2.  Modify a non-destructive property (e.g., display name or description) or an allowed configuration field.
3.  Click "Save".
4.  Return to agent Toolkits list and refresh.

### Expected Results:

- Changes persist and are reflected in toolkit metadata displayed under agent.

### Postconditions:

- Optionally revert changes in cleanup.

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
6. Create a toolkit with modifiable configuration for testing:
   - Navigate to the **Toolkits** section in the {Project}
   - Click the **+ Create** button to create a new toolkit
   - Fill in required fields:
     - Toolkit name: "Editable Test Toolkit"
     - Toolkit description: "Test toolkit for configuration modification testing"
   - Configure toolkit with editable properties (description, settings, etc.)
   - Click the **Save** button to create the toolkit
   - Verify "Editable Test Toolkit" appears in the toolkits list
7. Create a test agent for toolkit modification testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Toolkit Modify"
     - Agent's description: "Test agent for verifying toolkit modification functionality"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Toolkit Modify" agent in the agents list
   - Verify the agent appears in the agents table
8. Attach the editable toolkit to the agent:
   - Click on the "Test Agent Toolkit Modify" agent row to open its configuration page
   - Switch to the **Configuration** tab if not already selected
   - Locate the **Toolkits** section with action buttons: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
   - Click the **+Toolkit** button to open the toolkit attachment modal
   - Search for and select "Editable Test Toolkit" from the available toolkits
   - Click the **Add** or **Attach** button to attach the toolkit to the agent
   - Verify "Editable Test Toolkit" appears in the agent's toolkits list

### Test Steps

1. Navigate to the **Agents** section in the {Project}
2. Click on the "Test Agent Toolkit Modify" agent row to open its configuration page
3. Switch to the **Configuration** tab if not already selected
4. Locate the **Toolkits** section and verify "Editable Test Toolkit" is present in the toolkits list
5. In the toolkits list, locate the "Editable Test Toolkit" entry
6. Look for an "Edit", "Open", or configuration button/link for the "Editable Test Toolkit" (this may be a
   pencil icon, settings icon, or "Open toolkit" button)
7. Click the **Edit** or **Open toolkit** button to navigate to the toolkit's configuration page
8. Verify that the toolkit configuration page opens with editable fields and settings
9. Locate a non-destructive editable property such as:
   - Toolkit description field
   - Display name field
   - Configuration parameters or settings
   - Optional metadata fields
10. Record the current value of the selected field for verification purposes
11. Modify the selected field with a new value (e.g., update description from "Test toolkit for configuration
    modification testing" to "Updated test toolkit for configuration modification testing")
12. Verify that the change is properly reflected in the input field
13. Click the **Save** button to save the modifications
14. Wait for a success confirmation message or notification indicating the changes were saved
15. Navigate back to the **Agents** section in the {Project}
16. Click on the "Test Agent Toolkit Modify" agent row to return to its configuration page
17. Switch to the **Configuration** tab and locate the **Toolkits** section
18. Verify that the modified toolkit displays the updated information/metadata
19. Optionally refresh the page to confirm persistence of changes

### Expected Results

- The **Edit** or **Open toolkit** button for the "Editable Test Toolkit" is clearly visible and functional
- Clicking the edit button successfully navigates to the toolkit's configuration page
- The toolkit configuration page displays proper editing interface with accessible form fields
- The editable fields (description, display name, settings) are clearly identified and modifiable
- Changes to non-destructive properties can be entered and are properly reflected in the form
- The **Save** button is functional and processes the modifications successfully
- A success confirmation message, notification, or indicator confirms that changes were saved
- Navigation back to the agent configuration page works properly
- The modified toolkit information is reflected in the agent's toolkits list
- Updated metadata, descriptions, or configuration values are displayed correctly
- Changes persist when refreshing the page or navigating away and back
- The toolkit continues to function properly after configuration modifications
- No errors occur during the modification and saving process
- The agent-toolkit relationship remains intact after toolkit modifications
- Other attached toolkits (if any) are not affected by the modification of the selected toolkit

### Postconditions

1. Optionally revert the toolkit changes made during testing:
   - Navigate to the **Toolkits** section in the {Project}
   - Click on the "Editable Test Toolkit" to open its configuration page
   - Revert any modifications made during the test (restore original description or settings)
   - Click the **Save** button to save the reverted changes
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Toolkit Modify" agent in the agents list
   - Click on "Test Agent Toolkit Modify" agent to open its details page
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Toolkit Modify" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Toolkit Modify" agent is removed from the agents list and is not present
3. Clean up test data by removing the test toolkit:
   - Navigate to the **Toolkits** section in the {Project}
   - Locate the created "Editable Test Toolkit" toolkit in the toolkits list
   - Click on the toolkit menu (3 dots or ellipsis) next to the "Editable Test Toolkit" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the "Editable Test Toolkit" toolkit is removed from the toolkits list
4. Verify no residual data remains from the deleted agent and toolkit
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

--

## Test Case ID: TC-08-16

## Test Case ID: TC-08-16

#### Test Case Name: Negative — Cannot attach toolkit when backend validation fails (e.g., missing required keys)

#### Test Case Name:

Negative — Cannot attach toolkit when backend validation fails (e.g., missing required keys)

#### Test Case Tags: negative, validation, toolkit

#### Test Case Tags:

negative, validation, toolkit

#### Test Case Priority: High

#### Test Case Priority:

High

#### Test Case Description: Verify that if a toolkit attachment requires backend validation (for example, a connector requires credentials or config) and validation fails, the UI shows a descriptive error and prevents attachment.

#### Test Case Description:

Verify that if a toolkit attachment requires backend validation (for example, a connector requires credentials
or config) and validation fails, the UI shows a descriptive error and prevents attachment.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure a toolkit that requires additional configuration (e.g., connector needing credentials) exists to
  simulate validation failure.

### Test Steps:

1.  Attempt to add the toolkit that requires validation via search/dropdown.
2.  Confirm add.

### Expected Results:

- Attachment is rejected and an inline error is displayed explaining reason (e.g., "Missing configuration: API
  key").

### Postconditions:

- None.

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
6. Create a toolkit that requires additional configuration for validation failure testing:
   - Navigate to the **Toolkits** section in the {Project}
   - Click the **+ Create** button to create a new toolkit
   - Select a toolkit type that requires additional configuration (e.g., Database connector, API connector)
   - Fill in basic required fields but intentionally omit critical configuration (e.g., API keys, credentials)
   - Name the toolkit: "Invalid Config Toolkit"
   - Save the incomplete toolkit to simulate a validation failure scenario
   - Verify "Invalid Config Toolkit" appears in the toolkits list but may show as incomplete or requiring
     configuration
7. Create a test agent for validation failure testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Validation Fail"
     - Agent's description: "Test agent for verifying toolkit validation failure behavior"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Validation Fail" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Navigate to the **Agents** section in the {Project}
2. Click on the "Test Agent Validation Fail" agent row to open its configuration page
3. Switch to the **Configuration** tab if not already selected
4. Locate the **Toolkits** section with action buttons: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
5. Click the **+Toolkit** button to open the toolkit attachment modal
6. In the toolkit search/dropdown, locate "Invalid Config Toolkit"
7. Select "Invalid Config Toolkit" from the available options
8. Click the **Add** or **Attach** button to attempt adding the toolkit to the agent
9. Wait for the system to process the attachment request and perform backend validation
10. Observe the system response and any error messages displayed
11. Look for inline error messages, validation warnings, or failure notifications
12. Check if the toolkit appears in the agent's toolkits list despite the validation failure
13. Verify that the error message is descriptive and explains the specific validation issue
14. Attempt to dismiss or acknowledge the error message if applicable
15. Try alternative approaches to confirm the validation consistently fails
16. Check the overall system behavior and UI state after the validation failure

### Expected Results

- The toolkit attachment modal opens successfully and displays "Invalid Config Toolkit" as available for
  selection
- The system allows selection of "Invalid Config Toolkit" from the available options
- Clicking **Add** or **Attach** initiates the backend validation process
- The backend validation detects the missing or invalid configuration and fails appropriately
- A clear, descriptive error message is displayed explaining the specific validation failure (e.g., "Missing
  configuration: API key required", "Invalid credentials provided", "Required database connection parameters
  missing")
- The toolkit attachment is rejected and does not appear in the agent's toolkits list
- The error message is displayed inline or as a notification that is easily visible to the user
- The UI remains in a functional state after the validation failure, allowing for retry or cancellation
- No partial or inconsistent attachment state occurs in the system
- The user can dismiss the error message and attempt other toolkit attachments
- The system provides guidance on how to resolve the validation issue (if applicable)
- Other toolkit attachments continue to work normally after the validation failure
- The validation error handling does not cause system instability or UI corruption

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Validation Fail" agent in the agents list
   - Click on "Test Agent Validation Fail" agent to open its details page
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Validation Fail" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Validation Fail" agent is removed from the agents list and is not present
2. Clean up test data by removing the test toolkit:
   - Navigate to the **Toolkits** section in the {Project}
   - Locate the created "Invalid Config Toolkit" toolkit in the toolkits list
   - Click on the toolkit menu (3 dots or ellipsis) next to the "Invalid Config Toolkit" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the "Invalid Config Toolkit" toolkit is removed from the toolkits list
3. Verify no residual data remains from the deleted agent and toolkit
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

--

## Test Case ID: TC-08-17

## Test Case ID: TC-08-17

#### Test Case Name: Interruption — Create new toolkit flow interrupted by navigation away (browser back/close) and resumed

#### Test Case Name:

Interruption — Create new toolkit flow interrupted by navigation away (browser back/close) and resumed

#### Test Case Tags: interruption, create, toolkit

#### Test Case Tags:

interruption, create, toolkit

#### Test Case Priority: Medium

#### Test Case Priority:

Medium

#### Test Case Description: Verify behavior when user starts "+Create new" toolkit flow, fills fields, then navigates away (close tab/back) and later resumes; check for draft/autosave or that no partial toolkit is created.

#### Test Case Description:

Verify behavior when user starts "+Create new" toolkit flow, fills fields, then navigates away (close
tab/back) and later resumes; check for draft/autosave or that no partial toolkit is created.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".

### Test Steps:

1.  Click "+Toolkit" → "+Create new".
2.  Select toolkit type and fill required fields.
3.  Simulate interruption: click browser back, close tab, or navigate to another page without saving.
4.  Re-open toolkit creation page for the same type (or start from "+Create new" again).

### Expected Results:

- No half-created toolkit is attached to the agent.

### Postconditions:

- None.

### Notes:

- Test variations: network loss during save (see next test case).

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
6. Create a test agent for interruption testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Interruption"
     - Agent's description: "Test agent for toolkit creation interruption testing"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Interruption" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Navigate to the **Agents** section in the {Project}
2. Click on the "Test Agent Interruption" agent row to open its configuration page
3. Switch to the **Configuration** tab if not already selected
4. Locate the **Toolkits** section with action buttons: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
5. Click the **+Toolkit** button to open the toolkit selection dialog
6. In the toolkit dialog, locate and click the **+Create new** button to initiate toolkit creation
7. Wait for the toolkit creation page to load completely
8. On the toolkit creation page, select Toolkit Type: **Artifact**
9. Partially fill in the required fields for Artifact toolkit:
   - Click **PgVector Configuration** dropdown and select **elitea-pgvector**
   - Click **Embedding Model** dropdown and select **text-embedding-3-large**
   - In **Bucket** field enter "interrupted-toolkit-test"
10. Simulate interruption by one of the following methods:
    - Click the browser's **Back** button to navigate away
    - Close the browser tab (if multiple tabs are open)
    - Navigate to another page/section without saving
    - Use keyboard shortcut to navigate to a different page
11. Wait for the navigation to complete and verify the toolkit creation page is left
12. Re-navigate to the agent configuration:
    - Return to the **Agents** section in the {Project}
    - Click on the "Test Agent Interruption" agent row to open its configuration page
    - Switch to the **Configuration** tab
13. Check the agent's **Toolkits** section for any unexpected toolkit entries
14. Verify the global **Toolkits** section for any partially created toolkits
15. Attempt to restart the toolkit creation process:
    - Click the **+Toolkit** button again
    - Click the **+Create new** button again
    - Observe the state of the toolkit creation form

### Expected Results

- The toolkit creation page opens successfully and accepts the partial form data entry
- The interruption methods (back button, tab close, navigation away) work as expected
- After interruption, the toolkit creation process is properly aborted
- No partial or half-created toolkit "interrupted-toolkit-test" appears in the global toolkits list
- The "Test Agent Interruption" agent's toolkits list remains empty or unchanged
- No incomplete toolkit attachment occurs on the agent
- When restarting the toolkit creation process, the form is in a clean initial state
- No previously entered data persists in the new toolkit creation form (unless draft/autosave is intended)
- The system handles the interruption gracefully without errors or inconsistent states
- No system resources are left in an incomplete state
- If draft/autosave functionality exists, it behaves as designed (saves draft or discards appropriately)
- The user can successfully complete a new toolkit creation after the interruption
- No background processes continue running after the interruption
- The UI remains functional and responsive after resuming the creation process

### Postconditions

1. Clean up any residual test data if created during interruption:
   - Navigate to the **Toolkits** section in the {Project}
   - Search for any toolkit with name containing "interrupted-toolkit-test"
   - If any partial toolkit exists, delete it using the toolkit menu **Delete** option
   - Confirm no residual toolkit data remains in the system
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Interruption" agent in the agents list
   - Click on "Test Agent Interruption" agent to open its details page
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Interruption" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Interruption" agent is removed from the agents list and is not present
3. Verify no residual data remains from the interruption test scenario
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test variations: network loss during save (see next test case)
- Verify behavior with different interruption methods (back button, tab close, navigation)
- If autosave/draft functionality exists, validate it works as intended

--

## Test Case ID: TC-08-18

## Test Case ID: TC-08-18

#### Test Case Name: Interruption — Network or server error during add/create (retry/cleanup)

#### Test Case Name:

Interruption — Network or server error during add/create (retry/cleanup)

#### Test Case Tags: interruption, error-handling, retry

#### Test Case Tags:

interruption, error-handling, retry

#### Test Case Priority: High

#### Test Case Priority:

High

#### Test Case Description: Simulate a network/server error during toolkit creation or attachment and verify UI behavior, retries, and cleanup.

#### Test Case Description:

Simulate a network/server error during toolkit creation or attachment and verify UI behavior, retries, and
cleanup.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".

### Test Steps:

1.  Start "+Create new" or select existing toolkit and click "Add".
2.  Simulate server error (e.g., 500) or network offline during the save/attach request.
3.  Observe UI error handling (retry option, informative message).
4.  Restore network and retry operation.

### Expected Results:

- The UI shows an informative error and does not leave the agent in inconsistent partially-linked state.
- After network restoration and retry, the operation can succeed or the user can re-attempt.

### Postconditions:

- None.

### Notes:

- Capture network traces and API responses for engineering review.

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
6. Create a test toolkit for network error testing:
   - Navigate to the **Toolkits** section in the {Project}
   - Click the **+ Create** button to create a new toolkit
   - Select **Artifact** as the toolkit type
   - Fill in required fields and create toolkit named "Network Test Toolkit"
   - Verify "Network Test Toolkit" appears in the toolkits list
7. Create a test agent for network error testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Network Error"
     - Agent's description: "Test agent for network error handling during toolkit operations"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Network Error" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Navigate to the **Agents** section in the {Project}
2. Click on the "Test Agent Network Error" agent row to open its configuration page
3. Switch to the **Configuration** tab if not already selected
4. Locate the **Toolkits** section with action buttons: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
5. **Test Scenario A - Network Error During Existing Toolkit Attachment:**
   - Click the **+Toolkit** button to open the toolkit selection dialog
   - Search for and select "Network Test Toolkit" from the available toolkits
   - Simulate network error by disconnecting internet connection or using browser dev tools to simulate
     network failure
   - Click the **Add** or **Attach** button to attempt adding the toolkit
   - Observe the UI response during the network failure
   - Note any error messages, loading indicators, or timeout behaviors
6. **Test Scenario B - Network Error During New Toolkit Creation:**
   - With network still disconnected, click the **+Toolkit** button
   - Click the **+Create new** button to initiate toolkit creation
   - Fill in required fields for a new toolkit:
     - Select Toolkit Type: **Artifact**
     - Enter **Bucket** field: "network-error-test-toolkit"
   - Click the **Save** button to attempt creating the toolkit
   - Observe the UI behavior during the save operation with network issues
7. **Test Network Recovery and Retry:**
   - Restore the network connection (reconnect internet or restore network in dev tools)
   - Look for retry options, refresh buttons, or automatic retry mechanisms in the UI
   - Attempt to retry the failed operation (toolkit attachment or creation)
   - Click any **Retry** buttons or repeat the attachment/creation process
   - Verify that the operation can now succeed with restored network connectivity

### Expected Results

- The UI handles network errors gracefully during both toolkit attachment and creation processes
- Clear, informative error messages are displayed when network failures occur (e.g., "Network error occurred",
  "Unable to connect to server", "Request timed out")
- The system does not leave the agent in an inconsistent or partially-linked state during network failures
- Loading indicators or progress states are properly managed during network interruptions
- No partial toolkit attachments occur when network errors prevent completion
- No half-created toolkits appear in the global toolkits list when creation fails due to network issues
- The UI provides retry options, refresh mechanisms, or guidance for handling network failures
- Error states are properly cleared when network connectivity is restored
- After network restoration, retry operations complete successfully
- Previously failed operations can be successfully completed once network is restored
- The agent's toolkit list remains in a consistent state throughout the network error scenario
- System resources and API calls are properly cleaned up when network operations fail
- The UI remains responsive and functional after network errors are resolved
- Appropriate timeouts are implemented to prevent indefinite waiting during network issues

### Postconditions

1. Clean up any residual test data from network error scenarios:
   - Navigate to the **Toolkits** section in the {Project}
   - Search for any toolkit with name containing "network-error-test-toolkit"
   - If any partial toolkit exists, delete it using the toolkit menu **Delete** option
   - Verify no incomplete toolkit data remains in the system
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Network Error" agent in the agents list
   - Click on "Test Agent Network Error" agent to open its details page
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Network Error" to confirm deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Network Error" agent is removed from the agents list and is not present
3. Clean up test data by removing the test toolkit:
   - Navigate to the **Toolkits** section in the {Project}
   - Locate the created "Network Test Toolkit" toolkit in the toolkits list
   - Click on the toolkit menu (3 dots or ellipsis) next to the "Network Test Toolkit" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the "Network Test Toolkit" toolkit is removed from the toolkits list
4. Verify no residual data remains from the network error test scenarios
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Capture network traces and API responses for engineering review
- Test with different types of network failures (timeout, 500 error, connection refused)
- Verify retry mechanisms work for both automatic and manual retry scenarios

--

## Test Case ID: TC-08-19

## Test Case ID: TC-08-19

#### Test Case Name: Rare case — Duplicate attachment prevention (same toolkit linked twice)

#### Test Case Name:

Rare case — Duplicate attachment prevention (same toolkit linked twice)

#### Test Case Tags: edge-case, duplicate, validation

#### Test Case Tags:

edge-case, duplicate, validation

#### Test Case Priority: Medium

#### Test Case Priority:

Medium

#### Test Case Description: Verify the UI/backend prevents linking the same toolkit twice to the same agent and shows an appropriate message.

#### Test Case Description:

Verify the UI/backend prevents linking the same toolkit twice to the same agent and shows an appropriate
message.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure "Existing Toolkit A" is attached to the agent prior to running this test.

### Test Steps:

1.  Attempt to add "Existing Toolkit A" again via search or dropdown.
2.  Observe behavior/validation.

### Expected Results:

- The UI blocks duplicate and added toolkit is not listed in dropdown

### Postconditions:

- None.

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
6. Create a test toolkit for duplicate attachment testing:
   - Navigate to the **Toolkits** section in the {Project}
   - Click the **+ Create** button to create a new toolkit
   - Select **Artifact** as the toolkit type
   - Click **PgVector Configuration** dropdown and select **elitea-pgvector**
   - Click **Embedding Model** dropdown and select **text-embedding-3-large**
   - In **Bucket** field enter "Duplicate Test Toolkit"
   - Click **Save** button to create the toolkit
   - Verify that "Duplicate Test Toolkit" appears in the toolkits list
7. Create a test agent for duplicate attachment prevention testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button to create a new agent
   - Fill in required fields:
     - Agent's name: "Test Agent Duplicate Prevention"
     - Agent's description: "Test agent for duplicate toolkit attachment prevention"
   - Click the **Save** button to create the agent
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Duplicate Prevention" agent in the agents list
   - Verify the agent appears in the agents table

### Test Steps

1. Navigate to the **Agents** section in the {Project}
2. Click on the "Test Agent Duplicate Prevention" agent row to open its configuration page
3. Switch to the **Configuration** tab if not already selected
4. Locate the **Toolkits** section with action buttons: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
5. **First Attachment - Add the toolkit initially:**
   - Click the **+Toolkit** button to open the toolkit selection dialog
   - Search for and select "Duplicate Test Toolkit" from the available toolkits
   - Click the **Add** or **Attach** button to attach the toolkit to the agent
   - Wait for the operation to complete
   - Verify that "Duplicate Test Toolkit" appears in the agent's toolkits list
   - Click the **Save** button to persist the agent configuration changes
6. **Second Attachment Attempt - Try to add the same toolkit again:**
   - Click the **+Toolkit** button again to open the toolkit selection dialog
   - Search for "Duplicate Test Toolkit" in the toolkit search field
   - Observe whether "Duplicate Test Toolkit" appears in the search results or dropdown
   - If it appears, attempt to select it again
   - If it appears and is selectable, try to click the **Add** or **Attach** button
   - Observe any validation messages, error notifications, or system behavior
   - Check if the system prevents the duplicate attachment
7. **Alternative Duplicate Prevention Testing:**
   - Try different approaches to attach the same toolkit (direct selection, search, etc.)
   - Verify the system consistently prevents duplicate attachments regardless of the method used
   - Check that the agent's toolkits list does not show duplicate entries

### Expected Results

- The first attachment of "Duplicate Test Toolkit" completes successfully and the toolkit appears in the
  agent's toolkits list
- The agent configuration is properly saved with the initial toolkit attachment
- When attempting to add the same toolkit a second time, the system prevents the duplicate attachment through
  one of the following methods:
  - "Duplicate Test Toolkit" does not appear in the search results or dropdown list for subsequent additions
  - "Duplicate Test Toolkit" appears in the search but is disabled, grayed out, or marked as already attached
  - If selectable, clicking **Add** displays a clear validation message like "This toolkit is already attached
    to this agent" or "Duplicate toolkit attachment prevented"
  - The system blocks the duplicate attachment and no second entry appears in the agent's toolkits list
- The agent's toolkits list continues to show only one instance of "Duplicate Test Toolkit"
- No duplicate entries, multiple instances, or inconsistent state occurs in the agent's configuration
- The duplicate prevention mechanism works consistently across different attachment methods (search, dropdown,
  direct selection)
- Error messages or validation feedback are clear and informative to the user
- The system remains stable and functional after preventing duplicate attachments
- Other toolkit attachments continue to work normally after the duplicate prevention occurs

### Postconditions

1. Clean up test data by removing the toolkit association:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button to display agents in table format
   - Locate the created "Test Agent Duplicate Prevention" agent in the agents list
   - Click on "Test Agent Duplicate Prevention" agent to open its details page
   - Navigate to the **Configuration** tab
   - Locate the **Toolkits** section and find "Duplicate Test Toolkit" in the Toolkits list
   - Click the **Remove toolkit** button (trash icon) next to the "Duplicate Test Toolkit" entry
   - In the opened **Remove toolkit** confirmation window, click **Remove** button
   - Verify that "Duplicate Test Toolkit" is removed from the agent's Toolkits list
   - Click the **Save** button to persist the changes
2. Clean up test data by deleting the created agent:
   - Click the **Delete Agent** button in the top right corner of the agent details page
   - In the confirmation modal dialog, enter the agent's name "Test Agent Duplicate Prevention" to confirm
     deletion
   - Click the **Delete** button to confirm the deletion
   - Navigate back to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Verify the "Test Agent Duplicate Prevention" agent is removed from the agents list and is not present
3. Clean up test data by deleting the created toolkit:
   - Navigate to the **Toolkits** section in the {Project}
   - Locate the created "Duplicate Test Toolkit" toolkit in the toolkits list
   - Click on the toolkit menu (3 dots or ellipsis) next to the "Duplicate Test Toolkit" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the "Duplicate Test Toolkit" toolkit is removed from the toolkits list
4. Verify no residual data remains from the deleted agent and toolkit
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

--

## Test Case ID: TC-08-20

## Test Case ID: TC-08-20

#### Test Case Name: Rare case — Role/permission prevents adding/removing toolkits

#### Test Case Name:

Rare case — Role/permission prevents adding/removing toolkits

#### Test Case Tags: edge-case, permissions, negative

#### Test Case Tags:

edge-case, permissions, negative

#### Test Case Priority: High

#### Test Case Priority:

High

#### Test Case Description: Verify that a user without appropriate permissions cannot add/remove toolkits and receives proper authorization error or disabled controls.

#### Test Case Description:

Verify that a user without appropriate permissions cannot add/remove toolkits and receives proper
authorization error or disabled controls.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has only viewer permission

### Test Steps:

1.  Log in with limited-permission user.
2.  Open Test Agent → Toolkits.
3.  Attempt to click "+Toolkit", "+MCP", "+Agent", or "+Pipeline" and perform add/remove flows.

### Expected Results:

- Add/remove controls are disabled or attempts return clear authorization error messages.

### Postconditions:

- None.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials for a user with limited permissions
3. User logs in with restricted {Username} / {Password} (user with viewer-only or limited permissions)
4. User switches to {Project} (sidebar project switcher)
5. User has limited permissions (does NOT have models.applications.version.update,
   models.applications.tools.create, models.applications.toolkit_validator.check, and other toolkit
   modification permissions)
6. Ensure a test agent exists for permission testing:
   - If possible, have an administrator create a test agent named "Test Agent Permissions"
   - Alternatively, use an existing agent in the project for testing
   - Verify the agent is accessible to the limited-permission user for viewing

### Test Steps

1. Navigate to the **Agents** section in the {Project} as the limited-permission user
2. Locate the "Test Agent Permissions" agent (or available test agent) in the agents list
3. Click on the agent to open its configuration page
4. Switch to the **Configuration** tab if not already selected
5. Locate the **Toolkits** section and observe the available controls
6. **Test Add Controls Permissions:**
   - Look for the action buttons: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
   - Verify if these buttons are visible, enabled, or disabled for the limited-permission user
   - If visible, attempt to click the **+Toolkit** button
   - Observe any error messages, permission warnings, or system behavior
   - If a dialog opens, attempt to proceed with toolkit attachment
   - Note any authorization errors or blocked operations
7. **Test Remove Controls Permissions:**
   - Look for any existing toolkits attached to the agent
   - If toolkits are present, look for remove/delete buttons (trash icons) next to toolkit entries
   - Verify if remove buttons are visible, enabled, or disabled
   - If visible, attempt to click a **Remove toolkit** button
   - Observe any error messages, permission warnings, or system behavior
   - If a confirmation dialog opens, attempt to proceed with toolkit removal
   - Note any authorization errors or blocked operations
8. **Test Other Modification Operations:**
   - Attempt to modify agent configuration or save changes
   - Test access to other modification features in the agent configuration
   - Verify consistent permission enforcement across all toolkit-related operations

### Expected Results

- The limited-permission user can view the agent and its configuration but cannot modify toolkit attachments
- Add controls ("+Toolkit", "+MCP", "+Agent", "+Pipeline" buttons) are either:
  - Not visible/hidden for users without appropriate permissions
  - Visible but disabled/grayed out to indicate lack of permissions
  - Visible but clicking them displays clear authorization error messages
- Remove controls (delete/trash icons next to toolkits) are either:
  - Not visible/hidden for users without remove permissions
  - Visible but disabled/grayed out to indicate lack of permissions
  - Visible but clicking them displays clear authorization error messages
- If permission errors occur, they display clear, informative messages such as:
  - "You do not have permission to add toolkits to this agent"
  - "Insufficient permissions to modify agent configuration"
  - "Access denied: toolkit modification requires additional permissions"
- The user interface clearly indicates which operations are restricted due to permissions
- No toolkit addition or removal operations succeed for the limited-permission user
- The agent's configuration remains unchanged despite any attempted modifications
- The system maintains security by preventing unauthorized toolkit modifications
- Other read-only operations (viewing agent details, configuration) continue to work properly
- Permission enforcement is consistent across all toolkit-related operations

### Postconditions

1. **Remove Limited-Permission User:**
   - If a specific limited-permission user was created for testing, remove or deactivate the user account
   - Return user management to normal state for other tests
2. **Restore Original Permissions:**
   - If existing user permissions were temporarily modified for testing, restore original permission levels
   - Verify user can perform normal operations if permissions were restored
3. **Clean Up Test Environment:**
   - Ensure the "Test Agent Permissions" agent remains in a consistent state
   - If any toolkit attachments were unexpectedly modified during permission testing, restore them to expected
     state
   - Verify agent configuration is not corrupted by permission testing attempts
4. **Document Permission Results:**
   - Record which permission levels were tested and their outcomes
   - Note any unexpected behaviors or permission bypasses for security review
   - Ensure security testing results are logged appropriately
5. **Return to Standard Test User:**
   - Log out the limited-permission user and return to standard test user account
   - Verify standard user can perform normal agent and toolkit operations
   - Confirm environment is ready for subsequent test cases

--

## Test Case ID: TC-08-21

## Test Case ID: TC-08-21

#### Test Case Name: UI consistency — Toolkits list shows correct ordering and metadata after multiple operations

#### Test Case Name:

UI consistency — Toolkits list shows correct ordering and metadata after multiple operations

#### Test Case Tags: regression, ui, ordering

#### Test Case Tags:

regression, ui, ordering

#### Test Case Priority: Low

#### Test Case Priority:

Low

#### Test Case Description: After performing many add/remove/modify operations, verify Toolkits list ordering, pagination/scrolling, and metadata consistency.

#### Test Case Description:

After performing many add/remove/modify operations, verify Toolkits list ordering, pagination/scrolling, and
metadata consistency.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure several toolkits/agents/pipelines/mcps exist and some are already attached to the agent.

### Test Steps:

1.  Add several items of different types to the Toolkits list.
2.  Remove some and modify others.
3.  Refresh the page and inspect list ordering and metadata.

### Expected Results:

- List renders correctly, ordering rules hold (e.g., newest on top) and metadata matches backend values.

### Postconditions:

- None.

### Preconditions

1. **User Authentication and Access:**
   - User navigates to {URL}
   - User has valid login credentials: {Username}, {Password}
   - User switches to {Project}
   - User has permissions to create, view, edit, and delete agents and toolkits
   - User can access the "Agents" section within the current project
2. **Agent Setup:**
   - Navigate to the "Agents" section in the {Project} of application
   - Ensure an Agent named "Test Agent UI Consistency" exists and is visible in the Agents list
   - If "Test Agent UI Consistency" is not present, create one:
     1. Click the "Create Agent" button
     2. Fill in required fields: Name = "Test Agent UI Consistency" (must be ≤64 characters), Description
        (optional but recommended: "Agent for testing UI consistency of toolkit operations")
     3. Set required runtime configuration and other settings as per product conventions
     4. Click "Save" and ensure the agent appears in the agents list
     5. Verify the agent is successfully created and accessible
3. **Agent Configuration Access:**
   - Click on the "Test Agent UI Consistency" to open its details page
   - Navigate to the "Configuration" tab in the agent details view
   - Verify the Configuration view loads properly and displays all sections
4. **Toolkits Section Setup:**
   - In the Configuration view, locate the "Toolkits" section
   - Verify the presence of action buttons: "+Toolkit", "+MCP", "+Agent", "+Pipeline"
   - Ensure all action buttons are visible and enabled for the current user
5. **Pre-existing Toolkit Content:**
   - Ensure the system has a variety of toolkits, agents, pipelines, and MCPs available for attachment
   - Verify that several different types of items are already attached to the "Test Agent UI Consistency"
     agent:
     - At least 3-5 toolkits of different types
     - At least 2-3 MCP connections
     - At least 1-2 agent references
     - At least 1-2 pipeline connections
   - If sufficient attachments are not present, manually add them using the respective "+[Type]" buttons
   - Ensure the attached items have varied metadata (names, descriptions, creation dates, types) for
     comprehensive testing
6. **UI State Preparation:**
   - Ensure the toolkit list is in a consistent state with items properly displayed
   - Verify that pagination or scrolling controls are visible if the list contains many items
   - Confirm that sorting and filtering options are accessible and functional

### Test Steps

1. **Initial State Documentation:**
   - Take note of the current state of the Toolkits list
   - Document the order of currently attached items (toolkits, MCPs, agents, pipelines)
   - Record the metadata displayed for each item (names, types, descriptions, timestamps)
   - Note any pagination indicators, total counts, or sorting options currently active
2. **Perform Multiple Add Operations:**
   - Click the "+Toolkit" button and add 2-3 new toolkits of different types
   - For each addition, observe where the new item appears in the list
   - Click the "+MCP" button and add 1-2 new MCP connections
   - Observe the placement and metadata display of newly added MCP items
   - Click the "+Agent" button and add 1-2 new agent references
   - Note how agent references are integrated into the list display
   - Click the "+Pipeline" button and add 1-2 new pipeline connections
   - Document the order and positioning of all newly added items
3. **Perform Multiple Remove Operations:**
   - Identify 2-3 items from different categories to remove (toolkit, MCP, agent, pipeline)
   - Click the remove/delete button (trash icon) for the first selected item
   - Confirm the removal and observe how the list reorganizes
   - Remove the second selected item and note any changes in ordering or pagination
   - Remove the third selected item and document the list's current state
   - Verify that item counts and pagination controls update appropriately
4. **Perform Modification Operations:**
   - If available, modify the configuration or properties of 2-3 existing attached items
   - Change names, descriptions, or other editable metadata where possible
   - Save the modifications and observe how changes are reflected in the list display
   - Note any changes in ordering that might result from modifications
5. **Test List Refresh and Consistency:**
   - Refresh the page using the browser refresh button (F5 or Ctrl+R)
   - Wait for the page to fully reload and the Configuration tab to be accessible
   - Navigate back to the "Configuration" tab and locate the "Toolkits" section
   - Compare the current list state with your documented initial state plus expected changes
6. **Verify Ordering Rules:**
   - Examine the current order of items in the Toolkits list
   - Determine if there are consistent ordering rules being applied:
     - Are newest items displayed first (reverse chronological order)?
     - Are items grouped by type (toolkits, MCPs, agents, pipelines)?
     - Is there alphabetical sorting within categories?
     - Are there user-defined sorting options available?
   - Test any available sorting controls or options
7. **Inspect Metadata Consistency:**
   - For each item in the current list, verify that displayed metadata is accurate:
     - Item names match what was configured
     - Item types are correctly labeled and categorized
     - Descriptions are displayed properly where available
     - Creation/modification timestamps are reasonable and formatted correctly
     - Any status indicators (active, inactive, error states) are appropriate
8. **Test Pagination and Scrolling:**
   - If the list is long enough to require pagination, test pagination controls
   - Navigate through different pages and verify consistent display formatting
   - If scrolling is used instead of pagination, test smooth scrolling behavior
   - Verify that item counts and navigation indicators remain accurate
9. **Test List Responsiveness:**
   - If available, test the list display on different screen sizes or browser window sizes
   - Verify that responsive design maintains list readability and functionality
   - Check that metadata truncation or expansion works properly
10. **Performance and Loading Verification:**
    - Note the loading time for the list after refresh
    - Verify that the list loads efficiently even with multiple attached items
    - Check for any loading indicators or progress bars during list population

### Expected Results

1. **List Rendering and Display:**
   - The Toolkits list renders correctly after multiple add/remove/modify operations
   - All attached items (toolkits, MCPs, agents, pipelines) are displayed in the list
   - List formatting and layout remain consistent and professional
   - No visual glitches, overlapping text, or broken layouts occur
   - Item cards or rows display properly with appropriate spacing and alignment
2. **Ordering Rules Consistency:**
   - The list follows consistent ordering rules throughout all operations:
     - If newest-first ordering: newly added items appear at the top of the list
     - If alphabetical ordering: items are sorted alphabetically by name within categories
     - If category grouping: items are properly grouped by type (toolkits, MCPs, agents, pipelines)
     - If user-defined sorting: selected sorting options are applied and maintained
   - Ordering rules remain consistent after page refresh and are not lost
   - Any changes in ordering due to modifications are logical and predictable
3. **Metadata Accuracy and Consistency:**
   - All displayed metadata matches the actual backend values and configuration:
     - Item names are displayed exactly as configured
     - Item types are correctly identified and labeled
     - Descriptions appear properly formatted and complete
     - Creation and modification timestamps are accurate and properly formatted
     - Any version numbers or identifiers are correctly displayed
   - Metadata updates are reflected immediately after modifications
   - No stale or cached metadata is displayed after refresh
4. **Count and Pagination Accuracy:**
   - Total item counts are accurate and update correctly after add/remove operations
   - If pagination is used:
     - Page numbers and navigation controls work correctly
     - Items per page settings are respected and consistent
     - Page boundaries are logical and don't split related information
   - If scrolling is used, scroll behavior is smooth and responsive
5. **State Persistence After Refresh:**
   - All changes made during the test session persist after page refresh
   - Added items remain in the list with correct metadata
   - Removed items are no longer displayed
   - Modified items show updated information
   - No phantom items or duplicates appear after refresh
6. **Performance and Responsiveness:**
   - List loading performance remains acceptable even with multiple attached items
   - Operations (add/remove/modify) complete within reasonable time frames
   - Page refresh and list reload occur within acceptable time limits (typically < 5 seconds)
   - UI remains responsive during list operations and updates
7. **Visual and Functional Consistency:**
   - All UI elements maintain consistent styling and behavior
   - Action buttons (add/remove) remain properly positioned and functional
   - Status indicators and icons display correctly for all item types
   - Color coding, badges, or other visual indicators are consistent across items
8. **Error-Free Operation:**
   - No JavaScript errors occur during list operations or after refresh
   - Console logs show no critical errors or warnings related to list functionality
   - All list interactions work as expected without system errors
   - Network requests for list data complete successfully

### Postconditions

1. **Agent State Documentation:**
   - Document the final state of the "Test Agent UI Consistency" agent after all operations
   - Record the final list of attached toolkits, MCPs, agents, and pipelines for reference
   - Note any configuration changes that resulted from the testing process
2. **List State Cleanup (Optional):**
   - Depending on test requirements, consider whether to restore the agent to its original state
   - If cleanup is required, remove test items that were added during the test procedure
   - Restore any modified metadata to original values if needed for subsequent tests
3. **Performance Data Collection:**
   - Record any performance metrics observed during testing (load times, operation speeds)
   - Document any performance issues or concerns for further investigation
   - Note browser and system performance during extensive list operations
4. **Test Environment Status:**
   - Ensure the testing environment remains stable and ready for subsequent test cases
   - Verify that the agent and its configuration are in a usable state for other tests
   - Confirm that no system-level issues were introduced during the testing process
5. **Documentation and Reporting:**
   - Compile test results, including ordering behavior, metadata accuracy, and performance observations
   - Document any deviations from expected behavior for development team review
   - Record any UI inconsistencies or usability issues discovered during testing
6. **Browser State Management:**
   - Clear browser cache if performance testing revealed caching issues
   - Close any developer tools or debugging interfaces used during testing
   - Ensure browser session is in a clean state for subsequent testing activities

--

## Test Case ID: TC-08-22

## Test Case ID: TC-08-22

#### Test Case Name: Accessibility — keyboard-only add/select flows for Toolkits

#### Test Case Name: Accessibility — keyboard-only add/select flows for Toolkits

#### Test Case Tags: accessibility, a11y, keyboard

#### Test Case Tags: accessibility, a11y, keyboard

#### Test Case Priority: Low

#### Test Case Priority: Low

#### Test Case Description: Verify that all add/select flows for Toolkits, Agent, Pipeline, and MCP are operable via keyboard only and meet basic accessibility expectations (focus order, aria labels).

#### Test Case Description:

Verify that all add/select flows for Toolkits, Agent, Pipeline, and MCP are operable via keyboard only and
meet basic accessibility expectations (focus order, aria labels).

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".

### Test Steps:

1.  Navigate to Toolkits section using keyboard only (Tab/Shift+Tab).
2.  Open "+Toolkit" via keyboard, type partial name, navigate suggestions with arrow keys, and select via
    Enter.
3.  Repeat for "+Agent", "+Pipeline", "+MCP".

### Expected Results:

- All interactions are keyboard operable; focus indicators visible and aria labels present where applicable.

### Postconditions:

- None.

--

## Test Case ID: TC-08-23

## Test Case ID: TC-08-23

#### Test Case Name: API validation — verify toolkit attachment API call and payloads

#### Test Case Name:

API validation — verify toolkit attachment API call and payloads

#### Test Case Tags: integration, api

#### Test Case Tags:

integration, api

#### Test Case Priority: Medium

#### Test Case Priority:

Medium

#### Test Case Description: Monitor network/API calls when attaching/detaching toolkits to ensure correct endpoints and payloads are used.

#### Test Case Description:

Monitor network/API calls when attaching/detaching toolkits to ensure correct endpoints and payloads are used.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure browser devtools or a proxy is available to capture network traffic for this test.

### Test Steps:

1.  Perform an attach or detach operation for a toolkit.
2.  Capture the network request and inspect URL, method, and payload.

### Expected Results:

- Correct endpoint is called (e.g., POST /api/agents/{id}/toolkits) and payload includes required fields.

### Postconditions:

- None.

--

## Test Case ID: TC-08-24

## Test Case ID: TC-08-24

#### Test Case Name: Data integrity — attached toolkit config persists after agent export/import

#### Test Case Name:

Data integrity — attached toolkit config persists after agent export/import

#### Test Case Tags: data, export, import

#### Test Case Tags:

data, export, import

#### Test Case Priority: Low

#### Test Case Priority:

Low

#### Test Case Description: Verify that when exporting an agent and importing it into another project/environment, attached toolkit references are preserved or handed according to product spec.

#### Test Case Description:

Verify that when exporting an agent and importing it into another project/environment, attached toolkit
references are preserved or handed according to product spec.

### Preconditions: General Preconditions

### Preconditions:

General Preconditions

### Test Steps:

1.  Attach multiple toolkits to "Test Agent".
2.  Export the agent using available export feature.
3.  Import into another project/environment and inspect toolkits list.

### Expected Results:

- Attachment references are preserved where supported; if not supported, product shows clear warning and
  handles gracefully.

### Postconditions:

- None.

--

## Test Case ID: TC-08-25

## Test Case ID: TC-08-25

#### Test Case Name: Cleanup helper — remove all attached toolkits programmatically

#### Test Case Name:

Cleanup helper — remove all attached toolkits programmatically

#### Test Case Tags: cleanup, automation

#### Test Case Tags:

cleanup, automation

#### Test Case Priority: Low

#### Test Case Priority:

Low

#### Test Case Description: Provide steps for an automated cleanup script or API sequence to remove all attached toolkits from "Test Agent" to restore a clean state for other tests.

#### Test Case Description:

Provide steps for an automated cleanup script or API sequence to remove all attached toolkits from "Test
Agent" to restore a clean state for other tests.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents and toolkits
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list. If not present, create one:
  1. Click "Create Agent".
  2. Fill required fields: Name (valid, <=64 chars), Description (optional), set required runtime/config as
     per product conventions.
  3. Click "Save" and ensure agent appears in the list.
- Open the "Test Agent" configuration page and switch to the "Configuration" tab.
- In the Configuration view, locate the "Toolkits" section with action buttons: "+Toolkit", "+MCP", "+Agent",
  "+Pipeline".
- Ensure API tokens are available for cleanup/automation steps in this test.

### Test Steps:

1.  Use API: GET /api/agents/{id}/toolkits to list attachments.
2.  For each attached toolkit, call DELETE /api/agents/{id}/toolkits/{toolkitId}.

### Expected Results:

- Agent has no attached toolkits after script completion.

### Postconditions:

- None.

## Test Case ID: TC-08-26

#### Test Case Name:

Search toolkit with special characters

#### Test Case Tags:

search, special-characters, edge-case

#### Test Case Priority:

Low

#### Test Case Description:

Verify toolkit search handles special characters and edge cases correctly

### Preconditions:

- General preconditions apply (as defined at the beginning of this document)
- Toolkit library contains toolkits with special characters in names/descriptions

### Test Steps:

1. Navigate to the agent configuration page
2. Access the toolkit search functionality
3. Enter search terms with special characters (e.g., "@#$%", "C++", "API-V2")
4. Verify search results display relevant toolkits
5. Test search with Unicode characters (e.g., "测试", "café")
6. Test search with symbols commonly used in toolkit names

### Expected Results:

- Search correctly interprets and processes special characters
- Results display toolkits matching special character patterns
- No JavaScript errors or search failures occur
- Unicode characters are properly handled and displayed
- Search maintains functionality with all character types

### Postconditions:

- System returns to stable state
- Search functionality remains operational for subsequent searches

### Notes:

- Test with various special character combinations
- Verify both exact matches and partial matches work correctly

---

## Test Case ID: TC-08-29

#### Test Case Name:

Stress test with large number of toolkits

#### Test Case Tags:

stress-test, performance, large-dataset

#### Test Case Priority:

Medium

#### Test Case Description:

Verify system performance when handling a large volume of toolkits

### Preconditions:

- General preconditions apply (as defined at the beginning of this document)
- System has access to large toolkit library (500+ toolkits)
- Performance monitoring tools available

### Test Steps:

1. Navigate to agent configuration with large toolkit database
2. Access toolkit search/browse functionality
3. Monitor system response times and resource usage
4. Perform multiple simultaneous toolkit operations
5. Test pagination with large result sets
6. Verify search performance with large datasets
7. Monitor memory usage during toolkit operations

### Expected Results:

- Search results load within acceptable time limits (< 5 seconds)
- Pagination works smoothly with large datasets
- System maintains responsiveness during operations
- Memory usage remains within acceptable bounds
- No timeouts or performance degradation
- UI remains responsive during data loading

### Postconditions:

- System performance returns to baseline levels
- No memory leaks or resource exhaustion
- All toolkit functionality remains operational

### Notes:

- Record baseline performance metrics for comparison
- Test with both filtered and unfiltered large datasets

---

## Test Case ID: TC-08-30

#### Test Case Name:

Conflict resolution during concurrent toolkit operations

#### Test Case Tags:

concurrency, conflict-resolution, data-integrity

#### Test Case Priority:

High

#### Test Case Description:

Verify system handles concurrent toolkit modifications correctly

### Preconditions:

- General preconditions apply (as defined at the beginning of this document)
- Multiple user sessions or browser tabs available for testing
- Toolkit in shared/collaborative environment

### Test Steps:

1. Open agent configuration in multiple browser tabs/sessions
2. Select the same toolkit for modification in both sessions
3. Make different changes to toolkit configuration in each session
4. Attempt to save changes simultaneously from both sessions
5. Verify conflict detection and resolution mechanisms
6. Test user notification of conflicting changes
7. Verify data integrity after conflict resolution

### Expected Results:

- System detects concurrent modification attempts
- Appropriate conflict resolution dialog/warning appears
- User is notified of conflicting changes with clear options
- Data integrity is maintained (no data corruption)
- Conflict resolution preserves intended changes
- System provides clear guidance on resolving conflicts

### Postconditions:

- Toolkit configuration reflects resolved state
- System logs conflict resolution for audit purposes
- All sessions display consistent toolkit state

### Notes:

- Test various conflict scenarios (add/remove, different properties)
- Verify conflict resolution works across different user roles

---

## Test Case ID: TC-08-31

#### Test Case Name:

Expired credentials validation for external toolkits

#### Test Case Tags:

credentials, validation, security

#### Test Case Priority:

High

#### Test Case Description:

Verify system properly handles expired or invalid credentials for external toolkit services

### Preconditions:

- General preconditions apply (as defined at the beginning of this document)
- External toolkits configured with expiring credentials
- Ability to simulate credential expiration

### Test Steps:

1. Configure agent with external toolkit requiring credentials
2. Ensure toolkit functions correctly with valid credentials
3. Simulate credential expiration or invalidation
4. Attempt to use the external toolkit
5. Verify error handling and user notification
6. Test credential refresh/update functionality
7. Verify toolkit status indicators reflect credential state

### Expected Results:

- System detects expired/invalid credentials
- Clear error messages inform user of credential issues
- Toolkit status indicators show authentication problems
- User is provided with options to update credentials
- Credential refresh process works correctly
- System prevents unauthorized access with invalid credentials

### Postconditions:

- Credentials are updated or toolkit is disabled
- System security is maintained
- User understands credential status and required actions

### Notes:

- Test with various external service types (APIs, databases, cloud services)
- Verify credential validation occurs at appropriate intervals

---

## Test Case ID: TC-08-32

#### Test Case Name:

Toolkit Category Filtering and Navigation

#### Test Case Tags:

filtering, navigation, categories

#### Test Case Priority:

Medium

#### Test Case Description:

Verify toolkit category-based filtering works correctly

### Preconditions:

- General preconditions apply (as defined at the beginning of this document)
- Toolkit library contains toolkits from multiple categories
- Categories are properly configured and visible in the interface

### Test Steps:

1. Navigate to the agent configuration page
2. Access the toolkit selection interface
3. Verify all available categories are displayed in the category dropdown
4. Select a single category from the dropdown menu
5. Verify filtered results show only toolkits from the selected category
6. Clear the category filter and verify all toolkits are displayed again
7. Select multiple categories simultaneously
8. Verify filtered results show toolkits from all selected categories
9. Test category combination with different category pairs
10. Verify category navigation breadcrumbs display correctly
11. Test category filter persistence during page navigation

### Expected Results:

- Category dropdown displays all available toolkit categories
- Single category selection filters results correctly
- Multiple category selection shows union of selected categories
- Filter clearing restores full toolkit list
- Category combinations work as expected (OR logic)
- Filtered results count matches actual displayed items
- Navigation breadcrumbs reflect current filter state
- Category filters persist during session navigation
- No toolkits from unselected categories appear in results

### Postconditions:

- Category filters can be cleared successfully
- System returns to unfiltered state when needed
- Category selection state is maintained appropriately

### Notes:

- Test with various category combinations to ensure comprehensive coverage
- Verify category names are displayed consistently across the interface
- Test category filtering performance with large numbers of toolkits

---

#### End of Scenario: 08_Agent_Toolkits
