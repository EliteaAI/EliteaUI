```markdown
# Scenario ID: 05_Setup_Tags

#### Scenario Name:

Setup Tags for an Agent

#### Scenario Tags:

functional testing, regression, agents, tags

#### Scenario Priority:

Medium

#### Scenario Description:

Verify adding, removing and persisting tags on an Agent. Covers both ways to add tags (select from list via
popup/dropdown and manual typing with comma/Enter), single and multiple tags, tag deletion (single and all),
and that tags are not editable once added. Validate that after saving the agent a transient success message
"The agent has been updated" is displayed and tags are persisted.

## Test Case ID: TC-05-01

#### Test Case Name:

Add one tag by manual input (Confirm with Enter)

#### Test Case Tags:

functional testing, tags, manual, enter

#### Test Case Priority:

High

#### Test Case Description:

Verify a single tag can be added by typing its name and confirming with Enter.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
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
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Type the tag name "support"
6. Press **Enter** to confirm the tag
7. Observe that the tag "support" appears as a tag chip in the Tags list
8. Click the **Save** button to persist changes
9. Reopen the agent **Configuration** tab to verify persistence
10. Observe the tag "support" remains in the Tags field

### Expected Results

- The **Tags** field accepts the entered text
- The tag chip with text "support" is displayed after confirmation in the Tags input
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, the tag "support" remains present in the Tags list

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

## Test Case ID: TC-05-02

#### Test Case Name:

Add one tag by manual input (Confirm with comma)

#### Test Case Tags:

functional testing, tags, manual, comma

#### Test Case Priority:

High

#### Test Case Description:

Verify a single tag can be added by typing its name and confirming with a comma.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
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
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Type the tag name "support"
6. Type a comma (",") to confirm the tag
7. Observe that the tag "support" appears as a tag chip in the Tags list and the comma is consumed
8. Click the **Save** button to persist changes
9. Reopen the agent **Configuration** tab to verify persistence
10. Observe the tag "support" remains in the Tags field

### Expected Results

- The **Tags** field accepts the entered text
- The tag chip with text "support" is displayed after confirmation in the Tags input
- The comma is not included in the tag name and is used only as a delimiter
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, the tag "support" remains present in the Tags list

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

## Test Case ID: TC-05-03

#### Test Case Name:

Add tag with maximum length (48 characters) by manual input

#### Test Case Tags:

functional testing, tags, boundary-values, manual

#### Test Case Priority:

High

#### Test Case Description:

Verify a tag with exactly 48 characters (maximum allowed) can be added successfully.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
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
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Type the tag name "abcdefghijklmnopqrstuvwxyz1234567890abcdefghijkl" (exactly 48 characters)
6. Press **Enter** to confirm the tag
7. Observe that the tag "abcdefghijklmnopqrstuvwxyz1234567890abcdefghijkl" appears as a tag chip in the Tags
   list
8. Click the **Save** button to persist changes
9. Reopen the agent **Configuration** tab to verify persistence
10. Observe the tag "abcdefghijklmnopqrstuvwxyz1234567890abcdefghijkl" remains in the Tags field

### Expected Results

- The **Tags** field accepts the 48-character tag name
- The tag chip is displayed with the complete 48-character text
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, the 48-character tag remains present in the Tags list

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

## Test Case ID: TC-05-04

#### Test Case Name:

Add tag with maximum length (48 characters) by copy-paste

#### Test Case Tags:

functional testing, tags, boundary-values, copy-paste

#### Test Case Priority:

High

#### Test Case Description:

Verify a tag with exactly 48 characters can be added by copy-pasting the text.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Prepare text with exactly 48 characters: "abcdefghijklmnopqrstuvwxyz1234567890abcdefghijkl"

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Copy the 48-character text "abcdefghijklmnopqrstuvwxyz1234567890abcdefghijkl" from external source
6. Paste the text (Ctrl+V) into the Tags input field
7. Press **Enter** to confirm the tag
8. Observe that the tag "abcdefghijklmnopqrstuvwxyz1234567890abcdefghijkl" appears as a tag chip in the Tags
   list
9. Click the **Save** button to persist changes
10. Reopen the agent **Configuration** tab to verify persistence
11. Observe the tag "abcdefghijklmnopqrstuvwxyz1234567890abcdefghijkl" remains in the Tags field

### Expected Results

- The **Tags** field accepts the pasted 48-character tag name
- The tag chip is displayed with the complete 48-character text
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, the 48-character tag remains present in the Tags list

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

## Test Case ID: TC-05-05

#### Test Case Name:

Add tag exceeding maximum length (49 and + characters) by manual input

#### Test Case Tags:

functional testing, tags, boundary-values, negative-testing, manual

#### Test Case Priority:

Medium

#### Test Case Description:

Verify system behavior when entering a tag name that exceeds the 48-character limit by manual typing.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
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
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Try to type the tag name "abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklm" (49 characters)
6. Press **Enter** to confirm the tag
7. Observe prevention of input
8. Verify the system prevents inputing more than 48 characters

### Expected Results

- The system prevents input beyond 48 characters
- The tag is limited to 48 characters

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

## Test Case ID: TC-05-06

#### Test Case Name:

Add tag exceeding maximum length (49 and+ characters) by copy-paste

#### Test Case Tags:

functional testing, tags, boundary-values, negative-testing, copy-paste

#### Test Case Priority:

Medium

#### Test Case Description:

Verify system behavior when pasting a tag name that exceeds the 48-character limit.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Prepare text with more than 48 characters: e.g."abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmno"

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Copy the 50-character text "abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmno" from external source
6. Paste the text (Ctrl+V) into the Tags input field
7. Press **Enter** to confirm the tag
8. Observe the system behavior truncation to 48 characters
9. Verify the system prevents saving invalid data by truncates to 48 characters

### Expected Results

- The system prevents pasting text beyond 48 characters
- If truncated, the tag is limited to 48 characters
- The system prevents saving invalid data

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

## Test Case ID: TC-05-07

#### Test Case Name:

Add tag with alphanumeric characters by manual input

#### Test Case Tags:

functional testing, tags, valid-characters, alphanumeric, manual

#### Test Case Priority:

High

#### Test Case Description:

Verify a tag containing only alphanumeric characters can be added successfully.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
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
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Type the tag name "Support123" (alphanumeric characters)
6. Press **Enter** to confirm the tag
7. Observe that the tag "Support123" appears as a tag chip in the Tags list
8. Click the **Save** button to persist changes
9. Reopen the agent **Configuration** tab to verify persistence
10. Observe the tag "Support123" remains in the Tags field

### Expected Results

- The **Tags** field accepts the alphanumeric tag name
- The tag chip is displayed with text "Support123"
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, the alphanumeric tag remains present in the Tags list

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

## Test Case ID: TC-05-08

#### Test Case Name:

Add tag with alphanumeric characters by copy-paste

#### Test Case Tags:

functional testing, tags, valid-characters, alphanumeric, copy-paste

#### Test Case Priority:

High

#### Test Case Description:

Verify a tag containing only alphanumeric characters can be added by copy-pasting.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Prepare alphanumeric text: "Analytics2024"

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Copy the alphanumeric text "Analytics2024" from external source
6. Paste the text (Ctrl+V) into the Tags input field
7. Press **Enter** to confirm the tag
8. Observe that the tag "Analytics2024" appears as a tag chip in the Tags list
9. Click the **Save** button to persist changes
10. Reopen the agent **Configuration** tab to verify persistence
11. Observe the tag "Analytics2024" remains in the Tags field

### Expected Results

- The **Tags** field accepts the pasted alphanumeric tag name
- The tag chip is displayed with text "Analytics2024"
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, the alphanumeric tag remains present in the Tags list

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

## Test Case ID: TC-05-09

#### Test Case Name:

Add tag with white space by manual input

#### Test Case Tags:

functional testing, tags, valid-characters, whitespace, manual

#### Test Case Priority:

High

#### Test Case Description:

Verify a tag containing white spaces can be added successfully.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
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
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Type the tag name "Customer Support" (with white spaces)
6. Press **Enter** to confirm the tag
7. Observe that the tag "Customer Support" appears as a tag chip in the Tags list
8. Click the **Save** button to persist changes
9. Reopen the agent **Configuration** tab to verify persistence
10. Observe the tag "Customer Support" remains in the Tags field

### Expected Results

- The **Tags** field accepts the tag name with white spaces
- The tag chip is displayed with text "Customer Support"
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, the tag with white space remains present in the Tags list

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

## Test Case ID: TC-05-10

#### Test Case Name:

Add tag with white space by copy-paste

#### Test Case Tags:

functional testing, tags, valid-characters, whitespace, copy-paste

#### Test Case Priority:

High

#### Test Case Description:

Verify a tag containing white spaces can be added by copy-pasting.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Prepare text with white spaces: "Priority High"

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Copy the text "Priority High" from external source
6. Paste the text (Ctrl+V) into the Tags input field
7. Press **Enter** to confirm the tag
8. Observe that the tag "Priority High" appears as a tag chip in the Tags list
9. Click the **Save** button to persist changes
10. Reopen the agent **Configuration** tab to verify persistence
11. Observe the tag "Priority High" remains in the Tags field

### Expected Results

- The **Tags** field accepts the pasted tag name with white spaces
- The tag chip is displayed with text "Priority High"
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, the tag with white space remains present in the Tags list

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

## Test Case ID: TC-05-11

#### Test Case Name:

Add tag with underscore by manual input

#### Test Case Tags:

functional testing, tags, valid-characters, underscore, manual

#### Test Case Priority:

High

#### Test Case Description:

Verify a tag containing underscores can be added successfully.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
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
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Type the tag name "customer_support" (with underscores)
6. Press **Enter** to confirm the tag
7. Observe that the tag "customer_support" appears as a tag chip in the Tags list
8. Click the **Save** button to persist changes
9. Reopen the agent **Configuration** tab to verify persistence
10. Observe the tag "customer_support" remains in the Tags field

### Expected Results

- The **Tags** field accepts the tag name with underscores
- The tag chip is displayed with text "customer_support"
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, the tag with underscores remains present in the Tags list

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

## Test Case ID: TC-05-12

#### Test Case Name:

Add tag with underscore by copy-paste

#### Test Case Tags:

functional testing, tags, valid-characters, underscore, copy-paste

#### Test Case Priority:

High

#### Test Case Description:

Verify a tag containing underscores can be added by copy-pasting.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Prepare text with underscores: "data_analytics"

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Copy the text "data_analytics" from external source
6. Paste the text (Ctrl+V) into the Tags input field
7. Press **Enter** to confirm the tag
8. Observe that the tag "data_analytics" appears as a tag chip in the Tags list
9. Click the **Save** button to persist changes
10. Reopen the agent **Configuration** tab to verify persistence
11. Observe the tag "data_analytics" remains in the Tags field

### Expected Results

- The **Tags** field accepts the pasted tag name with underscores
- The tag chip is displayed with text "data_analytics"
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, the tag with underscores remains present in the Tags list

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

## Test Case ID: TC-05-13

#### Test Case Name:

Add tag with all valid character combinations by manual input

#### Test Case Tags:

functional testing, tags, valid-characters, combination, manual

#### Test Case Priority:

High

#### Test Case Description:

Verify a tag containing all valid character types (alphanumeric, white space, underscore) can be added
successfully.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
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
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Type a tag name with all valid characters (e.g., "Customer_Support 123")
6. Press **Enter** to confirm the tag
7. Observe that the tag appears as a tag chip in the Tags list
8. Click the **Save** button to persist changes

### Expected Results

- The **Tags** field accepts the tag name with all valid character types
- The tag chip is displayed with text "Customer_Support 123"
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, the tag with all valid characters remains present in the Tags list

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

## Test Case ID: TC-05-14

#### Test Case Name:

Add tag with invalid characters by manual input

#### Test Case Tags:

functional testing, tags, invalid-characters, negative-testing, manual

#### Test Case Priority:

Medium

#### Test Case Description:

Verify impossible to add tag with invalid characters (special symbols other than underscore).

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
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
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Type a tag name with invalid characters (e.g., "support@#$%")
6. Press **Enter** to confirm the tag
7. Observe the system behavior (validation error, character filtering, or prevention)
8. Attempt to save if tag is accepted

### Expected Results

- The system shows validation error message "Only alphanumeric characters, white space, comma and underscore
  allowed"
- Invalid characters are rejected or filtered out
- The system prevents saving invalid tag data
- User is informed about character restrictions

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

## Test Case ID: TC-05-15

#### Test Case Name:

Add tag with invalid characters by copy-paste

#### Test Case Tags:

functional testing, tags, invalid-characters, negative-testing, copy-paste

#### Test Case Priority:

Medium

#### Test Case Description:

Verify system behavior when pasting a tag with invalid characters (special symbols other than underscore).

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Prepare text with invalid characters: "billing!@#"

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Copy the text "billing!@#" from external source
6. Paste the text (Ctrl+V) into the Tags input field
7. Press **Enter** to confirm the tag
8. Observe the system behavior (validation error, character filtering, or prevention)
9. Attempt to save if tag is accepted

### Expected Results

- The system shows validation error message "Only alphanumeric characters, white space, comma and underscore
  allowed"
- Invalid characters are rejected or filtered out from pasted text
- The system prevents saving invalid tag data
- User is informed about character restrictions

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

## Test Case ID: TC-05-16

#### Test Case Name:

Verify comma behavior as tag separator (not stored in tag name)

#### Test Case Tags:

functional testing, tags, comma-behavior, separator

#### Test Case Priority:

High

#### Test Case Description:

Verify that comma acts as a delimiter and is not stored as part of the tag name.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
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
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Type "support," (with comma at the end)
6. Observe that the tag "support" is created without the comma
7. Type "billing," (with comma at the end)
8. Observe that the tag "billing" is created without the comma
9. Click the **Save** button to persist changes
10. Reopen the agent and verify tag names

### Expected Results

- Each comma triggers the creation of a new tag chip
- Tag names displayed in chips do not contain commas
- The comma functions purely as a separator/delimiter
- Tags are saved correctly without comma characters
- After reopening, tags "support" and "billing" are present without commas

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

## Test Case ID: TC-05-17

#### Test Case Name:

Add multiple tags with comma separation by manual input

#### Test Case Tags:

functional testing, tags, multiple, comma-separation, manual

#### Test Case Priority:

High

#### Test Case Description:

Verify multiple tags can be added by typing names separated by commas.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
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
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Type "billing,urgent,priority" (multiple tags separated by commas)
6. Press **Enter** to confirm all tags
7. Observe that three separate tag chips are created: "billing", "urgent", "priority"
8. Click the **Save** button to persist changes

### Expected Results

- All three tags appear as separate tag chips in the Tags list
- Each tag is created without comma characters
- Tags are displayed in the order they were entered
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, all three tags remain present

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

## Test Case ID: TC-05-18

#### Test Case Name:

Add multiple tags with comma separation by copy-paste

#### Test Case Tags:

functional testing, tags, multiple, comma-separation, copy-paste

#### Test Case Priority:

High

#### Test Case Description:

Verify multiple tags can be added by pasting comma-separated text.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Prepare comma-separated text: "analytics,customer_support,high_priority"

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Copy the comma-separated text "analytics,customer_support,high_priority" from external source
6. Paste the text (Ctrl+V) into the Tags input field
7. Press **Enter** to confirm all tags
8. Observe that three separate tag chips are created
9. Click the **Save** button to persist changes

### Expected Results

- All three tags appear as separate tag chips: "analytics", "customer_support", "high_priority"
- Each tag is created without comma characters
- Tags are displayed in the order they were pasted
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, all three tags remain present

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

## Test Case ID: TC-05-19

#### Test Case Name:

Add one tag by selecting from suggestions (click)

#### Test Case Tags:

functional testing, tags, select, click

#### Test Case Priority:

High

#### Test Case Description:

Verify a tag can be added by focusing the Tags field and clicking an existing tag in the suggestion list.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Ensure at least one existing tag is available in system suggestions

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Wait for the suggestion popup/dropdown to appear
6. From the suggestion list, click on an existing tag (e.g. "code")
7. Observe that the selected tag appears as a tag chip
8. Click the **Save** button to persist changes

### Expected Results

- The suggestion popup appears when focusing the Tags field
- The selected tag from suggestions appears as a chip in the Tags list
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, the selected tag remains present

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

## Test Case ID: TC-05-20

#### Test Case Name:

Remove a single tag via chip cross icon

#### Test Case Tags:

functional testing, tags, delete

#### Test Case Priority:

High

#### Test Case Description:

Verify a single tag can be removed by clicking the cross icon on the tag chip and the removal persists after
saving.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with tags:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Add tags "billing" and "urgent"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Locate the **Tags** field containing tags "billing" and "urgent"
4. Click the cross (X) icon on the "urgent" tag chip
5. Observe that "urgent" is removed from the Tags list
6. Click the **Save** button to persist changes
7. Reopen the agent configuration to verify persistence

### Expected Results

- The tag "urgent" is removed from the UI list immediately after clicking cross icon
- Only the "billing" tag remains visible
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent, "urgent" remains deleted while "billing" remains present

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

## Test Case ID: TC-05-21

#### Test Case Name:

Remove all tags (delete all)

#### Test Case Tags:

functional testing, tags, delete, cleanup

#### Test Case Priority:

Medium

#### Test Case Description:

Verify all tags can be deleted individually and that the final state persists after save.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with multiple tags:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Add multiple tags: "billing", "urgent", "support"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Locate the **Tags** field containing multiple tags
4. Click the cross icon on each tag chip one by one until no tags remain
5. Verify no tags are visible in the Tags list
6. Click the **Save** button to persist changes
7. Reopen the agent configuration to verify persistence

### Expected Results

- All tags are removed from the UI after clicking their respective cross icons
- The Tags field becomes empty with no tag chips visible
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent, no tags are present

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

## Test Case ID: TC-05-22

#### Test Case Name:

Tags are not editable once added

#### Test Case Tags:

functional testing, tags, ui

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that an existing tag chip cannot be edited inline (only removable).

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with at least one tag:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Add tag "support"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Locate the **Tags** field containing the "support" tag
4. Attempt to edit the tag text by double-clicking the tag chip
5. Attempt to place cursor into the tag chip text
6. Try various interaction methods to edit the tag inline

### Expected Results

- The tag text is not editable inline
- Double-clicking or cursor placement does not enable text editing
- The only available actions are remove (click cross on chip) or leave unchanged
- Tag content remains static and non-editable

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

## Test Case ID: TC-05-23

#### Test Case Name:

Deleting a tag and cancelling save reverts deletion

#### Test Case Tags:

negative testing, tags

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that if a tag is deleted but the user discards changes (does not save), the tag remains when re-opening
the agent.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent with a tag:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Add tag "support"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Locate the **Tags** field containing the "support" tag
4. Click the cross on the "support" tag to remove it
5. Verify the tag is removed from UI
6. Do not click **Save**; instead click **Discard** or navigate away and confirm discard when prompted
7. Reopen the agent configuration

### Expected Results

- After discarding changes, the tag "support" remains present as it was before deletion
- The tag deletion is reverted successfully
- No changes are persisted when discarding

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

## Test Case ID: TC-05-24

#### Test Case Name:

Add multiple tags by selecting from suggestions (click multiple)

#### Test Case Tags:

functional testing, tags, select, multiple, click

#### Test Case Priority:

High

#### Test Case Description:

Verify multiple tags can be added by clicking items in the suggestion list.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Ensure there are existing tags available in suggestions (e.g., "analytics", "customer")

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field to show suggestions
5. Click "analytics" from the suggestion list
6. Click "customer" from the suggestion list
7. Observe both tags appear as chips
8. Click the **Save** button to persist changes

### Expected Results

- The suggestion dropdown appears when focusing the Tags field
- Both selected tags appear as separate chips in the Tags list
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, both tags remain present

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

## Test Case ID: TC-05-25

#### Test Case Name:

Prevent duplicate tag addition (same tag twice)

#### Test Case Tags:

functional testing, tags, duplicate-prevention, negative-testing

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that adding the same tag twice does not create duplicate tags in the list.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
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
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Type "support" and press **Enter** to add the first tag
6. Click (focus) the **Tags** input field again
7. Type "support" again and press **Enter** to attempt adding the duplicate
8. Observe the system behavior
9. Click the **Save** button to persist changes

### Expected Results

- The first "support" tag is added successfully
- When attempting to add the duplicate "support" tag, the system prevents it or ignores the duplicate
- Only one "support" tag chip appears in the Tags list
- No duplicate tags are created
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, only one "support" tag remains present

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

## Test Case ID:

TC-05-26

#### Test Case Name:

Mixed input methods (manual typing and suggestion selection)

#### Test Case Tags:

functional testing, tags, mixed-input, manual, suggestions

#### Test Case Priority:

Medium

#### Test Case Description:

Verify tags can be added using combination of manual typing and selecting from suggestions.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Description"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Ensure there are existing tags available in suggestions (e.g., "analytics")

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to **Configuration** tab
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Type "support" and press **Enter** to add first tag manually
6. Click (focus) the **Tags** input field to show suggestions
7. Click "analytics" from the suggestion list
8. Click (focus) the **Tags** input field again
9. Type "urgent" and press **Enter** to add third tag manually
10. Observe all three tags appear as chips
11. Click the **Save** button to persist changes

### Expected Results

- All three tags ("support", "analytics", "urgent") appear as separate chips in the Tags list
- Tags added via different methods (manual typing and suggestions) work seamlessly together
- On clicking **Save** the transient success message "The agent has been updated" is displayed
- After reopening the agent configuration, all three tags remain present

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

## Test Case ID: TC-05-27

#### Test Case Name:

Add tag with only whitespace (edge case validation)

#### Test Case Tags:

functional testing, tags, whitespace-validation, negative-testing, edge-cases

#### Test Case Priority:

Low

#### Test Case Description:

Verify impossible to add a tag containing only whitespace characters.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions models.applications.application.update, models.applications.tools.create,
   models.applications.application.details, models.applications.applications.create,
   models.applications.version.delete,
6. Create a test agent for tags setup:
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
3. Locate the **Tags** field
4. Click (focus) the **Tags** input field
5. Type only spaces (e.g., " ") in the input field
6. Press **Enter** to attempt adding the whitespace-only tag
7. Observe no tag are added

### Expected Results

- The system rejects the whitespace-only tag or shows validation error
- If validation error is shown, appropriate message like "Tag should not be all white spaces" is displayed
- No empty or whitespace-only tag chip is created
- The system prevents saving invalid data

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
```
