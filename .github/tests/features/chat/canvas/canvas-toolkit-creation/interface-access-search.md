# Scenario ID: CANVAS-002-1

#### Scenario Name:

Interface access and search for canvas toolkit creation

#### Scenario Tags:

chat,canvas,toolkit,interface,search,smoke,regression

#### Scenario Priority:

High

#### Scenario Description

This scenario validates the basic interface access and search functionality for toolkit creation via the
canvas interface. It covers accessing the toolkit creation dialog, navigating through the canvas toolkit
selection interface, and using search functionality to locate specific toolkit types.

## Test Case ID: TK-001

#### Test Case Name:

Access canvas toolkit creation interface

#### Test Case Tags:

chat, canvas, toolkit, smoke, create

#### Test Case Priority:

High

#### Test Case Description

Verify that users can access the toolkit creation canvas interface via the "+Add toolkit" icon, navigate
through the canvas toolkit selection, view all available categories, and interact with specific toolkit
options

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: toolkit.create, toolkits.details

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Toolkits**
3. Click on the **+Add toolkit** icon
4. Verify the "New Toolkit" dialog opens
5. Click on **+ Create new Toolkit**
6. Verify the "Choose the toolkit type" canvas interface is displayed
7. Verify various toolkit categories are available: Analysis, Code Repositories, Communication, Development,
   Documentation, Office, Other, Project Management, Test Management, Testing
8. In the "Choose the toolkit type" interface, click on a category (e.g., **Code Repositories**)
9. Locate and click on a toolkit option (e.g., **GitHub**)

### Expected Results

- The "New Toolkit" dialog opens successfully
- Toolkit type selection interface displays with all available categories
- Categories include: Analysis, Code Repositories, Communication, Development, Documentation, Office, Other,
  Project Management, Test Management, Testing
- Each category shows relevant toolkit options
- Categories can be clicked and expanded to show available toolkit options
- Individual toolkit options (like GitHub) can be located and selected

### Postconditions

1. Click the **X** (close) button to close the dialog
2. Verify the dialog is dismissed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes

## Test Case ID: TK-003

#### Test Case Name

Search for toolkit types during creation via canvas

#### Test Case Tags

chat, canvas, toolkit, regression

#### Test Case Priority

Medium

#### Test Case Description

Verify that users can search for specific toolkit types using the search functionality in the toolkit creation
dialog.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions: toolkit.create, toolkit.list

### Test Steps

1. Navigate to the **Chat** page (sidebar or main menu)
2. In the **PARTICIPANTS** section, locate **Toolkits**
3. Click on the **Add toolkit** button
4. Verify the "New Toolkit" dialog opens
5. Click on **+ Create new Toolkit**
6. In the "Choose the toolkit type" interface, locate the search field
7. Type "github" in the search field
8. Verify that GitHub toolkit is filtered
9. Clear the search and type "confluence"
10. Verify that Confluence toolkit is filtered

### Expected Results

- Search functionality filters toolkit options in real-time
- Typing "github" shows GitHub toolkit
- Typing "confluence" shows Confluence toolkit
- Search is case-insensitive and responsive

### Postconditions

1. Click the **X** (close) button to close the dialog
2. Verify the dialog is dismissed
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application.

### Notes
