# Scenario ID: 10_Agent_Icons

#### Scenario Name: Agent Icons — upload, select, use custom and default icons

#### Scenario Tags: functional testing, regression, agents, icons, upload

#### Scenario Priority: High

#### Scenario Description: Validate the agent icon UX: hover behavior, icon chooser modal, selecting from existing icons, uploading supported image formats under the size limit, rejection of unsupported formats and oversized files, and ability to set different icons per agent version.

---

## Test Case ID: TC-10-01

#### Test Case Name: Hover over agent icon shows edit (pencil) affordance

#### Test Case Tags: positive, ui, hover

#### Test Case Priority: Medium

#### Test Case Description: On the Agent configuration tab, hovering over the agent icon near the agent name shows a pencil/edit icon.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Hover the mouse over the agent icon near the agent's name in the configuration header.

### Expected Results:

- The icon visually changes to a pencil/edit affordance (hover state) indicating edit is available.

### Postconditions:

- delete agent created at precondition

## Test Case ID: TC-10-02

#### Test Case Name: Click pencil opens icon chooser modal with existing and upload options

#### Test Case Tags: positive, ui, modal

#### Test Case Priority: High

#### Test Case Description: Clicking the pencil edit icon opens a chooser window with a list of previously added icons (if any), an upload control, and current agent icon preview. Default fallback icon is shown if none uploaded.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Hover over the agent icon and click the pencil/edit icon.

### Expected Results:

- A modal window titled "Choose the image from the list or upload" opens.
- The modal shows a list/grid of existing icons (may be empty), an Upload control (button/dropzone), and a
  preview area showing the agent's current icon (or default symbol if none uploaded).

### Postconditions:

- delete agent created at precondition

## Test Case ID: TC-10-03

#### Test Case Name: Close icon chooser via close (X) button

#### Test Case Tags: negative, ui, modal

#### Test Case Priority: Medium

#### Test Case Description: Confirm the chooser modal closes when clicking the cross/close button and the user remains on the Agent Configuration tab.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Click the modal close (X) control.

### Expected Results:

- The modal closes and the user remains on the Agent Configuration tab (no navigation away).

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-04

#### Test Case Name: Close icon chooser by clicking outside modal

#### Test Case Tags: negative, ui, modal

#### Test Case Priority: Medium

#### Test Case Description: Confirm the chooser modal closes when the user clicks outside the modal area (backdrop click) and returns to the Agent Configuration tab.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Click on the modal backdrop/outside the modal content.

### Expected Results:

- The modal closes and focus returns to the Agent Configuration tab.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-31

#### Test Case Name: Upload web image (.svg/.webp) — exactly 500KB is rejected

#### Test Case Tags: negative, upload, web, size-boundary

#### Test Case Priority: High

#### Test Case Description: Attempt to upload an SVG or WebP image with size exactly 500KB; the application should reject it per size limit.

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

#### Test Case Name: Upload web image (.svg/.webp) — >500KB is rejected

#### Test Case Tags: negative, upload, web, size-boundary

#### Test Case Priority: High

#### Test Case Description: Attempt to upload an SVG or WebP image larger than 500KB and verify it is rejected.

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

## Test Case ID: TC-10-05

#### Test Case Name: Select existing icon from list updates agent icon and shows success message

#### Test Case Tags: positive, selection, ui

#### Test Case Priority: High

#### Test Case Description: Selecting an icon from the existing icons list changes the agent's icon, closes modal, and displays a success notification.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.
- Ensure at least one existing icon is available in the icons list (if not, upload one first using Upload
  tests below).

### Test Steps:

1. Click pencil to open chooser modal.
2. Click an icon from the existing list.

### Expected Results:

- Modal closes and the Agent Configuration tab shows the new icon for the agent.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-06

#### Test Case Name: Upload and apply supported image format under 500KB (generic)

#### Test Case Tags: positive, upload, formats

#### Test Case Priority: High

#### Test Case Description: Upload a supported image file under 500KB via the Upload control in the chooser modal and confirm it becomes available and can be applied.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Use the Upload control to select a supported image file < 500KB (format-specific tests below).
3. Wait for upload to complete and the icon to appear in the list/preview.
4. Select the uploaded icon and confirm.

### Expected Results:

- Upload completes without error and the uploaded icon appears in the list and preview.
- Selecting the uploaded icon updates the agent icon and shows success notification.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-07

#### Test Case Name: Upload .png images — three valid under 500KB

#### Test Case Tags: positive, upload, png

#### Test Case Priority: High

#### Test Case Description: Attempt to upload three different PNG files each under 500KB and verify successful upload and application.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Upload PNG file #1 (size < 500KB).
3. Verify upload success and the image appears in the list.
4. Repeat for PNG file #2 and #3.
5. For each uploaded image, select it and confirm the agent icon updates and success notification appears.

### Expected Results:

- All three uploads complete successfully.
- Each uploaded image is selectable and when selected updates the agent icon and shows a success notification.

### Postconditions:

- delete agent created at precondition

---

#### Test Case Description: Upload three different JPEG images, all under 500KB, and verify successful upload and apply behavior.

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

#### Test Case Name: Upload .jpg/.jpeg file — exactly 500KB is rejected

#### Test Case Tags: negative, upload, jpeg, size-boundary

#### Test Case Priority: High

#### Test Case Description: Attempt to upload a JPG/JPEG image with size exactly 500KB; the application should reject it per size limit.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload a JPG/JPEG file with size exactly 500KB.

### Expected Results:

- The upload is rejected and a clear validation message is shown indicating file size must be less than 500KB.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-22

#### Test Case Name: Upload .jpg/.jpeg file — >500KB is rejected

#### Test Case Tags: negative, upload, jpeg, size-boundary

#### Test Case Priority: High

#### Test Case Description: Attempt to upload a JPG/JPEG image larger than 500KB and verify it is rejected.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload a JPG/JPEG file larger than 500KB.

### Expected Results:

- Upload is rejected and validation message displayed indicating file is too large.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-09

#### Test Case Name: Upload .gif images — three valid under 500KB

#### Test Case Tags: positive, upload, gif

#### Test Case Priority: Medium

#### Test Case Description: Upload GIFs under 500KB and verify upload and apply. Animated GIFs may be supported as static preview; validate UX.

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

#### Test Case Name: Upload .gif file — exactly 500KB is rejected

#### Test Case Tags: negative, upload, gif, size-boundary

#### Test Case Priority: High

#### Test Case Description: Attempt to upload a GIF image with size exactly 500KB; the application should reject it per size limit.

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

#### Test Case Name: Upload .gif file — >500KB is rejected

#### Test Case Tags: negative, upload, gif, size-boundary

#### Test Case Priority: High

#### Test Case Description: Attempt to upload a GIF image larger than 500KB and verify it is rejected.

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

#### Test Case Name: Upload .bmp images — three valid under 500KB

#### Test Case Tags: positive, upload, bmp

#### Test Case Priority: Medium

#### Test Case Description: Upload BMP files under 500KB and verify uploads succeed and may be converted/previewed by the application.

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

#### Test Case Name: Upload .bmp file — exactly 500KB is rejected

#### Test Case Tags: negative, upload, bmp, size-boundary

#### Test Case Priority: High

#### Test Case Description: Attempt to upload a BMP image with size exactly 500KB; the application should reject it per size limit.

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

#### Test Case Name: Upload .bmp file — >500KB is rejected

#### Test Case Tags: negative, upload, bmp, size-boundary

#### Test Case Priority: High

#### Test Case Description: Attempt to upload a BMP image larger than 500KB and verify it is rejected.

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

#### Test Case Name: Upload .ico files — three valid under 500KB

#### Test Case Tags: positive, upload, ico

#### Test Case Priority: Medium

#### Test Case Description: Upload ICO (icon) files under 500KB and verify successful upload and application as agent icons.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Upload ICO file #1 (size < 500KB).
3. Verify upload success and the image appears in the list.
4. Repeat for ICO file #2 and #3.
5. Select uploaded ICOs and confirm agent icon update + success message.

### Expected Results:

- ICO uploads succeed and are selectable; if ICO contains multiple sizes, confirm chosen size used in UI.

### Postconditions:

- delete agent created at precondition

---

## Test Case ID: TC-10-27

#### Test Case Name: Upload .ico file — exactly 500KB is rejected

#### Test Case Tags: negative, upload, ico, size-boundary

#### Test Case Priority: High

#### Test Case Description: Attempt to upload an ICO file with size exactly 500KB; the application should reject it per size limit.

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

#### Test Case Name: Upload .ico file — >500KB is rejected

#### Test Case Tags: negative, upload, ico, size-boundary

#### Test Case Priority: High

#### Test Case Description: Attempt to upload an ICO file larger than 500KB and verify it is rejected.

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

#### Test Case Name: Upload .tiff/.tif images — three valid under 500KB

#### Test Case Tags: positive, upload, tiff

#### Test Case Priority: Medium

#### Test Case Description: Upload TIFF images under 500KB and verify uploaded images are accepted and can be applied as icons.

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

#### Test Case Name: Upload .tiff/.tif file — exactly 500KB is rejected

#### Test Case Tags: negative, upload, tiff, size-boundary

#### Test Case Priority: High

#### Test Case Description: Attempt to upload a TIFF/TIF image with size exactly 500KB; the application should reject it per size limit.

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

#### Test Case Name: Upload .tiff/.tif file — >500KB is rejected

#### Test Case Tags: negative, upload, tiff, size-boundary

#### Test Case Priority: High

#### Test Case Description: Attempt to upload a TIFF/TIF image larger than 500KB and verify it is rejected.

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

#### Test Case Name: Upload web images (.svg, .webp) — three valid under 500KB

#### Test Case Tags: positive, upload, web

#### Test Case Priority: Medium

#### Test Case Description: Upload web-native image formats (SVG/WebP) under 500KB and verify they are accepted and previewable.

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

#### Test Case Name: Upload web image (.svg/.webp) — exactly 500KB is rejected

#### Test Case Tags: negative, upload, web, size-boundary

#### Test Case Priority: High

#### Test Case Description: Attempt to upload an SVG or WebP image with size exactly 500KB; the application should reject it per size limit.

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

#### Test Case Name: Upload web image (.svg/.webp) — >500KB is rejected

#### Test Case Tags: negative, upload, web, size-boundary

#### Test Case Priority: High

#### Test Case Description: Attempt to upload an SVG or WebP image larger than 500KB and verify it is rejected.

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

#### Test Case Name: Upload exactly 500KB file is rejected

#### Test Case Tags: negative, upload, size-boundary

ma

#### Test Case Priority: High

#### Test Case Description: Attempt to upload a valid image file whose size is exactly 500KB. The application should treat the limit as exclusive and reject the file.

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

#### Test Case Name: Upload >500KB file is rejected

#### Test Case Tags: negative, upload, size-boundary

#### Test Case Priority: High

#### Test Case Description: Attempt to upload a supported image file larger than 500KB and verify it's rejected with appropriate error messaging.

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

#### Test Case Name: Upload unsupported/invalid file format is rejected

#### Test Case Tags: negative, upload, formats

#### Test Case Priority: High

#### Test Case Description: Attempt to upload files with unsupported extensions (e.g., .exe, .txt, .pdf) and verify the app rejects them with a helpful error.

### Preconditions: Have created agent

- User navigates to {URL}
- User has valid login credentials: {Username}, {Password}
- User switches to {Project}
- User has permissions to create, view, and edit agents
- Navigate to the "Agents" section in the {Project} of application.
- Ensure an Agent named "Test Agent" exists and is visible in the Agents list and open its Configuration tab.

### Test Steps:

1. Click pencil to open chooser modal.
2. Attempt to upload an unsupported file type (e.g., .exe, .txt, .pdf).

### Expected Results:

- The upload is rejected and an explanatory validation message is shown (e.g., "Unsupported file format.
  Allowed: png, jpg, gif, bmp, ico, tiff, svg, webp").

### Postconditions:

- delete agent created at precondition

---

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
