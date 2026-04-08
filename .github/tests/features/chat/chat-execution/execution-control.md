# Scenario ID: CHAT-005-5

#### Scenario Name:

Model settings and execution control in chat conversations

#### Scenario Tags:

chat,regression,model-settings,execution-control

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the functionality for managing model settings and execution control in chat
conversations. It covers adjusting model parameters (Temperature, Top P, Max Completion Tokens), stopping chat
execution during processing, and clearing chat history. The tests ensure that users have full control over
their chat interactions and model behavior.

## Test Case ID: SC-015

#### Test Case Name:

Model settings adjustment during chat execution

#### Test Case Tags:

chat,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can access and adjust model settings (Temperature, Top P, Max Completion Tokens) while
chatting with an AI model and that the changes are applied to subsequent responses.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User navigates to the **Chat** page (sidebar or main menu)
6. User clicks on the **+Create** button to start a new conversation
7. User selects an AI model:
   - Click **Select LLM Model** in the chat interface
   - Select **GPT-4o** (or available model) from the list
   - Verify the model selection is applied
8. User executes initial conversation:
   - Type a test message in the chat input field (e.g., "Please explain what GPT-4o model you are")
   - Click the **Run** button to execute the chat
   - Wait for the model to respond
   - Verify that both user message and model response appear in the chat

### Test Steps

1. **Access Model Settings and adjust parameters:**
   - Locate and click the **Model Settings** (gear) button in the chat interface
   - Verify that the Model Settings dialog/panel opens
   - Confirm that current model parameters are displayed (Temperature, Top P, Max Completion Tokens, Remaining
     Tokens)
   - Adjust **Temperature** slider from default value (e.g., 0.2) to **0.9**
   - Adjust **Top P** slider from default value (e.g., 0.8) to **0.3**
   - Change **Max Completion Tokens** from default value (e.g., 1024) to **4096**
   - Verify that the **Remaining Tokens** field updates accordingly
   - Verify that all numeric values update to reflect the new settings (Temperature: 0.9, Top P: 0.3, Max
     Completion Tokens: 4096)
   - Click the **Apply** button to save the model settings changes
   - Verify that the Model Settings dialog closes
   - Confirm that the settings are applied (no error messages appear)

2. **Test adjusted settings in conversation:**
   - Type a new test message in the chat input field (e.g., "Generate a creative story about space
     exploration")
   - Click the **Run** button to execute the chat
   - Wait for the model to respond with the new settings

3. **Verify settings persistence:**
   - Click the **Model Settings** button again
   - Verify that the previously adjusted values are maintained (Temperature: 0.9, Top P: 0.3, Max Completion
     Tokens: 512)
   - Click **Cancel** to close without changes

4. **Test Cancel functionality:**
   - Click the **Model Settings** button
   - Make a temporary change to any parameter (e.g., change Temperature to 0.1)
   - Click **Cancel** button
   - Verify that the dialog closes without applying changes
   - Reopen Model Settings to confirm the previous values are unchanged (Temperature: 0.9, Top P: 0.3, Max
     Completion Tokens: 512)

### Expected Results

- Model Settings button is visible and accessible in the chat interface
- Model Settings dialog opens successfully when clicked
- Temperature slider functions properly within the 0.1-1.0 range
- Top P slider functions properly within the 0.1-1.0 range
- Max Completion Tokens field accepts valid numeric input
- Remaining Tokens calculation updates automatically when Max Completion Tokens changes
- Numeric values update in real-time as sliders are moved
- Apply button successfully saves and applies the new settings
- Model Settings dialog closes after successful application
- No error messages appear when valid settings are applied
- Previously applied settings are maintained when reopening Model Settings dialogCancel button closes the
  dialog without applying any changes

### Postconditions

1. Clean up the test conversation:
   - Click on the **3 dots** (ellipsis menu) next to the conversation name(`Explain GPT-4o model you`) in the
     CONVERSATIONS sidebar
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the deleted conversation
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

## Test Case ID: SC-016

#### Test Case Name:

Stop chat execution using stop button

#### Test Case Tags:

chat,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can stop/interrupt chat execution while the AI model is generating a response by clicking
the stop button that replaces the run button during execution.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User navigates to the **Chat** page (sidebar or main menu)
6. User clicks on the **+Create** button to start a new conversation
7. User selects an AI model:
   - Click **Select LLM Model** in the chat interface
   - Select **GPT-4o** (or available model) from the list
   - Verify the model selection is applied

### Test Steps

1. **Prepare a message that will take time to generate:**
   - Type a complex request in the chat input field that will require significant processing time (e.g.,
     "Write a detailed 1000-word essay about artificial intelligence, machine learning, and their impact on
     society")
   - Verify the **Run** button is visible and ready

2. **Execute chat and observe button state change:**
   - Click the **Run** button to start chat execution
   - Immediately verify that the **Run** button changes to a **Stop** button (square/stop icon)
   - Verify that a loading indicator or "thinking" state is displayed

3. **Stop execution using the stop button:**
   - While the model is still generating the response (before completion)
   - Click the **Stop** button (square/stop icon)
   - Verify that the execution stops immediately
   - Verify that the **Stop** button changes back to the **Run** button
   - Verify that any loading indicators disappear

### Expected Results

- Run button immediately changes to Stop button when execution starts
- Stop button remains visible throughout the entire execution process
- Stop button changes back to Run button when execution completes or is stopped
- Button state changes are immediate and responsive
- Clicking Stop button immediately interrupts the ongoing execution
- No UI freezing or unresponsive behavior during execution or stopping
- No error messages or warnings when using stop functionality appropriately

### Postconditions

1. Clean up the test conversation:
   - Click on the **3 dots** (ellipsis menu) next to the conversation name(`New conversation`) in the
     CONVERSATIONS sidebar
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the deleted conversation
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test validates critical user control functionality for long-running AI processes
- Focus is on immediate responsiveness and proper state management during execution control
- Stop functionality is essential for user experience when dealing with complex queries or slow responses
- Proper handling of interrupted execution prevents system inconsistencies
- Multiple stop/start cycles test the robustness of the execution control system
- Feature ensures users maintain control over their chat interactions and can correct mistakes quickly

## Test Case ID: SC-017

#### Test Case Name:

Clear chat history functionality

#### Test Case Tags:

chat,regression

#### Test Case Priority:

High

#### Test Case Description

Verify that users can clear all chat history using the "Clear chat history" button, which removes all messages
from the current conversation while maintaining the conversation structure.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User navigates to the **Chat** page (sidebar or main menu)
6. User clicks on the **+Create** button to start a new conversation
7. User selects an AI model:
   - Click **Select LLM Model** in the chat interface
   - Select **GPT-4o** (or available model) from the list
   - Verify the model selection is applied
8. User creates conversation with multiple messages:
   - Type a first message (e.g., "What are your capabilities?")
   - Click **Run** and wait for response
   - Type a second message (e.g., "Can you help me write code?")
   - Click **Run** and wait for response
   - Verify that multiple message pairs (user + AI) are displayed in the chat

### Test Steps

1. **Locate the Clear chat history button:**
   - Verify that the **Clear chat history** button is visible in the chat interface
   - Click the **Clear chat history** button
   - Verify that a **Warning** confirmation dialog appears
   - Confirm the dialog displays the message: "The deleted messages can't be restored. Are you sure to delete
     all the messages?"
   - Verify the dialog has two buttons: **Cancel** (gray) and **Confirm** (red)
   - Click the **Cancel** (gray) button
   - Verify that the dialog closes without clearing any messages
   - Confirm that all current messages remain intact in the chat

2. **Execute clear chat history with Confirm:**
   - Click the **Clear chat history** button again
   - Verify the **Warning** confirmation dialog appears with the same message
   - Click **Confirm** (red) to proceed with clearing the history

3. **Verify chat history is cleared:**
   - Verify that all previous messages (both user and AI messages) are removed from the chat interface
   - Confirm that the chat area shows an empty/clean state
   - Verify that the message input field remains available and functional
   - Confirm that the conversation(`Your capabilities`) still exists in the CONVERSATIONS sidebar
     (conversation not deleted, only history cleared)

### Expected Results

- Clear chat history button is visible and easily accessible in the chat interface
- Clicking Clear chat history button triggers a **Warning** confirmation dialog
- Dialog displays the exact message: "The deleted messages can't be restored. Are you sure to delete all the
  messages?"
- Dialog provides two clear options: **Cancel** (gray button) and **Confirm** (red button)
- All previous messages (user and AI) are completely removed from the chat interface
- Chat area displays a clean/empty state after clearing
- No residual message fragments or formatting remain
- Clearing operation is immediate and complete

### Postconditions

1. Clean up the test conversation:
   - Click on the **3 dots** (ellipsis menu) next to the conversation name(`Your capabilities`) in the
     CONVERSATIONS sidebar
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the deleted conversation
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes
