# Scenario ID: 02_Search_Credentials

#### Scenario Name:

Search and Filter Credentials by Type and Name in Card/Table View

#### Scenario Tags:

functional testing, regression, credentials, search, filtering, ui

#### Scenario Priority:

High

#### Scenario Description:

Validate the credential search and filtering functionality: verify credential type filtering in right panel,
search by full name (manual and copy-paste), partial name matching with highlighting, search suggestions, view
mode switching (card/table), and proper filtering behavior including unselect actions.

## Test Case ID: TC-02-01

#### Test Case Name:

Verify all credential types are present in search filter panel

#### Test Case Tags:

positive, ui, filtering, types

#### Test Case Priority:

High

#### Test Case Description:

Verify that all credential types listed in the main credentials area are also present in the right search
window types section, and vice versa.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details
6. Create test credentials for search validation:
   - Navigate to the **Credentials** section in the {Project} application
   - Create ADO credential:
     - Click **+ Create** button
     - Select **ADO** credential type
     - Fill in fields: Display Name: "Test*ADO_Search", ID: "test_ado_search*{timestamp}", Base URL: valid ADO
       URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create Jira credential:
     - Click **+ Create** button
     - Select **Jira** credential type
     - Fill in fields: Display Name: "Test*Jira_Search", ID: "test_jira_search*{timestamp}", Base URL: valid
       Jira URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create Confluence credential:
     - Click **+ Create** button
     - Select **Confluence** credential type
     - Fill in fields: Display Name: "Test*Confluence_Search", ID: "test_confluence_search*{timestamp}", Base
       URL: valid Confluence URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Observe the main credentials list area (left side)
3. Identify all credential types visible in the credentials list (ADO, Jira, Confluence, etc.)
4. Locate the search/filter panel on the right side of the screen
5. Examine the **Types** section in the right filter panel
6. Verify that **ADO** and **Jira** credential types from the main list are present in the Types filter
   section
7. Verify that each type shows the correct count/number of credentials

### Expected Results

- All credential types present in the main credentials area are also available in the right panel Types
  section
- All types in the right panel Types section correspond to actual credentials in the main area
- No missing or extra types in either section
- Types are displayed consistently with proper naming

### Postconditions

1. Clean up test data by deleting the created test credentials:
   - Navigate to the **Credentials** section of the {Project}
   - Click the **Table view** icon/button to switch to table view
   - Delete "Test_ADO_Search" credential:
     - Locate "Test_ADO_Search" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_ADO_Search" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Jira_Search" credential:
     - Locate "Test_Jira_Search" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Jira_Search" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
2. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- This test validates the synchronization between main credential list and filter panel

## Test Case ID: TC-02-02

#### Test Case Name:

Filter credentials by single type selection in card view

#### Test Case Tags:

positive, filtering, card_view, single_selection

#### Test Case Priority:

High

#### Test Case Description:

Verify that clicking on a single credential type in the right filter panel displays only credentials of that
type in the main area (card view).

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details
6. Create test credentials for filtering validation:
   - Navigate to the **Credentials** section in the {Project} application
   - Create ADO credential:
     - Click **+ Create** button
     - Select **ADO** credential type
     - Fill in fields: Display Name: "Test*ADO_Filter", ID: "test_ado_filter*{timestamp}", Base URL: valid ADO
       URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create Jira credential:
     - Click **+ Create** button
     - Select **Jira** credential type
     - Fill in fields: Display Name: "Test*Jira_Filter", ID: "test_jira_filter*{timestamp}", Base URL: valid
       Jira URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create Confluence credential:
     - Click **+ Create** button
     - Select **Confluence** credential type
     - Fill in fields: Display Name: "Test*Confluence_Filter", ID: "test_confluence_filter*{timestamp}", Base
       URL: valid Confluence URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
7. User is in the **Credentials** section with card view active

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Ensure the view is set to **Card view** (default view with credential cards)
3. Observe all credentials displayed in the main area before filtering
4. Locate the right filter panel with **Types** section
5. Click on **ADO** type in the Types filter section
6. Verify that the ADO type becomes highlighted/selected
7. Observe that only ADO displayed in the main area (should include "Test_ADO_Filter")
8. Verify that Confluence an jira credentials are no longer visible
9. Click on **ADO** type in the Types filter section do deselect them
10. Verify that ADO type button selection become deselectedselected
11. Click on **Confluence** type in the Types filter section
12. Verify that only Confluence credentials are displayed in the main area (should include
    "Test_Confluence_Filter")

### Expected Results

- Clicking on a type filter highlights/selects that specific type
- Only credentials of the selected type are displayed in the main area
- Filtering works instantly without page reload
- Credential cards update dynamically based on type selection
- Selected type remains visually highlighted

### Postconditions

1. Reset filter by clicking the selected type to deselect it or refresh the page
2. Clean up test data by deleting the created test credentials:
   - Navigate to the **Credentials** section of the {Project}
   - Click the **Table view** icon/button to switch to table view
   - Delete "Test_ADO_Filter" credential:
     - Locate "Test_ADO_Filter" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_ADO_Filter" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Jira_Filter" credential:
     - Locate "Test_Jira_Filter" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Jira_Filter" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Confluence_Filter" credential:
     - Locate "Test_Confluence_Filter" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Confluence_Filter" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test focuses on single type selection behavior in card view

## Test Case ID: TC-02-03

#### Test Case Name:

Filter credentials by multiple type selection in card view

#### Test Case Tags:

positive, filtering, card_view, multiple_selection

#### Test Case Priority:

High

#### Test Case Description:

Verify that selecting multiple credential types in the filter panel displays credentials of all selected
types, with proper highlighting of selections.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details
6. Create test credentials for multiple type filtering validation:
   - Navigate to the **Credentials** section in the {Project} application
   - Create ADO credential:
     - Click **+ Create** button
     - Select **ADO** credential type
     - Fill in fields: Display Name: "Test*ADO_MultiFilter", ID: "test_ado_multifilter*{timestamp}", Base URL:
       valid ADO URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create Jira credential:
     - Click **+ Create** button
     - Select **Jira** credential type
     - Fill in fields: Display Name: "Test*Jira_MultiFilter", ID: "test_jira_multifilter*{timestamp}", Base
       URL: valid Jira URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create Confluence credential:
     - Click **+ Create** button
     - Select **Confluence** credential type
     - Fill in fields: Display Name: "Test*Confluence_MultiFilter", ID:
       "test_confluence_multifilter*{timestamp}", Base URL: valid Confluence URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
7. User is in the **Credentials** section with card view active
8. All type filters are currently unselected (showing all credentials)

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Ensure the view is set to **Card view**
3. Locate the right filter panel with **Types** section
4. Click on **ADO** type to select it
5. Verify that ADO type becomes highlighted and only ADO credentials are shown
6. Click on **Jira** type
7. Verify that both ADO and Jira types are highlighted/selected
8. Observe that credentials of both ADO and Jira types are displayed in the main area
9. Verify that Confluence credentials are not displayed
10. Add **Confluence** to the selection
11. Verify that all three types (ADO, Jira, Confluence) are highlighted
12. Observe that credentials of all three selected types are displayed
13. Test deselecting one type by clicking on **ADO** while others remain selected
14. Verify that only Jira and Confluence credentials are displayed
15. Verify that ADO type is no longer highlighted

### Expected Results

- Multiple types can be selected simultaneously
- All selected types are visually highlighted/indicated
- Main area displays credentials matching any of the selected types (OR logic)
- Adding/removing types from selection updates the display dynamically
- Deselecting a type removes its credentials from the display

### Postconditions

1. Reset all type filters for next test case
2. Clean up test data by deleting the created test credentials:
   - Navigate to the **Credentials** section of the {Project}
   - Click the **Table view** icon/button to switch to table view
   - Delete "Test_ADO_MultiFilter" credential:
     - Locate "Test_ADO_MultiFilter" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_ADO_MultiFilter" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Jira_MultiFilter" credential:
     - Locate "Test_Jira_MultiFilter" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Jira_MultiFilter" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Confluence_MultiFilter" credential:
     - Locate "Test_Confluence_MultiFilter" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Confluence_MultiFilter" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
3. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Test validates multi-select functionality for type filtering

## Test Case ID: TC-02-04

#### Test Case Name:

Filter credentials by single type selection in table view

#### Test Case Tags:

positive, filtering, table_view, single_selection

#### Test Case Priority:

High

#### Test Case Description:

Verify that type filtering works correctly in table view mode with single type selection.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details
6. Create test credentials for single type filtering validation in table view:
   - Navigate to the **Credentials** section in the {Project} application
   - Create ADO credential:
     - Click **+ Create** button
     - Select **ADO** credential type
     - Fill in fields: Display Name: "Test*ADO_TableSingle", ID: "test_ado_tablesingle*{timestamp}", Base URL:
       valid ADO URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create Jira credential:
     - Click **+ Create** button
     - Select **Jira** credential type
     - Fill in fields: Display Name: "Test*Jira_TableSingle", ID: "test_jira_tablesingle*{timestamp}", Base
       URL: valid Jira URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create Confluence credential:
     - Click **+ Create** button
     - Select **Confluence** credential type
     - Fill in fields: Display Name: "Test*Confluence_TableSingle", ID:
       "test_confluence_tablesingle*{timestamp}", Base URL: valid Confluence URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
7. User is in the **Credentials** section

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Locate and click the **Table view** icon/button to switch to table view
3. Verify that credentials are displayed in table format with columns
4. Observe all credentials in the table before applying filters
5. Locate the right filter panel with **Types** section
6. Click on **ADO** type in the Types filter section
7. Verify that the ADO type becomes highlighted/selected
8. Observe that only ADO credentials are displayed in the table
9. Verify that table rows show only ADO type credentials
10. Click on **Jira** type in the Types filter section
11. Verify that only Jira credentials are displayed in the table
12. Click on **Confluence** type in the Types filter section
13. Verify that only Confluence credentials are displayed in the table

### Expected Results

- Table view displays credentials in tabular format with proper columns
- Type filtering works the same way in table view as in card view
- Only credentials of the selected type appear in table rows
- Type selection remains visually highlighted
- Table updates dynamically when type filter is changed
- No functional differences between card and table view filtering

### Postconditions

1. Reset type filters
2. Clean up test data by deleting the created test credentials:
   - Navigate to the **Credentials** section of the {Project}
   - Ensure the view is set to **Table view**
   - Delete "Test_ADO_TableSingle" credential:
     - Locate "Test_ADO_TableSingle" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_ADO_TableSingle" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Jira_TableSingle" credential:
     - Locate "Test_Jira_TableSingle" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Jira_TableSingle" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Confluence_TableSingle" credential:
     - Locate "Test_Confluence_TableSingle" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Confluence_TableSingle" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
3. Switch back to card view for subsequent tests if needed
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Validates consistent filtering behavior across different view modes

## Test Case ID: TC-02-05

#### Test Case Name:

Filter credentials by multiple type selection in table view

#### Test Case Tags:

positive, filtering, table_view, multiple_selection

#### Test Case Priority:

High

#### Test Case Description:

Verify that multiple type selection filtering works correctly in table view mode.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details
6. Create test credentials for multiple type filtering validation in table view:
   - Navigate to the **Credentials** section in the {Project} application
   - Create ADO credential:
     - Click **+ Create** button
     - Select **ADO** credential type
     - Fill in fields: Display Name: "Test*ADO_TableMulti", ID: "test_ado_tablemulti*{timestamp}", Base URL:
       valid ADO URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create Jira credential:
     - Click **+ Create** button
     - Select **Jira** credential type
     - Fill in fields: Display Name: "Test*Jira_TableMulti", ID: "test_jira_tablemulti*{timestamp}", Base URL:
       valid Jira URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create Confluence credential:
     - Click **+ Create** button
     - Select **Confluence** credential type
     - Fill in fields: Display Name: "Test*Confluence_TableMulti", ID:
       "test_confluence_tablemulti*{timestamp}", Base URL: valid Confluence URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
7. User is in the **Credentials** section with table view active

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Ensure the view is set to **Table view**
3. Locate the right filter panel with **Types** section
4. Select multiple types (e.g., ADO and Jira) using multi-select method
5. Verify that both types are highlighted/selected
6. Observe that table displays credentials of both selected types
7. Add a third type (Confluence) to the selection
8. Verify that all three types are selected and highlighted
9. Observe that table shows credentials of all selected types
10. Remove one type from selection (e.g., deselect ADO)
11. Verify that table updates to show only remaining selected types

### Expected Results

- Multiple type selection works consistently in table view
- Table rows display credentials matching any selected type
- Multi-selection visual feedback is clear
- Adding/removing types updates table content dynamically
- No functional differences from card view multi-selection

### Postconditions

1. Reset all filters for next test case
2. Clean up test data by deleting the created test credentials:
   - Navigate to the **Credentials** section of the {Project}
   - Ensure the view is set to **Table view**
   - Delete "Test_ADO_TableMulti" credential:
     - Locate "Test_ADO_TableMulti" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_ADO_TableMulti" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Jira_TableMulti" credential:
     - Locate "Test_Jira_TableMulti" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Jira_TableMulti" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Confluence_TableMulti" credential:
     - Locate "Test_Confluence_TableMulti" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Confluence_TableMulti" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
3. Prepare for search functionality tests
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Ensures multi-select consistency across view modes

## Test Case ID: TC-02-06

#### Test Case Name:

Search credential by full name - manual entry in card view

#### Test Case Tags:

positive, search, full_name, manual_entry, card_view

#### Test Case Priority:

High

#### Test Case Description:

Verify that manually entering the complete credential name in the search field displays only the exact
matching credential in card view.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details
6. Create test credentials for search validation (manual entry):
   - Navigate to the **Credentials** section in the {Project} application
   - Create Confluence credential:
     - Click **+ Create** button
     - Select **Confluence** credential type
     - Fill in fields: Display Name: "Test*Confluence_ManualSearch", ID:
       "test_confluence_manualsearch*{timestamp}", Base URL: valid Confluence URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create additional test credentials for comparison:
     - Create ADO credential: Display Name: "Test*ADO_ManualSearch", ID: "test_ado_manualsearch*{timestamp}"
     - Create Jira credential: Display Name: "Test*Jira_ManualSearch", ID:
       "test_jira_manualsearch*{timestamp}"
7. User is in the **Credentials** section with card view active
8. All type filters are cleared

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Ensure the view is set to **Card view**
3. Locate the search field (usually at the top of the credentials area)
4. Click in the search field to focus it
5. Manually type the complete credential name: "Test_Confluence_ManualSearch"
6. Press Enter or wait for search to auto-execute
7. Observe the search results in the main area
8. Verify that only the "Test_Confluence_ManualSearch" credential is displayed
9. Verify that no other credentials are visible in the results
10. Check that the search term is properly displayed in the search field
11. Clear the search field and verify all credentials reappear

### Expected Results

- Search field accepts manual text input
- Entering exact credential name returns only that specific credential
- No other credentials are displayed in the results
- Search executes automatically or on Enter key press
- Search is case-sensitive or provides appropriate case handling
- Clearing search restores full credential list

### Postconditions

1. Clear the search field for next test case
2. Clean up test data by deleting the created test credentials:
   - Navigate to the **Credentials** section of the {Project}
   - Click the **Table view** icon/button to switch to table view
   - Delete "Test_Confluence_ManualSearch" credential:
     - Locate "Test_Confluence_ManualSearch" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Confluence_ManualSearch" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_ADO_ManualSearch" credential:
     - Locate "Test_ADO_ManualSearch" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_ADO_ManualSearch" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Jira_ManualSearch" credential:
     - Locate "Test_Jira_ManualSearch" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Jira_ManualSearch" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
3. All credentials should be visible again
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests exact name matching with manual input

## Test Case ID: TC-02-07

#### Test Case Name:

Search credential by full name - copy-paste in card view

#### Test Case Tags:

positive, search, full_name, copy_paste, card_view

#### Test Case Priority:

High

#### Test Case Description:

Verify that copy-pasting the complete credential name in the search field displays only the exact matching
credential in card view.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details
6. Create test credentials for search validation (copy-paste):
   - Navigate to the **Credentials** section in the {Project} application
   - Create Confluence credential:
     - Click **+ Create** button
     - Select **Confluence** credential type
     - Fill in fields: Display Name: "Test*Confluence_CopyPaste", ID: "test_confluence_copypaste*{timestamp}",
       Base URL: valid Confluence URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create additional test credentials for comparison:
     - Create ADO credential: Display Name: "Test*ADO_CopyPaste", ID: "test_ado_copypaste*{timestamp}"
     - Create Jira credential: Display Name: "Test*Jira_CopyPaste", ID: "test_jira_copypaste*{timestamp}"
7. User is in the **Credentials** section with card view active
8. All type filters are cleared
9. Search field is empty

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Ensure the view is set to **Card view**
3. Locate the "Test_Confluence_CopyPaste" credential in the credentials list
4. Select and copy the credential name "Test_Confluence_CopyPaste" from the credential card
5. Navigate to the search field
6. Click in the search field to focus it
7. Paste the copied credential name using Ctrl+V or right-click paste
8. Verify the complete name appears in the search field
9. Press Enter or wait for search to auto-execute
10. Observe the search results in the main area
11. Verify that only the "Test_Confluence_CopyPaste" credential is displayed
12. Verify that no other credentials are visible in the results
13. Clear the search field and verify all credentials reappear

### Expected Results

- Search field accepts pasted text input
- Copy-paste functionality works correctly
- Pasted exact credential name returns only that specific credential
- No other credentials are displayed in the results
- Search behavior is identical to manual entry
- Clearing search restores full credential list

### Postconditions

1. Clear the search field for next test case
2. Clean up test data by deleting the created test credentials:
   - Navigate to the **Credentials** section of the {Project}
   - Click the **Table view** icon/button to switch to table view
   - Delete "Test_Confluence_CopyPaste" credential:
     - Locate "Test_Confluence_CopyPaste" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Confluence_CopyPaste" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_ADO_CopyPaste" credential:
     - Locate "Test_ADO_CopyPaste" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_ADO_CopyPaste" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Jira_CopyPaste" credential:
     - Locate "Test_Jira_CopyPaste" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Jira_CopyPaste" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
3. All credentials should be visible again
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Validates copy-paste search functionality

## Test Case ID: TC-02-08

#### Test Case Name:

Search credential by full name - manual entry in table view

#### Test Case Tags:

positive, search, full_name, manual_entry, table_view

#### Test Case Priority:

High

#### Test Case Description:

Verify that manually entering the complete credential name in the search field displays only the exact
matching credential in table view.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details
6. Create test credentials for search validation (manual entry - table view):
   - Navigate to the **Credentials** section in the {Project} application
   - Create Confluence credential:
     - Click **+ Create** button
     - Select **Confluence** credential type
     - Fill in fields: Display Name: "Test*Confluence_TableSearch", ID:
       "test_confluence_tablesearch*{timestamp}", Base URL: valid Confluence URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create additional test credentials for comparison:
     - Create ADO credential: Display Name: "Test*ADO_TableSearch", ID: "test_ado_tablesearch*{timestamp}"
     - Create Jira credential: Display Name: "Test*Jira_TableSearch", ID: "test_jira_tablesearch*{timestamp}"
7. User is in the **Credentials** section

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click the **Table view** icon/button to switch to table view
3. Verify that credentials are displayed in table format
4. Locate the search field
5. Click in the search field to focus it
6. Manually type the complete credential name: "Test_Confluence_TableSearch"
7. Press Enter or wait for search to auto-execute
8. Observe the search results in the table
9. Verify that only one row is displayed containing "Test_Confluence_TableSearch"
10. Verify that no other credential rows are visible
11. Check that all table columns are properly displayed for the result
12. Clear the search field and verify all credentials reappear in the table

### Expected Results

- Search functionality works consistently in table view
- Only the matching credential appears as a table row
- All table columns display correctly for the search result
- Search behavior is identical to card view functionality
- Table maintains proper formatting during search

### Postconditions

1. Clear the search field for next test case
2. Clean up test data by deleting the created test credentials:
   - Ensure the view is set to **Table view**
   - Delete "Test_Confluence_TableSearch" credential:
     - Locate "Test_Confluence_TableSearch" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Confluence_TableSearch" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_ADO_TableSearch" credential:
     - Locate "Test_ADO_TableSearch" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_ADO_TableSearch" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Jira_TableSearch" credential:
     - Locate "Test_Jira_TableSearch" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Jira_TableSearch" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
3. All credentials should be visible in table view
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Ensures search consistency across view modes

## Test Case ID: TC-02-09

#### Test Case Name:

Search credential by full name - copy-paste in table view

#### Test Case Tags:

positive, search, full_name, copy_paste, table_view

#### Test Case Priority:

High

#### Test Case Description:

Verify that copy-pasting the complete credential name in the search field displays only the exact matching
credential in table view.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details
6. Create test credentials for search validation (copy-paste - table view):
   - Navigate to the **Credentials** section in the {Project} application
   - Create Confluence credential:
     - Click **+ Create** button
     - Select **Confluence** credential type
     - Fill in fields: Display Name: "Test*Confluence_TableCopy", ID: "test_confluence_tablecopy*{timestamp}",
       Base URL: valid Confluence URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create additional test credentials for comparison:
     - Create ADO credential: Display Name: "Test*ADO_TableCopy", ID: "test_ado_tablecopy*{timestamp}"
     - Create Jira credential: Display Name: "Test*Jira_TableCopy", ID: "test_jira_tablecopy*{timestamp}"
7. User is in the **Credentials** section with table view active

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Ensure the view is set to **Table view**
3. Locate the "Test_Confluence_TableCopy" credential in the table
4. Select and copy the credential name from the table cell
5. Navigate to the search field
6. Click in the search field to focus it
7. Paste the copied credential name using Ctrl+V
8. Verify the complete name appears in the search field
9. Press Enter or wait for search to auto-execute
10. Observe that only one table row is displayed
11. Verify the row contains the correct "Test_Confluence_TableCopy" credential
12. Clear the search field and verify all credentials reappear

### Expected Results

- Copy-paste works correctly in table view
- Search results display as expected table rows only
- Functionality matches card view copy-paste behavior
- Table formatting is maintained during search

### Postconditions

1. Clear the search field for next test case
2. Clean up test data by deleting the created test credentials:
   - Ensure the view is set to **Table view**
   - Delete "Test_Confluence_TableCopy" credential:
     - Locate "Test_Confluence_TableCopy" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Confluence_TableCopy" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_ADO_TableCopy" credential:
     - Locate "Test_ADO_TableCopy" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_ADO_TableCopy" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Jira_TableCopy" credential:
     - Locate "Test_Jira_TableCopy" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Jira_TableCopy" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
3. All credentials visible for partial search tests
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Validates copy-paste consistency in table view

## Test Case ID: TC-02-10

#### Test Case Name:

Search credential by partial name with highlighting in card view

#### Test Case Tags:

positive, search, partial_match, highlighting, card_view

#### Test Case Priority:

High

#### Test Case Description:

Verify that entering partial credential name (first 2 letters) filters credentials and highlights matching
parts in the credential names in card view.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details
6. Create test credentials for search validation (partial name matching):
   - Navigate to the **Credentials** section in the {Project} application
   - Create Confluence credential:
     - Click **+ Create** button
     - Select **Confluence** credential type
     - Fill in fields: Display Name: "Test*Confluence_Partial", ID: "test_confluence_partial*{timestamp}",
       Base URL: valid Confluence URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create additional test credentials for comparison:
     - Create ADO credential: Display Name: "Test*ADO_Partial", ID: "test_ado_partial*{timestamp}"
     - Create Jira credential: Display Name: "Test*Jira_Partial", ID: "test_jira_partial*{timestamp}"
7. User is in the **Credentials** section with card view active
8. Search field is empty

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Ensure the view is set to **Card view**
3. Locate the search field
4. Click in the search field to focus it
5. Type the first 2 letters of the credential name: "Co" (for Confluence)
6. Observe the search results immediately or after a brief delay
7. Verify that credentials containing "Co" in their names are displayed
8. Check that "Test_Confluence_Partial" appears in the results
9. Verify that the "Co" portion is highlighted in the credential name
10. Observe that credentials not containing "Co" are filtered out
11. Try typing different partial matches (e.g., "Te" for "Test")
12. Verify highlighting updates accordingly
13. Clear the search to restore all credentials

### Expected Results

- Partial name search filters credentials containing the search term
- Matching portions of credential names are highlighted/emphasized
- Search is performed as user types (real-time or near real-time)
- Only credentials containing the search term remain visible
- Highlighting is visually clear and consistent
- Search is case-insensitive or provides appropriate case handling

### Postconditions

1. Clear the search field for next test case
2. Clean up test data by deleting the created test credentials:
   - Navigate to the **Credentials** section of the {Project}
   - Click the **Table view** icon/button to switch to table view
   - Delete "Test_Confluence_Partial" credential:
     - Locate "Test_Confluence_Partial" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Confluence_Partial" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_ADO_Partial" credential:
     - Locate "Test_ADO_Partial" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_ADO_Partial" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Jira_Partial" credential:
     - Locate "Test_Jira_Partial" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Jira_Partial" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
3. All credentials should be visible again
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests partial matching with visual highlighting feedback

## Test Case ID: TC-02-11

#### Test Case Name:

Search credential by partial name with highlighting in table view

#### Test Case Tags:

positive, search, partial_match, highlighting, table_view

#### Test Case Priority:

High

#### Test Case Description:

Verify that entering partial credential name filters table rows and highlights matching parts in the
credential names in table view.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details
6. Create test credentials for search validation (partial name matching - table view):
   - Navigate to the **Credentials** section in the {Project} application
   - Create Confluence credential:
     - Click **+ Create** button
     - Select **Confluence** credential type
     - Fill in fields: Display Name: "Test*Confluence_TablePartial", ID:
       "test_confluence_tablepartial*{timestamp}", Base URL: valid Confluence URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create additional test credentials for comparison:
     - Create ADO credential: Display Name: "Test*ADO_TablePartial", ID: "test_ado_tablepartial*{timestamp}"
     - Create Jira credential: Display Name: "Test*Jira_TablePartial", ID:
       "test_jira_tablepartial*{timestamp}"
7. User is in the **Credentials** section

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click the **Table view** icon/button to switch to table view
3. Locate the search field
4. Click in the search field to focus it
5. Type the first 2 letters: "Co" (for Confluence)
6. Observe the table results immediately or after a brief delay
7. Verify that only table rows containing "Co" in credential names are displayed
8. Check that "Test_Confluence_TablePartial" appears in the table
9. Verify that the "Co" portion is highlighted in the credential name column
10. Observe that non-matching rows are filtered out
11. Try different partial matches and verify highlighting updates
12. Clear the search to restore all table rows

### Expected Results

- Partial search filters table rows correctly
- Matching text is highlighted in table cells
- Table maintains proper formatting during search
- Highlighting behavior matches card view functionality
- Real-time or near real-time filtering

### Postconditions

1. Clear the search field for next test case
2. Clean up test data by deleting the created test credentials:
   - Ensure the view is set to **Table view**
   - Delete "Test_Confluence_TablePartial" credential:
     - Locate "Test_Confluence_TablePartial" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Confluence_TablePartial" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_ADO_TablePartial" credential:
     - Locate "Test_ADO_TablePartial" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_ADO_TablePartial" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Jira_TablePartial" credential:
     - Locate "Test_Jira_TablePartial" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Jira_TablePartial" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
3. All credentials visible in table view
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Ensures partial search consistency across view modes

## Test Case ID: TC-02-12

#### Test Case Name:

Search suggestions and navigation in card view

#### Test Case Tags:

positive, search, suggestions, navigation, card_view

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that search provides suggestions below the search field and clicking on a suggestion navigates to that
credential detail view in card view.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details
6. Create test credentials for search suggestions validation:
   - Navigate to the **Credentials** section in the {Project} application
   - Create Confluence credential:
     - Click **+ Create** button
     - Select **Confluence** credential type
     - Fill in fields: Display Name: "Test*Confluence_Suggestions", ID:
       "test_confluence_suggestions*{timestamp}", Base URL: valid Confluence URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create additional test credentials for comparison:
     - Create ADO credential: Display Name: "Test*ADO_Suggestions", ID: "test_ado_suggestions*{timestamp}"
     - Create Jira credential: Display Name: "Test*Jira_Suggestions", ID: "test_jira_suggestions*{timestamp}"
7. User is in the **Credentials** section with card view active

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Ensure the view is set to **Card view**
3. Locate the search field
4. Click in the search field to focus it
5. Start typing "Test" (partial match for multiple credentials)
6. Observe if search suggestions appear below the search field
7. Verify that suggestions include matching credentials like:
   - "Test_Confluence_Suggestions"
   - "Test_ADO_Suggestions"
   - "Test_Jira_Suggestions"
8. Click on "Test_Confluence_Suggestions" from the suggestions list
9. Verify that clicking the suggestion navigates to the credential detail view
10. Verify that the credential detail page opens for "Test_Confluence_Suggestions"
11. Navigate back to the credentials list
12. Repeat with different suggestions to test navigation

### Expected Results

- Search suggestions appear below the search field when typing
- Suggestions include relevant matching credentials
- Suggestions are selectable/clickable
- Clicking a suggestion navigates to that credential's detail view
- Navigation works correctly for all suggested items
- Suggestions update dynamically as user types

### Postconditions

1. User can navigate back to credentials list
2. Clean up test data by deleting the created test credentials:
   - Navigate to the **Credentials** section of the {Project}
   - Click the **Table view** icon/button to switch to table view
   - Delete "Test_Confluence_Suggestions" credential:
     - Locate "Test_Confluence_Suggestions" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Confluence_Suggestions" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_ADO_Suggestions" credential:
     - Locate "Test_ADO_Suggestions" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_ADO_Suggestions" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Jira_Suggestions" credential:
     - Locate "Test_Jira_Suggestions" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Jira_Suggestions" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
3. Search functionality remains available for next test
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests search suggestion and navigation features
- May not be applicable if suggestions feature is not implemented

## Test Case ID: TC-02-13

#### Test Case Name:

Search suggestions and navigation in table view

#### Test Case Tags:

positive, search, suggestions, navigation, table_view

#### Test Case Priority:

Medium

#### Test Case Description:

Verify that search suggestions work correctly in table view and navigation to credential details functions
properly.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details
6. Create test credentials for search suggestions validation (table view):
   - Navigate to the **Credentials** section in the {Project} application
   - Create Confluence credential:
     - Click **+ Create** button
     - Select **Confluence** credential type
     - Fill in fields: Display Name: "Test*Confluence_TableSuggestions", ID:
       "test_confluence_tablesuggestions*{timestamp}", Base URL: valid Confluence URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create additional test credentials for comparison:
     - Create ADO credential: Display Name: "Test*ADO_TableSuggestions", ID:
       "test_ado_tablesuggestions*{timestamp}"
     - Create Jira credential: Display Name: "Test*Jira_TableSuggestions", ID:
       "test_jira_tablesuggestions*{timestamp}"
7. User is in the **Credentials** section

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click the **Table view** icon/button to switch to table view
3. Locate the search field
4. Click in the search field and start typing "Test"
5. Observe search suggestions if they appear
6. Click on a suggestion from the list
7. Verify navigation to credential detail view
8. Test that suggestion behavior is consistent with card view

### Expected Results

- Search suggestions work consistently in table view
- Navigation from suggestions functions properly
- Behavior matches card view suggestion functionality

### Postconditions

1. User can return to credentials list
2. Clean up test data by deleting the created test credentials:
   - Ensure the view is set to **Table view**
   - Delete "Test_Confluence_TableSuggestions" credential:
     - Locate "Test_Confluence_TableSuggestions" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Confluence_TableSuggestions" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_ADO_TableSuggestions" credential:
     - Locate "Test_ADO_TableSuggestions" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_ADO_TableSuggestions" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Jira_TableSuggestions" credential:
     - Locate "Test_Jira_TableSuggestions" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Jira_TableSuggestions" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
3. Both view modes remain functional
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Ensures suggestion consistency across view modes

## Test Case ID: TC-02-14

#### Test Case Name:

Unselect type filters and verify filtering removal in card view

#### Test Case Tags:

positive, unselect, filtering, card_view

#### Test Case Priority:

High

#### Test Case Description:

Verify that clicking on selected type filters (e.g., Confluence, ADO) to unselect them removes the filtering
and shows all credentials in card view.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details
6. Create test credentials for unselect filtering validation in card view:
   - Navigate to the **Credentials** section in the {Project} application
   - Create ADO credential:
     - Click **+ Create** button
     - Select **ADO** credential type
     - Fill in fields: Display Name: "Test*ADO_Unselect", ID: "test_ado_unselect*{timestamp}", Base URL: valid
       ADO URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create Jira credential:
     - Click **+ Create** button
     - Select **Jira** credential type
     - Fill in fields: Display Name: "Test*Jira_Unselect", ID: "test_jira_unselect*{timestamp}", Base URL:
       valid Jira URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create Confluence credential:
     - Click **+ Create** button
     - Select **Confluence** credential type
     - Fill in fields: Display Name: "Test*Confluence_Unselect", ID: "test_confluence_unselect*{timestamp}",
       Base URL: valid Confluence URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
7. User is in the **Credentials** section with card view active

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Ensure the view is set to **Card view**
3. Apply a type filter by clicking on **Confluence** in the Types section
4. Verify that only Confluence credentials are displayed and the type is highlighted
5. Click on the selected **Confluence** type again to unselect it
6. Verify that the Confluence type is no longer highlighted/selected
7. Observe that all credential types are now displayed in the main area
8. Repeat the process with **ADO** type:
   - Select ADO type
   - Verify filtering works
   - Unselect ADO type
   - Verify all credentials reappear
9. Test with multiple selections:
   - Select both Confluence and Jira types
   - Unselect only Confluence
   - Verify only Jira credentials remain
   - Unselect Jira
   - Verify all credentials reappear

### Expected Results

- Clicking on a selected type filter unselects it
- Visual highlighting/selection state is removed
- Unselecting a filter removes its filtering effect
- All credentials become visible when no types are selected
- Multiple selection/unselection works correctly
- Unselecting one of multiple selected types removes only that filter

### Postconditions

1. All type filters are unselected
2. Clean up test data by deleting the created test credentials:
   - Navigate to the **Credentials** section of the {Project}
   - Click the **Table view** icon/button to switch to table view
   - Delete "Test_ADO_Unselect" credential:
     - Locate "Test_ADO_Unselect" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_ADO_Unselect" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Jira_Unselect" credential:
     - Locate "Test_Jira_Unselect" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Jira_Unselect" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Confluence_Unselect" credential:
     - Locate "Test_Confluence_Unselect" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Confluence_Unselect" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
3. All credentials are visible for next test case
4. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Tests the toggle behavior of type filters

## Test Case ID: TC-02-15

#### Test Case Name:

Unselect type filters and verify filtering removal in table view

#### Test Case Tags:

positive, unselect, filtering, table_view

#### Test Case Priority:

High

#### Test Case Description:

Verify that unselecting type filters works correctly in table view and removes filtering to show all
credentials.

### Preconditions

1. User navigates to {URL}
2. User has valid login credentials
3. User logs in with {Username} / {Password}
4. User switches to {Project} (sidebar project switcher)
5. User has permissions credentials.credentials.create, credentials.credentials.list,
   credentials.credentials.details
6. Create test credentials for unselect filtering validation in table view:
   - Navigate to the **Credentials** section in the {Project} application
   - Create ADO credential:
     - Click **+ Create** button
     - Select **ADO** credential type
     - Fill in fields: Display Name: "Test*ADO_TableUnselect", ID: "test_ado_tableunselect*{timestamp}", Base
       URL: valid ADO URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create Jira credential:
     - Click **+ Create** button
     - Select **Jira** credential type
     - Fill in fields: Display Name: "Test*Jira_TableUnselect", ID: "test_jira_tableunselect*{timestamp}",
       Base URL: valid Jira URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
   - Create Confluence credential:
     - Click **+ Create** button
     - Select **Confluence** credential type
     - Fill in fields: Display Name: "Test*Confluence_TableUnselect", ID:
       "test_confluence_tableunselect*{timestamp}", Base URL: valid Confluence URL
     - Select **Basic** authentication, fill Username and API Key
     - Click **Save** button
7. User is in the **Credentials** section

### Test Steps

1. Navigate to the **Credentials** section in the {Project} application
2. Click the **Table view** icon/button to switch to table view
3. Apply a type filter by selecting **Confluence** in the Types section
4. Verify that only Confluence credentials appear in table rows
5. Click on the selected **Confluence** type to unselect it
6. Verify that the type is no longer highlighted/selected
7. Observe that all credential types now appear in the table
8. Test multiple selection/unselection:
   - Select multiple types
   - Unselect them one by one
   - Verify table updates correctly each time
9. Verify that unselect behavior matches card view functionality

### Expected Results

- Unselect functionality works consistently in table view
- Table rows update correctly when filters are removed
- Visual feedback matches card view behavior
- All credentials appear when no filters are active

### Postconditions

1. All type filters are cleared
2. All credentials are visible in table view
3. Clean up test data by deleting the created test credentials:
   - Ensure the view is set to **Table view**
   - Delete "Test_ADO_TableUnselect" credential:
     - Locate "Test_ADO_TableUnselect" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_ADO_TableUnselect" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Jira_TableUnselect" credential:
     - Locate "Test_Jira_TableUnselect" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Jira_TableUnselect" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
   - Delete "Test_Confluence_TableUnselect" credential:
     - Locate "Test_Confluence_TableUnselect" credential in the credentials list
     - Click on the ellipsis menu (⋯) in the Action field for this credential
     - Select **Delete** from the dropdown menu
     - In the **Delete confirmation** modal window:
       - Enter the credential name "Test_Confluence_TableUnselect" in the confirmation field
       - Click **Delete** button to confirm
     - Verify the credential is removed from the list
4. Verify credential cleanup is successful
5. Click on the Avatar icon (bottom left), select the Logout option to log out of the application

### Notes

- Final test case includes cleanup of all test data
- Ensures unselect consistency across both view modes
