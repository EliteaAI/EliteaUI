# Scenario ID: 06_Setup_and_configure_variables

#### Scenario Name:

Setup and configure Variables for an Agent

#### Scenario Tags:

functional testing, regression, agents, variables

#### Scenario Priority:

Medium

#### Scenario Description:

Verify adding, editing, deleting and interacting with variables that are discovered/created from using the
{{var}} placeholder inside the Instructions field of an agent. Tests include adding single and multiple
variables via Instructions, persistence after save, discard behavior, initializing variable values at creation
and after creation, editing variable values, deletion of variables from Instructions and their visibility in
the Configuration tab, UI interactions such as full-screen view of variable values, and validation of variable
naming rules.

## Test Case ID: TC-06-01

#### Test Case Name:

Add one variable via Instructions (unsaved agent - visible in Configuration tab)

#### Test Case Tags:

functional testing, variables, instructions, unsaved

#### Test Case Priority:

High

#### Test Case Description:

Verify typing `{{var}}` in the Instructions field creates a new variable entry which is visible in the
Configuration (Variables) tab with an empty value before the agent is saved.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type the instruction text: "Please greet the user using {{username}}."
6. Navigate to the **Variables** tab without saving
7. Observe that the variable "username" appears in the Variables list with empty value

### Expected Results

- The **Instructions** field accepts the entered text with variable placeholder
- The variable "username" is automatically discovered and listed in the Variables tab
- The variable entry displays an empty value (or placeholder indicating no value set)
- The variable appears in the Variables tab without needing to save the agent first

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

-

## Test Case ID: TC-06-02

#### Test Case Name:

Add multiple variables via Instructions (unsaved agent - visible in Configuration tab)

#### Test Case Tags:

functional testing, variables, instructions, multiple, unsaved

#### Test Case Priority:

High

#### Test Case Description:

Verify typing multiple `{{var}}` placeholders in the Instructions field creates corresponding variable entries
which are visible in the Configuration (Variables) tab before the agent is saved.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type the instruction text: "Collect {{first_name}} and {{last_name}} then send confirmation to {{email}}."
6. Navigate to the **Variables** tab without saving
7. Observe that variables "first_name", "last_name", and "email" appear in the Variables list with empty
   values

### Expected Results

- The **Instructions** field accepts the entered text with multiple variable placeholders
- All three variables are automatically discovered and listed in the Variables tab
- Each variable entry displays an empty value (or placeholder indicating no value set)
- All variables appear in the Variables tab without needing to save the agent first

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

-

## Test Case ID: TC-06-03

#### Test Case Name:

Variable persistence after agent save

#### Test Case Tags:

functional testing, variables, persistence, saved

#### Test Case Priority:

High

#### Test Case Description:

Verify that variables discovered from Instructions field persist in the Variables tab after saving the agent
and reopening it.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type the instruction text: "Start by requesting {{user_email}} to authenticate."
6. Click the **Save** button to persist changes
7. Observe the transient success message "The agent has been updated"
8. Navigate to the **Agents** section and reopen "Test Agent"
9. Navigate to **Variables** tab
10. Observe that the variable "user_email" remains in the Variables list

### Expected Results

- The **Instructions** field accepts the entered text with variable placeholder
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- The variable "user_email" appears in the Variables tab with empty value
- After reopening the agent configuration, the "user_email" variable remains present in the Variables list

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

-

## Test Case ID: TC-06-04

#### Test Case Name:

Initialize variable values during creation

#### Test Case Tags:

functional testing, variables, initialization, values

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that variable values can be set in the Variables tab immediately after variables are discovered from
the Instructions field.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type the instruction text: "Request {{phone}} and {{address}} to validate the user's contact."
6. Navigate to the **Variables** tab
7. In the **Variables** tab, set values for the discovered variables:
   - Click in the "phone" value field and enter "555-0123"
   - Click in the "address" value field and enter "123 Main St"
8. Click the **Save** button to persist changes
9. Observe the transient success message "The agent has been updated"
10. Reopen the agent and navigate to **Variables** tab to verify persistence

### Expected Results

- Variables "phone" and "address" are discovered and listed in the Variables tab
- Variable values can be entered in the Variables tab before saving the agent
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent, the variable values remain persistent ("555-0123" and "123 Main St")

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

-

## Test Case ID: TC-06-05

#### Test Case Name:

Edit variable values after agent is saved

#### Test Case Tags:

functional testing, variables, editing, saved_agent

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that variable values can be modified in a saved agent and that changes persist after saving.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with variables:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - In **Instructions** field, type: "Use {{api_key}} for authentication."
   - Navigate to **Variables** tab and set "api_key" value to "old_key_123"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Variables** tab
3. Verify the current value of "api_key" is "old_key_123"
4. Click in the "api_key" value field
5. Clear the existing value and enter "new_key_456"
6. Click the **Save** button to persist changes
7. Observe the transient success message "The agent has been updated"
8. Reopen the agent and navigate to **Variables** tab to verify the change persisted

### Expected Results

- The existing variable value "old_key_123" is displayed in the Variables tab
- The variable value can be edited successfully
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent, the new variable value "new_key_456" remains persistent

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

-

## Test Case ID: TC-06-06

#### Test Case Name:

Delete variables by removing from Instructions

#### Test Case Tags:

variables, delete, instructions, agent-editing

#### Test Case Priority:

High

#### Test Case Description:

Verify that variables can be deleted by removing their references from the Instructions text and saving the
agent.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with variables:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - In **Instructions** field, type: "Use {{token}} and {{session_id}} for processing."
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Variables** tab
3. Verify both "token" and "session_id" variables are present
4. Navigate to **Configuration** tab
5. Locate the **Instructions** field
6. Click (focus) the **Instructions** input field
7. Edit the text to remove {{token}}: "Use {{session_id}} for processing."
8. Click the **Save** button to persist changes
9. Observe the transient success message "The agent has been updated"
10. Navigate to **Variables** tab
11. Verify only "session_id" remains and "token" is no longer present

### Expected Results

- Both variables are initially present in the Variables tab
- After removing {{token}} from Instructions and saving, only "session_id" remains
- The "token" variable is automatically removed from the Variables tab
- On clicking **Save** the transient success message "The agent has been updated" is displayed

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

-

## Test Case ID: TC-06-07

#### Test Case Name:

Deleting unsaved variables (discard behavior for multiple variables)

#### Test Case Tags:

negative testing, variables, discard, multiple

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that when multiple variables are added via Instructions but the user discards changes, none persist
after re-opening the agent.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type the instruction text: "Use {{v1}} and then {{v2}} for processing."
6. Navigate to **Variables** tab to verify both variables appear
7. Click **Discard** button or navigate away from the agent
8. Confirm discard when prompted
9. Reopen the "Test Agent" configuration
10. Navigate to **Variables** tab

### Expected Results

- Variables "v1" and "v2" appear in the Variables tab before discarding
- After discarding changes, neither "v1" nor "v2" are present in the Variables tab
- The agent returns to its previous saved state without the variables

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

-

## Test Case ID: TC-06-08

#### Test Case Name:

Full-screen view of variable values

#### Test Case Tags:

functional testing, variables, full-screen, UI

#### Test Case Priority:

Low

#### Test Case Description:

Verify that variable values can be viewed in full-screen mode for better editing of longer text content.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with variables:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Navigate to **configuration** tab,
   - In **Instructions** field, type: "Process {{long_text}} content."
   - Navigate to **Variables** tab and set "long_text" value to a longer text content
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. In **Variables** tab locate the "long_text" variable in the Variables list
4. Click the full-screen icon (expand icon) next to the variable value field
5. Verify the full-screen editor opens with the variable content
6. Edit the content in full-screen mode
7. Save or confirm changes in the full-screen editor
8. Verify the updated content is reflected in the Variables tab

### Expected Results

- The full-screen icon is visible next to variable value fields
- Clicking the full-screen icon opens an expanded editor view
- The variable content is editable in full-screen mode
- Changes made in full-screen mode are reflected back in the Variables tab
- Full-screen mode provides better visibility for longer content

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

-

## Test Case ID: TC-06-09

#### Test Case Name:

Variable name validation - valid names

#### Test Case Tags:

functional testing, variables, validation, positive

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that valid variable names (alphanumeric, underscore, hyphen) are accepted when typed in the
Instructions field.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type instruction text with valid variable names:
   - "Use {{user_name}} and {{api-key}} and {{session123}} for processing."
6. Navigate to **Variables** tab
7. Verify all three variables appear: "user_name", "api-key", and "session123"
8. Click the **Save** button to persist changes
9. Observe the transient success message "The agent has been updated"

### Expected Results

- All valid variable names are accepted in the Instructions field
- Variables "user_name", "api-key", and "session123" appear in the Variables tab
- No validation errors are displayed for valid variable names
- On clicking **Save** the transient success message "The agent has been updated" is displayed

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

-

## Test Case ID: TC-06-10

#### Test Case Name:

Variable name validation - invalid names with spaces

#### Test Case Tags:

negative testing, variables, validation, spaces

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that variable names containing spaces are handled appropriately (either rejected or processed according
to system rules).

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type instruction text with variable names containing spaces:
   - "Use {{user name}} and {{api key}} for processing."
6. Navigate to **Variables** tab
7. Observe how the system handles variables with spaces
8. Attempt to save the agent by clicking the **Save** button
9. Note any validation errors or system behavior

### Expected Results

- The system either rejects variable names with spaces or handles them according to defined rules
- If rejected, appropriate validation errors are displayed
- If accepted, variables appear in Variables tab (potentially with modified names)
- System behavior is consistent with documented variable naming rules

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

-

## Test Case ID: TC-06-11

#### Test Case Name:

Variable name validation - invalid names with special characters

#### Test Case Tags:

negative testing, variables, validation, special_characters

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that variable names containing invalid special characters are handled appropriately according to system
validation rules.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type instruction text with variable names containing special characters:
   - "Use {{user@email}} and {{api$key}} and {{session#id}} for processing."
6. Navigate to **Variables** tab
7. Observe how the system handles variables with special characters
8. Attempt to save the agent by clicking the **Save** button
9. Note any validation errors or system behavior

### Expected Results

- The system either rejects variable names with invalid special characters or handles them according to
  defined rules
- If rejected, appropriate validation errors are displayed
- If accepted, variables appear in Variables tab (potentially with modified names)
- System behavior is consistent with documented variable naming rules

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

-

## Test Case ID: TC-06-12

#### Test Case Name:

Variable name validation - empty variable names

#### Test Case Tags:

negative testing, variables, validation, empty

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that empty variable names (e.g., {{}}) are handled appropriately by the system.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type instruction text with empty variable placeholders:
   - "Use {{}} and {{valid_var}} for processing."
6. Navigate to **Variables** tab
7. Observe how the system handles empty variable names
8. Attempt to save the agent by clicking the **Save** button
9. Note any validation errors or system behavior

### Expected Results

- The system either rejects empty variable names or ignores them
- If rejected, appropriate validation errors are displayed
- Valid variables like "valid_var" should still be processed correctly
- System behavior is consistent and doesn't break due to empty variable names

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

-

## Test Case ID: TC-06-13

#### Test Case Name:

Variable name validation - case sensitivity

#### Test Case Tags:

functional testing, variables, validation, case_sensitivity

#### Test Case Priority:

Medium

#### Test Case Description:

Verify how the system handles variables with the same name but different case (e.g., {{User}} vs {{user}}).

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type instruction text with variables having different cases:
   - "Use {{User}} and {{user}} and {{USER}} for processing."
6. Navigate to **Variables** tab
7. Observe how many variables appear and their names
8. Click the **Save** button to persist changes
9. Observe the transient success message "The agent has been updated"

### Expected Results

- The system treats variables case-sensitively (creates 3 separate variables) OR case-insensitively (creates 1
  variable)
- System behavior is consistent with documented variable handling rules
- All variables (or the consolidated variable) appear correctly in the Variables tab
- On clicking **Save** the transient success message "The agent has been updated" is displayed

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

-

## Test Case ID: TC-06-14

#### Test Case Name:

Variable name validation - maximum length

#### Test Case Tags:

boundary testing, variables, validation, length

#### Test Case Priority:

Low

#### Test Case Description:

Verify the system's behavior when variable names exceed the maximum allowed length.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type instruction text with very long variable names:
   - "Use
     {{this_is_a_very_long_variable_name_that_exceeds_normal_length_expectations_and_tests_system_limits}} for
     processing."
6. Navigate to **Variables** tab
7. Observe how the system handles very long variable names
8. Attempt to save the agent by clicking the **Save** button
9. Note any validation errors or system behavior

### Expected Results

- The system either accepts long variable names or enforces length limits
- If length limits exist, appropriate validation errors are displayed
- If accepted, the long variable name appears correctly in the Variables tab
- System behavior is consistent with documented variable naming rules

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

-

## Test Case ID: TC-06-15

#### Test Case Name:

Duplicate variable names in Instructions

#### Test Case Tags:

functional testing, variables, duplicates

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that when the same variable name appears multiple times in Instructions, only one entry appears in the
Variables tab.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type instruction text with duplicate variable references:
   - "First use {{username}} to login, then verify {{username}} matches the expected {{username}} format."
6. Navigate to **Variables** tab
7. Verify only one "username" variable entry appears
8. Click the **Save** button to persist changes
9. Observe the transient success message "The agent has been updated"

### Expected Results

- Multiple references to {{username}} in Instructions are recognized
- Only one "username" entry appears in the Variables tab (no duplicates)
- The variable can be configured with a single value that applies to all references
- On clicking **Save** the transient success message "The agent has been updated" is displayed

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

-

## Test Case ID: TC-06-16

#### Test Case Name:

Variables with nested braces

#### Test Case Tags:

edge case testing, variables, nested_braces

#### Test Case Priority:

Low

#### Test Case Description:

Verify how the system handles variable placeholders with nested or malformed braces.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type instruction text with nested/malformed braces:
   - "Use {{{nested}}} and {{unclosed} and {malformed}} and {{normal}} for processing."
6. Navigate to **Variables** tab
7. Observe which variables are recognized by the system
8. Attempt to save the agent by clicking the **Save** button
9. Note any validation errors or system behavior

### Expected Results

- The system handles malformed braces gracefully without crashing
- Only properly formatted {{variable}} patterns are recognized as variables
- Malformed patterns are treated as regular text
- Valid variables like "normal" are still processed correctly

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

-

## Test Case ID: TC-06-17

#### Test Case Name:

Variables in multiline Instructions

#### Test Case Tags:

functional testing, variables, multiline

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that variables are properly discovered when the Instructions field contains multiple lines of text.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type multiline instruction text with variables:
   ```
   Step 1: Collect {{user_input}} from the user
   Step 2: Validate {{user_input}} format
   Step 3: Process using {{api_token}}
   Step 4: Send results to {{email_address}}
   ```
6. Navigate to **Variables** tab
7. Verify all variables appear: "user_input", "api_token", "email_address"
8. Click the **Save** button to persist changes
9. Observe the transient success message "The agent has been updated"

### Expected Results

- The multiline Instructions text is accepted
- All variables from different lines are discovered: "user_input", "api_token", "email_address"
- Variables appear correctly in the Variables tab regardless of line position
- On clicking **Save** the transient success message "The agent has been updated" is displayed

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

-

## Test Case ID: TC-06-18

#### Test Case Name:

Variables persistence across agent versions

#### Test Case Tags:

functional testing, variables, versioning, persistence

#### Test Case Priority:

High

#### Test Case Description:

Verify that variable values persist correctly when agent configurations are updated and new versions are
created.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with variables:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - In **Instructions** field, type: "Process {{config_value}} and {{setting}}."
   - Navigate to **Variables** tab and set values:
     - "config_value": "initial_config"
     - "setting": "default_setting"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Variables** tab and verify initial values are present
3. Navigate to **Configuration** tab
4. Make a minor change to agent configuration (e.g., update description)
5. Click the **Save** button to create a new version
6. Observe the transient success message "The agent has been updated"
7. Navigate to **Variables** tab
8. Verify that variable values persist: "config_value" = "initial_config", "setting" = "default_setting"
9. Edit variable values:
   - "config_value": "updated_config"
   - "setting": "updated_setting"
10. Click the **Save** button again
11. Reopen agent and verify the updated values persist

### Expected Results

- Initial variable values persist after the first agent update
- Variable values can be modified and persist after subsequent saves
- On each save, the transient success message "The agent has been updated" is displayed
- Variable persistence works correctly across multiple agent versions

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

-

## Test Case ID: TC-06-19

#### Test Case Name:

Variables with different values across agent versions using Save as Version

#### Test Case Tags:

functional testing, variables, versioning, save_as_version

#### Test Case Priority:

High

#### Test Case Description:

Verify that different versions of an agent can have different variables with different values when using the
"Save as Version" functionality, and each version maintains its specific variable configuration.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with initial variables:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - In **Instructions** field, type: "Use {{version1_var}} for processing."
   - Navigate to **Variables** tab and set "version1_var" value to "v1_value"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Variables** tab and verify "version1_var" = "v1_value"
3. Navigate to **Configuration** tab
4. Update **Instructions** field to: "Use {{version2_var}} and {{shared_var}} for processing."
5. Navigate to **Variables** tab and set values:
   - "version2_var": "v2_value"
   - "shared_var": "shared_value"
6. Click the **Save as Version** button (instead of regular Save)
7. Observe version creation confirmation
8. Navigate to agent version history/management
9. Switch back to Version 1 and verify it contains only "version1_var" = "v1_value"
10. Switch to Version 2 and verify it contains "version2_var" = "v2_value" and "shared_var" = "shared_value"
11. Create Version 3 with different variables:
    - Update **Instructions** to: "Process {{version3_var}} and {{shared_var}}."
    - Set "version3_var": "v3_value" and "shared_var": "modified_shared"
    - Click **Save as Version**
12. Verify each version maintains its specific variables and values

### Expected Results

- Version 1 contains only "version1_var" with value "v1_value"
- Version 2 contains "version2_var" = "v2_value" and "shared_var" = "shared_value"
- Version 3 contains "version3_var" = "v3_value" and "shared_var" = "modified_shared"
- Each version maintains its distinct variable configuration without affecting other versions
- Switching between versions correctly displays the version-specific variables

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

-

## Test Case ID: TC-06-20

#### Test Case Name:

Variable name validation - single letter variables

#### Test Case Tags:

functional testing, variables, validation, single_letter

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that single letter variable names are accepted and function correctly in the Instructions field.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type instruction text with single letter variable names:
   - "Use {{a}} and {{x}} and {{z}} for processing data."
6. Navigate to **Variables** tab
7. Verify all three single letter variables appear: "a", "x", and "z"
8. Set values for each variable:
   - "a": "alpha"
   - "x": "variable_x"
   - "z": "zeta"
9. Click the **Save** button to persist changes
10. Observe the transient success message "The agent has been updated"
11. Reopen the agent and verify single letter variables and their values persist

### Expected Results

- Single letter variable names "a", "x", and "z" are accepted in the Instructions field
- All single letter variables appear correctly in the Variables tab
- Variable values can be set and saved for single letter variables
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- Single letter variables and their values persist after reopening the agent

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

-

## Test Case ID: TC-06-21

#### Test Case Name:

Variable name validation - underscore in variable names

#### Test Case Tags:

functional testing, variables, validation, underscore

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that variable names containing underscores are properly accepted and function correctly in various
positions within the variable name.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for variables setup:
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
3. Locate the **Instructions** field
4. Click (focus) the **Instructions** input field
5. Type instruction text with underscore variable names:
   - "Use {{user_name}} and {{_private}} and {{config_value_max}} and {{test_}} for processing."
6. Navigate to **Variables** tab
7. Verify all underscore variables appear: "user*name", "\_private", "config_value_max", and "test*"
8. Set values for each variable:
   - "user_name": "john_doe"
   - "\_private": "private_data"
   - "config_value_max": "100"
   - "test\_": "trailing_underscore"
9. Click the **Save** button to persist changes
10. Observe the transient success message "The agent has been updated"
11. Reopen the agent and verify underscore variables and their values persist

### Expected Results

- Variable names with underscores in different positions are accepted: beginning, middle, end, and multiple
  underscores
- All underscore variables appear correctly in the Variables tab
- Variable values can be set and saved for underscore variables
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- Underscore variables and their values persist after reopening the agent

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

-
