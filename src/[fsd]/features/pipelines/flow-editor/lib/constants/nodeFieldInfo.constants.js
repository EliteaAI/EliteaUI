import { PipelineNodeTypes } from './flowEditor.constants';

// Keys of the node panel fields; input-mapping fields use their YAML mapping key
export const NODE_FIELD_KEYS = {
  name: 'name',
  type: 'type',
  trigger: 'trigger',
  agent: 'agent',
  version: 'version',
  task: 'task',
  system: 'system',
  input: 'input',
  output: 'output',
  chatHistory: 'chat_history',
  structuredOutput: 'structured_output',
  code: 'code',
  decisionCriteria: 'decision_criteria',
  decisionOutputs: 'decision_outputs',
  defaultOutput: 'default_output',
  userMessage: 'user_message',
  approve: 'approve',
  edit: 'edit',
  editStateKey: 'edit_state_key',
  reject: 'reject',
  toolkits: 'toolkits',
  tools: 'tools',
  toolkit: 'toolkit',
  mcp: 'mcp',
  tool: 'tool',
  addOptionalParameter: 'add_optional_parameter',
  printer: 'printer',
  finalMessage: 'final_message',
  condition: 'condition',
  routes: 'routes',
  jinjaTemplate: 'jinja_template',
  variablesToClean: 'variables_to_clean',
  inputMapping: 'input_mapping',
  loopTool: 'loop_tool',
  variablesMapping: 'variables_mapping',
  conditionInput: 'condition_input',
  conditionalOutputs: 'conditional_outputs',
  pipeline: 'pipeline',
  configuration: 'configuration',
};

const K = NODE_FIELD_KEYS;

export const COMMON_NODE_FIELD_INFO = {
  [K.name]:
    "Unique name of this node. It's used to connect nodes and in run logs. Renaming updates all references.",
  [K.type]:
    'How the value is provided. Fixed: used exactly as typed. Variable: taken from a state variable. F-String: text with {variable} placeholders filled from state.',
  [K.trigger]:
    'What starts the pipeline. Chat Message: a user message. Schedule: runs on a timer. Webhook: runs when an external system calls a URL. Schedule and Webhook are unavailable if the pipeline needs user interaction.',
};

const TOOL_NODE_FIELD_INFO = {
  [K.tool]: '',
  [K.addOptionalParameter]:
    "Add an optional argument of the selected tool. Unset optional arguments use the tool's defaults.",
  [K.input]: 'State variables available for tool parameters.',
  [K.output]: "State variables where the tool's result is saved.",
  [K.structuredOutput]:
    "When on, the tool's result is parsed as JSON and its fields are saved to the matching Output variables.",
};

const TOOLKIT_NODE_FIELD_INFO = {
  ...TOOL_NODE_FIELD_INFO,
  [K.toolkit]: 'The toolkit from this project to use, e.g. Jira, GitHub or Confluence.',
  [K.tool]: 'The toolkit action this node runs.',
};

const DEPRECATED_COMMON_FIELD_INFO = {
  [K.input]: TOOL_NODE_FIELD_INFO[K.input],
  [K.output]: TOOL_NODE_FIELD_INFO[K.output],
  [K.structuredOutput]: TOOL_NODE_FIELD_INFO[K.structuredOutput],
};

const FUNCTION_INFO =
  "Deprecated: use a Toolkit or MCP node instead. Same meaning as the Toolkit node's Toolkit, Tool and Tool parameters.";
const TOOL_INFO =
  'Deprecated: use a Toolkit, MCP or Agent node. The tool to run and the instruction sent to it.';
const LOOP_INFO = 'Deprecated: runs the selected tool repeatedly for each item described in Task.';
const LOOP_FROM_TOOL_INFO =
  "Deprecated: runs Loop tool for every item returned by Tool. Variables mapping maps each item to the loop tool's inputs.";
const CUSTOM_INFO = 'Deprecated: select a specific node type instead. Raw node configuration.';
const CUSTOM_FIELD_INFO = {
  ...DEPRECATED_COMMON_FIELD_INFO,
  [K.configuration]: CUSTOM_INFO,
};
const CONDITION_INFO =
  'Deprecated: use Router. Variables to evaluate, the condition template, possible next nodes, and the fallback node.';

export const NODE_FIELD_INFO = {
  [PipelineNodeTypes.Agent]: {
    [K.agent]: 'The agent or pipeline from this project that this node runs.',
    [K.version]: 'Which version of the selected agent or pipeline to run.',
    [K.task]:
      'The instruction or question sent to the agent. Use F-String to include state values, e.g. Summarize {issue_text}.',
    [K.input]: 'State variables this node can read. Only these can be used in Task and other fields.',
    [K.output]: "State variables where the agent's answer is saved for the next nodes.",
    [K.chatHistory]:
      'Previous messages passed to the agent as context. Set to an empty list to start the agent without history.',
  },
  [PipelineNodeTypes.Code]: {
    [K.code]:
      "Python code to run. Read state values from the node's Input. The returned value is saved to Output.",
    [K.input]: 'State variables available to the code.',
    [K.output]: "State variables where the code's result is saved.",
    [K.structuredOutput]:
      'When on, the result must be a dictionary. Its keys are saved to the matching Output variables.',
  },
  [PipelineNodeTypes.Decision]: {
    [K.decisionCriteria]:
      'Describe in plain language how to choose the next step. An LLM reads this and the Input values and picks one of the Decision outputs.',
    [K.decisionOutputs]: 'Nodes the decision can route to.',
    [K.defaultOutput]: 'Node to go to if none of the Decision outputs fits.',
    [K.input]: 'State variables the decision can consider.',
  },
  [PipelineNodeTypes.Hitl]: {
    [K.userMessage]:
      'Message shown to the user when the pipeline pauses, e.g. what to review. F-String can include state values.',
    [K.approve]: 'Node to continue with when the user approves.',
    [K.edit]: 'Node to continue with after the user edits a value. Requires Edit state key.',
    [K.editStateKey]: 'State variable the user can edit before the pipeline continues on the Edit route.',
    [K.reject]: 'Node to go to when the user rejects. Defaults to End.',
    [K.input]: 'State variables available to the User message.',
  },
  [PipelineNodeTypes.LLM]: {
    [K.toolkits]: 'Toolkits and MCPs from this project that the LLM may call while answering.',
    [K.tools]:
      'Tools of the selected toolkit or MCP the LLM is allowed to use. Fewer tools means faster and more predictable answers.',
    [K.system]: "Instructions that define the LLM's role, rules and response format.",
    [K.task]: 'The request the LLM should complete. Use F-String to include state values.',
    [K.input]: 'State variables this node can read in System and Task.',
    [K.output]: "State variables where the LLM's answer is saved.",
    [K.chatHistory]:
      'Previous messages sent to the LLM as context. Use an empty list for an independent request.',
    [K.structuredOutput]:
      'When on, the LLM returns JSON matching the Output variables, and each value is saved to its variable.',
  },
  [PipelineNodeTypes.Mcp]: {
    ...TOOL_NODE_FIELD_INFO,
    [K.mcp]: 'The MCP server from this project to call. You may need to log in first.',
    [K.tool]: 'The MCP tool this node runs.',
  },
  [PipelineNodeTypes.Printer]: {
    [K.printer]: 'Content shown to the user in chat at this step. Use F-String to include state values.',
    [K.finalMessage]:
      'Note shown after the content. The pipeline pauses until the user replies. Default: "How to proceed? To resume the pipeline - type anything…"',
  },
  [PipelineNodeTypes.Router]: {
    [K.condition]: 'Template that returns the name of the route to take, based on Input values.',
    [K.routes]: 'Nodes the router can send the flow to.',
    [K.defaultOutput]: 'Node to go to if the condition matches no route.',
    [K.input]: 'State variables available to the Condition.',
  },
  [PipelineNodeTypes.StateModifier]: {
    [K.jinjaTemplate]:
      'Jinja2 template that builds a new value from Input variables, e.g. {{ title }} - {{ status }}. The result is saved to Output.',
    [K.variablesToClean]: 'State variables reset to empty at this step, e.g. to clear temporary data.',
    [K.input]: 'State variables available in the template.',
    [K.output]: 'State variable(s) where the template result is saved.',
  },
  [PipelineNodeTypes.Toolkit]: TOOLKIT_NODE_FIELD_INFO,
  [PipelineNodeTypes.Function]: {
    ...DEPRECATED_COMMON_FIELD_INFO,
    [K.toolkit]: FUNCTION_INFO,
    [K.tool]: FUNCTION_INFO,
    [K.inputMapping]: FUNCTION_INFO,
  },
  [PipelineNodeTypes.Tool]: {
    ...DEPRECATED_COMMON_FIELD_INFO,
    [K.tool]: TOOL_INFO,
    [K.task]: TOOL_INFO,
  },
  [PipelineNodeTypes.Loop]: {
    ...DEPRECATED_COMMON_FIELD_INFO,
    [K.tool]: LOOP_INFO,
    [K.task]: LOOP_INFO,
  },
  [PipelineNodeTypes.LoopFromTool]: {
    ...DEPRECATED_COMMON_FIELD_INFO,
    [K.tool]: LOOP_FROM_TOOL_INFO,
    [K.loopTool]: LOOP_FROM_TOOL_INFO,
    [K.variablesMapping]: LOOP_FROM_TOOL_INFO,
  },
  [PipelineNodeTypes.Condition]: {
    ...DEPRECATED_COMMON_FIELD_INFO,
    [K.conditionInput]: CONDITION_INFO,
    [K.condition]: CONDITION_INFO,
    [K.conditionalOutputs]: CONDITION_INFO,
    [K.defaultOutput]: CONDITION_INFO,
  },
  [PipelineNodeTypes.Pipeline]: {
    ...DEPRECATED_COMMON_FIELD_INFO,
    [K.pipeline]: 'Deprecated: use the Agent node. The pipeline to run as a step.',
  },
  [PipelineNodeTypes.Custom]: CUSTOM_FIELD_INFO,
  // Custom nodes are rendered as the Default node type
  [PipelineNodeTypes.Default]: CUSTOM_FIELD_INFO,
};
