# Scenario ID: 06_Setup_and_configure_variables

#### Scenario Name: Setup and configure Variables for an Agent

#### Scenario Tags: functional testing, regression, agents, variables

#### Scenario Priority: Medium

#### Scenario Description: Verify adding, editing, deleting and interacting with variables that are discovered/created from using the {{var}} placeholder inside the Instructions field of an agent. Tests include adding single and multiple variables via Instructions, persistence after save, discard behavior, initializing variable values at creation and after creation, editing variable values, deletion of variables from Instructions and their visibility in the Configuration tab, and UI interactions such as full-screen view of variable values.

## Test Case ID: TC-06-01

#### Test Case Name: Add one variable via Instructions (unsaved agent - visible in Configuration tab)

#### Test Case Tags: functional testing, variables, instructions, unsaved

#### Test Case Priority: High

#### Test Case Description: Verify typing `{{var}}` in the Instructions field creates a new variable entry which is visible in the Configuration (Variables) tab with an empty value before the agent is saved.

### Preconditions: Have created agent

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed) e.g "Test
    Agent"
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab

### Test Steps:

1. Open the agent configuration for "Test Agent" and switch to the Instructions editor.
2. In the Instructions field type: `Please greet the user using {{username}}.` (use `{{username}}` as
   `{{var}}` placeholder)
3. Do NOT click Save; remain on the page.

### Expected Results:

- The variable `username` is listed in the Variables/Configuration tab.
- The variable entry displays an empty value (or placeholder indicating no value set).

### Postconditions:

- Discard changes or navigate away to avoid leaving agent in modified state.

## Test Case ID: TC-06-02

#### Test Case Name: Add one variable via Instructions (save agent and verify persistence)

#### Test Case Tags: functional testing, variables, instructions, save

#### Test Case Priority: High

#### Test Case Description: Verify typing `{{var}}` in the Instructions field creates a variable that persists after saving and reopening the agent configuration.

### Preconditions: Have created agent

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed) e.g "Test
    Agent"
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab

### Test Steps:

1. Open "Test Agent" configuration and edit Instructions.
2. Type: `Start by requesting {{user_email}} to authenticate.` (introduces `user_email` variable)
3. Click "Save" to persist the agent configuration.
4. Observe transient message "The agent has been updated"
5. Re-open the "Test Agent" configuration.
6. Switch to the Variables / Configuration tab.

### Expected Results:

- On Save the transient success message "The agent has been updated" is displayed.
- The variable `user_email` appears in the Variables tab with empty value (unless initial value provided).
- After re-opening the agent configuration the `user_email` variable remains listed.

### Postconditions:

- Remove created variable or cleanup if needed.

## Test Case ID: TC-06-03

#### Test Case Name: Add multiple variables via Instructions (unsaved agent - visible in Configuration tab)

#### Test Case Tags: functional testing, variables, instructions, unsaved, multiple

#### Test Case Priority: High

#### Test Case Description: Verify typing multiple `{{var}}` placeholders in the Instructions field shows multiple variable entries in the Variables tab before saving.

### Preconditions: Have created agent

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed) e.g "Test
    Agent"
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab

### Test Steps:

1. Open "Test Agent" configuration and edit Instructions.
2. Type: `Collect {{first_name}} {{last_name}} and then send confirmation to {{email}}.`
3. Do NOT click Save; remain on the page.

### Expected Results:

- Variables `first_name`, `last_name`, and `email` are listed in the Variables tab.
- Each variable shows an empty value.

### Postconditions:

- Discard changes or navigate away to avoid leaving agent in modified state.

## Test Case ID: TC-06-04

#### Test Case Name: Add multiple variables via Instructions and save (persistence)

#### Test Case Tags: functional testing, variables, instructions, save, multiple

#### Test Case Priority: High

#### Test Case Description: Verify multiple variables added via Instructions persist after saving the agent.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed) e.g "Test
    Agent"
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab

### Test Steps:

1. Open "Test Agent" configuration and edit Instructions.
2. Type: `Request {{phone}} and {{address}} to validate the user's contact.`
3. Click "Save" to persist the agent.
4. Observe the transient "The agent has been updated" success message
5. Re-open the agent configuration.
6. Switch to the Variables / Configuration tab.

### Expected Results:

- The transient message "The agent has been updated" is displayed on Save.
- Variables `phone` and `address` are present in the Variables tab with empty values.
- After reopening the agent the variables remain present.

### Postconditions:

- Remove created variables (cleanup) if needed.

## Test Case ID: TC-06-05

#### Test Case Name: Deleting unsaved variable (discard behavior for single variable)

#### Test Case Tags: negative testing, variables, discard

#### Test Case Priority: Medium

#### Test Case Description: Verify that when a variable is added via Instructions but the user discards changes (does not save), the variable is not present after re-opening the agent.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed) e.g "Test
    Agent"
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab

### Test Steps:

1. Open "Test Agent" configuration and edit Instructions.
2. Type: `Prompt using {{temp_var}}` to create `temp_var`.
3. Click "Discard" or navigate away and confirm discard when prompted.
4. Re-open "Test Agent" configuration and switch to Variables tab.

### Expected Results:

- After discarding changes, the variable `temp_var` is NOT present in the Variables tab.

### Postconditions:

- None.

## Test Case ID: TC-06-06

#### Test Case Name: Deleting unsaved variables (discard behavior for multiple variables)

#### Test Case Tags: negative testing, variables, discard, multiple

#### Test Case Priority: Medium

#### Test Case Description: Verify that when multiple variables are added via Instructions but the user discards changes, none persist after re-opening the agent.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed) e.g "Test
    Agent"
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab

### Test Steps:

1. Open "Test Agent" configuration and edit Instructions.
2. Type: `Use {{v1}} and then {{v2}} for processing.`
3. Click "Discard" or navigate away and confirm discard when prompted.
4. Re-open "Test Agent" configuration and switch to Variables tab.

### Expected Results:

- After discarding changes, neither `v1` nor `v2` are present in the Variables tab.

### Postconditions:

- None.

## Test Case ID: TC-06-07

#### Test Case Name: Add variable when one already exists (add second variable)

#### Test Case Tags: functional testing, variables, add

#### Test Case Priority: High

#### Test Case Description: With an existing variable in the agent, verify adding another variable via Instructions is reflected in the Variables tab and persists after save.

### Preconditions: Agent has one variable configured

### Preconditions: Have created agent havong one variable

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed) e.g "Test
    Agent"
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Edit Instructions Type: "Use {{existing_var}}"
- Click the "Save" button.

### Test Steps:

1. Open "Test Agent" configuration and confirm `existing_var` in Variables tab.
2. Edit Instructions and add `Also capture {{new_var}} for later.`
3. Click "Save" to persist changes.
4. Re-open the agent and view Variables tab.

### Expected Results:

- Both {{existing_var}} and {{new_var}} are listed and present after save.

### Postconditions:

- Cleanup: remove {{new_var}}

## Test Case ID: TC-06-08

#### Test Case Name: Initialize value on variable at creation

#### Test Case Tags: functional testing, variables, initialization

#### Test Case Priority: High

#### Test Case Description: Verify that if a variable is provided with an initial value in the Instructions (if product supports syntax like "{{var=initial}}" or via UI support to set initial value during creation), the value is reflected in the Variables tab after creation and save.

### Preconditions: Have created agent

User navigates to {URL}

- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed) e.g "Test
    Agent"
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab

### Test Steps:

1. Open "Test Agent" configuration and edit Instructions.
2. If supported, insert `Notify {{recipient=ops@example.com}} about the outage.` (or use UI to set initial
   value while adding variable).
3. Click "Save".
4. Re-open agent and navigate to Variables tab.

### Expected Results:

- Variable `recipient` exists and its value is `ops@example.com` (reflects initialized value).

### Postconditions:

- Cleanup variable if needed.

## Test Case ID: TC-06-09

#### Test Case Name: Initialize value after variable created (set value in Variables tab)

#### Test Case Tags: functional testing, variables, initialization, update

#### Test Case Priority: High

#### Test Case Description: Verify setting an initial value for a variable after it's been discovered/created (open Variables tab and input value) persists after save and reopen.

### Preconditions: Have created agent with a variable "token" present (empty value)

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed) e.g "Test
    Agent"
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Add variable {{token}}` with empty value
- The Variables / Configuration tab is available and accessible

### Test Steps:

1. Open "Test Agent" configuration and go to Variables tab.
2. Click into the `token` value field and enter `abc123`.
3. Click "Save".
4. Re-open the agent and confirm `token` value equals `abc123`.

### Expected Results:

- The entered value persists after save and reopen.

### Postconditions:

- Reset token value or remove variable if needed.

## Test Case ID: TC-06-10

#### Test Case Name: Edit single variable value (replace existing value)

#### Test Case Tags: functional testing, variables, edit

#### Test Case Priority: High

#### Test Case Description: Verify editing an existing variable's value by clearing the old value and entering a new one persists after save.

### Preconditions: Have created agent with a variable `field1` initialized to `old` value

- - User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed) e.g "Test
    Agent"
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- An agent named "Test Agent" exists and includes variable `field1` with value `old`
- The Variables / Configuration tab is available and accessible

### Test Steps:

1. Open "Test Agent" configuration and go to Variables tab.
2. Click into the `field1` value field, delete all existing characters and type `newvalue`.
3. Click "Save".
4. Re-open the agent and confirm `field1` value equals `newvalue`.

### Expected Results:

- The new value `newvalue` replaces the previous value and persists after save.

### Postconditions:

- Restore previous value.

## Test Case ID: TC-06-11

#### Test Case Name: Edit multiple variable values (append vs replace scenarios)

#### Test Case Tags: functional testing, variables, edit, multiple

#### Test Case Priority: High

#### Test Case Description: Verify editing multiple variable values by both replacing (delete-then-enter) and appending (typing additional text) and persisting after save.

### Preconditions: Have created agent with variables `a`=`x` and `b`=`y`

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed) e.g "Test
    Agent"
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Add variables {{a}} and {{b}} with non-empty values in instructions
- The Variables / Configuration tab is available and accessible

### Test Steps:

1. Open "Test Agent" configuration and go to Variables tab.
2. For variable `a`: delete existing value and enter `newA` (replace scenario).
3. For variable `b`: place cursor at end of existing value and type `-more` (append scenario).
4. Click "Save".
5. Re-open the agent and confirm `a`=`newA` and `b` equals original plus `-more`.

### Expected Results:

- Replaced and appended values persist after saving.

### Postconditions:

- Restore original values if needed.

## Test Case ID: TC-06-12

#### Test Case Name: Remove variable placeholder from Instructions removes variable from Configuration list

#### Test Case Tags: functional testing, variables, delete, instructions

#### Test Case Priority: High

#### Test Case Description: Verify removing `{{var}}` placeholder text from the Instructions field removes the corresponding variable from the Variables tab (after save or when changes are saved).

### Preconditions: Have created agent with variables `del_var` present

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed) e.g "Test
    Agent"
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Add variables {{del_var}}
- The Instructions field is visible and editable in the agent configuration
- The Variables / Configuration tab is available and accessible

### Test Steps:

1. Open "Test Agent" configuration and confirm `del_var` exists in Variables tab.
2. Edit Instructions and delete the `{{del_var}}` placeholder from the Instructions text.
3. Click "Save" to persist changes.
4. Re-open the agent and switch to Variables tab.

### Expected Results:

- After saving, `del_var` is no longer listed in the Variables tab.

### Postconditions:

- None.

## Test Case ID: TC-06-13

#### Test Case Name: Remove variable placeholder and discard (unsaved deletion)

#### Test Case Tags: negative testing, variables, discard

#### Test Case Priority: Medium

#### Test Case Description: Verify that removing a variable placeholder from Instructions but discarding changes leaves the variable present after re-opening the agent.

### Preconditions: Have created agent with variable `keep_var` present

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed) e.g "Test
    Agent"
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Leave all other optional fields blank.
- Click the "Save" button.
- goto agent's list of the {Project}
- open "Test Agent"
- Navigate to configuration tab
- Add variables {{keep_var}}
- The Instructions field is visible and editable in the agent configuration
- The Variables / Configuration tab is available and accessible
- An agent named "Test Agent" exists and includes variable {{keep_var}}

### Test Steps:

1. Open "Test Agent" configuration and confirm `keep_var` exists in Variables tab.
2. Edit Instructions and remove `{{keep_var}}` from the text.
3. Click "Discard" or navigate away and confirm discard when prompted.
4. Re-open the agent and switch to Variables tab.

### Expected Results:

- After discarding, `keep_var` is still present in the Variables tab.

### Postconditions:

- None.

## Test Case ID: TC-06-14

#### Test Case Name: Full screen view for variable value

#### Test Case Tags: functional testing, variables, ui, full-screen

#### Test Case Priority: Low

#### Test Case Description: Verify clicking the "full screen view" control for a variable value opens an enlarged editor/modal for easier editing and that changes made in full-screen persist on save.

### Preconditions: Have created agent with variable `long_text` present

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- An agent named "Test Agent" exists and includes variable `long_text`
- The Variables / Configuration tab is available and accessible

### Test Steps:

1. Open "Test Agent" configuration and go to Variables tab.
2. Click the "full screen view" or expand button for `long_text` value.
3. In the full-screen editor, modify the value (e.g., add a paragraph of text).
4. Save changes from full-screen editor and then save the agent configuration.
5. Re-open agent and confirm `long_text` includes the modified content.

### Expected Results:

- The full-screen editor opens, allows editing, and saved content persists after agent save and reopen.

### Postconditions:

- Restore original value if needed.

## End of Scenario

```markdown
# Scenario ID: 05_Setup_Tags

#### Scenario Name: Setup Tags for an Agent

#### Scenario Tags: functional testing, regression, agents, tags

#### Scenario Priority: Medium

#### Scenario Description: Verify adding, removing and persisting tags on an Agent. Covers both ways to add tags (select from list via popup/dropdown and manual typing with comma/Enter), single and multiple tags, tag deletion (single and all), and that tags are not editable once added. Validate that after saving the agent a transient success message "The agent has been updated" is displayed and tags are persisted.

## Test Case ID: TC-05-01a

#### Test Case Name: Add one tag by manual input (Confirm with Enter)

#### Test Case Tags: functional testing, tags, manual, enter

#### Test Case Priority: High

#### Test Case Description: Verify a single tag can be added by typing its name and confirming with Enter.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- An agent named "Test Agent" exists and is open in configuration mode
- The Tags field is visible and editable in agent configuration
- Navigate to the "Agents" section in the {Project} of application.
- Click the "Create Agent" button (if needed to create the test agent).
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed)
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.

### Test Steps:

1. Open the agent configuration for "Test Agent".
2. Click (focus) the Tags input field.
3. Type a tag name (e.g., "support").
4. Press Enter to confirm the tag.
5. Observe that the tag "support" appears as a tag chip in the Tags list.
6. Click the "Save" button to persist changes.

### Expected Results:

- The tag chip with text "support" is displayed after confirmation in the Tags input.
- On clicking "Save" the transient success message "The agent has been updated" is displayed.
- After reopening the agent configuration, the tag "support" remains present in the Tags list.

### Postconditions:

- Remove created tags (cleanup) the tag should not be listed in tag's list also.

## Test Case ID: TC-05-01b

#### Test Case Name: Add one tag by manual input (Confirm with comma)

#### Test Case Tags: functional testing, tags, manual, comma

#### Test Case Priority: High

#### Test Case Description: Verify a single tag can be added by typing its name and confirming with a comma.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- An agent named "Test Agent" exists and is open in configuration mode
- The Tags field is visible and editable in agent configuration
- Navigate to the "Agents" section in the {Project} of application.
- Click the "Create Agent" button (if needed to create the test agent).
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed)
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.

### Test Steps:

1. Open the agent configuration for "Test Agent".
2. Click (focus) the Tags input field.
3. Type a tag name (e.g., "support").
4. Type a comma (",") to confirm the tag.
5. Observe that the tag "support" appears as a tag chip in the Tags list.
6. Click the "Save" button to persist changes.

### Expected Results:

- The tag chip with text "support" is displayed after confirmation in the Tags input.
- On clicking "Save" the transient success message "The agent has been updated" is displayed.
- After reopening the agent configuration, the tag "support" remains present in the Tags list.

### Postconditions:

- Remove created tags (cleanup) the tag should not be listed in tag's list also.

## Test Case ID: TC-05-02a

#### Test Case Name: Add multiple tags by manual input (Confirm each with Enter)

#### Test Case Tags: functional testing, tags, manual, multiple, enter

#### Test Case Priority: High

#### Test Case Description: Verify multiple tags can be added by typing names and confirming each with Enter.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- An agent named "Test Agent" exists and is open in configuration mode
- The Tags field is visible and editable in agent configuration
- Navigate to the "Agents" section in the {Project} of application.
- Click the "Create Agent" button (if needed to create the test agent).
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed)
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.

### Test Steps:

1. Open the agent configuration for "Test Agent".
2. Click (focus) the Tags input field.
3. Type "billing" then press Enter — observe tag chip created.
4. Type "priority-high" then press Enter — observe tag chip created.
5. Type "urgent" then press Enter — observe tag chip created.
6. Click "Save" to persist changes.

### Expected Results:

- All three tags appear as separate tag chips in the Tags list in the order added.
- On clicking "Save" the transient success message "The agent has been updated" is displayed.
- After reopening the agent configuration, all three tags remain present.

### Postconditions:

- Remove created tags (cleanup) the tag should not be listed in tag's list also.

## Test Case ID: TC-05-02b

#### Test Case Name: Add multiple tags by manual input (Confirm each with comma)

#### Test Case Tags: functional testing, tags, manual, multiple, comma

#### Test Case Priority: High

#### Test Case Description: Verify multiple tags can be added by typing names and confirming each with a comma.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- An agent named "Test Agent" exists and is open in configuration mode
- The Tags field is visible and editable in agent configuration
- Navigate to the "Agents" section in the {Project} of application.
- Click the "Create Agent" button (if needed to create the test agent).
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed)
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.

### Test Steps:

1. Open the agent configuration for "Test Agent".
2. Click (focus) the Tags input field.
3. Type "billing" then type a comma — observe tag chip created.
4. Type "priority-high" then type a comma — observe tag chip created.
5. Type "urgent" then type a comma — observe tag chip created.
6. Click "Save" to persist changes.

### Expected Results:

- All three tags appear as separate tag chips in the Tags list in the order added.
- On clicking "Save" the transient success message "The agent has been updated" is displayed.
- After reopening the agent configuration, all three tags remain present.

### Postconditions:

- Remove created tags (cleanup) the tag should not be listed in tag's list also.

## Test Case ID: TC-05-03a

#### Test Case Name: Add one tag by selecting from suggestions (click)

#### Test Case Tags: functional testing, tags, select, click

#### Test Case Priority: High

#### Test Case Description: Verify a tag can be added by focusing the Tags field and clicking an existing tag in the suggestion list.

### Preconditions: Have created agent and at least one existing tag available in system suggestions

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- An agent named "Test Agent" exists and is open in configuration mode
- The Tags field is visible and editable in agent configuration
- Navigate to the "Agents" section in the {Project} of application.
- Click the "Create Agent" button (if needed to create the test agent).
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed)
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.

### Test Steps:

1. Open the agent configuration for "Test Agent".
2. Focus the Tags input field; wait for the suggestion popup/dropdown to appear.
3. From the list, click the tag (e.g. "code").
4. Observe that the tag "code" appears as a tag chip.
5. Click "Save" to persist changes.

### Expected Results:

- The selected tag appears as a chip in the Tags list.
- On clicking "Save" the transient success message "The agent has been updated" is displayed.
- After reopening the agent configuration, the "code" tag remains present.

### Postconditions:

- Remove created tag(s) (cleanup).

## Test Case ID: TC-05-03b

#### Test Case Name: Add one tag by selecting from suggestions (drag-and-drop)

#### Test Case Tags: functional testing, tags, select, drag-and-drop

#### Test Case Priority: High

#### Test Case Description: Verify a tag can be added by dragging an existing suggestion into the Tags field (if UI supports drag-and-drop).

### Preconditions: Have created agent and at least one existing tag available in system suggestions

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- An agent named "Test Agent" exists and is open in configuration mode
- The Tags field is visible and editable in agent configuration
- Navigate to the "Agents" section in the {Project} of application.
- Click the "Create Agent" button (if needed to create the test agent).
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed)
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.

### Test Steps:

1. Open the agent configuration for "Test Agent".
2. Show the suggestion list and drag the tag "analytics" into the Tags field.
3. Observe that the tag "analytics" appears as a tag chip.
4. Click "Save" to persist changes.

### Expected Results:

- The dragged tag appears as a chip in the Tags list.
- On clicking "Save" the transient success message "The agent has been updated" is displayed.
- After reopening the agent configuration, the "analytics" tag remains present.

### Postconditions:

- Remove created tags (cleanup) the tag should not be listed in tag's list also.

## Test Case ID: TC-05-04a

#### Test Case Name: Add multiple tags by selecting from suggestions (click)

#### Test Case Tags: functional testing, tags, select, multiple, click

#### Test Case Priority: High

#### Test Case Description: Verify multiple tags can be added by clicking items in the suggestion list.

### Preconditions: Have created agent and multiple existing tags available in suggestions

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- An agent named "Test Agent" exists and is open in configuration mode
- The Tags field is visible and editable in agent configuration
- Navigate to the "Agents" section in the {Project} of application.
- Click the "Create Agent" button (if needed to create the test agent).
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed)
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.

### Test Steps:

1. Open the agent configuration for "Test Agent".
2. Focus the Tags input field to show suggestions.
3. Click "analytics" then click "customer" in the suggestion list.
4. Observe both tags appear as chips.
5. Click "Save" to persist changes.

### Expected Results:

- Both tags appear as separate chips in the Tags list.
- On clicking "Save" the transient success message "The agent has been updated" is displayed.
- After reopening the agent configuration, both tags remain present.

### Postconditions:

- Remove created tags (cleanup) the tag should not be listed in tag's list also.

## Test Case ID: TC-05-04b

#### Test Case Name: Add multiple tags by selecting from suggestions (drag-and-drop)

#### Test Case Tags: functional testing, tags, select, multiple, drag-and-drop

#### Test Case Priority: High

#### Test Case Description: Verify multiple tags can be added by dragging suggestions into the Tags field.

### Preconditions: Have created agent and multiple existing tags available in suggestions

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- An agent named "Test Agent" exists and is open in configuration mode
- The Tags field is visible and editable in agent configuration
- Navigate to the "Agents" section in the {Project} of application.
- Click the "Create Agent" button (if needed to create the test agent).
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed)
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.

### Test Steps:

1. Open the agent configuration for "Test Agent".
2. Show the suggestion list and drag "analytics" into the Tags field, then drag "customer" into the Tags
   field.
3. Observe both tags appear as chips.
4. Click "Save" to persist changes.

### Expected Results:

- Both tags appear as separate chips in the Tags list.
- On clicking "Save" the transient success message "The agent has been updated" is displayed.
- After reopening the agent configuration, both tags remain present.

### Postconditions:

- Remove created tags (cleanup) the tag should not be listed in tag's list also.

## Test Case ID: TC-05-05

#### Test Case Name: Tags are not editable once added

#### Test Case Tags: functional testing, tags, ui

#### Test Case Priority: Medium

#### Test Case Description: Verify that an existing tag chip cannot be edited inline (only removable).

### Preconditions: Have created agent with at least one tag

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- An agent named "Test Agent" exists and is open in configuration mode
- The Tags field is visible and editable in agent configuration
- Navigate to the "Agents" section in the {Project} of application.
- Click the "Create Agent" button (if needed to create the test agent).
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed)
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.

### Test Steps:

1. Open the agent configuration containing a tag (e.g., "support").
2. Attempt to edit the tag text by double-clicking or placing cursor into the tag chip.

### Expected Results:

- The tag text is not editable inline. The only available actions are remove (click cross on chip) or leave
  unchanged.

### Postconditions:

- None.

## Test Case ID: TC-05-06

#### Test Case Name: Remove a single tag via chip cross icon

#### Test Case Tags: functional testing, tags, delete

#### Test Case Priority: High

#### Test Case Description: Verify a single tag can be removed by clicking the cross icon on the tag chip and the removal persists after saving.

### Preconditions: Have created agent with at least two tags

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- An agent named "Test Agent" exists and is open in configuration mode
- The Tags field is visible and editable in agent configuration
- Navigate to the "Agents" section in the {Project} of application.
- Click the "Create Agent" button (if needed to create the test agent).
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed)
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Add "billing" and "urgent" tags
- Leave all other optional fields blank.
- Click the "Save" button.

### Test Steps:

1. Open the agent configuration that contains tags "billing" and "urgent".
2. Click the cross (X) icon on the "urgent" tag chip.
3. Observe that "urgent" is removed from the Tags list.
4. Click "Save" to persist changes.

### Expected Results:

- The tag "urgent" is removed from the UI list immediately after click.
- On clicking "Save" the transient success message "The agent has been updated" is displayed.
- After reopening the agent, "urgent" remains deleted while "billing" remains.

### Postconditions:

- Re-add or cleanup tags as needed.

## Test Case ID: TC-05-07

#### Test Case Name: Remove all tags (delete all)

#### Test Case Tags: functional testing, tags, delete, cleanup

#### Test Case Priority: Medium

#### Test Case Description: Verify all tags can be deleted individually and that the final state persists after save.

### Preconditions: Have created agent with multiple tags

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- An agent named "Test Agent" exists and is open in configuration mode
- The Tags field is visible and editable in agent configuration
- Navigate to the "Agents" section in the {Project} of application.
- Click the "Create Agent" button (if needed to create the test agent).
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed)
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.

### Test Steps:

1. Open the agent configuration that contains multiple tags.
2. Click the cross icon on each tag chip one by one until no tags remain.
3. Click "Save" to persist changes.

### Expected Results:

- All tags are removed from the UI after clicking their cross icons.
- On clicking "Save" the transient success message "The agent has been updated" is displayed.
- After reopening the agent, no tags are present.

### Postconditions:

- None.

## Test Case ID: TC-05-08

#### Test Case Name: Deleting a tag and cancelling save reverts deletion

#### Test Case Tags: negative testing, tags

#### Test Case Priority: Medium

#### Test Case Description: Verify that if a tag is deleted but the user discards changes (does not save), the tag remains when re-opening the agent.

### Preconditions: Have created agent with a tag

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, edit, and delete agents
- An agent named "Test Agent" exists and is open in configuration mode
- The Tags field is visible and editable in agent configuration
- Navigate to the "Agents" section in the {Project} of application.
- Click the "Create Agent" button (if needed to create the test agent).
- Fill in all the required fields:
  - Agent's name using valid symbols and valid length (up to 64 characters, alphanumeric allowed)
  - Agent's description using valid symbols and valid length (up to 512 characters, alphanumeric allowed)
- Leave all other optional fields blank.
- Click the "Save" button.

### Test Steps:

1. Open the agent configuration that contains tag "support".
2. Click the cross on "support" to remove it.
3. Do not click "Save"; instead click "Discard" or navigate away and confirm discard when prompted.
4. Reopen the agent configuration.

### Expected Results:

- After discarding changes, the tag "support" remains present as it was before deletion.

### Postconditions:

- None.

## Notes and Edge Cases

- Verify UI hint when focusing Tags field: suggestion popup or drag-and-drop area appears.
- Verify that empty tag names are not accepted.
- Verify character limits for tag names and that long names are truncated or rejected per product behavior.
- Verify tag deduplication: adding the same tag twice should not create duplicates.
```
