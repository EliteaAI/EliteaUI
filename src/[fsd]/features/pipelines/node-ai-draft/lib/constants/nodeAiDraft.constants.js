import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

const { PipelineNodeTypes } = FlowEditorConstants;

// The two modal modes and their texts
export const NODE_AI_MODES = {
  build: { key: 'build', label: 'Build with AI', requirementLabel: 'What should this node do?' },
  edit: { key: 'edit', label: 'Edit with AI', requirementLabel: 'What should change?' },
};

/**
 * Node types the AI can draft (the keys are the supported types) with:
 * - configPaths: the node is "not configured" when all of them are empty (spec AC-3);
 * - placeholder, build and edit examples for the requirement box (spec §5.6).
 */
export const NODE_AI_NODE_TYPES = {
  [PipelineNodeTypes.LLM]: {
    configPaths: ['input_mapping.system.value', 'input_mapping.task.value', 'tool_names'],
    placeholder: 'e.g. Summarize the issues in a table with ID, title, assignee and status',
    build: [
      'Summarize issues as a table',
      'Classify the request as bug, feature or question',
      'Write a Jira description from summary using the Jira toolkit',
    ],
    edit: [
      'Make the summary shorter',
      'Also return the total count',
      'Use the Confluence toolkit to search docs first',
    ],
  },
  [PipelineNodeTypes.Agent]: {
    configPaths: ['tool', 'input_mapping.task.value'],
    placeholder: "e.g. Ask the Daily Issue Summary Agent for today's report",
    build: [
      'Run Daily Issue Summary Agent with input',
      'Pass summary to the release notes agent',
      'Ask the triage agent to label issue',
    ],
    edit: ['Pass chat history too', 'Store the answer in report', 'Use version base'],
  },
  [PipelineNodeTypes.Toolkit]: {
    configPaths: ['toolkit_name', 'tool'],
    placeholder: 'e.g. Create a Jira issue from the summary in project QA',
    build: [
      'List open GitHub issues from the last 24 hours',
      'Create a Jira issue from summary',
      'Post report to the Slack channel #release',
    ],
    edit: ['Use the bug issue type', 'Also set the assignee from owner', 'Save the result in jira_key'],
  },
  [PipelineNodeTypes.Mcp]: {
    configPaths: ['toolkit_name', 'tool'],
    placeholder: 'e.g. Search the docs MCP for question',
    build: ['Search documents for question', 'Read the file from path', 'Fetch the page from url'],
    edit: ['Limit to 5 results', 'Use the search tool instead', 'Save results in docs'],
  },
  [PipelineNodeTypes.Code]: {
    configPaths: ['code.value'],
    placeholder: 'e.g. Count the issues by status and return the counts',
    build: ['Count issues by status', 'Keep only issues created today', 'Convert report to CSV'],
    edit: ['Also handle an empty list', 'Return the result in stats', 'Sort by date'],
  },
  [PipelineNodeTypes.Router]: {
    configPaths: ['condition', 'routes'],
    placeholder: 'e.g. Go to create_jira_issue if severity is critical, else END',
    build: [
      'Route by severity: critical → create_jira_issue',
      'If issues is empty go to END',
      'Route by category to the matching node',
    ],
    edit: ['Add a route for high severity', 'Make the default END', 'Compare case-insensitively'],
  },
  [PipelineNodeTypes.Decision]: {
    configPaths: ['description', 'nodes'],
    placeholder: 'e.g. Pick the next step based on whether the user wants a summary or a ticket',
    build: [
      'Decide between summarize and create_jira_issue',
      'Go to approve when the change is risky',
      'Choose the team node by topic',
    ],
    edit: ['Add the notify node as an option', 'Explain the criteria more clearly', 'Default to END'],
  },
  [PipelineNodeTypes.Hitl]: {
    configPaths: ['user_message.value', 'routes.approve', 'routes.edit'],
    placeholder: 'e.g. Ask the user to approve the Jira issue before creating it',
    build: [
      'Ask to approve summary before create_jira_issue',
      'Let the user edit draft before sending',
      'Ask for confirmation, reject ends',
    ],
    edit: ['Allow editing summary', 'Make the message friendlier', 'Reject goes back to summarize'],
  },
  [PipelineNodeTypes.StateModifier]: {
    configPaths: ['template'],
    placeholder: 'e.g. Combine summary and jira_key into a final report',
    build: [
      'Join summary and jira_key into report',
      'Format issues as a numbered list',
      'Clear issues after use',
    ],
    edit: ["Add a header with today's date", 'Also clean draft', 'Output to final_text'],
  },
  [PipelineNodeTypes.Printer]: {
    configPaths: ['input_mapping.printer.value', 'final_message'],
    placeholder: 'e.g. Show the report to the user and wait',
    build: [
      'Show report to the user',
      'Tell the user the Jira issue jira_key was created',
      'Show progress after step 1',
    ],
    edit: ['Add a closing sentence', 'Show summary instead', 'Make it shorter'],
  },
};
