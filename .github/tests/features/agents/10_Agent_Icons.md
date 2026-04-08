# Scenario ID: 10_Agent_Icons

#### Scenario Name:

Agent Icons — upload, select, use custom and default icons

#### Scenario Tags:

functional testing, regression, agents, icons, upload

#### Scenario Priority:

High

#### Scenario Description:

Validate the agent icon UX: hover behavior, icon chooser modal, selecting from existing icons, uploading
supported image formats under the size limit, rejection of unsupported formats and oversized files, and
ability to set different icons per agent version.

---

## Test Case ID: TC-10-01

#### Test Case Name:

Hover over agent icon shows edit (pencil) affordance

#### Test Case Tags:

positive, ui, hover

#### Test Case Priority:

Medium

#### Test Case Description:

On the Agent configuration tab, hovering over the agent icon near the agent name shows a pencil/edit icon.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Position the mouse cursor over the agent icon without clicking
5. Hold the mouse cursor steady over the icon for 1-2 seconds
6. Observe the visual changes to the icon during hover
7. Move the mouse cursor away from the icon
8. Observe the icon returns to its normal state
9. Repeat the hover action to confirm consistent behavior
10. Verify the hover effect is clearly visible and intuitive

### Expected Results

- The agent icon is clearly visible near the agent's name in the configuration header
- When hovering over the icon, a visual change occurs indicating editability
- The icon shows a pencil/edit affordance (overlay, border change, or similar visual indicator)
- The hover state clearly communicates that the icon is clickable/editable
- The visual change is immediate and responsive to mouse movement
- When the mouse moves away, the icon returns to its normal appearance
- The hover effect is consistent across multiple hover actions
- The hover state does not interfere with other UI elements
- The pencil/edit affordance is clearly distinguishable from the original icon

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

- delete agent created at precondition

## Test Case ID: TC-10-02

#### Test Case Name:

Click pencil opens icon chooser modal with existing and upload options

#### Test Case Tags:

positive, ui, modal

#### Test Case Priority:

High

#### Test Case Description:

Clicking the pencil edit icon opens a chooser window with a list of previously added icons, an upload control,
and current agent icon preview. Default fallback icon is shown if none uploaded.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Position the mouse cursor over the agent icon to reveal the hover state
5. Observe the pencil/edit affordance appears
6. Click on the pencil/edit icon that appears during hover
7. Wait for the modal window to open
8. Observe the modal window title and content
9. Examine the existing icons list/grid area
10. Locate the upload control (button or dropzone)
11. Examine the preview area showing the current agent icon
12. Verify all modal components are properly displayed and accessible
13. Check if the modal is properly centered and sized
14. Verify the modal overlay/backdrop is present

### Expected Results

- Clicking the pencil/edit icon immediately opens a modal window
- The modal window displays the title "Choose the image from the list or upload" (or equivalent)
- The modal contains a list/grid area for existing icons (may be empty for new installations)
- An upload control is present (either as a button, dropzone, or file input)
- A preview area shows the agent's current icon or default fallback symbol
- The modal is properly sized and centered on the screen
- The modal has a backdrop/overlay that dims the background content
- All modal elements are properly aligned and visually organized
- The modal is fully functional and responsive
- Close button (X) or equivalent dismissal option is visible
- The modal does not obscure critical UI elements
- Loading states are handled gracefully if applicable

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

- delete agent created at precondition

## Test Case ID: TC-10-03

#### Test Case Name:

Close icon chooser via close (X) button

#### Test Case Tags:

negative, ui, modal

#### Test Case Priority:

Medium

#### Test Case Description:

Confirm the chooser modal closes when clicking the cross/close button and the user remains on the Agent
Configuration tab.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Position the mouse cursor over the agent icon to reveal the hover state
5. Click on the pencil/edit icon that appears during hover
6. Wait for the icon chooser modal to open completely
7. Locate the close button (X) in the modal header or corner
8. Verify the close button is visible and accessible
9. Click on the close (X) button
10. Observe the modal closing animation/transition
11. Verify the modal is completely dismissed
12. Check that the focus returns to the Agent Configuration tab
13. Verify no changes were made to the agent icon
14. Confirm the user remains on the same page/tab

### Expected Results

- The icon chooser modal opens successfully when clicking the pencil icon
- The close button (X) is clearly visible in the modal
- The close button is clickable and responsive
- Clicking the close button immediately initiates modal dismissal
- The modal closes smoothly with appropriate transition/animation
- The modal is completely removed from the screen
- Focus returns to the Agent Configuration tab
- The user remains on the Agent Configuration tab (no navigation occurs)
- No changes are made to the agent icon
- The background content is no longer dimmed/overlaid
- The page functionality returns to normal
- No error messages or unexpected behavior occurs

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

- ***

## Test Case ID: TC-10-04

#### Test Case Name:

Close icon chooser by clicking outside modal

#### Test Case Tags:

negative, ui, modal

#### Test Case Priority:

Medium

#### Test Case Description:

Confirm the chooser modal closes when the user clicks outside the modal area (backdrop click) and returns to
the Agent Configuration tab.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Position the mouse cursor over the agent icon to reveal the hover state
5. Click on the pencil/edit icon that appears during hover
6. Wait for the icon chooser modal to open completely
7. Observe the modal backdrop (darkened area around the modal)
8. Identify the modal content area and the backdrop area outside it
9. Click on the backdrop area outside the modal content (not on the modal itself)
10. Observe the modal closing animation/transition
11. Verify the modal is completely dismissed
12. Check that the focus returns to the Agent Configuration tab
13. Verify no changes were made to the agent icon
14. Confirm the user remains on the same page/tab

### Expected Results

- The icon chooser modal opens successfully when clicking the pencil icon
- The modal backdrop (overlay) is clearly visible behind the modal content
- The backdrop area outside the modal content is clickable
- Clicking on the backdrop area immediately initiates modal dismissal
- The modal closes smoothly with appropriate transition/animation
- The modal is completely removed from the screen
- Focus returns to the Agent Configuration tab
- The user remains on the Agent Configuration tab (no navigation occurs)
- No changes are made to the agent icon
- The background content is no longer dimmed/overlaid
- The page functionality returns to normal
- Backdrop click behavior is consistent with other modals in the application
- No error messages or unexpected behavior occurs

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

- ***

## Test Case ID: TC-10-05

#### Test Case Name:

Upload web image (.svg/.webp) — exactly 500KB is rejected

#### Test Case Tags:

negative, upload, web, size-boundary

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload an SVG or WebP image with size exactly 500KB; the application should reject it per size
limit.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload an SVG or WebP file with size exactly 500KB.

### Expected Results:

- The upload is rejected and a clear validation message is shown indicating file size must be less than 500KB.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-06

#### Test Case Name:

Upload web image (.svg/.webp) — >500KB is rejected

#### Test Case Tags:

negative, upload, web, size-boundary

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload an SVG or WebP image larger than 500KB and verify it is rejected.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload an SVG or WebP file larger than 500KB.

### Expected Results:

- Upload is rejected and validation message displayed indicating file is too large.

### Postconditions:

- delete agent created at precondition

## Test Case ID: TC-10-07

#### Test Case Name:

Select existing icon from list updates agent icon and shows success message

#### Test Case Tags:

positive, selection, ui

#### Test Case Priority:

High

#### Test Case Description:

Selecting an icon from the existing icons list changes the agent's icon, closes modal, and displays a success
notification.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Ensure at least one existing icon is available in the icons list (if not, upload one first using Upload
     tests below)

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Record the current agent icon (if any) for comparison purposes
5. Position the mouse cursor over the agent icon to reveal the hover state
6. Click on the pencil/edit icon that appears during hover
7. Wait for the icon chooser modal to open completely
8. Observe the available icons in the existing icons list/section
9. Identify and select an icon different from the current agent icon
10. Click on the selected icon from the existing icons list
11. Observe any loading indicators or transitions after selection
12. Wait for the modal to close automatically after icon selection
13. Check for any success notification or message displayed
14. Verify the agent icon has been updated in the Configuration tab header
15. Compare the new icon with the previously selected icon to confirm the change

### Expected Results

- The icon chooser modal opens successfully when clicking the pencil icon
- The existing icons list/section displays available icons properly
- Icons in the existing list are clickable and selectable
- When an icon is clicked from the existing list:
  - A loading indicator may briefly appear during the update process
  - The modal closes automatically after successful selection
  - A success notification/message is displayed confirming the icon update
  - The agent icon in the Configuration tab header is immediately updated
  - The new icon matches the selected icon from the list
- The icon update process completes without errors
- The page remains on the Agent Configuration tab
- No additional user action is required to complete the icon change
- The updated icon persists after page refresh or navigation
- The icon change is reflected in other views (agents list, etc.)

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

- ***

## Test Case ID: TC-10-08

#### Test Case Name:

Upload and apply supported image format under 500KB (generic)

#### Test Case Tags:

positive, upload, formats

#### Test Case Priority:

High

#### Test Case Description:

Upload a supported image file under 500KB via the Upload control in the chooser modal and confirm it becomes
available and can be applied.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Prepare a supported image file (PNG, JPG, JPEG, GIF, SVG) under 500KB for upload testing
   - Ensure test files exist in {path_less_500} folder with supported image formats under 500KB

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Position the mouse cursor over the agent icon to reveal the hover state
5. Click on the pencil/edit icon that appears during hover
6. Wait for the icon chooser modal to open completely
7. Locate the **Upload** control/button within the modal
8. Click on the **Upload** control to open the file selection dialog
9. Navigate to {path_less_500} folder in the file selection dialog
10. Select a supported image file under 500KB:

- File format: PNG, JPG, JPEG, GIF, or SVG
- File size: Less than 500KB
- Image dimensions: Reasonable size for icon usage

11. Confirm the file selection in the file dialog
12. Monitor the upload progress indicator (if displayed)
13. Wait for the upload process to complete
14. Verify the uploaded icon appears in the icons list/preview area
15. Check that the uploaded icon is visually displayed correctly
16. Click on the newly uploaded icon to select it
17. Observe any confirmation dialogs or immediate application
18. Verify the modal closes after icon selection
19. Check for success notification/message after icon update
20. Confirm the agent icon in the Configuration tab header is updated

### Expected Results

- The icon chooser modal opens successfully
- The **Upload** control is visible and accessible within the modal
- Clicking the **Upload** control opens the system file selection dialog
- The file selection dialog allows browsing and selecting image files
- The supported image file (under 500KB) uploads without errors
- Upload progress is indicated during the process (if applicable)
- The upload completes successfully within a reasonable time
- The uploaded icon appears in the icons list/preview area
- The uploaded icon displays correctly with proper image quality
- The uploaded icon is selectable and clickable
- Clicking the uploaded icon selects it as the agent's icon
- The modal closes automatically after successful icon selection
- A success notification/message confirms the icon update
- The agent icon in the Configuration tab header shows the uploaded image
- The uploaded icon maintains good visual quality and appropriate sizing
- No error messages or upload failures occur during the process
- The uploaded icon persists after page refresh or navigation

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
3. Clean up uploaded icon file if it remains in the system
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-10-09

#### Test Case Name:

Upload .png images — three valid under 500KB

#### Test Case Tags:

positive, upload, png

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload three different PNG files each under 500KB and verify successful upload and application.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Prepare three different PNG image files (each under 500KB) for upload testing
   - Ensure test PNG files exist in {path_less_500} folder with various PNG formats under 500KB

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Position the mouse cursor over the agent icon to reveal the hover state
5. Click on the pencil/edit icon that appears during hover
6. Wait for the icon chooser modal to open completely
7. **Upload PNG File #1:**
   - Click on the **Upload** control within the modal
   - Navigate to {path_less_500} folder in the file selection dialog
   - Select PNG file #1 (size < 500KB) from the available PNG files
   - Monitor upload progress and wait for completion
   - Verify the uploaded PNG appears in the icons list
   - Check that the PNG displays correctly with good image quality
8. **Upload PNG File #2:**
   - Click on the **Upload** control again
   - Navigate to {path_less_500} folder in the file selection dialog
   - Select PNG file #2 (size < 500KB) from the available PNG files
   - Monitor upload progress and wait for completion
   - Verify the second PNG appears in the icons list alongside the first
   - Check that both PNGs are displayed correctly
9. **Upload PNG File #3:**
   - Click on the **Upload** control again
   - Navigate to {path_less_500} folder in the file selection dialog
   - Select PNG file #3 (size < 500KB) from the available PNG files
   - Monitor upload progress and wait for completion
   - Verify the third PNG appears in the icons list with the previous two
   - Check that all three PNGs are displayed correctly
10. **Test PNG File #1 Selection:**
    - Click on the first uploaded PNG to select it
    - Verify the modal closes and agent icon updates
    - Check for success notification
    - Verify the agent Configuration tab shows PNG #1 as the icon
11. **Test PNG File #2 Selection:**
    - Open the icon chooser modal again
    - Click on the second uploaded PNG to select it
    - Verify the modal closes and agent icon updates
    - Check for success notification
    - Verify the agent Configuration tab shows PNG #2 as the icon
12. **Test PNG File #3 Selection:**
    - Open the icon chooser modal again
    - Click on the third uploaded PNG to select it
    - Verify the modal closes and agent icon updates
    - Check for success notification
    - Verify the agent Configuration tab shows PNG #3 as the icon

### Expected Results

- The icon chooser modal opens successfully
- All three PNG upload operations complete without errors:
  - PNG File #1 uploads successfully and appears in the icons list
  - PNG File #2 uploads successfully and appears alongside PNG #1
  - PNG File #3 uploads successfully and all three PNGs are visible
- Each uploaded PNG file displays correctly with proper image quality
- All three PNG files maintain their visual integrity during upload
- The icons list properly manages multiple uploaded files
- Each PNG file is selectable and clickable from the icons list
- When selecting PNG File #1:
  - Modal closes automatically
  - Agent icon updates to show PNG #1
  - Success notification appears confirming the change
- When selecting PNG File #2:
  - Modal closes automatically
  - Agent icon updates to show PNG #2
  - Success notification appears confirming the change
- When selecting PNG File #3:
  - Modal closes automatically
  - Agent icon updates to show PNG #3
  - Success notification appears confirming the change
- All PNG format files are properly supported and handled
- No upload failures or format compatibility issues occur
- File size validation works correctly (under 500KB requirement)
- Multiple file uploads work seamlessly in sequence

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
3. Clean up uploaded PNG icon files if they remain in the system
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

#### Test Case Description:

Upload three different JPEG images, all under 500KB, and verify successful upload and apply behavior.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Upload JPEG file #1 (size < 500KB).
3. Verify upload success and the image appears in the list.
4. Repeat for JPEG file #2 and #3.
5. Select each uploaded image to apply and confirm agent icon change + success message.

### Expected Results:

- All three JPEG uploads succeed and are applicable.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-21

#### Test Case Name:

Upload .jpg/.jpeg file — exactly 500KB is rejected

#### Test Case Tags:

negative, upload, jpeg, size-boundary

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload a JPG/JPEG image with size exactly 500KB; the application should reject it per size limit.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Ensure test files exist in {path_eq_500} folder with JPG/JPEG files exactly 500KB in size

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Position the mouse cursor over the agent icon to reveal the hover state
5. Click on the pencil/edit icon that appears during hover
6. Wait for the icon chooser modal to open completely
7. Locate the **Upload** control/button within the modal
8. Click on the **Upload** control to open the file selection dialog
9. Navigate to {path_eq_500} folder in the file selection dialog
10. Select the JPG/JPEG file with size exactly 500KB from the available files
11. Attempt to confirm the file selection in the file dialog
12. Observe the upload attempt and any validation messages
13. Check for error messages or rejection notifications
14. Verify the upload is blocked before completion
15. Check that no progress indicator appears or it stops with an error
16. Confirm the file does not appear in the icons list
17. Verify the validation message clearly indicates the size limit issue
18. Check that the modal remains open after the rejection
19. Verify no changes are made to the agent icon

### Expected Results

- The icon chooser modal opens successfully
- The **Upload** control is visible and accessible within the modal
- Clicking the **Upload** control opens the system file selection dialog
- The JPG/JPEG file (exactly 500KB) can be selected from the file dialog
- The upload attempt is immediately rejected due to size validation
- A clear validation error message is displayed indicating:
  - File size must be less than 500KB (not equal to or greater than)
  - The specific size limit requirement
  - Clear guidance on acceptable file sizes
- The upload process does not complete or progress
- No loading indicators show successful upload
- The rejected file does not appear in the icons list/preview area
- The modal remains open after the rejection for user to try another file
- No changes are made to the agent's current icon
- The error message is user-friendly and actionable
- File size validation works correctly at the exact boundary (500KB)
- The rejection occurs before any network upload activity
- System handles the boundary condition properly (exactly 500KB = rejected)

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
3. Close the icon chooser modal if still open
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-10-22

#### Test Case Name:

Upload .jpg/.jpeg file — >500KB is rejected

#### Test Case Tags:

negative, upload, jpeg, size-boundary

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload a JPG/JPEG image larger than 500KB and verify it is rejected.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Ensure test files exist in {path_more_500} folder with JPG/JPEG files larger than 500KB

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Position the mouse cursor over the agent icon to reveal the hover state
5. Click on the pencil/edit icon that appears during hover
6. Wait for the icon chooser modal to open completely
7. Click on the **Upload** control within the modal
8. Navigate to {path_more_500} folder in the file selection dialog
9. Select a JPG/JPEG file with size larger than 500KB from the available files
10. Attempt to confirm the file selection in the file dialog
11. Observe the system response to the file selection
12. Check for validation error messages or upload rejection
13. Verify that no upload progress indicator appears
14. Confirm that the file does not appear in the icons list
15. Verify the modal remains open after the rejection

### Expected Results

- The icon chooser modal opens successfully
- The **Upload** control is accessible and clickable
- The file selection dialog opens when clicking the **Upload** control
- Navigation to {path_more_500} folder is successful
- The JPG/JPEG file larger than 500KB is visible in the folder
- When attempting to select the oversized file:
  - The system immediately rejects the file selection
  - A clear validation error message appears indicating file is too large
  - The error message specifically mentions the 500KB size limit
  - No upload progress indicator is displayed
  - The file does not appear in the icons list/preview area
  - The upload process does not initiate
- The modal remains open allowing the user to try another file
- The validation occurs before any upload attempt begins
- The error handling is user-friendly and informative
- No system errors or crashes occur during the validation
- The file size limit (greater than 500KB) is properly enforced
- The error message provides clear guidance on acceptable file sizes

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

- ***

## Test Case ID: TC-10-09

#### Test Case Name:

Upload .gif images — three valid under 500KB

#### Test Case Tags:

positive, upload, gif

#### Test Case Priority:

Medium

#### Test Case Description:

Upload GIFs under 500KB and verify upload and apply. Animated GIFs may be supported as static preview;
validate UX.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Upload GIF file #1 (size < 500KB).
3. Verify upload success and image appears in the list/preview.
4. Repeat for GIF file #2 and #3.
5. Select uploaded GIFs and confirm agent icon update + success message.

### Expected Results:

- GIF files upload successfully; preview and selection work as expected.
- If animated GIFs are uploaded, preview may show animation or static frame per product spec; record behavior.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-23

#### Test Case Name:

Upload .gif file — exactly 500KB is rejected

#### Test Case Tags:

negative, upload, gif, size-boundary

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload a GIF image with size exactly 500KB; the application should reject it per size limit.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload a GIF file with size exactly 500KB.

### Expected Results:

- The upload is rejected and a clear validation message is shown indicating file size must be less than 500KB.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-24

#### Test Case Name:

Upload .gif file — >500KB is rejected

#### Test Case Tags:

negative, upload, gif, size-boundary

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload a GIF image larger than 500KB and verify it is rejected.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload a GIF file larger than 500KB.

### Expected Results:

- Upload is rejected and validation message displayed indicating file is too large.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-10

#### Test Case Name:

Upload .bmp images — three valid under 500KB

#### Test Case Tags:

positive, upload, bmp

#### Test Case Priority:

Medium

#### Test Case Description:

Upload BMP files under 500KB and verify uploads succeed and may be converted/previewed by the application.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Upload BMP file #1 (size < 500KB).
3. Verify upload success and the image appears in the list.
4. Repeat for BMP file #2 and #3.
5. Select uploaded BMPs and confirm agent icon update + success message.

### Expected Results:

- BMP uploads succeed and behave similarly to other supported formats; if the app auto-converts or resizes,
  record the behavior.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-25

#### Test Case Name:

Upload .bmp file — exactly 500KB is rejected

#### Test Case Tags:

negative, upload, bmp, size-boundary

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload a BMP image with size exactly 500KB; the application should reject it per size limit.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload a BMP file with size exactly 500KB.

### Expected Results:

- The upload is rejected and a clear validation message is shown indicating file size must be less than 500KB.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-26

#### Test Case Name:

Upload .bmp file — >500KB is rejected

#### Test Case Tags:

negative, upload, bmp, size-boundary

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload a BMP image larger than 500KB and verify it is rejected.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload a BMP file larger than 500KB.

### Expected Results:

- Upload is rejected and validation message displayed indicating file is too large.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-11

#### Test Case Name:

Upload .ico files — three valid under 500KB

#### Test Case Tags:

positive, upload, ico

#### Test Case Priority:

Medium

#### Test Case Description:

Upload three different ICO (icon) files each under 500KB and verify successful upload and application as agent
icons.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Ensure test files exist in {path_less_500} folder with various ICO formats under 500KB

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Position the mouse cursor over the agent icon to reveal the hover state
5. Click on the pencil/edit icon that appears during hover
6. Wait for the icon chooser modal to open completely
7. **Upload ICO File #1:**
   - Click on the **Upload** control within the modal
   - Navigate to {path_less_500} folder in the file selection dialog
   - Select the first ICO file under 500KB from the available files
   - Confirm the file selection and wait for upload to complete
   - Verify the ICO file appears in the icons list/preview area
   - Check that the ICO displays correctly with proper image quality
8. **Upload ICO File #2:**
   - Click on the **Upload** control again
   - Navigate to {path_less_500} folder in the file selection dialog
   - Select the second ICO file under 500KB from the available files
   - Confirm the file selection and wait for upload to complete
   - Verify both ICO files are displayed correctly in the icons list
9. **Upload ICO File #3:**
   - Click on the **Upload** control again
   - Navigate to {path_less_500} folder in the file selection dialog
   - Select the third ICO file under 500KB from the available files
   - Confirm the file selection and wait for upload to complete
   - Verify all three ICO files are displayed correctly in the icons list
10. **Test ICO File #1 Selection:**
    - Click on the first uploaded ICO to select it
    - Observe any confirmation dialogs or immediate application
    - Verify the modal closes after icon selection
    - Check for success notification confirming the icon update
    - Verify the agent Configuration tab shows ICO #1 as the icon
11. **Test ICO File #2 Selection:**
    - Open the icon chooser modal again by hovering and clicking the pencil icon
    - Click on the second uploaded ICO to select it
    - Verify the modal closes and success notification appears
    - Verify the agent Configuration tab shows ICO #2 as the icon
12. **Test ICO File #3 Selection:**
    - Open the icon chooser modal again by hovering and clicking the pencil icon
    - Click on the third uploaded ICO to select it
    - Verify the modal closes and success notification appears
    - Verify the agent Configuration tab shows ICO #3 as the icon

### Expected Results

- The icon chooser modal opens successfully
- All three ICO upload operations complete without errors:
  - ICO File #1 uploads successfully and appears in the icons list
  - ICO File #2 uploads successfully and appears alongside ICO #1
  - ICO File #3 uploads successfully and all three ICOs are visible
- Each uploaded ICO file displays correctly with proper image quality
- All three ICO files maintain their visual integrity during upload
- If ICO files contain multiple sizes, the appropriate size is selected for display
- The icons list properly manages multiple uploaded ICO files
- Each ICO file is selectable and clickable from the icons list
- When selecting ICO File #1:
  - Modal closes automatically
  - Agent icon updates to show ICO #1
  - Success notification appears confirming the change
  - The ICO displays with proper resolution and clarity
- When selecting ICO File #2:
  - Modal closes automatically
  - Agent icon updates to show ICO #2
  - Success notification appears confirming the change
  - The ICO displays with proper resolution and clarity
- When selecting ICO File #3:
  - Modal closes automatically
  - Agent icon updates to show ICO #3
  - Success notification appears confirming the change
  - The ICO displays with proper resolution and clarity
- All ICO format files are properly supported and handled
- No upload failures or format compatibility issues occur
- File size validation works correctly (under 500KB requirement)
- Multiple ICO file uploads work seamlessly in sequence
- ICO files with multiple embedded sizes display correctly in the UI

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
3. Clean up uploaded ICO icon files if they remain in the system
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- ***

## Test Case ID: TC-10-27

#### Test Case Name:

Upload .ico file — exactly 500KB is rejected

#### Test Case Tags:

negative, upload, ico, size-boundary

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload an ICO file with size exactly 500KB; the application should reject it per size limit.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload an ICO file with size exactly 500KB.

### Expected Results:

- The upload is rejected and a clear validation message is shown indicating file size must be less than 500KB.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-28

#### Test Case Name:

Upload .ico file — >500KB is rejected

#### Test Case Tags:

negative, upload, ico, size-boundary

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload an ICO file larger than 500KB and verify it is rejected.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload an ICO file larger than 500KB.

### Expected Results:

- Upload is rejected and validation message displayed indicating file is too large.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-12

#### Test Case Name:

Upload .tiff/.tif images — three valid under 500KB

#### Test Case Tags:

positive, upload, tiff

#### Test Case Priority:

Medium

#### Test Case Description:

Upload TIFF images under 500KB and verify uploaded images are accepted and can be applied as icons.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Upload TIFF file #1 (size < 500KB).
3. Verify upload success and the image appears in the list/preview.
4. Repeat for TIFF file #2 and #3.
5. Select uploaded TIFFs and confirm agent icon update + success message.

### Expected Results:

- TIFF uploads succeed and are usable as icons; record any conversion/resizing behavior.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-29

#### Test Case Name:

Upload .tiff/.tif file — exactly 500KB is rejected

#### Test Case Tags:

negative, upload, tiff, size-boundary

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload a TIFF/TIF image with size exactly 500KB; the application should reject it per size limit.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload a TIFF/TIF file with size exactly 500KB.

### Expected Results:

- The upload is rejected and a clear validation message is shown indicating file size must be less than 500KB.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-30

#### Test Case Name:

Upload .tiff/.tif file — >500KB is rejected

#### Test Case Tags:

negative, upload, tiff, size-boundary

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload a TIFF/TIF image larger than 500KB and verify it is rejected.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload a TIFF/TIF file larger than 500KB.

### Expected Results:

- Upload is rejected and validation message displayed indicating file is too large.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-13

#### Test Case Name:

Upload web images (.svg, .webp) — three valid under 500KB

#### Test Case Tags:

positive, upload, web

#### Test Case Priority:

Medium

#### Test Case Description:

Upload web-native image formats (SVG/WebP) under 500KB and verify they are accepted and previewable.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Web image file #1 (size < 500KB).
3. Verify upload success and the image appears in the list/preview.
4. Repeat for two more web images.
5. Select uploaded images and confirm agent icon update + success message.

### Expected Results:

- Web-native images upload and appear correctly; if SVG is sanitized or rasterized for preview, record
  behavior.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-31

#### Test Case Name:

Upload web image (.svg/.webp) — exactly 500KB is rejected

#### Test Case Tags:

negative, upload, web, size-boundary

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload an SVG or WebP image with size exactly 500KB; the application should reject it per size
limit.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload an SVG or WebP file with size exactly 500KB.

### Expected Results:

- The upload is rejected and a clear validation message is shown indicating file size must be less than 500KB.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-32

#### Test Case Name:

Upload web image (.svg/.webp) — >500KB is rejected

#### Test Case Tags:

negative, upload, web, size-boundary

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload an SVG or WebP image larger than 500KB and verify it is rejected.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload an SVG or WebP file larger than 500KB.

### Expected Results:

- Upload is rejected and validation message displayed indicating file is too large.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-14

#### Test Case Name:

Upload exactly 500KB file is rejected

#### Test Case Tags:

negative, upload, size-boundary ma

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload a valid image file whose size is exactly 500KB. The application should treat the limit as
exclusive and reject the file.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload a supported image file (e.g., PNG) with size exactly 500KB.

### Expected Results:

- The upload is rejected and a clear validation message is shown, for example: "File exceeds maximum allowed
  size of 500KB" or "File size must be less than 500KB".

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-15

#### Test Case Name:

Upload >500KB file is rejected

#### Test Case Tags:

negative, upload, size-boundary

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload a supported image file larger than 500KB and verify it's rejected with appropriate error
messaging.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload a supported image file (e.g., PNG) with size > 500KB.

### Expected Results:

- Upload is rejected and validation message displayed indicating file is too large.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-16

#### Test Case Name:

Upload unsupported/invalid file format is rejected

#### Test Case Tags:

negative, upload, formats

#### Test Case Priority:

High

#### Test Case Description:

Attempt to upload files with unsupported extensions (e.g., .exe, .txt, .pdf) and verify the app rejects them
with a helpful error.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
   - Ensure test files exist in {path_invalid} folder with unsupported file formats (e.g., .exe, .txt, .pdf,
     .doc, .zip)

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Position the mouse cursor over the agent icon to reveal the hover state
5. Click on the pencil/edit icon that appears during hover
6. Wait for the icon chooser modal to open completely
7. Click on the **Upload** control within the modal
8. Navigate to {path_invalid} folder in the file selection dialog
9. Select an unsupported file type from the available files:
   - Choose from files with extensions like .exe, .txt, .pdf, .doc, .zip, .mp4, .avi, etc.
   - Ensure the selected file has an extension not supported for image upload
10. Attempt to confirm the file selection in the file dialog
11. Observe the system response to the unsupported file selection
12. Check for validation error messages or upload rejection
13. Verify that no upload progress indicator appears
14. Confirm that the file does not appear in the icons list
15. Verify the modal remains open after the rejection
16. Read and validate the specific error message content
17. Test with additional unsupported file types if available (e.g., .txt, .pdf)

### Expected Results

- The icon chooser modal opens successfully
- The **Upload** control is accessible and clickable
- The file selection dialog opens when clicking the **Upload** control
- Navigation to {path_invalid} folder is successful
- Unsupported files with various extensions are visible in the folder
- When attempting to select an unsupported file:
  - The system immediately rejects the file selection
  - A clear validation error message appears indicating unsupported file format
  - The error message specifies allowed file formats (e.g., "Unsupported file format. Allowed: png, jpg, jpeg,
    gif, bmp, ico, tiff, svg, webp")
  - No upload progress indicator is displayed
  - The file does not appear in the icons list/preview area
  - The upload process does not initiate
- The modal remains open allowing the user to try another file
- The validation occurs before any upload attempt begins
- The error handling is user-friendly and informative
- Multiple unsupported file types are consistently rejected
- No system errors or crashes occur during the validation
- The file format validation works correctly for all unsupported extensions
- The error message provides clear guidance on acceptable file formats

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

- ***

## Test Case ID: TC-10-17

#### Test Case Name: Set different icons for different agent versions

#### Test Case Tags: positive, versions, regression

#### Test Case Priority: High

#### Test Case Description: Verify that different agent versions can have different icons and updating one version's icon does not change other versions.

### Preconditions: Have created agent with multiple versions

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents and their versions
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Versioned Agent" exists with at least two versions (v1, v2) visible in the
  Versions/Details UI.

### Test Steps:

1. Open Agent Configuration for Versioned Agent and select Version v1.
2. Click pencil and upload or select Icon A; apply it to v1.
3. Switch to Version v2, click pencil and upload or select Icon B; apply it to v2.
4. Verify that v1 still shows Icon A and v2 shows Icon B in both configuration and agents list (if versions
   are visible there).

### Expected Results:

- Each version retains its assigned icon independently.
- Changing icon for one version does not alter other versions.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-18

#### Test Case Name: Verify icon persistence across UI and API

#### Test Case Tags: integration, persistence, api

#### Test Case Priority: Medium

#### Test Case Description: After applying an icon, verify the change persists in the UI (agents list, configuration) and is reflected in the agent metadata returned by the API (if an API exists).

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Apply an icon via the chooser modal and confirm success.
2. Navigate to the Agents list and verify the icon is shown next to the agent.
3. If API access is available, call the agent metadata endpoint and verify the icon reference (URL or id)
   matches the uploaded/selected icon.

### Expected Results:

- UI shows the updated icon in all relevant places.
- API returns metadata indicating the chosen icon (URL/id) consistent with the UI.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-33

#### Test Case Name:

Delete icon from Icons list with confirmation

#### Test Case Tags:

negative, ui, delete, confirmation

#### Test Case Priority:

High

#### Test Case Description:

Verify that icons can be deleted from icons list by hovering over the icon to reveal a cross/delete button,
confirming deletion in the warning dialog, and verifying the icon is removed from the icons list.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Upload a custom icon to the test agent:
   - Click on the "Test Agent" agent to open it
   - Navigate to the **Configuration** tab
   - Click on the pencil icon next to the agent icon
   - Click on the **Upload** button in the icon chooser modal
   - Navigate to the {path_less_500} folder and select a valid PNG file under 500KB
   - Click **Open** in the file picker dialog
   - Wait for the upload to complete successfully
   - Click the **Apply** button to confirm the icon selection
   - Verify the success message appears
   - Close the icon chooser modal

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Click on the pencil icon next to the agent icon to open the icon chooser modal
4. In the "Existing Icons" section, locate the uploaded custom icon
5. Hover the mouse cursor over the uploaded custom icon
6. Observe that a cross/delete button appears at the top right corner of the icon
7. Click on the cross/delete button
8. Verify that a warning dialog appears with the message "Are you sure to delete this icon?"
9. Click the **Confirm** button in the warning dialog
10. Wait for the deletion operation to complete
11. Verify that the icon is no longer listed in the "Existing Icons" section
12. Verify that a success message appears confirming the icon deletion
13. Close the icon chooser modal

### Expected Results

1. Agent configuration page opens successfully
2. Configuration tab displays correctly
3. Icon chooser modal opens when pencil icon is clicked
4. Custom uploaded icon is visible in the "Existing Icons" section
5. Cross/delete button appears at the top right corner of the icon when hovered
6. Warning dialog displays with "Are you sure to delete this icon?" message
7. Clicking **Confirm** button initiates the deletion process
8. Icon is successfully removed from the "Existing Icons" list
9. Success message confirms the icon deletion
10. Icon chooser modal can be closed without errors
11. No errors or unexpected behavior occurs during the deletion process
12. The deleted icon is permanently removed and cannot be accessed
13. Other existing icons remain unaffected by the deletion

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

- ***

## Test Case ID: TC-10-34

#### Test Case Name:

Cancel icon deletion and verify icon remains

#### Test Case Tags:

positive, ui, delete, cancel

#### Test Case Priority:

High

#### Test Case Description:

Verify that canceling icon deletion in the warning dialog preserves the icon in the icons list and no deletion
occurs.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Upload a custom icon to the test agent:
   - Click on the "Test Agent" agent to open it
   - Navigate to the **Configuration** tab
   - Click on the pencil icon next to the agent icon
   - Click on the **Upload** button in the icon chooser modal
   - Navigate to the {path_less_500} folder and select a valid PNG file under 500KB
   - Click **Open** in the file picker dialog
   - Wait for the upload to complete successfully
   - Click the **Apply** button to confirm the icon selection
   - Verify the success message appears
   - Close the icon chooser modal

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Click on the pencil icon next to the agent icon to open the icon chooser modal
4. In the "Existing Icons" section, locate the uploaded custom icon
5. Hover the mouse cursor over the uploaded custom icon
6. Observe that a cross/delete button appears at the top right corner of the icon
7. Click on the cross/delete button
8. Verify that a warning dialog appears with the message "Are you sure to delete this icon?"
9. Click the **Cancel** button in the warning dialog
10. Verify that the warning dialog closes without performing any deletion
11. Verify that the icon is still present and listed in the "Existing Icons" section
12. Verify that no success or error messages appear related to deletion
13. Close the icon chooser modal

### Expected Results

1. Agent configuration page opens successfully
2. Configuration tab displays correctly
3. Icon chooser modal opens when pencil icon is clicked
4. Custom uploaded icon is visible in the "Existing Icons" section
5. Cross/delete button appears at the top right corner of the icon when hovered
6. Warning dialog displays with "Are you sure to delete this icon?" message
7. Clicking **Cancel** button closes the warning dialog without deletion
8. Icon remains present in the "Existing Icons" list after cancellation
9. No deletion-related messages appear
10. Icon chooser modal can be closed without errors
11. No errors or unexpected behavior occurs during the cancellation
12. The icon is still available for selection and use
13. All other existing icons remain unaffected

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

- ***

## Test Case ID: TC-10-36

#### Test Case Name:

Upload corrupted image file (appears valid but damaged)

#### Test Case Tags:

negative, upload, corruption, error

#### Test Case Priority:

High

#### Test Case Description:

Verify that uploading a corrupted image file that appears valid but contains damaged data results in
appropriate error handling and rejection.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Click on the pencil/edit icon that appears when hovering over the agent icon
5. Verify the icon chooser modal opens with existing icons and upload options
6. Click on the **Upload** button in the icon chooser modal
7. In the file picker dialog, navigate to the {path_invalid} folder and select a corrupted PNG file
8. Click **Open** in the file picker dialog
9. Wait for the upload process to complete or fail
10. Observe the response from the system regarding the corrupted file
11. Verify that an appropriate error message is displayed
12. Verify that the upload is rejected and the corrupted file is not added to existing icons
13. Verify that the icon chooser modal remains open and functional

### Expected Results

1. Agent configuration page opens successfully
2. Configuration tab displays correctly with agent icon
3. Pencil/edit icon appears when hovering over the agent icon
4. Icon chooser modal opens with existing icons and upload button
5. Upload button triggers the file picker dialog
6. File picker allows navigation to the {path_invalid} folder
7. Corrupted PNG file can be selected from the file picker
8. System detects the file corruption during upload processing
9. Clear error message is displayed indicating the file is corrupted or invalid
10. Upload is rejected and the corrupted file is not processed
11. The corrupted file does not appear in the existing icons list
12. Icon chooser modal remains functional after the error
13. User can continue with other operations after the error handling

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

- ***

## Test Case ID: TC-10-37

#### Test Case Name:

Upload file with misleading extension (.txt renamed to .png)

#### Test Case Tags:

negative, upload, security, validation

#### Test Case Priority:

High

#### Test Case Description:

Verify that uploading a non-image file with a misleading image extension (e.g., .txt file renamed to .png) is
properly detected and rejected by the system.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Click on the pencil/edit icon that appears when hovering over the agent icon
5. Verify the icon chooser modal opens with existing icons and upload options
6. Click on the **Upload** button in the icon chooser modal
7. In the file picker dialog, navigate to the {path_invalid} folder and select a .txt file that has been
   renamed to have a .png extension
8. Click **Open** in the file picker dialog
9. Wait for the upload process to complete or fail
10. Observe the system's response to the misleading file extension
11. Verify that an appropriate error message is displayed indicating invalid file format
12. Verify that the upload is rejected and the fake image file is not added to existing icons
13. Verify that the icon chooser modal remains open and functional

### Expected Results

1. Agent configuration page opens successfully
2. Configuration tab displays correctly with agent icon
3. Pencil/edit icon appears when hovering over the agent icon
4. Icon chooser modal opens with existing icons and upload button
5. Upload button triggers the file picker dialog
6. File picker allows navigation to the {path_invalid} folder
7. Text file with .png extension can be selected from the file picker
8. System detects that the file is not a valid image despite the .png extension
9. Clear error message is displayed indicating invalid file format or content
10. Upload is rejected and the fake image file is not processed
11. The misleading file does not appear in the existing icons list
12. Icon chooser modal remains functional after the error
13. User can continue with other operations after the error handling

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

- ***

## Test Case ID: TC-10-38

#### Test Case Name:

Upload zero-byte file

#### Test Case Tags:

negative, upload, edge-case, validation

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that uploading a zero-byte file (empty file with valid image extension) is properly detected and
rejected by the system with appropriate error handling.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Click on the pencil/edit icon that appears when hovering over the agent icon
5. Verify the icon chooser modal opens with existing icons and upload options
6. Click on the **Upload** button in the icon chooser modal
7. In the file picker dialog, navigate to the {path_invalid} folder and select a zero-byte file with a .png
   extension
8. Click **Open** in the file picker dialog
9. Wait for the upload process to complete or fail
10. Observe the system's response to the zero-byte file
11. Verify that an appropriate error message is displayed indicating invalid file size or empty file
12. Verify that the upload is rejected and the zero-byte file is not added to existing icons
13. Verify that the icon chooser modal remains open and functional

### Expected Results

1. Agent configuration page opens successfully
2. Configuration tab displays correctly with agent icon
3. Pencil/edit icon appears when hovering over the agent icon
4. Icon chooser modal opens with existing icons and upload button
5. Upload button triggers the file picker dialog
6. File picker allows navigation to the {path_invalid} folder
7. Zero-byte PNG file can be selected from the file picker
8. System detects that the file is empty (zero bytes)
9. Clear error message is displayed indicating empty file or invalid file size
10. Upload is rejected and the zero-byte file is not processed
11. The empty file does not appear in the existing icons list
12. Icon chooser modal remains functional after the error
13. User can continue with other operations after the error handling

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

- ***

## Test Case ID: TC-10-39

#### Test Case Name:

Upload file with special characters in filename

#### Test Case Tags:

edge-case, upload, filename, validation

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that uploading a valid image file with special characters, spaces, or Unicode characters in the
filename is handled appropriately by the system.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Click on the pencil/edit icon that appears when hovering over the agent icon
5. Verify the icon chooser modal opens with existing icons and upload options
6. Click on the **Upload** button in the icon chooser modal
7. In the file picker dialog, navigate to the {path_less_500} folder and select a valid PNG file with special
   characters in the filename (e.g., "test@#$%icon & spaces.png", "测试图标.png", "îcôn-spéciàl.png")
8. Click **Open** in the file picker dialog
9. Wait for the upload process to complete
10. Observe the system's response to the file with special characters in the filename
11. Verify that the upload completes successfully or provides appropriate error handling
12. If successful, verify that the icon appears in the existing icons list
13. If successful, verify that the filename is properly handled and displayed
14. Verify that the icon chooser modal remains functional

### Expected Results

1. Agent configuration page opens successfully
2. Configuration tab displays correctly with agent icon
3. Pencil/edit icon appears when hovering over the agent icon
4. Icon chooser modal opens with existing icons and upload button
5. Upload button triggers the file picker dialog
6. File picker allows navigation to the {path_less_500} folder
7. PNG file with special characters in filename can be selected
8. System properly handles the special characters in the filename
9. Upload completes successfully or provides clear error message if unsupported
10. If successful, the uploaded icon appears in the existing icons list
11. If successful, the filename is properly sanitized or displayed
12. Icon chooser modal remains functional throughout the process
13. No system errors or crashes occur due to special characters

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

- ***

## Test Case ID: TC-10-40

#### Test Case Name:

Upload file with very long filename (>255 characters)

#### Test Case Tags:

edge-case, upload, filename, validation

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that uploading a valid image file with an extremely long filename (over 255 characters) is handled
appropriately by the system with proper error handling or filename truncation.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list

### Test Steps

1. Click on the "Test Agent" agent to open it
2. Navigate to the **Configuration** tab
3. Locate the agent icon near the agent's name in the configuration header
4. Click on the pencil/edit icon that appears when hovering over the agent icon
5. Verify the icon chooser modal opens with existing icons and upload options
6. Click on the **Upload** button in the icon chooser modal
7. In the file picker dialog, navigate to the {path_invalid} folder and select a valid PNG file with an
   extremely long filename (over 255 characters)
8. Click **Open** in the file picker dialog
9. Wait for the upload process to complete or fail
10. Observe the system's response to the file with very long filename
11. Verify that the upload is handled appropriately (either rejected with error or processed with filename
    truncation)
12. If processed, verify that the filename is properly truncated or sanitized
13. Verify that the icon chooser modal remains functional

### Expected Results

1. Agent configuration page opens successfully
2. Configuration tab displays correctly with agent icon
3. Pencil/edit icon appears when hovering over the agent icon
4. Icon chooser modal opens with existing icons and upload button
5. Upload button triggers the file picker dialog
6. File picker allows navigation to the {path_invalid} folder
7. PNG file with very long filename can be selected
8. System properly handles the extremely long filename
9. Either upload is rejected with clear error message about filename length, or filename is
   truncated/sanitized
10. If processed, the uploaded icon appears in the existing icons list with appropriately handled filename
11. If rejected, clear error message explains the filename length limitation
12. Icon chooser modal remains functional throughout the process
13. No system errors or crashes occur due to long filename

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

- ***

## Test Case ID: TC-10-41

#### Test Case Name:

Unselect custom icon and revert to default agent icon

#### Test Case Tags:

positive, ui, default, revert, unselect

#### Test Case Priority:

High

#### Test Case Description:

Verify that after setting a custom icon for an agent, the user can unselect/remove the custom icon and revert
back to the default agent icon by selecting the default option in the icon chooser modal.

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
6. Create a test agent for icon operations:
   - Navigate to the **Agents** section in the {Project} of application
   - Click the **+ Create** button
   - Fill in required fields:
     - Agent's name: "Test Agent"
     - Agent's description: "Test Agent for Icon Testing"
   - Click the **Save** button
   - Navigate to the **Agents** section in the {Project}
   - Click on **Table view** button
   - Locate the created "Test Agent" agent in the agents list
7. Set a custom icon for the test agent:
   - Click on the "Test Agent" agent to open it
   - Navigate to the **Configuration** tab
   - Note the current default icon displayed for the agent
   - Click on the pencil icon next to the agent icon
   - Click on the **Upload** button in the icon chooser modal
   - Navigate to the {path_less_500} folder and select a valid PNG file under 500KB
   - Click **Open** in the file picker dialog
   - Wait for the upload to complete successfully
   - Click the **Apply** button to confirm the icon selection
   - Verify the success message appears and the custom icon is applied
   - Close the icon chooser modal
   - Verify the agent now displays the custom icon instead of the default

### Test Steps

1. Click on the "Test Agent" agent to open it (if not already open)
2. Navigate to the **Configuration** tab
3. Verify that the agent currently displays the custom icon that was previously set
4. Click on the pencil icon next to the agent icon to open the icon chooser modal
5. Verify the icon chooser modal opens with existing icons and upload options
6. In the icon chooser modal, locate the default icon option (usually displayed as the first option or labeled
   as "Default")
7. Click on the default icon to select it
8. Verify that the preview area shows the default icon is now selected
9. Click the **Apply** button to confirm the default icon selection
10. Wait for the change to be processed and applied
11. Verify that a success message appears confirming the icon change
12. Close the icon chooser modal
13. Verify that the agent icon in the configuration header now displays the default icon
14. Navigate to the **Agents** section in the {Project}
15. Click on **Table view** button
16. Locate the "Test Agent" in the agents list
17. Verify that the agent in the list also displays the default icon (not the custom icon)

### Expected Results

1. Agent configuration page opens successfully showing the previously set custom icon
2. Configuration tab displays correctly with the custom icon
3. Pencil/edit icon appears when hovering and opens the icon chooser modal when clicked
4. Icon chooser modal opens with existing icons, upload options, and default icon option
5. Default icon option is clearly visible and selectable in the modal
6. Clicking on the default icon highlights it as selected in the preview area
7. Preview area correctly shows the default icon when selected
8. **Apply** button successfully processes the default icon selection
9. Success message appears confirming the icon has been changed to default
10. Icon chooser modal closes without errors
11. Agent icon in the configuration header is reverted to the default icon
12. Agent list in the **Agents** section shows the agent with the default icon
13. Custom icon is no longer displayed for the agent
14. The custom icon remains available in the existing icons list for future use
15. No errors or unexpected behavior occurs during the revert process
16. The default icon is properly displayed across all UI locations where the agent icon appears
17. The change is persistent and remains after page refresh

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

- This test case verifies the ability to revert from custom icons back to the system default
- The custom icon should remain in the existing icons list and not be deleted when reverting to default
- This functionality is important for users who want to temporarily use custom icons but later prefer the
  default appearance
