export const datasourceToolOptions = [
  { label: 'Chat', value: 'chat' },
  { label: 'Search', value: 'search' },
];

export const browserToolOptions = [
  { label: 'Wiki', value: 'wiki' },
  { label: 'Single URL Crawler', value: 'single_url_crawler' },
  { label: 'Multi URL Crawler', value: 'multi_url_crawler' },
  { label: 'Get HTML Content', value: 'get_html_content' },
  { label: 'Google', value: 'google' },
];

export const xrayToolOptions = [
  { label: 'Get tests', value: 'get_tests' },
  { label: 'Create test', value: 'create_test' },
  { label: 'Execute custom GraphQL', value: 'execute_graphql' },
];

export const confluenceToolOptions = [
  // { label: 'Page Exists', value: 'page_exists' },
  { label: 'Get pages with the label', value: 'get_pages_with_label' },
  { label: 'List pages with the label', value: 'list_pages_with_label' },
  { label: 'Search pages', value: 'search_pages' },
  { label: 'Create page', value: 'create_page' },
  { label: 'Create pages', value: 'create_pages' },
  { label: 'Get page tree', value: 'get_page_tree' },
  { label: 'Delete page', value: 'delete_page' },
  { label: 'Update page by id', value: 'update_page_by_id' },
  { label: 'Update page by title', value: 'update_page_by_title' },
  { label: 'Update labels', value: 'update_labels' },
  { label: 'Update pages', value: 'update_pages' },
  { label: 'Site search', value: 'site_search' },
  { label: 'Search  by title', value: 'search_by_title' },
  { label: 'Read page by Id', value: 'read_page_by_id' },
  { label: 'Generic request', value: 'execute_generic_confluence' },
  { label: 'Loader', value: 'loader' },
];

export const jiraToolOptions = [
  { label: 'Search using JQL', value: 'search_using_jql' },
  { label: 'Create issue', value: 'create_issue' },
  { label: 'Update issue', value: 'update_issue' },
  { label: 'List comments', value: 'list_comments' },
  { label: 'Add comments', value: 'add_comments' },
  { label: 'Get attachments content', value: 'get_attachments_content' },
  { label: 'List projects', value: 'list_projects' },
  { label: 'Set issue status', value: 'set_issue_status' },
  { label: 'Get specific field info', value: 'get_specific_field_info' },
  { label: 'Get remote links', value: 'get_remote_links' },
  { label: 'Link issues', value: 'link_issues' },
  { label: 'Modify labels', value: 'modify_labels' },
  { label: 'Generic request', value: 'execute_generic_rq' },
];

export const zephyrToolOptions = [
  { label: 'Get test case steps', value: 'get_test_case_steps' },
  { label: 'Add test step', value: 'add_new_test_case_step' },
  { label: 'Add test case', value: 'add_test_case' },
];

export const zephyrScaleToolOptions = [
  { label: 'Get tests', value: 'get_tests' },
  { label: 'Get test', value: 'get_test' },
  { label: 'Get test steps', value: 'get_test_steps' },
  { label: 'Create test case', value: 'create_test_case' },
];

export const yagmailToolOptions = [{ label: 'Send e-mail', value: 'send_gmail_message' }];

export const githubToolOptions = [
  { label: 'Get issues', value: 'get_issues' },
  { label: 'Get issue', value: 'get_issue' },
  { label: 'Search issues', value: 'search_issues' },
  { label: 'Create issue', value: 'create_issue' },
  { label: 'Update issue', value: 'update_issue' },
  { label: 'Create issue on project', value: 'create_issue_on_project' },
  { label: 'Update issue on project', value: 'update_issue_on_project' },
  { label: 'Comment on issue', value: 'comment_on_issue' },
  { label: 'List open pull requests (PRs)', value: 'list_open_pull_requests' },
  { label: 'Get pull request', value: 'get_pull_request' },
  { label: 'List pull request files', value: 'list_pull_request_files' },
  { label: 'Create pull request', value: 'create_pull_request' },
  { label: 'Create file', value: 'create_file' },
  { label: 'Read file', value: 'read_file' },
  { label: 'Update file', value: 'update_file' },
  { label: 'Delete file', value: 'delete_file' },
  { label: 'List files in branch', value: 'list_files_in_main_branch' },
  { label: 'List branches in repo', value: 'list_branches_in_repo' },
  { label: 'Set active branch', value: 'set_active_branch' },
  { label: 'Create branch', value: 'create_branch' },
  { label: 'Get files from directory', value: 'get_files_from_directory' },
];

export const bitbucketToolOptions = [
  { label: 'Create pull request', value: 'create_pull_request' },
  { label: 'Create file', value: 'create_file' },
  { label: 'Read file', value: 'read_file' },
  { label: 'Update file', value: 'update_file' },
  { label: 'List branches in repo', value: 'list_branches_in_repo' },
  { label: 'Set active branch', value: 'set_active_branch' },
  { label: 'Create branch', value: 'create_branch' },
];

export const artifactToolOptions = [
  { label: 'List Files', value: 'listFiles' },
  { label: 'Create File', value: 'createFile' },
  { label: 'Read File', value: 'readFile' },
  { label: 'Delete File', value: 'deleteFile' },
  { label: 'Append Data', value: 'appendData' },
  { label: 'Create New Bucket', value: 'createNewBucket' },
  { label: 'Overwrite Data', value: 'overwriteData' },
];

export const gitlabToolOptions = [
  { label: 'Create branch', value: 'create_branch' },
  { label: 'Create pull request', value: 'create_pull_request' },
  { label: 'Create file', value: 'create_file' },
  { label: 'List files', value: 'list_files' },
  { label: 'Read file', value: 'read_file' },
  { label: 'Update file', value: 'update_file' },
  { label: 'Append file', value: 'append_file' },
  { label: 'Delete file', value: 'delete_file' },
  { label: 'Set active branch', value: 'set_active_branch' },
  { label: 'List branches in repo', value: 'list_branches_in_repo' },
  { label: 'Get PR changes', value: 'get_pr_changes' },
  { label: 'Create PR change comment', value: 'create_pr_change_comment' },
];

export const testrailToolOptions = [
  { label: 'Get case', value: 'get_case' },
  { label: 'Get cases', value: 'get_cases' },
  { label: 'Get cases by filter', value: 'get_cases_by_filter' },
  { label: 'Add case', value: 'add_case' },
];

export const adoBoardsToolOptions = [
  { label: 'Search work items', value: 'search_work_items' },
  { label: 'Get work item', value: 'get_work_item' },
  { label: 'Create work item', value: 'create_work_item' },
  { label: 'Update work item', value: 'update_work_item' },
  { label: 'Link work items', value: 'link_work_items' },
  { label: 'Get relation types', value: 'get_relation_types' },
];

export const adoWikiToolOptions = [
  { label: 'Get wiki', value: 'get_wiki' },
  { label: 'Get wiki page by path', value: 'get_wiki_page_by_path' },
  { label: 'Get wiki page by id', value: 'get_wiki_page_by_id' },
  { label: 'Delete wiki page by path', value: 'delete_page_by_path' },
  { label: 'Delete wiki page by id', value: 'delete_page_by_id' },
  { label: 'Modify wiki page', value: 'modify_wiki_page' },
];

export const adoPlansToolOptions = [
  { label: 'Create test plan', value: 'create_test_plan' },
  { label: 'Delete test plan', value: 'delete_test_plan' },
  { label: 'Get test plan', value: 'get_test_plan' },
  { label: 'Create test suite', value: 'create_test_suite' },
  { label: 'Delete test suite', value: 'delete_test_suite' },
  { label: 'Get test suite', value: 'get_test_suite' },
  { label: 'Add test case', value: 'add_test_case' },
  { label: 'Get test case', value: 'get_test_case' },
  { label: 'Get test cases', value: 'get_test_cases' },
];

export const adoReposToolOptions = [
  { label: 'List branches', value: 'list_branches_in_repo' },
  { label: 'Set active branch', value: 'set_active_branch' },
  { label: 'List files', value: 'list_files' },
  { label: 'List opened pull requests', value: 'list_open_pull_requests' },
  { label: 'Get pull request', value: 'get_pull_request' },
  { label: 'List pull request files', value: 'list_pull_request_files' },
  { label: 'Create branch', value: 'create_branch' },
  { label: 'Read file', value: 'read_file' },
  { label: 'Create file', value: 'create_file' },
  { label: 'Update file', value: 'update_file' },
  { label: 'Delete file', value: 'delete_file' },
  { label: 'Get work items', value: 'get_work_items' },
  { label: 'Comment pull request', value: 'comment_on_pull_request' },
  { label: 'Create pull request', value: 'create_pull_request' },
];

export const reportPortalToolOptions = [
  { label: 'Export specified launch', value: 'export_specified_launch' },
  { label: 'Get launch details', value: 'get_launch_details' },
  { label: 'Get all launches', value: 'get_all_launches' },
  { label: 'Find test item by id', value: 'find_test_item_by_id' },
  { label: 'Get test items for launch', value: 'get_test_items_for_launch' },
  { label: 'Get logs for test item', value: 'get_logs_for_test_items' },
  { label: 'Get user information', value: 'get_user_information' },
  { label: 'Get dashboard data', value: 'get_dashboard_data' },
];

export const testioToolOptions = [
  { label: 'Get Test Cases for Test', value: 'get_test_cases_for_test' },
  { label: 'Test Cases Statuses for Test', value: 'get_test_cases_statuses_for_test' },
  { label: 'List Bugs for Test with Filter', value: 'list_bugs_for_test_with_filter' },
];

export const qtestToolOptions = [
  { label: 'Search by dql', value: 'search_by_dql' },
  { label: 'Create test cases', value: 'create_test_cases' },
  { label: 'Update test case', value: 'update_test_case' },
  { label: 'Find test case by id', value: 'find_test_case_by_id' },
  { label: 'Delete test case', value: 'delete_test_case' },
];

export const googleToolOptions = [{ label: 'Get files', value: 'get_files' }];

export const sharepointToolOptions = [
  { label: 'Get all files', value: 'get_files_list' },
  { label: 'Read document', value: 'read_document' },
  { label: 'Read list', value: 'read_list' },
];

export const rallyToolOptions = [
  { label: 'Get types', value: 'get_types' },
  { label: 'Get entities', value: 'get_entities' },
  { label: 'Create artifact', value: 'create_artifact' },
  { label: 'Update artifact', value: 'update_artifact' },
  { label: 'Get project', value: 'get_project' },
  { label: 'Get workspace', value: 'get_workspace' },
  { label: 'Get user', value: 'get_user' },
  { label: 'Get context', value: 'get_context' },
];

export const sqlToolOptions = [
  { label: 'List tables and columns', value: 'list_tables_and_columns' },
  { label: 'Execute SQL', value: 'execute_sql' },
];

export const sonarToolOptions = [{ label: 'Get Sonar data', value: 'get_sonar_data' }];

export const gplacesToolOptions = [
  { label: 'Find places', value: 'places' },
  { label: 'Find near', value: 'find_near' },
];
