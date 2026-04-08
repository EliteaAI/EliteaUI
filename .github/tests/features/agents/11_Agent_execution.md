# Scenario ID: AE-11

#### Scenario Name:

Agent Execution Testing - Comprehensive Test Coverage

#### Scenario Tags:

Agent Execution, UI Testing, Functional, Conversation Starters, Manual Execution, LLM Settings

#### Scenario Priority:

High

#### Scenario Description

This scenario covers comprehensive testing of agent execution functionality including verification of default
LLM model settings, execution via conversation starters, manual execution, execution with/without toolkits and
variables, multi-version execution, full-screen mode execution, LLM settings modification, public project
execution, and file attachment scenarios.

## Test Case ID: TC-11-01

#### Test Case Name:

Verify Default LLM Model Setting Consistency Between Project Settings and Agent

#### Test Case Tags:

Smoke, Regression, LLM Settings, Configuration

#### Test Case Priority:

High

#### Test Case Description

Verify that the default LLM model set in project settings matches the LLM model configured for the test agent.

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
6. Create a test agent for LLM model verification:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent LLM Model"
     - Agent's description: "Test agent for LLM model verification"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent LLM Model" agent in the agents list

### Test Steps

1. Navigate to the **Settings** section in the {Project}
2. Observe and note the default LLM model that is set in project settings
3. Navigate to **Agents** menu
4. Click on the "Test Agent LLM Model" agent to open it
5. Navigate to **Configuration** tab
6. Scroll down to the **LLM Settings** section
7. Observe the LLM model currently selected for the agent
8. Compare the agent's LLM model with the project's default LLM model noted in step 2

### Expected Results

- Project settings page loads and displays default LLM model
- Agent configuration page loads successfully
- LLM Settings section is visible in agent configuration
- The LLM model set for the agent matches the default LLM model from project settings
- Both settings display the same model name and version

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent LLM Model" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Record both model settings for comparison verification

## Test Case ID: TC-11-02

#### Test Case Name:

Execute Agent via Conversation Starter from Run Tab

#### Test Case Tags:

Smoke, Regression, Agent Execution, Conversation Starter

#### Test Case Priority:

High

#### Test Case Description

Execute an agent using conversation starter functionality from the Run tab and verify successful execution
with LLM response.

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
6. Create a test agent with conversation starter for execution testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Conversation Starter"
     - Agent's description: "Test agent for conversation starter execution"
   - Click **+ starter** button
   - Enter conversation starter text: "Please execute a test task and show your capabilities"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Conversation Starter" agent in the agents list

### Test Steps

1. Click on the "Test Agent Conversation Starter" agent to open it
2. Navigate to **Run** tab
3. Observe the conversation starter button/text at the top of the conversation window
4. Click on the conversation starter
5. Observe that the conversation starter text is populated in the input field
6. Click the **Send** arrow button
7. Wait for the LLM response
8. Observe the conversation dialogue showing both the sent message and received response

### Expected Results

- Run tab loads successfully with conversation interface
- Conversation starter is visible and clickable at the top
- Clicking conversation starter populates the input field with starter text
- Send button is functional and sends the message
- Message appears in conversation dialogue as sent
- LLM processes the request and returns a response
- Response is displayed in the conversation dialogue
- Conversation flow appears natural and complete

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Conversation Starter" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Monitor response time and content quality

## Test Case ID: TC-11-03

#### Test Case Name:

Execute Agent via Conversation Starter from Configuration Tab

#### Test Case Tags:

Regression, Agent Execution, Conversation Starter, Configuration

#### Test Case Priority:

High

#### Test Case Description

Execute an agent using conversation starter functionality from the Configuration tab and verify successful
execution with LLM response.

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
6. Create a test agent with conversation starter for configuration tab testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Config Starter"
     - Agent's description: "Test agent for configuration tab conversation starter"
   - Click **+ starter** button
   - Enter conversation starter text: "Please execute a configuration test task"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Config Starter" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent Config Starter" to open it
4. Navigate to **Configuration** tab
5. Scroll to the **Conversation Starters** section
6. Click on an existing conversation starter
7. Observe that the conversation starter text appears in the conversation input field
8. Click the **Send** arrow button
9. Wait for the LLM response
10. Observe the conversation dialogue showing both the sent message and received response

### Expected Results

- Configuration tab loads successfully
- Conversation Starters section is visible
- Conversation starter is clickable
- Clicking starter populates the conversation input field
- Send button functions correctly
- Message is sent and appears in conversation dialogue
- LLM responds appropriately to the starter message
- Full conversation flow is completed successfully

### Postconditions

1. Clear conversation history if needed for subsequent tests
2. Clean up test entities:
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the "Test Agent Config Starter" agent in the list
   - Click on the three dots menu and select **Delete**
   - Confirm deletion in the confirmation dialog
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify conversation starter content matches what was configured

## Test Case ID: TC-11-04

#### Test Case Name:

Execute Agent with Manual Input from Run Tab

#### Test Case Tags:

Smoke, Regression, Agent Execution, Manual Input

#### Test Case Priority:

High

#### Test Case Description

Execute an agent by manually entering execution text in the conversation window from the Run tab.

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
6. Create a test agent for manual execution testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for manual execution testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. In the conversation input field, manually type: "Please execute this agent task"
6. Click the **Send** arrow button
7. Wait for the LLM response
8. Observe the messages sent and the response received from the LLM

### Expected Results

- Run tab loads with clean conversation interface
- Input field accepts manual text entry
- Typed text appears correctly in the input field
- Send button is active and functional
- Message is sent successfully and appears in conversation
- LLM processes the manual input and provides appropriate response
- Response content is relevant to the input message

### Postconditions

1. Clear conversation history if needed for subsequent tests
2. Clean up test entities:
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the "Test Agent" agent in the list
   - Click on the three dots menu and select **Delete**
   - Confirm deletion in the confirmation dialog
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test with various manual input phrases to ensure consistency

## Test Case ID: TC-11-05

#### Test Case Name:

Execute Agent with Manual Input from Configuration Tab

#### Test Case Tags:

Regression, Agent Execution, Manual Input, Configuration

#### Test Case Priority:

Medium

#### Test Case Description

Execute an agent by manually entering execution text in the conversation window from the Configuration tab.

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
6. Create a test agent for configuration tab execution testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for configuration tab execution testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Configuration** tab
5. Locate the conversation input field at the bottom of the configuration area
6. Manually type: "Run agent with custom execution command"
7. Click the **Send** arrow button
8. Wait for the LLM response
9. Observe the messages sent and the response received from the LLM

### Expected Results

- Configuration tab provides access to conversation interface
- Manual input is accepted in the conversation field
- Send functionality works from configuration tab
- Message is processed and sent successfully
- LLM responds appropriately to manual input
- Response appears in the conversation area

### Postconditions

1. Clear conversation history if needed for subsequent tests
2. Clean up test entities:
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the "Test Agent" agent in the list
   - Click on the three dots menu and select **Delete**
   - Confirm deletion in the confirmation dialog
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Compare behavior with Run tab execution for consistency

## Test Case ID: TC-11-06

#### Test Case Name:

Execute Agent Without Toolkit

#### Test Case Tags:

Regression, Agent Execution, No Toolkit

#### Test Case Priority:

Medium

#### Test Case Description

Execute an agent that has no toolkits attached and verify successful execution with basic LLM functionality.

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
6. Create a test agent without toolkits for basic execution testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent No Toolkit"
     - Agent's description: "Test agent without toolkits for basic execution"
   - In **Instructions field** type: "You are a helpful assistant that can answer questions using only your
     base knowledge"
   - Do NOT add any toolkits (skip the Toolkits section)
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent No Toolkit" agent in the agents list

### Test Steps

1. Click on the "Test Agent No Toolkit" agent to open it
2. Navigate to **Configuration** tab
3. Verify in the **Toolkits** section that no toolkits are attached
4. Navigate to **Run** tab
5. In the conversation input field, type: "Hello, please help me with a simple task"
6. Click the **Send** arrow button
7. Wait for the LLM response
8. Observe the agent's response without toolkit assistance

### Expected Results

- Agent configuration shows no toolkits attached
- Agent executes successfully without toolkits
- Basic LLM functionality is available
- Response is generated using only the agent's instructions and LLM knowledge
- No toolkit-specific functionality is available or referenced
- Agent provides helpful response within its basic capabilities

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent No Toolkit" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Compare response quality with toolkit-enabled agents

## Test Case ID: TC-11-07

#### Test Case Name:

Execute Agent With Toolkit

#### Test Case Tags:

Smoke, Regression, Agent Execution, Toolkit Integration

#### Test Case Priority:

High

#### Test Case Description

Execute an agent that has one or more toolkits attached and verify successful execution with enhanced
functionality.

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
6. Create a toolkit for testing:
   - Navigate to the **Toolkits** section in the {Project}
   - Click the **+ Create** button
   - Click **Artifact**
   - Click **PgVector Configuration** dropdown and select **elitea-pgvector**
   - Click **Embedding Model** dropdown and select **text-embedding-3-large**
   - In **Bucket** field enter "Test Toolkit With Tools"
   - Click **Save** button
7. Create a test agent with toolkit for enhanced execution testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent With Toolkit"
     - Agent's description: "Test agent with toolkit for enhanced execution"
   - In **Instructions field** type: "You are an assistant with access to specialized tools to help users more
     effectively"
   - Scroll to **Toolkits** section
   - Click **+Toolkit** button
   - In the toolkit search dialog, search for "Test Toolkit With Tools"
   - Select the toolkit from the dropdown
   - Click **Add** button
   - Verify the toolkit appears in the Toolkits list
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent With Toolkit" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent With Toolkit" to open it
4. Navigate to **Configuration** tab
5. Verify in the **Toolkits** section that at least one toolkit is attached
6. Note the toolkit name and functionality
7. Navigate to **Run** tab
8. In the conversation input field, type a request that would utilize the toolkit: "Please use your tools to
   help me"
9. Click the **Send** arrow button
10. Wait for the LLM response
11. Observe the agent's response and toolkit utilization

### Expected Results

- Agent configuration shows attached toolkit(s)
- Agent executes successfully with toolkit integration
- LLM can access and utilize toolkit functions
- Response demonstrates enhanced functionality beyond basic LLM
- Toolkit tools are properly invoked when relevant
- Agent provides comprehensive assistance using available tools

### Postconditions

1. Clear conversation history if needed for subsequent tests
2. Clean up test entities:
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the "Test Agent With Toolkit" agent in the list
   - Click on the three dots menu and select **Delete**
   - Confirm deletion in the confirmation dialog
   - Navigate to the **Toolkits** section
   - Locate the "Test Toolkit With Tools" toolkit in the list
   - Click on the three dots menu and select **Delete**
   - Confirm deletion in the confirmation dialog
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document which toolkit functions were utilized during execution

## Test Case ID: TC-11-08

#### Test Case Name:

Execute Agent With Variables

#### Test Case Tags:

Regression, Agent Execution, Variables, Dynamic Content

#### Test Case Priority:

Medium

#### Test Case Description

Execute an agent that has variables configured and verify that variables are properly resolved during
execution.

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
6. Create a test agent with variables for execution testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent With Variables"
     - Agent's description: "Test agent with variables for dynamic execution"
   - In **Instructions field** type: "You are an assistant that uses variables. Hello {{user_name}}, I will
     help you with {{task_type}} tasks. My specialty is {{domain}}."
   - Scroll to **Variables** section
   - Click **+ Variable** button
   - Add first variable:
     - Name: "user_name"
     - Default value: "Test User"
   - Click **+ Variable** button again
   - Add second variable:
     - Name: "task_type"
     - Default value: "testing"
   - Click **+ Variable** button again
   - Add third variable:
     - Name: "domain"
     - Default value: "quality assurance"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent With Variables" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent With Variables" to open it
4. Navigate to **Configuration** tab
5. Verify in the **Variables** section that variables are configured
6. Note the variable names and default values
7. Navigate to **Run** tab
8. In the conversation input field, type: "Please execute using the configured variables"
9. Click the **Send** arrow button
10. Wait for the LLM response
11. Observe that variables are properly resolved in the agent's response

### Expected Results

- Agent configuration shows configured variables
- Variables section displays variable names and values
- Agent executes successfully with variable resolution
- Variable placeholders are replaced with actual values
- Response content includes resolved variable data
- Variable functionality enhances agent personalization

### Postconditions

1. Clear conversation history if needed for subsequent tests
2. Clean up test entities:
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the "Test Agent With Variables" agent in the list
   - Click on the three dots menu and select **Delete**
   - Confirm deletion in the confirmation dialog
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify variable resolution accuracy and context appropriateness

## Test Case ID: TC-11-09

#### Test Case Name:

Execute Agent Without Variables

#### Test Case Tags:

Regression, Agent Execution, No Variables

#### Test Case Priority:

Low

#### Test Case Description

Execute an agent that has no variables configured and verify normal execution without variable-dependent
functionality.

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
6. Create a test agent without variables for execution testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent No Variables"
     - Agent's description: "Test agent without variables for standard execution"
   - In **Instructions field** type: "You are a helpful assistant that provides clear and concise responses"
   - Do not add any variables (leave Variables section empty)
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent No Variables" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent No Variables" to open it
4. Navigate to **Configuration** tab
5. Verify in the **Variables** section that no variables are configured
6. Navigate to **Run** tab
7. In the conversation input field, type: "Hello, please assist me with a task"
8. Click the **Send** arrow button
9. Wait for the LLM response
10. Observe the agent's response without variable functionality

### Expected Results

- Agent configuration shows no variables configured
- Agent executes successfully without variables
- Response is generated using static agent instructions
- No variable placeholders appear in responses
- Agent functionality is not dependent on dynamic variables
- Basic agent execution works normally without variables

### Postconditions

1. Clear conversation history if needed for subsequent tests
2. Clean up test entities:
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the "Test Agent No Variables" agent in the list
   - Click on the three dots menu and select **Delete**
   - Confirm deletion in the confirmation dialog
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Ensure static content execution is stable and consistent

## Test Case ID: TC-11-10

#### Test Case Name:

Execute Agent with Single Version

#### Test Case Tags:

Regression, Agent Execution, Version Management

#### Test Case Priority:

Medium

#### Test Case Description

Execute an agent that has only one version and verify successful execution with single-version functionality.

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
6. Create a test agent with single version for execution testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Single Version"
     - Agent's description: "Test agent with single version for execution testing"
   - In **Instructions field** type: "You are a helpful assistant v1.0.0"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Single Version" agent in the agents list
   - Verify that the agent has only version v1.0.0 by default

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent Single Version" to open it
4. Navigate to **Configuration** tab
5. Verify in the version section that only one version exists
6. Navigate to **Run** tab
7. In the conversation input field, type: "Execute agent task"
8. Click the **Send** arrow button
9. Wait for the LLM response
10. Observe successful execution with single version

### Expected Results

- Agent shows single version in configuration
- Version selector (if present) shows only one option
- Agent executes successfully using the single version
- All configured functionality works properly
- Response quality matches version capabilities
- No version-related conflicts or issues occur

### Postconditions

1. Clear conversation history if needed for subsequent tests
2. Clean up test entities:
   - Navigate to the **Agents** section
   - Click on **Table view** button
   - Locate the "Test Agent Single Version" agent in the list
   - Click on the three dots menu and select **Delete**
   - Confirm deletion in the confirmation dialog
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Baseline test for version functionality

## Test Case ID: TC-11-11

#### Test Case Name:

Execute Agent with Multiple Versions and Version Switching

#### Test Case Tags:

Regression, Agent Execution, Version Management, Version Switching

#### Test Case Priority:

High

#### Test Case Description

Execute an agent that has multiple versions, switch between versions, and verify execution behavior changes
appropriately.

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
6. Create a test agent with multiple versions for version switching testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Multi Version"
     - Agent's description: "Test agent with multiple versions for version switching"
   - In **Instructions field** type: "You are a helpful assistant v1.0.0"
   - Click the **Save** button
   - Create a second version:
     - Click **+ Version** button
     - Update the **Instructions field** to: "You are an advanced assistant v2.0.0 with enhanced capabilities"
     - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Multi Version" agent in the agents list
   - Verify that multiple versions (v1.0.0 and v2.0.0) are available

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent Multi Version" to open it
4. Navigate to **Configuration** tab
5. Note the current version and available versions in the version selector
6. Navigate to **Run** tab
7. Execute agent with current version:
   - Type: "Execute task with current version"
   - Click **Send** arrow button
   - Wait for response and note the behavior
8. Return to **Configuration** tab
9. Change to a different version using the version selector
10. Navigate to **Run** tab
11. Execute agent with new version:
    - Type: "Execute task with new version"
    - Click **Send** arrow button
    - Wait for response and compare behavior with previous version

### Expected Results

- Multiple versions are visible in version selector
- Version switching works smoothly
- Agent executes successfully with first version
- Version change is applied correctly
- Agent executes successfully with second version
- Behavior differences (if any) are observed between versions
- Each version maintains its specific configuration and functionality

### Postconditions

1. Clear conversation history if needed for subsequent tests
2. Reset to preferred version if needed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document differences observed between versions

## Test Case ID: TC-11-12

#### Test Case Name:

Execute Agent from Full Screen Mode

#### Test Case Tags:

Regression, Agent Execution, Full Screen Mode, UI

#### Test Case Priority:

Medium

#### Test Case Description

Execute an agent while in full screen mode and verify all functionality works properly in the expanded
interface.

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
6. Create a test agent for full screen mode testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Full Screen"
     - Agent's description: "Test agent for full screen mode execution"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Full Screen" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Locate and click the **Full Screen** button/icon
6. Verify the interface expands to full screen mode
7. In the full screen conversation input field, type: "Execute agent in full screen mode"
8. Click the **Send** arrow button
9. Wait for the LLM response
10. Observe the agent execution and response in full screen mode
11. Exit full screen mode and verify normal functionality

### Expected Results

- Full screen button is visible and functional
- Interface expands properly to full screen mode
- All conversation functionality remains available in full screen
- Input field and send button work normally
- Agent executes successfully in full screen mode
- Response display is optimized for full screen view
- Exit full screen returns to normal mode successfully
- User experience is enhanced in full screen mode

### Postconditions

1. Ensure interface returns to normal mode
2. Clear conversation history if needed for subsequent tests
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify responsive design and functionality in full screen

## Test Case ID: TC-11-13

#### Test Case Name:

Execute Agent After Changing LLM Temperature Settings

#### Test Case Tags:

Regression, Agent Execution, LLM Settings, Temperature

#### Test Case Priority:

Medium

#### Test Case Description

Modify the LLM temperature setting, apply changes, and execute the agent to verify the setting change affects
response behavior.

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
6. Create a test agent for LLM temperature settings testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Temperature"
     - Agent's description: "Test agent for LLM temperature settings modification"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Temperature" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Configuration** tab
5. Scroll to the **LLM Settings** section
6. Note the current temperature value
7. Change the temperature to a different value (e.g., from 0.7 to 0.3)
8. Click **Apply** or **Save** to confirm the changes
9. Navigate to **Run** tab
10. Execute the agent:
    - Type: "Generate a creative response about technology"
    - Click **Send** arrow button
    - Wait for response and observe the style/creativity level
11. Return to configuration and change temperature to a higher value (e.g., 0.9)
12. Apply changes and execute again with the same prompt
13. Compare response characteristics

### Expected Results

- Temperature setting is visible and editable
- Apply/Save functionality works for temperature changes
- Agent executes successfully with modified temperature
- Lower temperature produces more focused, deterministic responses
- Higher temperature produces more creative, varied responses
- Response style reflects the temperature setting appropriately
- Setting changes persist between executions

### Postconditions

1. Reset temperature to original value if needed
2. Clear conversation history if needed for subsequent tests
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document response characteristics at different temperature values

## Test Case ID: TC-11-14

#### Test Case Name:

Execute Agent After Changing LLM Top-P Settings

#### Test Case Tags:

Regression, Agent Execution, LLM Settings, Top-P

#### Test Case Priority:

Medium

#### Test Case Description

Modify the LLM top-p setting, apply changes, and execute the agent to verify the setting change affects
response behavior.

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
6. Create a test agent for LLM top-p settings testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for LLM top-p settings testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Configuration** tab
5. Scroll to the **LLM Settings** section
6. Note the current top-p value
7. Change the top-p to a different value (e.g., from 0.9 to 0.5)
8. Click **Apply** or **Save** to confirm the changes
9. Navigate to **Run** tab
10. Execute the agent:
    - Type: "Explain artificial intelligence concepts"
    - Click **Send** arrow button
    - Wait for response and observe the diversity/focus
11. Return to configuration and change top-p to a higher value (e.g., 0.95)
12. Apply changes and execute again with the same prompt
13. Compare response characteristics

### Expected Results

- Top-p setting is visible and editable
- Apply/Save functionality works for top-p changes
- Agent executes successfully with modified top-p
- Lower top-p produces more focused, less diverse responses
- Higher top-p produces more diverse, varied responses
- Response diversity reflects the top-p setting appropriately
- Setting changes are applied correctly to agent execution

### Postconditions

1. Reset top-p to original value if needed
2. Clear conversation history if needed for subsequent tests
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document response diversity at different top-p values

## Test Case ID: TC-11-15

#### Test Case Name:

Execute Agent After Changing LLM Max Tokens Settings

#### Test Case Tags:

Regression, Agent Execution, LLM Settings, Max Tokens

#### Test Case Priority:

Medium

#### Test Case Description

Modify the LLM max tokens setting, apply changes, and execute the agent to verify the setting change affects
response length.

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
6. Create a test agent for LLM max tokens settings testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for LLM max tokens settings testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Configuration** tab
5. Scroll to the **LLM Settings** section
6. Note the current max tokens value
7. Change the max tokens to a lower value (e.g., from 1000 to 100)
8. Click **Apply** or **Save** to confirm the changes
9. Navigate to **Run** tab
10. Execute the agent:
    - Type: "Please provide a detailed explanation of machine learning algorithms"
    - Click **Send** arrow button
    - Wait for response and observe the length
11. Return to configuration and change max tokens to a higher value (e.g., 2000)
12. Apply changes and execute again with the same prompt
13. Compare response lengths

### Expected Results

- Max tokens setting is visible and editable
- Apply/Save functionality works for max tokens changes
- Agent executes successfully with modified max tokens
- Lower max tokens produces shorter, truncated responses
- Higher max tokens allows for longer, more complete responses
- Response length respects the max tokens limit
- Setting changes control response length appropriately

### Postconditions

1. Reset max tokens to original value if needed
2. Clear conversation history if needed for subsequent tests
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document actual response lengths with different max token values

## Test Case ID: TC-11-16

#### Test Case Name:

Cancel LLM Temperature Changes and Execute Agent

#### Test Case Tags:

Regression, Agent Execution, LLM Settings, Cancel Changes

#### Test Case Priority:

Low

#### Test Case Description

Modify the LLM temperature setting, cancel the changes without applying, and execute the agent to verify
original settings are maintained.

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
6. Create a test agent for LLM temperature cancel changes testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for LLM temperature cancel changes testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Configuration** tab
5. Scroll to the **LLM Settings** section
6. Note the current temperature value
7. Change the temperature to a different value (e.g., from 0.7 to 0.2)
8. Click **Cancel** or navigate away without saving/applying changes
9. Return to **Configuration** tab and verify temperature shows original value
10. Navigate to **Run** tab
11. Execute the agent:
    - Type: "Generate a response about innovation"
    - Click **Send** arrow button
    - Wait for response and observe behavior matches original settings

### Expected Results

- Temperature change is visible while editing
- Cancel functionality properly discards changes
- Temperature reverts to original value after cancel
- Agent configuration shows original temperature value
- Agent executes with original temperature settings
- Response behavior matches original configuration
- No unintended setting changes persist

### Postconditions

1. Verify settings remain at original values
2. Clear conversation history if needed for subsequent tests
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify cancel functionality for settings management

## Test Case ID: TC-11-17

#### Test Case Name:

Cancel LLM Top-P Changes and Execute Agent

#### Test Case Tags:

Regression, Agent Execution, LLM Settings, Cancel Changes

#### Test Case Priority:

Low

#### Test Case Description

Modify the LLM top-p setting, cancel the changes without applying, and execute the agent to verify original
settings are maintained.

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
6. Create a test agent for LLM top-p cancel changes testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for LLM top-p cancel changes testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Configuration** tab
5. Scroll to the **LLM Settings** section
6. Note the current top-p value
7. Change the top-p to a different value (e.g., from 0.9 to 0.3)
8. Click **Cancel** or navigate away without saving/applying changes
9. Return to **Configuration** tab and verify top-p shows original value
10. Navigate to **Run** tab
11. Execute the agent:
    - Type: "Describe the future of technology"
    - Click **Send** arrow button
    - Wait for response and observe behavior matches original settings

### Expected Results

- Top-p change is visible while editing
- Cancel functionality properly discards changes
- Top-p reverts to original value after cancel
- Agent configuration shows original top-p value
- Agent executes with original top-p settings
- Response behavior matches original configuration
- No unintended setting changes persist

### Postconditions

1. Verify settings remain at original values
2. Clear conversation history if needed for subsequent tests
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Ensure cancel functionality works consistently across settings

## Test Case ID: TC-11-18

#### Test Case Name:

Cancel LLM Max Tokens Changes and Execute Agent

#### Test Case Tags:

Regression, Agent Execution, LLM Settings, Cancel Changes

#### Test Case Priority:

Low

#### Test Case Description

Modify the LLM max tokens setting, cancel the changes without applying, and execute the agent to verify
original settings are maintained.

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
6. Create a test agent for LLM max tokens cancel changes testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for LLM max tokens cancel changes testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Configuration** tab
5. Scroll to the **LLM Settings** section
6. Note the current max tokens value
7. Change the max tokens to a different value (e.g., from 1000 to 200)
8. Click **Cancel** or navigate away without saving/applying changes
9. Return to **Configuration** tab and verify max tokens shows original value
10. Navigate to **Run** tab
11. Execute the agent:
    - Type: "Please provide a comprehensive overview of cloud computing"
    - Click **Send** arrow button
    - Wait for response and observe length matches original settings

### Expected Results

- Max tokens change is visible while editing
- Cancel functionality properly discards changes
- Max tokens reverts to original value after cancel
- Agent configuration shows original max tokens value
- Agent executes with original max tokens settings
- Response length matches original configuration
- No unintended setting changes persist

### Postconditions

1. Verify settings remain at original values
2. Clear conversation history if needed for subsequent tests
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Confirm cancel behavior is consistent across all LLM settings

## Test Case ID: TC-11-19

#### Test Case Name:

Execute Agent in Public Project with Conversation Starter

#### Test Case Tags:

Regression, Agent Execution, Public Project, Conversation Starter

#### Test Case Priority:

Medium

#### Test Case Description

Navigate to a public project and execute an agent using conversation starter functionality.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User has permissions models.applications.version.update, models.applications.upload_icon.delete,
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
5. Create a test agent and publish it to create a public project scenario:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Public Agent"
     - Agent's description: "Test agent for public project execution"
   - Click **+ starter** button
   - Enter conversation starter text: "Execute public agent test task"
   - Click the **Save** button
   - Click **Publish** button to make the agent publicly available
   - Confirm publishing in the confirmation dialog
   - Navigate to **Public Projects** or **Discover** section
   - Locate the published agent for testing

### Test Steps

1. Navigate to the **Projects** section or use the project switcher
2. Locate and switch to a **Public** project
3. Navigate to the **Agents** section in the public project
4. Click on **Table view** button
5. Locate an agent with conversation starters and click to open it
6. Navigate to **Run** tab
7. Observe the conversation starter options available
8. Click on a conversation starter
9. Observe that the starter text populates the input field
10. Click the **Send** arrow button
11. Wait for the LLM response
12. Observe the agent execution in the public project context

### Expected Results

- Public project is accessible and loads successfully
- Agents section is available in public project
- Agent opens successfully with full functionality
- Conversation starters are visible and functional
- Clicking starter populates input field correctly
- Agent executes successfully in public project context
- LLM responds appropriately to conversation starter
- Public project execution works similarly to private projects

### Postconditions

1. Clear conversation history if needed
2. Return to original project if needed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Compare functionality between public and private project execution

## Test Case ID: TC-11-20

#### Test Case Name:

Execute Agent in Public Project without Conversation Starter

#### Test Case Tags:

Regression, Agent Execution, Public Project, Manual Input

#### Test Case Priority:

Medium

#### Test Case Description

Navigate to a public project and execute an agent using manual input without conversation starters.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. A public project exists with agents available
5. User has permissions to access public projects and execute agents

### Test Steps

1. Navigate to the **Projects** section or use the project switcher
2. Locate and switch to a **Public** project
3. Navigate to the **Agents** section in the public project
4. Click on **Table view** button
5. Locate any available agent and click to open it
6. Navigate to **Run** tab
7. In the conversation input field, manually type: "Hello, please help me with my question"
8. Click the **Send** arrow button
9. Wait for the LLM response
10. Observe the agent execution and response in the public project

### Expected Results

- Public project is accessible and functional
- Agent opens and loads correctly
- Manual input is accepted in conversation field
- Send functionality works in public project context
- Agent executes successfully with manual input
- LLM provides appropriate response
- Public project agent execution mirrors private project functionality

### Postconditions

1. Clear conversation history if needed
2. Return to original project if needed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify consistent behavior across project types

## Test Case ID: TC-11-21

#### Test Case Name:

Execute Agent with Attached Image File

#### Test Case Tags:

Regression, Agent Execution, File Attachment, Image Files

#### Test Case Priority:

Medium

#### Test Case Description

Execute an agent with an image file attached to verify file attachment functionality works properly.

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
6. Create a test agent for image file attachment testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for image file attachment testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. An image file is available for attachment (e.g., .jpg, .png, .gif)

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Locate the file attachment button/icon (e.g., paperclip or attach icon)
6. Click the attachment button
7. Select and upload an image file
8. Verify the image file appears as attached in the conversation interface
9. In the conversation input field, type: "Please analyze the attached image"
10. Click the **Send** arrow button
11. Wait for the LLM response
12. Observe the agent's ability to process and respond to the attached image

### Expected Results

- File attachment functionality is available and visible
- Image file uploads successfully
- Attached file is displayed in the interface
- Agent accepts the combination of text and image input
- Agent executes successfully with attached file
- LLM can process and analyze the attached image
- Response demonstrates understanding of the image content
- File attachment enhances agent capabilities

### Postconditions

1. Clear conversation history and remove attached files if needed
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
3. Verify no residual data remains from the deleted agent
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test with different image formats and sizes
- Document agent's image analysis capabilities

## Test Case ID: TC-11-22

#### Test Case Name:

Execute Agent without Attached Files

#### Test Case Tags:

Smoke, Agent Execution, No Attachments

#### Test Case Priority:

Low

#### Test Case Description

Execute an agent without any attached files to verify standard text-only execution works properly.

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
6. Create a test agent for text-only execution testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for text-only execution testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Verify no files are attached to the conversation
6. In the conversation input field, type: "Please help me with a text-based task"
7. Click the **Send** arrow button
8. Wait for the LLM response
9. Observe standard agent execution without file dependencies

### Expected Results

- Agent interface loads without attached files
- Text input works normally without attachments
- Agent executes successfully with text-only input
- LLM responds appropriately to text-based requests
- No file-related functionality is attempted
- Standard conversation flow works as expected

### Postconditions

1. Clear conversation history if needed for subsequent tests
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
3. Verify no residual data remains from the deleted agent
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Baseline test for standard text-only agent execution

## Additional Test Cases for Enhanced Coverage

## Test Case ID: TC-11-23

#### Test Case Name:

Execute Agent with Multiple File Attachments

#### Test Case Tags:

Regression, Agent Execution, Multiple Attachments

#### Test Case Priority:

Low

#### Test Case Description

Execute an agent with multiple files attached to verify multi-file handling capabilities.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions for agent execution and file attachments
6. Multiple image files are available for attachment

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Attach multiple image files (2-3 files) using the attachment functionality
6. Verify all files appear as attached in the interface
7. Type: "Please analyze all attached images and compare them"
8. Click the **Send** arrow button
9. Wait for the LLM response
10. Observe multi-file processing capabilities

### Expected Results

- Multiple file attachments are supported
- All attached files are displayed correctly
- Agent processes all attached files simultaneously
- Response references multiple images appropriately
- Multi-file functionality enhances agent analysis capabilities

### Postconditions

1. Clear conversation history and remove attached files
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test system limits for number of simultaneous attachments

## Test Case ID: TC-11-24

#### Test Case Name:

Execute Agent with Large File Attachment

#### Test Case Tags:

Regression, Agent Execution, Large Files, Performance

#### Test Case Priority:

Low

#### Test Case Description

Execute an agent with a large image file to test file size handling and performance.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions for agent execution and file attachments
6. A large image file (>5MB if supported) is available for testing

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Attempt to attach a large image file
6. Monitor upload progress and completion
7. If upload succeeds, type: "Please analyze this large image file"
8. Click the **Send** arrow button
9. Monitor processing time and system performance
10. Observe response quality with large file

### Expected Results

- Large files are handled appropriately within system limits
- Upload progress is displayed during file transfer
- System provides feedback on file size limitations if applicable
- Agent processes large files without errors or timeouts
- Performance remains acceptable with large file processing

### Postconditions

1. Clear conversation history and remove large files
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document maximum supported file sizes and performance impact

## Test Case ID: TC-11-25

#### Test Case Name:

Execute Agent with Unsupported File Type

#### Test Case Tags:

Negative Testing, Agent Execution, File Validation

#### Test Case Priority:

Low

#### Test Case Description

Attempt to execute an agent with an unsupported file type to verify proper error handling.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions for agent execution
6. Unsupported file types are available for testing (e.g., .exe, .zip, .pdf)

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Attempt to attach an unsupported file type
6. Observe system response and error messages
7. If attachment is blocked, verify error message clarity
8. If attachment succeeds, attempt to execute agent
9. Observe agent behavior with unsupported file type

### Expected Results

- Unsupported file types are properly identified and rejected
- Clear error messages explain file type restrictions
- System prevents execution with invalid attachments
- Agent execution is not broken by invalid attachment attempts
- User receives helpful guidance on supported file types

### Postconditions

1. Clear any error states or messages
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document supported vs unsupported file types for reference

## Test Case ID: TC-11-26

#### Test Case Name:

Execute Agent with Mixed Content (Text + Image + Conversation Starter)

#### Test Case Tags:

Integration, Agent Execution, Mixed Content

#### Test Case Priority:

Medium

#### Test Case Description

Execute an agent using conversation starter with additional manual text and image attachment to test
integrated functionality.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions for agent execution and file attachments
6. A test agent with conversation starters exists
7. An image file is available for attachment

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Click on a conversation starter to populate initial text
6. Add additional manual text to the conversation starter content
7. Attach an image file using the attachment functionality
8. Verify all content types are visible: starter text, manual text, and image
9. Click the **Send** arrow button
10. Wait for the LLM response
11. Observe how agent processes the mixed content types

### Expected Results

- All content types (starter, manual text, image) are accepted together
- Mixed content is displayed properly in the interface
- Agent processes all input elements in combination
- Response incorporates and references all input types appropriately
- Mixed content functionality enhances agent versatility

### Postconditions

1. Clear conversation history and attachments
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test various combinations of content types for comprehensive coverage

## Test Case ID: TC-11-27

#### Test Case Name:

Execute Agent During Network Interruption

#### Test Case Tags:

Reliability, Agent Execution, Network Issues

#### Test Case Priority:

Low

#### Test Case Description

Execute an agent and simulate network interruption to test error handling and recovery mechanisms.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions for agent execution
6. Network simulation capabilities are available for testing

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Type: "Please provide a detailed response about artificial intelligence"
6. Click the **Send** arrow button
7. During processing, simulate network disconnection
8. Observe system response to network loss
9. Restore network connection
10. Observe system recovery behavior
11. Verify conversation state and data integrity

### Expected Results

- Network issues are detected and reported to user
- Appropriate error messages are displayed during connectivity loss
- System maintains conversation state during interruption
- Network restoration is detected automatically
- System recovers gracefully with option to retry failed requests
- Data integrity is maintained throughout the process

### Postconditions

1. Ensure network connectivity is restored
2. Clear any error states or incomplete requests
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document system behavior under various network conditions

## Test Case ID: TC-11-28

#### Test Case Name:

Execute Agent with Maximum Token Response Testing

#### Test Case Tags:

Boundary Testing, Agent Execution, Token Limits

#### Test Case Priority:

Low

#### Test Case Description

Execute an agent with a request designed to produce maximum token response and verify token limit handling.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions for agent execution
6. A test agent exists with configurable max token settings

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Configuration** tab
5. Set max tokens to the highest allowed value
6. Save configuration changes
7. Navigate to **Run** tab
8. Type a request for comprehensive, detailed response: "Please provide an exhaustive, detailed explanation of
   machine learning, deep learning, artificial intelligence, and their applications"
9. Click the **Send** arrow button
10. Wait for response and monitor token usage
11. Observe how system handles token limit boundaries

### Expected Results

- Agent respects maximum token limits strictly
- Response is properly truncated at token boundary if needed
- Token limit handling is graceful without errors
- System provides indication when response is truncated
- Response quality remains high up to the token limit
- No system errors occur at token boundaries

### Postconditions

1. Reset max tokens to reasonable default value
2. Clear conversation history
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document actual token usage and truncation behavior

## Summary of Additional Suggested Test Cases for Comprehensive Coverage

Based on thorough analysis, here are additional test scenarios that would further enhance test coverage:

### **Performance and Load Testing:**

- Execute agent with concurrent multiple users
- Execute agent with extensive conversation history (50+ exchanges)
- Execute agent with rapid successive requests (stress testing)

### **Advanced Error Handling:**

- Execute agent when LLM service is temporarily unavailable
- Execute agent with malformed or corrupted conversation starters
- Execute agent with invalid or corrupted agent configuration

### **Security and Access Control:**

- Execute agent with unauthorized access attempts
- Execute agent with malicious input injection attempts
- Execute agent with cross-project unauthorized access

### **Integration and Dependency Testing:**

- Execute agent with external API dependencies failing
- Execute agent during database connectivity issues
- Execute agent with third-party toolkit service interruptions

### **Browser and Platform Compatibility:**

- Execute agent across different browsers (Chrome, Firefox, Safari, Edge)
- Execute agent with various browser extensions enabled
- Execute agent on different screen resolutions and viewport sizes

### **Mobile and Responsive Testing:**

- Execute agent on mobile devices (iOS/Android)
- Execute agent with touch interactions and gestures
- Execute agent with mobile virtual keyboard

### **Advanced UI and UX Testing:**

- Execute agent with accessibility tools enabled
- Execute agent with dark/light theme switching during execution
- Execute agent with browser zoom at different levels

### **Data Persistence and State Management:**

- Execute agent and verify conversation persistence across sessions
- Execute agent and test conversation export/import functionality
- Execute agent with browser refresh during execution

These comprehensive test cases provide thorough coverage of agent execution functionality across various
scenarios, edge cases, and system conditions, ensuring robust testing of the agent execution feature.

## Test Case ID: TC-11-29

#### Test Case Name:

Execute Agent with Empty/Blank Input

#### Test Case Tags:

Negative Testing, Agent Execution, Edge Cases

#### Test Case Priority:

Medium

#### Test Case Description

Attempt to execute an agent with empty or blank input to verify proper handling of null/empty requests.

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
6. Create a test agent for empty input testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for empty input testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Leave the conversation input field completely empty
6. Click the **Send** arrow button
7. Observe system response to empty input
8. Try with only whitespace characters (spaces, tabs)
9. Click **Send** arrow button again
10. Observe system handling of whitespace-only input

### Expected Results

- Send button behavior with empty input (disabled or shows validation)
- Appropriate error message or guidance for empty input
- System prevents sending empty messages or handles gracefully
- Whitespace-only input is properly validated
- No system errors or crashes with invalid input

### Postconditions

1. Clear any error states
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document validation behavior for empty input scenarios

## Test Case ID: TC-11-30

#### Test Case Name:

Execute Agent with Extremely Long Input Text

#### Test Case Tags:

Boundary Testing, Agent Execution, Input Limits

#### Test Case Priority:

Low

#### Test Case Description

Execute an agent with extremely long input text to test input field limits and processing capabilities.

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
6. Create a test agent for long input testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for long input testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Enter extremely long text (e.g., 10,000+ characters) in the input field
6. Observe input field behavior and character limits
7. Attempt to send the long input
8. Monitor system performance and response handling
9. Observe if input is truncated or processed completely

### Expected Results

- Input field enforces character limits appropriately
- System handles long input without performance degradation
- Clear indication of character limits if enforced
- Long input is processed or rejected gracefully
- No system crashes or errors with extreme input lengths

### Postconditions

1. Clear conversation history
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document maximum input length limits and system behavior

## Test Case ID: TC-11-31

#### Test Case Name:

Execute Agent with Special Characters and Unicode

#### Test Case Tags:

Internationalization, Agent Execution, Character Encoding

#### Test Case Priority:

Medium

#### Test Case Description

Execute an agent with special characters, emojis, and Unicode text to verify proper character handling.

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
6. Create a test agent for special characters and Unicode testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for special characters and Unicode testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Enter text with special characters: "Hello! @#$%^&\*()\_+{}|:<>?[]\\;',./"
6. Click **Send** arrow button and observe response
7. Enter text with emojis: "Test with emojis 😀🎉🚀💡🌟"
8. Click **Send** arrow button and observe response
9. Enter text with Unicode characters: "Testing with äöü ñ 中文 العربية русский"
10. Click **Send** arrow button and observe response

### Expected Results

- All special characters are displayed correctly in input field
- Special characters are transmitted and processed properly
- Emojis render correctly in both input and response
- Unicode text from various languages is handled properly
- Agent responses maintain character encoding integrity
- No character corruption or encoding issues occur

### Postconditions

1. Clear conversation history
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test various character sets and encoding scenarios

## Test Case ID: TC-11-32

#### Test Case Name:

Execute Agent While Switching Between Tabs/Windows

#### Test Case Tags:

UI Testing, Agent Execution, Browser Behavior

#### Test Case Priority:

Low

#### Test Case Description

Execute an agent and switch between browser tabs/windows to verify execution continues properly.

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
6. Create a test agent for tab switching testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for tab switching testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Type: "Please provide a detailed analysis that takes time to process"
6. Click the **Send** arrow button
7. Immediately switch to another browser tab
8. Wait for a few seconds, then return to the agent tab
9. Observe if the response completed properly
10. Test switching between browser windows during execution

### Expected Results

- Agent execution continues in background when tab is not active
- Response completes successfully regardless of tab switching
- UI state is maintained when returning to agent tab
- No execution interruption due to tab switching
- Background processing works reliably

### Postconditions

1. Close any additional tabs/windows opened for testing
2. Clear conversation history
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. Verify no residual data remains from the deleted agent
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify background execution reliability

## Test Case ID: TC-11-33

#### Test Case Name:

Execute Agent with Session Timeout Scenario

#### Test Case Tags:

Session Management, Agent Execution, Timeout Handling

#### Test Case Priority:

Medium

#### Test Case Description

Execute an agent after extended idle time to verify session timeout handling and re-authentication.

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
6. Create a test agent for session timeout testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for session timeout testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Session timeout settings are configured in the system

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Leave the browser idle for extended period (beyond session timeout)
6. Return and attempt to execute agent: "Test message after timeout"
7. Click the **Send** arrow button
8. Observe system response to expired session
9. Complete re-authentication if prompted
10. Retry agent execution after re-authentication

### Expected Results

- System detects session timeout appropriately
- Clear indication when session has expired
- Graceful re-authentication process is available
- Agent execution works normally after re-authentication
- Conversation state handling during timeout is appropriate
- User experience during timeout scenario is smooth

### Postconditions

1. Ensure valid session is established
2. Clear conversation history
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document session timeout behavior and re-authentication flow

## Test Case ID: TC-11-34

#### Test Case Name:

Execute Agent with Copy-Paste Large Content

#### Test Case Tags:

Input Methods, Agent Execution, Large Content

#### Test Case Priority:

Low

#### Test Case Description

Execute an agent by copying and pasting large content from external sources to verify paste functionality.

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
6. Create a test agent for copy-paste content testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for copy-paste content testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Large text content is available for copying (e.g., from a document or webpage)

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Copy large text content from an external source (e.g., multiple paragraphs)
6. Paste the content into the conversation input field
7. Verify the pasted content appears correctly
8. Add additional text: "Please analyze the above content"
9. Click the **Send** arrow button
10. Observe agent processing of pasted content

### Expected Results

- Copy-paste functionality works smoothly in input field
- Large pasted content is displayed correctly
- Input field handles pasted content without formatting issues
- Agent processes pasted content appropriately
- Combination of pasted and typed content works together
- No character limit issues with pasted content

### Postconditions

1. Clear conversation history
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test various paste scenarios and content types

## Test Case ID: TC-11-35

#### Test Case Name:

Execute Agent with Rapid Sequential Messages

#### Test Case Tags:

Stress Testing, Agent Execution, Message Queue

#### Test Case Priority:

Medium

#### Test Case Description

Send multiple messages rapidly in sequence to test message queuing and processing capabilities.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions for agent execution
6. A test agent named "Test Agent" exists in the project

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Quickly send multiple sequential messages:
   - Type "Message 1" and click Send
   - Immediately type "Message 2" and click Send
   - Immediately type "Message 3" and click Send
   - Continue for 5-7 rapid messages
6. Observe message queuing and processing order
7. Monitor system performance during rapid messaging
8. Verify all messages are processed in correct order

### Expected Results

- System handles rapid sequential messages gracefully
- Messages are queued and processed in correct order
- No messages are lost during rapid input
- System performance remains stable under rapid messaging
- UI remains responsive during message processing
- Each message receives appropriate individual response

### Postconditions

1. Wait for all messages to complete processing
2. Clear conversation history
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Monitor system behavior under rapid user input

## Test Case ID: TC-11-36

#### Test Case Name:

Execute Agent with Conversation History Persistence

#### Test Case Tags:

Data Persistence, Agent Execution, Conversation History

#### Test Case Priority:

Medium

#### Test Case Description

Execute an agent, close/reopen the session, and verify conversation history is properly maintained.

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
6. Create a test agent for conversation history persistence testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for conversation history persistence testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click on **Table view** button
3. Locate and click on "Test Agent" to open it
4. Navigate to **Run** tab
5. Send several messages to create conversation history:
   - "Hello, this is message 1"
   - "This is message 2 for history test"
   - "Final message 3 for persistence test"
6. Wait for all responses to complete
7. Close the browser tab or navigate away from the agent
8. Reopen the agent and navigate to **Run** tab
9. Observe if conversation history is maintained
10. Send a new message: "New message after reopening"
11. Verify the new message continues the conversation properly

### Expected Results

- Conversation history is preserved when reopening agent
- All previous messages and responses are visible
- Conversation context is maintained across sessions
- New messages continue the conversation appropriately
- No data loss occurs during session interruptions
- History persistence works reliably

### Postconditions

1. Clear conversation history for cleanup
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify data persistence mechanisms and reliability

## Test Case ID: TC-11-37

#### Test Case Name:

Execute Agent with Different User Roles/Permissions

#### Test Case Tags:

Access Control, Agent Execution, User Roles

#### Test Case Priority:

High

#### Test Case Description

Execute an agent with different user roles to verify proper access control and permission handling.

### Preconditions

1. Multiple user accounts with different roles/permissions are available
2. Users navigate to {URL}
3. Create a test agent for user roles testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test agent for user roles testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
4. Different permission levels are configured (Admin, User, Guest, etc.)

### Test Steps

1. **Test with Admin User:**
   - Log in with admin credentials
   - Navigate to **Agents** section and open "Test Agent"
   - Execute agent and observe full functionality
2. **Test with Regular User:**
   - Log out and log in with regular user credentials
   - Navigate to **Agents** section and open "Test Agent"
   - Execute agent and observe available functionality
3. **Test with Limited Permissions User:**
   - Log out and log in with limited permissions user
   - Attempt to access and execute agent
   - Observe permission restrictions and error handling
4. **Test with Guest User (if applicable):**
   - Access system with guest credentials
   - Attempt agent execution and observe restrictions

### Expected Results

- Each user role has appropriate access levels
- Admin users have full agent execution capabilities
- Regular users have expected functionality based on permissions
- Limited permission users see appropriate restrictions
- Proper error messages for insufficient permissions
- Security controls work as designed

### Postconditions

1. Log out from all test accounts
2. Clean up any test data created
3. Verify no unauthorized access occurred

### Notes

- Document permission matrix and access control behavior

## Test Case ID: TC-11-38

#### Test Case Name:

Execute Agent with Browser Back/Forward Navigation

#### Test Case Tags:

Navigation, Agent Execution, Browser History

#### Test Case Priority:

Low

#### Test Case Description

Execute an agent and use browser back/forward buttons to verify proper navigation handling.

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
6. Create a test agent for navigation testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Navigation"
     - Agent's description: "Test agent for navigation testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Navigation" agent in the agents list

### Test Steps

1. Click on the "Test Agent Navigation" agent to open it
2. Navigate to **Run** tab
3. Send a test message: "Test message before navigation"
4. Wait for response
5. Navigate to **Configuration** tab
6. Use browser back button to return to Run tab
7. Verify conversation state is maintained
8. Use browser forward button to go to Configuration tab
9. Use back button again and send another message
10. Observe system behavior with navigation actions

### Expected Results

- Browser back/forward buttons work properly
- Conversation state is maintained during navigation
- Agent execution continues to work after navigation
- No data loss occurs with browser navigation
- UI state is preserved appropriately
- Navigation doesn't interrupt ongoing processes

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Navigation" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Verify browser navigation compatibility

## Test Case ID: TC-11-39

#### Test Case Name:

Verify Stop Button Exists and is Clickable During Agent Execution

#### Test Case Tags:

UI Testing, Agent Execution, Stop Button, Control

#### Test Case Priority:

High

#### Test Case Description

Verify that the stop button is visible and clickable during agent execution, particularly during thinking
steps.

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
6. Create a test agent for stop button testing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Stop Button"
     - Agent's description: "Test agent for stop button functionality"
   - In **Instructions field** type detailed text that would require thinking steps: "Please analyze complex
     problems step by step, showing your reasoning process with detailed thinking steps before providing the
     final answer"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Stop Button" agent in the agents list

### Test Steps

1. Click on the "Test Agent Stop Button" agent to open it
2. Navigate to **Run** tab
3. Type a complex request that would trigger thinking steps: "Please provide a detailed analysis of artificial
   intelligence, machine learning, and deep learning, showing your step-by-step reasoning process"
4. Click the **Send** arrow button
5. Immediately observe the interface during agent processing
6. Look for the **Stop** button during thinking steps
7. Verify the stop button is visible and properly styled
8. Hover over the stop button to check for hover effects
9. Verify the stop button appears clickable (not disabled)
10. Note the position and accessibility of the stop button

### Expected Results

- Stop button is visible during agent execution
- Stop button appears during thinking steps phase
- Button is properly styled and recognizable
- Button shows appropriate hover effects when hovered
- Button appears clickable (not grayed out or disabled)
- Button is positioned accessibly in the UI
- Button maintains consistent appearance during execution

### Postconditions

1. Wait for agent execution to complete or manually stop if needed
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Stop Button" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
3. Verify no residual data remains from the deleted agent
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document stop button appearance and UI placement

## Test Case ID: TC-11-40

#### Test Case Name:

Stop Agent Execution During Thinking Steps Using Stop Button

#### Test Case Tags:

Functional Testing, Agent Execution, Stop Button, Interruption

#### Test Case Priority:

High

#### Test Case Description

Execute an agent with complex reasoning requirements and use the stop button to interrupt the thinking steps,
verifying that execution stops properly.

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
6. Create a test agent with toolkit for complex processing:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent Stop Execution"
     - Agent's description: "Test agent for stop execution functionality"
   - In **Instructions field** type: "You are an analytical agent that shows detailed step-by-step thinking
     processes. Always use multiple thinking steps to analyze problems thoroughly before providing answers"
   - Optionally add a toolkit if available:
     - Scroll to **Toolkits** section
     - Click **+Toolkit** button
     - Search for and select an available toolkit
     - Click **Add** button
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Stop Execution" agent in the agents list

### Test Steps

1. Click on the "Test Agent Stop Execution" agent to open it
2. Navigate to **Run** tab
3. Type a complex analytical request: "Please perform a comprehensive analysis of the economic impacts of
   artificial intelligence on various industries, considering both positive and negative effects, short-term
   and long-term implications, and provide detailed recommendations"
4. Click the **Send** arrow button
5. Wait for thinking steps to begin (observe "thinking..." or similar indicators)
6. During the thinking steps phase, locate the **Stop** button
7. Click the **Stop** button while thinking is in progress
8. Observe the immediate system response
9. Verify that thinking steps are interrupted
10. Check the conversation state after stopping
11. Attempt to send a new message after stopping to verify system is responsive

### Expected Results

- Agent begins execution and enters thinking steps phase
- Stop button is accessible during thinking steps
- Clicking stop button immediately interrupts the thinking process
- Thinking steps stop and do not continue
- System shows appropriate feedback that execution was stopped
- Conversation interface returns to ready state
- No partial or incomplete responses are displayed
- New messages can be sent normally after stopping
- System remains stable after interruption

### Postconditions

1. Verify conversation interface is in normal state
2. Clear any incomplete conversation state if needed
3. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent Stop Execution" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
4. If toolkit was added, verify it remains available for other agents
5. Verify no residual data remains from the deleted agent
6. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Document stop functionality behavior and system responsiveness
