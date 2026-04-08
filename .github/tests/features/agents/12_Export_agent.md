# Scenario ID: EA-12

#### Scenario Name:

Export Agent - Comprehensive Export Functionality and Format Verification

#### Scenario Tags:

Agent Export, UI Testing, Functional, Data Export, File Download

#### Scenario Priority:

High

#### Scenario Description

This scenario covers comprehensive testing of agent export functionality including export from different
views, export format validation, export content verification, error handling, permission validation, and
export behavior under various conditions. Each test case focuses on a single specific aspect of the export
functionality to ensure thorough coverage.

## Test Case ID: TC-12-01

#### Test Case Name:

Export Agent from Agent Details Page

#### Test Case Tags:

Smoke, Regression, Agent Export, Details View

#### Test Case Priority:

High

#### Test Case Description

Verify that an agent can be successfully exported from the agent details page using the export functionality.

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
6. Create a test agent for export testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Export Agent"
     - Agent's description: "Test agent for export functionality verification"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Export Agent" agent in the agents list

### Test Steps

1. Click on the "Test Export Agent" agent to open its details page
2. Navigate to the **Configuration** tab
3. Locate the **Export Agent** button
4. Click on the **Export Agent** button
5. Click **Save**in dialog window and wait for the export process to complete
6. Verify that a file download is initiated
7. Check browser's download list
8. Observe the agent's file is listed in browser download list

### Expected Results

- Agent details page loads successfully
- Export functionality is visible and accessible
- **Export Agent** button is clickable
- Export process initiates without errors
- File download starts automatically
- Downloaded file appears in browser downloads folder
- Export process completes successfully
- No error messages or failures occur during export

### Postconditions

1. Clean up downloaded files from browser downloads folder
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Export Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
3. Navigate to **Downloads** in browser
4. locate downloaded file and click **Delete** trash icon
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Record the exported file name and format for verification

## Test Case ID: TC-12-02

#### Test Case Name:

Export Agent from Table View Using Context Menu

#### Test Case Tags:

Regression, Agent Export, Table View, Context Menu

#### Test Case Priority:

High

#### Test Case Description

Verify that an agent can be successfully exported from the agents table view using the context menu export
option.

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
6. Create a test agent for table view export testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Table Export Agent"
     - Agent's description: "Test agent for table view export functionality"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Table Export Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button to display agents in table format
3. Locate the "Test Table Export Agent" in the agents table
4. Click on the context menu (3 dots or ellipsis) next to the agent name
5. Verify that the context menu dropdown appears
6. Look for the **Export** option in the context menu dropdown
7. Verify that the **Export** option is active and clickable (not grayed out or disabled)
8. Click the **Export** option from the context menu
9. Click **Save** in dialog window and wait for the export process to complete
10. Verify that a file download is initiated
11. Check browser's download list
12. Observe the agent's file is listed in browser download list

### Expected Results

- Agents table view loads successfully
- Test agent is visible in the table
- Context menu (3 dots) opens when clicked
- Context menu dropdown displays properly with available options
- Export option is visible in the context menu dropdown
- Export option is active and clickable (not disabled or grayed out)
- Export process initiates without errors
- File download starts automatically
- Downloaded file appears in browser downloads folder
- Export completes successfully without errors

### Postconditions

1. Clean up downloaded files from browser downloads folder
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Table Export Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
3. Navigate to **Downloads** in browser
4. Locate downloaded file and click **Delete** trash icon
5. Verify no residual data remains from the deleted agent
6. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Compare export functionality between details view and table view

## Test Case ID: TC-12-03

#### Test Case Name:

Verify Exported File Format and Extension

#### Test Case Tags:

Regression, Agent Export, File Format, Validation

#### Test Case Priority:

High

#### Test Case Description

Verify that the exported agent file has the correct file format and extension as expected by the system.

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
6. Create a test agent for file format verification:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Format Agent"
     - Agent's description: "Test agent for file format verification"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Format Agent" agent in the agents list

### Test Steps

1. Click on the "Test Format Agent" agent to open its details page
2. Navigate to the **Configuration** tab
3. Locate the **Export Agent** button
4. Click on the **Export Agent** button
5. Click **Save** in dialog window and wait for the export process to complete
6. Navigate to browser downloads folder
7. Locate the downloaded "Test Format Agent" file
8. Check the file extension (.json)
9. Verify the file name format
10. Check the file size to ensure it's not empty
11. Attempt to open the file with appropriate software to verify format validity

### Expected Results

- File downloads successfully with correct extension
- File name follows expected naming convention
- File extension matches expected export format (.json )
- File size is greater than 0 bytes
- File can be opened with appropriate software IDE
- File format is valid and readable
- File name includes agent name or identifier
- Downloaded file timestamp matches export time

### Postconditions

1. Navigate to Downloads in browser
2. Locate downloaded file and click Delete (trash icon)
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Format Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document the exact file format and extension for future reference

## Test Case ID: TC-12-04

#### Test Case Name:

Verify Exported File Contains Agent Name

#### Test Case Tags:

Regression, Agent Export, Content Validation, Agent Name

#### Test Case Priority:

High

#### Test Case Description

Verify that the exported agent file contains the correct agent name in its content.

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
6. Create a test agent for name verification testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Unique Test Agent Name 12345"
     - Agent's description: "Test agent for name verification in exported file"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Unique Test Agent Name 12345" agent in the agents list

### Test Steps

1. Click on the "Unique Test Agent Name 12345" agent to open its details page
2. Navigate to **Configuration** tab
3. Note the exact agent name displayed in the interface
4. Locate the **Export Agent** button
5. Click the **Export Agent** button
6. Click **Save** in dialog window
7. Wait for file download to complete
8. Navigate to browser downloads folder
9. Open the downloaded file with appropriate text editor or viewer
10. Search for the agent name "Unique Test Agent Name 12345" in the file content
11. Verify the agent name appears correctly in the exported data
12. Check that the name is not truncated or modified

### Expected Results

- Agent name is clearly visible in the agent details page
- Export process completes successfully
- Downloaded file can be opened and read
- Agent name "Unique Test Agent Name 12345" is found in the exported file content
- Agent name appears exactly as displayed in the UI
- Name is not truncated, modified, or corrupted
- Name appears in the appropriate field/section of the exported data
- Special characters and numbers in the name are preserved correctly

### Postconditions

1. Navigate to Downloads in browser
2. Locate downloaded file and click Delete (trash icon)
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Unique Test Agent Name 12345" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify character encoding handling for special characters

## Test Case ID: TC-12-05

#### Test Case Name:

Verify Exported File Contains Agent Description

#### Test Case Tags:

Regression, Agent Export, Content Validation, Agent Description

#### Test Case Priority:

High

#### Test Case Description

Verify that the exported agent file contains the correct agent description in its content.

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
6. Create a test agent for description verification testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Description Agent"
     - Agent's description: "This is a unique test description for export verification with special characters
       @#$%"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Description Agent" agent in the agents list

### Test Steps

1. Click on the "Test Description Agent" agent to open its details page
2. Navigate to Configuration tab
3. Note the exact agent description displayed in the interface
4. Locate the **Export Agent** button
5. Click the **Export Agent** button
6. Click Save in dialog window
7. Wait for file download to complete
8. Navigate to browser downloads folder
9. Open the downloaded file with appropriate text editor or IDE
10. Search for the description "This is a unique test description for export verification with special
    characters @#$%" in the file content
11. Verify the description appears correctly in the exported data
12. Check that special characters and formatting are preserved

### Expected Results

- Agent description is clearly visible in the agent details page
- Export process completes successfully
- Downloaded file can be opened and read
- Agent description is found in the exported file content
- Description appears exactly as displayed in the UI
- Description is not truncated, modified, or corrupted
- Special characters (@#$%) are preserved correctly in the exported data
- Description appears in the appropriate field/section of the exported file

### Postconditions

1. Navigate to Downloads in browser
2. Locate downloaded file and click **Delete** (trash icon)
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Description Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify handling of long descriptions and special formatting

## Test Case ID: TC-12-06

#### Test Case Name:

Verify Exported File Contains Agent Instructions

#### Test Case Tags:

Regression, Agent Export, Content Validation, Agent Instructions

#### Test Case Priority:

High

#### Test Case Description

Verify that the exported agent file contains the correct agent instructions in its content.

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
6. Create a test agent for instructions verification testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Instructions Agent"
     - Agent's description: "Test agent for instructions verification"
   - In the **Instructions** field, enter: "You are a helpful assistant that provides detailed responses.
     Always be polite and professional. Use examples when explaining concepts."
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Instructions Agent" agent in the agents list

### Test Steps

1. Click on the "Test Instructions Agent" agent to open its details page
2. Navigate to the **Configuration** tab
3. Note the exact instructions displayed in the Instructions field
4. Locate the **Export Agent** button
5. Click the **Export Agent** button
6. Click **Save** in dialog window
7. Wait for file download to complete
8. Navigate to browser **Downloads** folder
9. Open the downloaded "Test Instructions Agent" file with appropriate text editor or viewer
10. Search for the instructions text in the file content
11. Verify the instructions appear correctly in the exported data
12. Check that the full instructions text is preserved without truncation

### Expected Results

- Agent instructions are clearly visible in the Configuration tab
- Export process completes successfully
- Downloaded file can be opened and read
- Agent instructions are found in the exported file content
- Instructions appear exactly as entered in the UI
- Full instructions text is preserved without truncation
- Instructions text formatting and line breaks are maintained
- Instructions appear in the appropriate field/section of the exported data

### Postconditions

1. Navigate to Downloads in browser
2. Locate downloaded file and click Delete (trash icon)
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Instructions Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify handling of complex instructions with formatting

## Test Case ID: TC-12-07

#### Test Case Name:

Verify Exported File Contains Conversation Starters

#### Test Case Tags:

Regression, Agent Export, Content Validation, Conversation Starters

#### Test Case Priority:

Medium

#### Test Case Description

Verify that the exported agent file contains the correct conversation starters in its content.

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
6. Create a test agent for conversation starters verification:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Starters Agent"
     - Agent's description: "Test agent for conversation starters verification"
   - Click **+ starter** button
   - Enter conversation starter text: "What can you help me with today?"
   - Click **+ starter** button again
   - Enter second conversation starter text: "Please explain artificial intelligence"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Starters Agent" agent in the agents list

### Test Steps

1. Click on the "Test Starters Agent" agent to open its details page
2. Navigate to the **Configuration** tab
3. Note the conversation starters displayed in the Conversation Starters section
4. Locate the **Export Agent** button
5. Click the **Export Agent** button
6. Click Save in dialog window
7. Wait for file download to complete
8. Navigate to browser downloads folder
9. Open the downloaded file with appropriate text editor or viewer
10. Search for both conversation starters in the file content:

- "What can you help me with today?"
- "Please explain artificial intelligence"

9. Verify both conversation starters appear correctly in the exported data

### Expected Results

- Both conversation starters are visible in the Configuration tab
- Export process completes successfully
- Downloaded file can be opened and read
- Both conversation starters are found in the exported file content
- Conversation starters appear exactly as entered in the UI
- All conversation starters are included (none are missing)
- Conversation starters appear in the appropriate section of the exported data
- Order of conversation starters is preserved

### Postconditions

1. Navigate to Downloads in browser
2. Locate downloaded file and click Delete (trash icon)
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Starters Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify handling of multiple conversation starters and their ordering

## Test Case ID: TC-12-08

#### Test Case Name:

Verify Exported File Contains Variables Configuration

#### Test Case Tags:

Regression, Agent Export, Content Validation, Variables

#### Test Case Priority:

Medium

#### Test Case Description

Verify that the exported agent file contains the correct variables configuration in its content.

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
6. Create a test agent for variables verification:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Variables Agent"
     - Agent's description: "Test agent for variables verification"
   - Scroll to **Variables** section
   - Click **+ Variable** button
   - Add first variable:
     - Name: "user_name"
     - Default value: "Test User"
   - Click **+ Variable** button again
   - Add second variable:
     - Name: "task_type"
     - Default value: "export testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Variables Agent" agent in the agents list

### Test Steps

1. Click on the "Test Variables Agent" agent to open its details page
2. Navigate to the **Configuration** tab
3. Note the variables displayed in the Variables section
4. Record both variable names and their default values
5. Locate the **Export Agent** button
6. Click the **Export Agent** button
7. Click Save in dialog window
8. Wait for file download to complete
9. Navigate to browser downloads folder
10. Open the downloaded file with appropriate text editor or viewer
11. Search for both variables in the file content:

- Variable name "user_name" and its default value "Test User"
- Variable name "task_type" and its default value "export testing"

10. Verify both variables and their values appear correctly in the exported data

### Expected Results

- Both variables are visible in the Configuration tab Variables section
- Variable names and default values are displayed correctly
- Export process completes successfully
- Downloaded file can be opened and read
- Both variables are found in the exported file content
- Variable names appear exactly as configured
- Default values appear correctly associated with their variables
- Variables appear in the appropriate section of the exported data
- Variable configuration structure is preserved

### Postconditions

1. Navigate to Downloads in browser
2. Locate downloaded file and click Delete (trash icon)
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Variables Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify variable data types and validation rules are preserved

## Test Case ID: TC-12-09

#### Test Case Name:

Export Agent Without Sufficient Permissions

#### Test Case Tags:

Negative Testing, Agent Export, Permissions, Access Control

#### Test Case Priority:

High

#### Test Case Description

Verify that users without sufficient export permissions cannot export agents and receive appropriate error
messages.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials with LIMITED permissions (without export permissions)
3. User logs in with {Username} / {Password} (limited user account)
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.details, models.applications.applications.list
   (without models.applications.export_import.export permission)
6. Create a test agent for permissions testing (using admin account):
   - Log in with admin credentials
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Permissions Agent"
     - Agent's description: "Test agent for permissions verification"
   - Click the **Save** button
   - Log out and log back in with limited user account
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Permissions Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate the "Test Permissions Agent" in the agents table
4. Click on the agent to open its details page
5. Look for export functionality (Export button or menu option)
6. If export option is visible, attempt to click it
7. Observe system response to export attempt
8. Check for error messages or permission denied notifications
9. Return to table view and check context menu for export option
10. If export option is present in context menu, attempt to use it

### Expected Results

- User can view the agent details page
- Export functionality is either hidden/disabled or shows permission error
- If export button/option is visible, clicking it results in permission error
- System displays appropriate error message indicating insufficient permissions
- Error message is clear and informative
- No file download is initiated
- User is not able to bypass permission restrictions
- System logs the unauthorized access attempt appropriately

### Postconditions

1. Log out from limited user account
2. Log in with admin account to clean up test data
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Permissions Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document the exact error messages for permission violations

## Test Case ID: TC-12-10

#### Test Case Name:

Export Non-Existent Agent

#### Test Case Tags:

Negative Testing, Agent Export, Error Handling

#### Test Case Priority:

Medium

#### Test Case Description

Verify that attempting to export a non-existent or deleted agent results in appropriate error handling.

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
6. Create and then delete a test agent to simulate non-existent agent scenario:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Temp Agent"
     - Agent's description: "Temporary agent for deletion testing"
   - Click the **Save** button
   - Note the agent ID/URL if visible in browser address bar
   - Navigate back to agents list
   - Click on **Table view** button
   - Locate the created "Test Temp Agent" agent
   - Click on the agent menu (3 dots) and select Delete
   - Confirm deletion by entering agent name
   - Verify agent is removed from the list

### Test Steps

1. Attempt to directly access the deleted agent's details page using bookmarked URL or direct navigation (if
   URL was noted)
2. If direct URL access is not possible, verify the agent no longer appears in the agents list
3. Try to trigger export functionality for the non-existent agent (if accessible via direct URL)
4. Use browser developer tools to simulate export API call for non-existent agent ID
5. Observe system response to export attempt on non-existent agent
6. Check for appropriate error messages or 404 responses
7. Verify that no file download is initiated
8. Check system behavior when export is attempted on invalid agent ID

### Expected Results

- Deleted agent does not appear in agents list
- Direct URL access to deleted agent results in 404 or appropriate error page
- Export functionality is not accessible for non-existent agent
- System returns appropriate error response (404 Not Found or similar)
- Error message clearly indicates agent does not exist
- No file download is initiated
- System handles the error gracefully without crashes
- User is redirected to appropriate page or shown error message

### Postconditions

1. Verify no residual data remains from the deleted agent
2. Clear browser cache if necessary
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document error handling behavior and error message content

## Test Case ID: TC-12-11

#### Test Case Name:

Export Agent with Large Content Data

#### Test Case Tags:

Performance Testing, Agent Export, Large Data, Scalability

#### Test Case Priority:

Medium

#### Test Case Description

Verify that an agent with large content (long instructions, many variables, multiple conversation starters)
can be exported successfully.

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
6. Create a test agent with large content:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Large Content Agent"
     - Agent's description: "Test agent with large content for export performance testing"
   - In **Instructions** field, enter a very long text (2000+ characters with detailed instructions)
   - Add 10 conversation starters with substantial text each
   - Add 10 variables with descriptive names and values
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Large Content Agent" agent in the agents list

### Test Steps

1. Click on the "Test Large Content Agent" to open its details page
2. Navigate to **Configuration** tab and verify all large content is displayed
3. Note the current time before starting export
4. Locate the **Export Agent** button
5. Click the **Export Agent** button
6. Click Save in dialog window
7. Monitor the export process duration
8. Wait for the export process to complete
9. Note the time when export completes
10. Check if file download is initiated
11. Verify the downloaded file size is appropriate for the large content
12. Open the downloaded file and verify all content is present

### Expected Results

- Agent with large content loads successfully in the interface
- All large content is visible in the Configuration tab
- Export process completes successfully without timeout errors
- Export process completes within reasonable time (under 30 seconds)
- File download is initiated successfully
- Downloaded file size reflects the large content amount
- Downloaded file contains all the large content without truncation
- System performance remains stable during large content export
- No memory or performance issues occur during export

### Postconditions

1. Navigate to Downloads in browser
2. Locate downloaded file and click Delete (trash icon)
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Large Content Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document export time and file size for performance benchmarking

## Test Case ID: TC-12-12

#### Test Case Name:

Export Agent During Network Interruption

#### Test Case Tags:

Negative Testing, Agent Export, Network Issues, Error Handling

#### Test Case Priority:

Medium

#### Test Case Description

Verify that export functionality handles network interruptions gracefully and provides appropriate error
messages.

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
6. Create a test agent for network interruption testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Network Agent"
     - Agent's description: "Test agent for network interruption during export"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Network Agent" agent in the agents list
7. Prepare to simulate network interruption (browser developer tools Network tab or disable network)

### Test Steps

1. Click on the "Test Network Agent" to open its details page
2. Navigate to Configuration tab
3. Open browser developer tools and go to Network tab
4. Locate the **Export Agent** button
5. Click the **Export Agent** button
6. Click Save in dialog window to start export process
7. Immediately simulate network interruption by:
   - Setting Network tab to "Offline" mode in developer tools, OR
   - Temporarily disconnecting network connection
8. Observe system behavior during network interruption
9. Wait for system response to network failure
10. Check for error messages or timeout notifications
11. Restore network connection
12. Attempt export again after network restoration
13. Verify export works properly after network is restored

### Expected Results

- Export process initiates normally
- System detects network interruption during export
- Appropriate error message is displayed to user
- Error message clearly indicates network connectivity issue
- System does not hang or become unresponsive
- No partial or corrupted file download occurs
- User can retry export after network restoration
- Export works normally once network is restored
- System recovers gracefully from network interruption

### Postconditions

1. Restore network connection if still disconnected
2. Navigate to Downloads in browser
3. Locate any partial downloads and click Delete (trash icon)
4. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Network Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
5. Verify no residual data remains from the deleted agent
6. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document specific error messages and recovery behavior

## Test Case ID: TC-12-13

#### Test Case Name:

Multiple Concurrent Agent Exports

#### Test Case Tags:

Performance Testing, Agent Export, Concurrent Operations, Scalability

#### Test Case Priority:

Low

#### Test Case Description

Verify that multiple agents can be exported simultaneously without conflicts or system performance issues.

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
6. Create multiple test agents for concurrent export testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Create first agent:
     - Click the **+ Create** button
     - Agent's name: "Test Concurrent Agent 1"
     - Agent's description: "First agent for concurrent export testing"
     - Click the **Save** button
   - Create second agent:
     - Click the **+ Create** button
     - Agent's name: "Test Concurrent Agent 2"
     - Agent's description: "Second agent for concurrent export testing"
     - Click the **Save** button
   - Create third agent:
     - Click the **+ Create** button
     - Agent's name: "Test Concurrent Agent 3"
     - Agent's description: "Third agent for concurrent export testing"
     - Click the **Save** button
   - Navigate to **Table view** and verify all three agents are created

### Test Steps

1. Open multiple browser tabs or windows (3 tabs total)
2. In each tab, navigate to the agents section and open a different test agent:
   - Tab 1: Open "Test Concurrent Agent 1"
   - Tab 2: Open "Test Concurrent Agent 2"
   - Tab 3: Open "Test Concurrent Agent 3"
3. Quickly initiate export from all three tabs within a few seconds of each other
4. Monitor the export processes in all tabs
5. Wait for all export processes to complete
6. Check downloads folder for all three exported files
7. Verify each downloaded file corresponds to the correct agent
8. Open each exported file to verify content integrity
9. Check for any error messages or failed exports
10. Monitor system performance during concurrent exports

### Expected Results

- All three agents open successfully in separate tabs
- Export functionality works in all tabs simultaneously
- All three export processes complete successfully
- Three separate files are downloaded to downloads folder
- Each downloaded file contains data for the correct agent
- File names are distinct and identifiable
- No export processes fail due to concurrency
- System performance remains stable during concurrent exports
- No data corruption or mixing occurs between exports
- Each exported file is complete and valid

### Postconditions

1. Clean up all downloaded files from browser downloads folder
2. Close additional browser tabs used for testing
3. Clean up test data by deleting all created agents:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - For each agent ("Test Concurrent Agent 1", "Test Concurrent Agent 2", "Test Concurrent Agent 3"):
     - Locate the agent in the agents list
     - Click on the agent menu (3 dots or ellipsis) next to the agent name
     - Select **Delete** from the contextual menu
     - Confirm deletion in the modal dialog by entering agent's name
     - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agents
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document system performance behavior during concurrent operations

## Test Case ID: TC-12-14

#### Test Case Name:

Export Agent with Special Characters in Name

#### Test Case Tags:

Regression, Agent Export, Special Characters, File Naming

#### Test Case Priority:

Medium

#### Test Case Description

Verify that agents with special characters in their names can be exported successfully and result in
appropriately named export files.

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
6. Create a test agent with special characters in name:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test-Agent_2024 @#$% (Export)"
     - Agent's description: "Test agent with special characters for export file naming"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent with special characters in the agents list

### Test Steps

1. Click on the agent with special characters to open its details page
2. Navigate to Configuration tab
3. Verify the agent name displays correctly with all special characters
4. Locate the **Export Agent** button
5. Click the **Export Agent** button
6. Click Save in dialog window
7. Wait for the export process to complete
8. Check the downloaded file in browser downloads folder
9. Examine the downloaded file name
10. Verify how special characters are handled in the file name
11. Check if special characters are:

- Preserved as-is
- Replaced with safe characters (e.g., underscores, hyphens)
- URL encoded
- Removed entirely

12. Verify the file can be opened successfully
13. Open the file and verify the agent name appears correctly in the content

### Expected Results

- Agent with special characters displays correctly in the interface
- Export process completes successfully
- File download is initiated without errors
- Downloaded file has a valid, filesystem-safe name
- Special characters in file name are handled appropriately (either preserved safely or substituted)
- File name remains meaningful and identifiable
- Downloaded file can be opened successfully
- Agent name within file content preserves original special characters
- No file system errors occur due to special characters
- Export functionality handles character encoding properly

### Postconditions

1. Navigate to Downloads in browser
2. Locate downloaded file and click Delete (trash icon)
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent with special characters in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document the exact character handling and substitution rules

## Test Case ID: TC-12-15

#### Test Case Name:

Export Agent from Table View

#### Test Case Tags:

Regression, Agent Export, Table View

#### Test Case Priority:

High

#### Test Case Description

Verify that an agent can be successfully exported from the agents table view by selecting the agent using the
Export option from the side dropdown/bulk actions menu.

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
6. Create a test agent for bulk export testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Bulk Export Agent"
     - Agent's description: "Test agent for bulk export functionality"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Bulk Export Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button to display agents in table format
3. Locate the "Test Bulk Export Agent" in the agents table
4. Click on right action button(...)
5. Verify that a side dropdown menu appears
6. Locate the **Export** option in the side dropdown
7. Verify that the **Export** option is active and clickable
8. Click the **Export** option from the side dropdown
9. Wait for the export process to complete
10. Verify that a file download is initiated
11. Check browser's download list
12. Observe the agent's file is listed in browser download list

### Expected Results

- Agents table view loads successfully
- Test agent is visible in the table with selectable checkbox
- Checkbox selection works properly
- Side dropdown/bulk actions menu appears when agent is selected
- Export option is visible and active in the side dropdown
- Export option is clickable and functional
- Export process initiates without errors
- File download starts automatically
- Downloaded file appears in browser downloads folder
- Export completes successfully without errors
- Bulk selection UI provides clear feedback for selected items

### Postconditions

1. Navigate to Downloads in browser
2. Locate downloaded file and click Delete (trash icon)
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Bulk Export Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify that bulk selection functionality works consistently across different browsers
- Document the exact location and behavior of the side dropdown/bulk actions menu
