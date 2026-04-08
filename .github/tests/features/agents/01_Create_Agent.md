# Scenario ID: CA-01

#### Scenario Name:

Creating an Agent with all required fields and optional fields

#### Scenario Tags:

Agent Creation, UI Testing, Functional

#### Scenario Priority:

High

#### Scenario Description

Ensure that the agent can be created successfully by filling in all required fields as well as optional
fields.

## Test Case ID: TC-01-01

#### Test Case Name:

Create an agent filled mandatory fields with valid values

#### Test Case Tags:

Smoke, Regression, Agent Creation, Required Fields

#### Test Case Priority:

High

#### Test Case Description

Ensure the agent can be created by filling only the required fields.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click the **+ Create** Create Agent button
3. Fill in all the required fields:
   - Agent's name using valid symbols and valid length (from 1 up to 64 characters)
   - Agent's description using valid symbols and valid length (from 1 up to 512 characters)
4. Click the **Save** button

### Expected Results

- Agent creation screen loads without error
- Required fields are validated
- Agent is created
- The new agent is visible in the agents list

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-02

#### Test Case Name:

Create an agent with all fields (required + optional)

#### Test Case Tags:

Smoke, Regression, Agent Creation, Optional Fields

#### Test Case Priority:

High

#### Test Case Description

Ensure the agent can be created by filling in both required and optional fields.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,

### Test Steps

1. Navigate to the **Agents** section in the {Project} of application
2. Click the **+ Create** button
3. Fill in all required fields and populate optional fields with valid values:
   - Agent's name using valid symbols and valid length (from 1 up to 64 characters)
   - Agent's description using valid symbols and valid length (from 1 up to 512 characters)
   - In **tags** field type **QA** and ","
   - In **Instructions field** type text (e.g. execute agent)
   - In **Welcome message** field (e.g. Hello!)
   - Click **+ starter** button
   - Enter conversation starter text (e.g. run agent)
   - In **Advances** input value (step limit, e.g. 25)
4. Click the **Save** button

### Expected Results

- Agent creation screen loads without error
- Required fields are validated
- Agent is created
- The new agent is visible in the agents list with all input data

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-03

#### Test Case Name:

Create Agent with Missing Name Field

#### Test Case Tags:

Smoke, Regression, functional testing, agents, negative

#### Test Case Priority:

High

#### Test Case Description

Verify that an agent cannot be created if the mandatory Name field is missing.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,

### Test Steps

1. Navigate to the **Agents** section of project
2. Click the **+ Create** button
3. Leave the **Name** field empty
4. Fill in the **Description** field with valid data (from 1 up to 512 characters)
5. Click the **Save** button

### Expected Results

- **Save** button is inactive and not clickable
- "Name is required" error message in the agent creation page
- The agent is not created

### Postconditions

1. Cancel the agent creation process:
   - Click **Cancel** button
   - Verify no new agent is created in the agents list
2. Verify system state remains unchanged
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-04

#### Test Case Name:

Create Agent with Missing Description Field

#### Test Case Tags:

Smoke, Regression, functional testing, agents, negative

#### Test Case Priority:

High

#### Test Case Description

Verify that an agent cannot be created if the mandatory Description field is missing.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,

### Test Steps

1. Navigate to the **Agents** section of project
2. Click the **+ Create** button
3. Fill in the **Name** field with valid data
4. Leave the **Description** field empty
5. Click the **Save** button

### Expected Results

- **Save** button is inactive and not clickable
- "Description is required" error message in the agent creation page
- The agent is not created

### Postconditions

1. Cancel the agent creation process:
   - Click **Cancel** button close the agent creation form/modal without saving
   - Verify no new agent is created in the agents list
2. Verify system state remains unchanged
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-05

#### Test Case Name:

Create Agent with Invalid Length Name Field

#### Test Case Tags:

Regression, functional testing, agents, negative

#### Test Case Priority:

Medium

#### Test Case Description

Verify that the Name field does not allow input of more characters than the restricted limit.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,

### Test Steps

1. Navigate to the **Agents** section of the {Project}
2. Click the **+ Create** button
3. Try to enter more than 64 characters in the **Name** field
4. Fill in the **Description** field with valid data (from 1 up to 512 characters)
5. Attempt to click the **Save** button

### Expected Results

- The **Name** field input is automatically truncated at 64 characters
- No additional characters beyond the limit can not be entered
- The agent can be created with the truncated name content

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-06

#### Test Case Name:

Create Agent with Invalid Length Description Field

#### Test Case Tags:

Regression, functional testing, agents, negative

#### Test Case Priority:

Medium

#### Test Case Description

Verify that the Description field does not allow input of more characters than the restricted limit.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,

### Test Steps

1. Navigate to the **Agents** section of the {Project}
2. Click the **+ Create** button
3. Fill in the **Name** field with valid data (from 1 up to 64)
4. Try to enter more than 512 characters in the **Description** field
5. Attempt to click the **Save** button

### Expected Results

- The **Description** field input is automatically truncated at 512 characters
- No additional characters beyond the limit can't be entered
- The agent can be created with the truncated description content

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-07

#### Test Case Name:

Create Agent with Duplicate Name

#### Test Case Tags:

Regression, functional testing, agents, negative

#### Test Case Priority:

Medium

#### Test Case Description

Verify that an agent can be created with a name that already exists.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Navigate to the **Agents** section in the {Project} of application
7. Click the **+ Create** Create Agent button
8. Fill in all the required fields:
   - Agent's **Name** field enter "a"
   - Agent's description using valid symbols and valid length (from 1 up to 512 characters)
9. Leave all other optional fields blank
10. Click the **Save** button

### Test Steps

1. Navigate to the **Agents** section of the {Project}
2. Click the **+ Create** button
3. Enter Agent's **Name** field "a"
4. Fill in **Description** fields as required (from 1 up to 512 characters)
5. Click the **Save** button

### Expected Results

- The agent is created
- No error message is displayed

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "a" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "a" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. repeat step 2
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-01-08

#### Test Case Name:

Create Agent with Empty Fields

#### Test Case Tags:

Regression, functional testing, agents, negative

#### Test Case Priority:

Medium

#### Test Case Description

Verify that an agent cannot be created if all fields are left empty.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,

### Test Steps

1. Navigate to the **Agents** section of the {Project}
2. Click the **+ Create** button
3. Leave all fields empty
4. Click the **Save** button

### Expected Results

- Save button is inactive
- Save button is not clickable
- Agent is not created

### Postconditions

1. Cancel the agent creation process:
   - Click **Cancel** button, close the agent creation form/modal without saving
   - Verify no new agent is created in the agents list
2. Verify system state remains unchanged
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***
