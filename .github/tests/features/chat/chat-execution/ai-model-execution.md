# Scenario ID: CHAT-005-1

#### Scenario Name:

AI model execution in chat conversations

#### Scenario Tags:

chat,smoke,regression,models

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the functionality for executing chat conversations with various AI models. It covers
selecting different LLM models (GPT-4o, Claude Anthropic, GPT-5-mini, Dial) and ensuring that chat execution
works correctly with each model type. The tests verify model selection, response generation, and
model-specific characteristics.

## Test Case ID: SC-001

#### Test Case Name:

Execute chat with GPT-4o-2024-11-20 LLM model

#### Test Case Tags:

chat,smoke

#### Test Case Priority:

High

#### Test Case Description

Verify that users can execute chat conversations using the GPT-4o-2024-11-20 LLM model

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click on the **+Create** button to start a new conversation
3. Locate and click **Select LLM Model** in the chat interface
4. Select **GPT-4o-2024-11-20** from the available LLM models
5. Verify the model selection is applied and displayed
6. Type a test message in the chat input field (e.g., "Please explain what GPT-4o model you are")
7. Click the **Run**(play icon) button to execute the chat
8. Verify the response is generated using the selected GPT-4o model

### Expected Results

- Model Settings are accessible and functional
- GPT-4o-2024-11-20 model is available for selection
- Model selection is properly applied and maintained
- Chat execution works successfully with the selected model
- Responses are generated and displayed correctly
- Model remains consistent throughout the conversation
- New conversation appears in the CONVERSATIONS sidebar

### Postconditions

1. Clean up the test conversation:
   - Click on the **3 dots** (ellipsis menu) next to the (`Explain GPT-4o model you`)conversation name in the
     CONVERSATIONS sidebar
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the deleted conversation
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test validates LLM model selection and execution functionality
- Focus is on successful model configuration and chat execution

## Test Case ID: SC-002

#### Test Case Name:

Execute chat with Claude Anthropic model

#### Test Case Tags:

chat,regression

#### Test Case Priority:

High

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click on the **+Create** button to start a new conversation
3. Locate and click **Select LLM Model** in the chat interface
4. Select **eu.anthropic.claude-sonnet-4-20250514-v1:0** from the available LLM models
5. Verify the model selection is applied and displayed
6. Type a test message in the chat input field (e.g., "What Anthropic model are you and what are your
   capabilities?")
7. Click the **Run**(play icon) button to execute the chat
8. Verify the response is generated using the selected claude-sonnet model

### Expected Results

- Claude Anthropic model is available for selection in Model Settings
- Model selection is properly applied and maintained
- Chat execution works successfully with Claude model
- Responses are characteristic of Claude Anthropic model
- Model remains consistent throughout the conversation
- Conversation appears in the CONVERSATIONS sidebar

### Postconditions

1. Clean up the test conversation:
   - Click on the **3 dots** (ellipsis menu) next to the (`Anthropic model you and your`)conversation name in
     the CONVERSATIONS sidebar
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the deleted conversation
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test validates Claude Anthropic model selection and execution
- Focus is on model-specific functionality and response quality

## Test Case ID: SC-003

#### Test Case Name:

Execute chat with GPT-5-mini model

#### Test Case Tags:

chat,regression

#### Test Case Priority:

Medium

#### Test Case Description

Verify that users can execute chat conversations using the GPT-5-mini model

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click on the **+Create** button to start a new conversation
3. Locate and click **Select LLM Model** in the chat interface
4. Select **GPT-5-mini** from the available LLM models
5. Verify the model selection is applied and displayed
6. Type a test message in the chat input field (e.g., "What model are you and what are your capabilities?")
7. Click the **Run**(play icon) button to execute the chat
8. Verify the response is generated using the GPT-5-mini model

### Expected Results

- GPT-5-mini model is available for selection in Model Settings
- Model selection is properly applied and maintained
- Chat execution works successfully with GPT-5-mini model
- Responses are generated with appropriate mini model characteristics
- Model performs as expected for a lighter version
- Conversation appears in the CONVERSATIONS sidebar

### Postconditions

1. Clean up the test conversation:
   - Click on the **3 dots** (ellipsis menu) next to the (`Model you and your capabilities?`)conversation name
     in the CONVERSATIONS sidebar
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the deleted conversation
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test validates GPT-5-mini model selection and execution
- Focus is on mini model functionality and performance characteristics

## Test Case ID: SC-004

#### Test Case Name:

Execute chat with Dial model

#### Test Case Tags:

chat,regression

#### Test Case Priority:

Medium

#### Test Case Description

Verify that users can execute chat conversations using the Dial model

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. Click on the **+Create** button to start a new conversation
3. Locate and click **Select LLM Model** in the chat interface
4. Select **Dial** model from the available LLM models
5. Verify the model selection is applied and displayed
6. Type a test message in the chat input field (e.g., "What Dial model are you and how do you work?")
7. Click the **Run**(play icon) button to execute the chat
8. Verify the response is generated using the Dial model

### Expected Results

- Dial model is available for selection in Model Settings
- Model selection is properly applied and maintained
- Chat execution works successfully with Dial model
- Responses are characteristic of Dial model functionality
- Model-specific features work as expected
- Conversation appears in the CONVERSATIONS sidebar

### Postconditions

1. Clean up the test conversation:
   - Click on the **3 dots** (ellipsis menu) next to the (`Dial model you and you`)conversation name in the
     CONVERSATIONS sidebar
   - Select **Delete** from the contextual menu
   - Confirm deletion in the modal dialog
   - Verify the conversation is removed from the CONVERSATIONS sidebar
2. Verify no residual data remains from the deleted conversation
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test validates Dial model selection and execution functionality
- Focus is on Dial-specific capabilities and performance
