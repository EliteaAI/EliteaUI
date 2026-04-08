# Scenario ID: CANVAS-004-2

#### Scenario Name:

Workflow management and field validation in agent creation

#### Scenario Tags:

chat,canvas,agent,create,regression,validation

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the workflow management and field validation functionality during agent creation via
the canvas interface. It covers save/discard processes, proper handling of unsaved changes, conversation
starter management, and comprehensive field validation including required fields and character limits.

## Test Case ID: AG-004

#### Test Case Name:

Cancel agent creation process

#### Test Case Tags:

chat,canvas,agent,create,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can properly discard agent creation at any stage of the process, including confirmation
prompts when unsaved changes exist, and ensure no partial data is preserved after discarding.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Agents**
3. Click on the **Create new agent** button
4. Fill in partial agent data:
   - Enter **Name**: "Test Discard Agent"
   - Enter **Description**: "Agent to test discard functionality"
   - Add some instruction text: "This is a test instruction"
5. Click the **Discard** button
6. Click **Cancel** to test cancellation of discard
7. Click **Discard** button again
8. This time click **Confirm** to proceed with discard
9. Reopen agent creation canvas (steps 3)

### Expected Results

- Confirmation dialog appears with title "Warning" and message "Are you sure to drop the changes?"
- Dialog has **Cancel** and **Confirm** buttons
- When clicking **Cancel**, dialog closes and returns to agent creation form with data intact
- When clicking **Confirm**, canvas closes and returns to chat view
- After reopening agent creation canvas, all fields are empty (no data persistence)

### Postconditions

1. No test agents were created in the system
2. Confirm the Agents section shows no new entries
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates **Discard** button functionality and unsaved changes handling
- Ensures proper cleanup after discard operations
- Tests both **Cancel** and **Confirm** options in confirmation dialog

## Test Case ID: AG-005

#### Test Case Name:

Cancel agent creation process X button

#### Test Case Tags:

chat,canvas,agent,create,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can properly close agent creation using the X (close) button at any stage of the process,
including confirmation prompts when unsaved changes exist, and ensure no partial data is preserved after
closing.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Agents**
3. Click on the **Create new agent** button
4. Fill in partial agent data:
   - Enter **Name**: "Test Close Agent"
   - Enter **Description**: "Agent to test X button close functionality"
   - Add some instruction text: "This is a test instruction"
5. Click the **X** (close) button
6. Click **Cancel** to test cancellation of close
7. Click **X** (close) button again
8. This time click **Confirm** to proceed with close
9. Reopen agent creation canvas (step 3)

### Expected Results

- Confirmation dialog appears with title "Warning" and message "Are you sure to drop the changes?"
- Dialog has **Cancel** and **Confirm** buttons
- When clicking **Cancel**, dialog closes and returns to agent creation form with data intact
- When clicking **Confirm**, canvas closes and returns to chat view
- After reopening agent creation canvas, all fields are empty (no data persistence)

### Postconditions

1. No test agents were created in the system
2. Confirm the Agents section shows no new entries
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates **X** (close) button functionality and unsaved changes handling
- Ensures proper cleanup after close operations
- Tests both **Cancel** and **Confirm** options in confirmation dialog

## Test Case ID: AG-006

#### Test Case Name:

Manage conversation starters in agent creation

#### Test Case Tags:

chat,canvas,agent,create,regression

#### Test Case Priority:

Medium

#### Test Case Description

Verify that users can add, edit, and remove conversation starters during agent creation, including proper
management of multiple starters and validation of starter content.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Agents**
3. Click on the **Create new agent** button
4. Navigate to the **CONVERSATION STARTERS** section
5. Click the **+ Starter** button
6. Enter text in the starter field (e.g., "How can you help me?")
7. Click **+ Starter** again to add a second starter
8. Enter text in the second starter field (e.g., "What can you do?")
9. Add a third starter with text (e.g., "Tell me about your capabilities")
10. Click **+ Starter** again to add a fourth starter
11. Enter text in the fourth starter field (e.g., "How do I get started?")
12. Attempt to click the **+ Starter** button
13. Locate the delete (trash) icon next to the fourth starter field ("How do I get started?")
14. Click the delete icon for the fourth starter

### Expected Results

- New starter input field appears after clicking **+ Starter**
- The **+ Starter** button is disabled (no longer clickable) after adding 4 starters
- Each starter field has a delete (trash) icon for individual removal
- Clicking the delete icon removes the specific starter immediately
- The **+ Starter** button becomes enabled again after removal

### Postconditions

1. Click **Discard** to cancel agent creation
2. Verify no agent data is saved including conversation starters
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

- Test validates conversation starter management functionality
- Verifies 4-starter maximum limit and button disable/enable behavior
- Tests both addition and removal of conversation starters

## Test Case ID: AG-009

#### Test Case Name:

Verify required fields validation during agent creation

#### Test Case Tags:

chat,canvas,agent,create,smoke,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that required fields (Name and Description) are properly validated during agent creation and that the
Save button remains disabled until both required fields are filled. This test validates form validation
behavior and button state management.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Agents**
3. Click on the **Create new agent** button
4. Verify the **Save** button is disabled (both fields empty)
5. Enter only the **Name\*** field: "Test Required Fields"
6. Verify the **Save** button remains disabled (Description field empty)
7. Clear the **Name\*** field and enter only the **Description\*** field: "Testing required field validation"
8. Verify the **Save** button remains disabled (Name field empty)
9. Enter both required fields:
   - **Name\***: "Test Required Fields Agent"
   - **Description\***: "Agent for testing required field validation"
10. Verify the **Save** button is now enabled
11. Clear the **Name\*** field
12. Verify the **Save** button becomes disabled again

### Expected Results

- **Save** button is disabled when both required fields are empty (step 4)
- **Save** button remains disabled when only **Name\*** field is filled (step 6)
- **Save** button remains disabled when only **Description\*** field is filled (step 8)
- **Save** button becomes enabled when both **Name\*** and **Description\*** fields are filled (step 10)
- **Save** button becomes disabled again when **Name\*** field is cleared (steps 11-12) and "Name is required"
  validation message is displayed
- Required field indicators (\*) are visible next to field labels
- Save button state properly reflects required field validation status

### Postconditions

1. Click **Discard** to cancel agent creation without saving
2. Confirm no agent data is saved
3. Verify the canvas closes and returns to chat view
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: AG-010

#### Test Case Name:

Verify character length validation for agent creation fields

#### Test Case Tags:

chat,canvas,agent,create,regression

#### Test Case Priority:

Medium

#### Test Case Description

Verify that character length limits are enforced for Name (max 64), Tags (max 48), and Description (max 512)
fields during agent creation. This test validates that users cannot input more characters than the specified
maximum limits.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: agent.create, agent.list

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Agents**
3. Click on the **Create new agent** button
4. Test **Name\*** field character limit:
   - Attempt to enter a string with 65 characters (exceeding 64-character limit)
   - Verify that only 64 characters are accepted
5. Test **Tags** field character limit:
   - Attempt to enter a string with 49 characters (exceeding 48-character limit)
   - Verify that only 48 characters are accepted
6. Test **Description\*** field character limit:
   - Attempt to enter a string with 513 characters (exceeding 512-character limit)
   - Verify that only 512 characters are accepted
7. Verify valid character lengths work correctly:
   - Enter exactly 64 characters in **Name\*** field
   - Enter exactly 48 characters in **Tags** field
   - Enter exactly 512 characters in **Description\*** field
8. Verify all fields accept the maximum allowed characters

### Expected Results

- **Name\*** field enforces 64-character maximum:
  - Attempting to input 65+ characters results in only 64 characters being accepted
  - Field truncates input at 64 characters automatically
- **Tags** field enforces 48-character maximum:
  - Attempting to input 49+ characters results in only 48 characters being accepted
  - Field truncates input at 48 characters automatically
- **Description\*** field enforces 512-character maximum:
  - Attempting to input 513+ characters results in only 512 characters being accepted
  - Field truncates input at 512 characters automatically
- All fields accept their maximum allowed character counts (64, 48, and 512 respectively)
- Character limits are enforced in real-time during typing
- No validation error messages appear when within character limits
- Fields handle character limit enforcement gracefully without breaking functionality

### Postconditions

1. Click **Discard** to cancel agent creation without saving
2. Confirm no agent data is saved
3. Verify the canvas closes and returns to chat view
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes
