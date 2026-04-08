# Scenario ID: A-02

#### Scenario Name:

Modifying an Agent's details (name and description) and validating save/discard behaviors

#### Scenario Tags:

Agent Modification, UI Testing, Functional

#### Scenario Priority:

High

#### Scenario Description

This scenario verifies updating an existing agent's details (name and description). It covers successful
updates, validation for empty and invalid inputs, discard/cancel behaviors, and edge cases such as long inputs
and special characters.

## Test Case ID: TC-02-01

#### Test Case Name:

Modify Agent Name

#### Test Case Tags:

Smoke, Regression, Agent Modification, Name Field

#### Test Case Priority:

High

#### Test Case Description

Verify that the agent's name can be successfully modified.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's **Name**: "Test Agent"
     - Agent's **Description**: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Modify the **Name** field to "Updated Test Agent"
7. Click the **Save** button

### Expected Results

- The **Save** button is active and clickable
- "The agent has been updated" success message is displayed
- Agent's name field is updated to "Updated Test Agent"
- Navigate to the **Agents** section in the {Project}
- Click on **Table view** button
- Locate the created "Updated Test Agent" agent in the agents list

### Postconditions

1. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the updated "Updated Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-02-02

#### Test Case Name:

Modify Agent Description

#### Test Case Tags:

Smoke, Regression, Agent Modification, Description Field

#### Test Case Priority:

High

#### Test Case Description

Verify that the agent's description can be successfully modified.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section of {Project}
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Modify the **Description** field to "Updated Description"
7. Click the **Save** button

### Expected Results

- The **Save** button is active and clickable
- "The agent has been updated" success message is displayed
- Agent's **Description** field value is "Updated Description"

### Postconditions

1. Clean up test data by deleting the modified agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent with name "Test Agent"
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-02-03

#### Test Case Name:

Modify Agent with Missing Name Field

#### Test Case Tags:

Smoke, Regression, functional testing, agents, negative

#### Test Case Priority:

High

#### Test Case Description

Verify that an error message is displayed when the name field is left empty while modifying the agent.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section of {Project}
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Clear the **Name** field (delete previous name)
7. Click the **Save** button

### Expected Results

- "Name is required" error message appears under agent's name field
- An error message is displayed: "ensure this value has at least 1 characters at name"
- Changes are not saved
- In agents list the agent has the original name

### Postconditions

1. Cancel the agent modification process:
   - Click **Cancel** button or close the modification form
   - Verify no changes are made to the agent
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Verify the agent is removed from the agents list
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-02-04

#### Test Case Name:

Modify Agent with Missing Description Field

#### Test Case Tags:

Smoke, Regression, functional testing, agents, negative

#### Test Case Priority:

High

#### Test Case Description

Verify that an error message is displayed when the description field is left empty while modifying the agent.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section of {Project}
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Clear the **Description** field (delete previous description)
7. Click the **Save** button

### Expected Results

- "Description is required" error message appears under Description field
- An error message is displayed: "ensure this value has at least 1 characters at description"
- Changes are not saved
- The agent retains the original Description

### Postconditions

1. Cancel the agent modification process:
   - Click **Cancel** button or close the modification form
   - Verify no changes are made to the agent
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-02-05

#### Test Case Name:

Discard Changes on Name Field

#### Test Case Tags:

Regression, functional testing, agents, discard

#### Test Case Priority:

Medium

#### Test Case Description

Verify that discarding changes does not modify the agent's name field.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Modify the **Name** field to "Updated Test Agent"
7. Click the **Discard** button
8. Confirm discard action if prompted

### Expected Results

- The **Discard** button is active and clickable
- Warning dialog box appears with "Are you sure to drop the changes?" message and **Confirm** and **Cancel**
  buttons
- After confirming discard, agent's name field is not updated
- The agent's name remains unchanged as "Test Agent"

### Postconditions

1. Verify no changes were made to the agent:
   - Confirm agent name remains "Test Agent"
   - Confirm agent description remains "Test Description"
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-02-06

#### Test Case Name:

Discard Changes on Description Field

#### Test Case Tags:

Regression, functional testing, agents, discard

#### Test Case Priority:

Medium

#### Test Case Description

Verify that changes made to the agent's description are dropped successfully.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Modify the **Description** field to "Updated Description"
7. Click the **Discard** button
8. Confirm discard action if prompted

### Expected Results

- The **Discard** button is active and clickable
- Warning dialog box appears with "Are you sure to drop the changes?" message and **Confirm** and **Cancel**
  buttons
- After confirming discard, agent's description field is not updated
- The agent's description remains unchanged as "Test Description"

### Postconditions

1. Verify no changes were made to the agent:
   - Confirm agent name remains "Test Agent"
   - Confirm agent description remains "Test Description"
2. Clean up test data by deleting the created agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created agent in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the "Test Agent" agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Verify the agent is removed from the agents list
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-02-07

#### Test Case Name:

Modify Agent with Invalid Length Name Field

#### Test Case Tags:

Regression, functional testing, agents, negative

#### Test Case Priority:

Medium

#### Test Case Description

Verify that the Name field does not allow input of more characters than the restricted limit during
modification.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Try to enter more than 64 characters in the **Name** field (e.g., "Updated agent nameUpdated agent
   nameUpdated agent nameUpdated agent")
7. Click the **Save** button

### Expected Results

- The **Name** field input is automatically truncated at 64 characters
- No additional characters beyond the limit can be entered
- Changes are saved with the truncated name content
- Agent name is updated to the truncated version

### Postconditions

1. Clean up test data by deleting the modified agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent with truncated name in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-

## Test Case ID: TC-02-08

#### Test Case Name:

Modify Agent with Invalid Length Description Field

#### Test Case Tags:

Regression, functional testing, agents, negative

#### Test Case Priority:

Medium

#### Test Case Description

Verify that the Description field does not allow input of more characters than the restricted limit during
modification.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Try to enter more than 512 characters in the **Description** field (e.g., a long text that exceeds the
   limit)
7. Click the **Save** button

### Expected Results

- The **Description** field input is automatically truncated at 512 characters
- No additional characters beyond the limit can be entered
- Changes are saved with the truncated description content
- Agent description is updated to the truncated version

### Postconditions

1. Clean up test data by deleting the modified agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent with truncated description in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent "Test Agent" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-02-09

#### Test Case Name:

Modify Agent LLM Model

#### Test Case Tags:

Regression, functional testing, agent-modification, model-settings

#### Test Case Priority:

High

#### Test Case Description

Verify that the agent's LLM model can be successfully changed and the changes persist after saving.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Click on **Model Settings** button under the conversation window
7. Change the LLM model to a different model (e.g., "gpt-4" to "gpt-3.5-turbo" or vice versa)
8. Click the **Apply** button
9. Verify the dialog box is closed
10. Click the **Save** button to save the agent
11. Navigate back to **Agents** menu
12. Locate and click on the modified agent
13. Navigate to **Configuration** tab
14. Click on **Model Settings** button
15. Verify the model selection reflects the previously selected model

### Expected Results

- Model Settings dialog opens when button is clicked
- Different LLM models are available for selection
- **Apply** button functions correctly and closes the dialog
- Agent saves successfully with new model configuration
- Model selection persists after saving and reopening the agent
- No errors occur during model selection or saving process

### Postconditions

1. Clean up test data by deleting the modified agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent with updated model in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent "Test Agent" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-02-10

#### Test Case Name:

Modify Agent Model Temperature Setting

#### Test Case Tags:

Regression, functional testing, agent-modification, model-settings, temperature

#### Test Case Priority:

Medium

#### Test Case Description

Verify that the agent's model temperature setting can be modified and persists correctly after saving and
reopening.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Click on **Model Settings** button under the conversation window
7. Set temperature value to 0.1
8. Click **Apply** button
9. Observe the dialogue box is closed
10. Click **Save** agent button
11. Navigate to **Agents** menu
12. Click on the agent in the agent list
13. Navigate to **Configuration** tab
14. Click on **Model Settings** button
15. Observe that the temperature is set as 0.1
16. Click **Save** agent button
17. Reopen the agent from **Agents** menu
18. Click on the agent name
19. Click on **Model Settings** button
20. Observe that the temperature is still set to 0.1

### Expected Results

- Model Settings dialog opens successfully
- Temperature field accepts the value 0.1
- **Apply** button closes the dialog correctly
- Agent saves successfully with the new temperature setting
- Temperature value persists after saving and navigating away
- Temperature value remains 0.1 after reopening the agent
- No data loss or reset to default values occurs

### Postconditions

1. Clean up test data by deleting the modified agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent with updated temperature setting
   - Click on the agent menu (3 dots or ellipsis) next to the agent "Test Agent" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-02-11

#### Test Case Name:

Modify Agent Model Top-P Setting

#### Test Case Tags:

Regression, functional testing, agent-modification, model-settings, top-p

#### Test Case Priority:

Medium

#### Test Case Description

Verify that the agent's model Top-P setting can be modified and persists correctly after saving and reopening.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Click on **Model Settings** button under the conversation window
7. Set Top-P value to 0.1
8. Click **Apply** button
9. Observe the dialogue box is closed
10. Click **Save** agent button
11. Navigate to **Agents** menu
12. Open the agent that was just modified
13. Navigate to **Configuration** tab
14. Click on **Model Settings** button
15. Observe that the Top-P is set as 0.1

### Expected Results

- Model Settings dialog opens successfully
- Top-P field accepts the value 0.1
- **Apply** button closes the dialog correctly
- Agent saves successfully with the new Top-P setting
- Top-P value persists after saving and reopening the agent
- No validation errors occur for valid Top-P values
- Settings are maintained correctly across sessions

### Postconditions

1. Clean up test data by deleting the modified agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent with updated Top-P setting
   - Click on the agent menu (3 dots or ellipsis) next to the agent "Test Agent" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-02-12

#### Test Case Name:

Modify Agent Model Maximum Tokens Setting

#### Test Case Tags:

Regression, functional testing, agent-modification, model-settings, max-tokens

#### Test Case Priority:

Medium

#### Test Case Description

Verify that the agent's model maximum tokens setting can be modified and persists correctly after saving and
reopening.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Click on **Model Settings** button under the conversation window
7. Set maximum tokens to 2000
8. Click **Apply** button
9. Observe the dialog box is closed
10. Click **Save** agent button
11. Go to **Agents** menu
12. Open the agent that was just modified
13. Navigate to **Configuration** tab
14. Click on **Model Settings** button
15. Observe that the maximum tokens is set as 2000
16. Click **Apply** button
17. Observe the modal window is closed
18. Click **Save** button to save agent
19. Navigate to the **Agents** menu
20. Select the modified agent
21. Open agent
22. Click **Model Settings**
23. Observe that the max tokens is 2000

### Expected Results

- Model Settings dialog opens successfully
- Maximum tokens field accepts the value 2000
- **Apply** button closes the dialog correctly
- Agent saves successfully with the new maximum tokens setting
- Maximum tokens value persists after saving and reopening the agent
- Value remains consistent across multiple save/open cycles
- No data corruption or reset to default values occurs
- Modal behavior is consistent throughout the process

### Postconditions

1. Clean up test data by deleting the modified agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent with updated maximum tokens setting
   - Click on the agent menu (3 dots or ellipsis) next to the agent "Test Agent" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-02-13

#### Test Case Name:

Modify Multiple Model Settings Simultaneously

#### Test Case Tags:

Regression, functional testing, agent-modification, model-settings, comprehensive

#### Test Case Priority:

High

#### Test Case Description

Verify that multiple model settings (temperature, top-P, and maximum tokens) can be modified simultaneously
and all changes persist correctly.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Click on **Model Settings** button under the conversation window
7. Set the following values simultaneously:
   - Temperature: 0.7
   - Top-P: 0.9
   - Maximum tokens: 1500
8. Click **Apply** button
9. Observe the dialog box is closed
10. Click **Save** agent button
11. Navigate to **Agents** menu
12. Open the modified agent
13. Navigate to **Configuration** tab
14. Click on **Model Settings** button
15. Verify all settings are preserved:
    - Temperature: 0.7
    - Top-P: 0.9
    - Maximum tokens: 1500

### Expected Results

- Model Settings dialog allows modification of all parameters simultaneously
- All three settings accept their respective values without conflicts
- **Apply** button successfully applies all changes
- Agent saves successfully with all new settings
- All settings persist after saving and reopening the agent
- No partial saves or data loss occurs for any parameter
- Settings work correctly together without interference

### Postconditions

1. Clean up test data by deleting the modified agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent with updated model settings
   - Click on the agent menu (3 dots or ellipsis) next to the agent "Test Agent" name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's "Test Agent" name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-02-14

#### Test Case Name:

Modify Model Settings with Invalid Values

#### Test Case Tags:

Regression, functional testing, agent-modification, model-settings, validation, negative

#### Test Case Priority:

Medium

#### Test Case Description

Verify that the system properly validates model settings and prevents saving invalid values for temperature,
top-P, and maximum tokens.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Click on **Model Settings** button under the conversation window
7. Test invalid temperature values:
   - Enter temperature value > 2.0 (e.g., 3.0)
   - Enter temperature value < 0.0 (e.g., -0.5)
8. Test invalid top-P values:
   - Enter top-P value > 1.0 (e.g., 1.5)
   - Enter top-P value < 0.0 (e.g., -0.1)
9. Test invalid maximum tokens values:
   - Enter negative tokens value (e.g., -100)
   - Enter extremely large tokens value (e.g., 999999)
10. Attempt to click **Apply** button with invalid values
11. Observe validation messages and behavior

### Expected Results

- Invalid temperature values (< 0 or > 1) show validation errors
- Invalid top-P values (< 0 or > 1) show validation errors
- Invalid maximum tokens values (>1 and<16383) show appropriate validation errors
- **Apply** button is disabled or shows error when invalid values are present
- Clear error messages guide the user to correct input ranges
- No invalid settings are saved to the agent configuration
- Form validation prevents submission of invalid data

### Postconditions

1. Clean up test data by deleting the test agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent "Test Agent" in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-02-15

#### Test Case Name:

Cancel Temperature Changes in Model Settings

#### Test Case Tags:

Regression, functional testing, agent-modification, model-settings, cancel-behavior, temperature

#### Test Case Priority:

Medium

#### Test Case Description

Verify that temperature changes can be cancelled and do not persist when the user cancels or closes the dialog
without applying changes.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Click on **Model Settings** button under the conversation window
7. Note the current temperature value
8. Change temperature to 0.5
9. Click **Cancel** button (or close dialog without applying)
10. Click on **Model Settings** button again
11. Verify the original temperature setting is still present
12. Repeat steps 8-9 but close the dialog using the 'X' button
13. Verify temperature setting remains unchanged

### Expected Results

- **Cancel** button closes dialog without saving temperature changes
- Original temperature setting remains unchanged after cancelling
- Closing dialog with 'X' button does not save temperature changes
- No temporary temperature changes persist when dialog is cancelled
- Temperature setting retains its previous value after cancelled modifications
- No unintended side effects occur from cancelled temperature operations

### Postconditions

1. Clean up test data by deleting the test agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent "Test Agent" in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-02-16

#### Test Case Name:

Cancel Top-P Changes in Model Settings

#### Test Case Tags:

Regression, functional testing, agent-modification, model-settings, cancel-behavior, top-p

#### Test Case Priority:

Medium

#### Test Case Description

Verify that Top-P changes can be cancelled and do not persist when the user cancels or closes the dialog
without applying changes.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Click on **Model Settings** button under the conversation window
7. Note the current Top-P value
8. Change Top-P to 0.8
9. Click **Cancel** button (or close dialog without applying)
10. Click on **Model Settings** button again
11. Verify the original Top-P setting is still present
12. Repeat steps 8-9 but close the dialog using the 'X' button
13. Verify Top-P setting remains unchanged

### Expected Results

- **Cancel** button closes dialog without saving Top-P changes
- Original Top-P setting remains unchanged after cancelling
- Closing dialog with 'X' button does not save Top-P changes
- No temporary Top-P changes persist when dialog is cancelled
- Top-P setting retains its previous value after cancelled modifications
- No unintended side effects occur from cancelled Top-P operations

### Postconditions

1. Clean up test data by deleting the test agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent "Test Agent" in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-02-17

#### Test Case Name:

Cancel Maximum Tokens Changes in Model Settings

#### Test Case Tags:

Regression, functional testing, agent-modification, model-settings, cancel-behavior, max-tokens

#### Test Case Priority:

Medium

#### Test Case Description

Verify that maximum tokens changes can be cancelled and do not persist when the user cancels or closes the
dialog without applying changes.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Click on **Model Settings** button under the conversation window
7. Note the current maximum tokens value
8. Change maximum tokens to 1200
9. Click **Cancel** button (or close dialog without applying)
10. Click on **Model Settings** button again
11. Verify the original maximum tokens setting is still present
12. Repeat steps 8-9 but close the dialog using the 'X' button
13. Verify maximum tokens setting remains unchanged

### Expected Results

- **Cancel** button closes dialog without saving maximum tokens changes
- Original maximum tokens setting remains unchanged after cancelling
- Closing dialog with 'X' button does not save maximum tokens changes
- No temporary maximum tokens changes persist when dialog is cancelled
- Maximum tokens setting retains its previous value after cancelled modifications
- No unintended side effects occur from cancelled maximum tokens operations

### Postconditions

1. Clean up test data by deleting the test agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent "Test Agent" in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-02-18

#### Test Case Name:

Cancel Temperature Changes in Model Settings

#### Test Case Tags:

Regression, functional testing, agent-modification, model-settings, cancel-behavior, negative, temperature

#### Test Case Priority:

Medium

#### Test Case Description

Verify that temperature changes are not saved when the user clicks Cancel button in model settings, and the
original temperature value is preserved.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Click on **Model Settings** button under the conversation window
7. Note the current temperature value (original value)
8. Change temperature to 1.0
9. Click **Cancel** button
10. Observe that the model window is closed
11. Click on **Model Settings** button again
12. Observe that no changes were applied and the temperature remains at the original value
13. Verify that the temperature was not changed from its original value

### Expected Results

- Model Settings dialog opens successfully showing current temperature
- Temperature field accepts the new value (1.0) while dialog is open
- **Cancel** button closes the model window immediately
- No temperature changes are saved or applied
- When reopening Model Settings, the original temperature value is displayed
- No unintended modifications occur to the temperature setting
- System maintains data integrity by not saving cancelled changes

### Postconditions

1. Clean up test data by deleting the test agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent "Test Agent" in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-02-19

#### Test Case Name:

Cancel Top-P Changes in Model Settings

#### Test Case Tags:

Regression, functional testing, agent-modification, model-settings, cancel-behavior, negative, top-p

#### Test Case Priority:

Medium

#### Test Case Description

Verify that Top-P changes are not saved when the user clicks Cancel button in model settings, and the original
Top-P value is preserved.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Click on **Model Settings** button under the conversation window
7. Note the current Top-P value (original value)
8. Change Top-P to 1.0
9. Click **Cancel** button
10. Observe that the model window is closed
11. Click on **Model Settings** button again
12. Observe that the changes are not saved and applied
13. Verify that the Top-P value remains at its original value

### Expected Results

- Model Settings dialog opens successfully showing current Top-P value
- Top-P field accepts the new value (1.0) while dialog is open
- **Cancel** button closes the model window immediately
- No Top-P changes are saved or applied
- When reopening Model Settings, the original Top-P value is displayed
- No unintended modifications occur to the Top-P setting
- System maintains data integrity by not saving cancelled changes

### Postconditions

1. Clean up test data by deleting the test agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent "Test Agent" in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-02-20

#### Test Case Name:

Cancel Maximum Tokens Changes in Model Settings

#### Test Case Tags:

Regression, functional testing, agent-modification, model-settings, cancel-behavior, negative, max-tokens

#### Test Case Priority:

Medium

#### Test Case Description

Verify that maximum tokens changes are not saved when the user clicks Cancel button in model settings, and the
original maximum tokens value is preserved.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for modification:
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

1. Navigate to the **Agents** section
2. Click on **Table view** button
3. Locate the agent named "Test Agent" in the agents list
4. Click on the agent to open it
5. Navigate to **Configuration** tab
6. Click on **Model Settings** button under the conversation window
7. Note the current maximum tokens value (original value)
8. Change maximum tokens to 2000
9. Click **Cancel** button
10. Observe that the model window is closed
11. Click on **Model Settings** button again
12. Observe that the changes are not saved and applied
13. Verify that the maximum tokens value remains at its original value

### Expected Results

- Model Settings dialog opens successfully showing current maximum tokens value
- Maximum tokens field accepts the new value (2000) while dialog is open
- **Cancel** button closes the model window immediately
- No maximum tokens changes are saved or applied
- When reopening Model Settings, the original maximum tokens value is displayed
- No unintended modifications occur to the maximum tokens setting
- System maintains data integrity by not saving cancelled changes

### Postconditions

1. Clean up test data by deleting the test agent:
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the agent "Test Agent" in the agents list
   - Click on the agent menu (3 dots or ellipsis) next to the agent name
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog by entering agent's name
   - Verify the agent is removed from the agents list
2. Verify no residual data remains from the deleted agent
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

-
