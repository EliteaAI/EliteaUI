export const CONDITION_NODE_ID_SUFFIX = '~~~ConditionNode';
export const DECISION_NODE_ID_SUFFIX = '~~~DecisionNode';
export const ROUTER_HANDLE_ID_SUFFIX = 'routerNode';
export const HITL_HANDLE_ID_SUFFIX = 'hitlNode';
export const EDGE_PREFIX = 'xy-edge__';
export const DEFAULT_OUTPUT = 'default_output';
export const PIPELINE_STATE = 'state';
export const STATE_MESSAGES = 'messages';
export const STATE_INPUT = 'input';
export const RUN_STATE_NODE = 'run_state';

export const StateVariableTypes = {
  String: 'str',
  Number: 'number',
  List: 'list',
  Json: 'dict',
};

export const DefaultState = {
  [STATE_INPUT]: { type: StateVariableTypes.String },
  [STATE_MESSAGES]: { type: StateVariableTypes.List },
};

export const StateDefaultProps = [STATE_INPUT, STATE_MESSAGES];

export const LegacyIntType = 'int';

export const PipelineStatus = {
  InProgress: 'In progress',
  Completed: 'Completed',
  Interrupt: 'Interrupt',
  Error: 'Error',
  Stopped: 'Stopped',
};

export const PipelineNodeTypes = {
  Tool: 'tool',
  Agent: 'agent',
  Pipeline: 'pipeline',
  Function: 'function',
  LLM: 'llm',
  Decision: 'decision',
  Condition: 'condition',
  Loop: 'loop',
  LoopFromTool: 'loop_from_tool',
  Router: 'router',
  StateModifier: 'state_modifier',
  Toolkit: 'toolkit',
  Mcp: 'mcp',
  Code: 'code',
  Printer: 'printer',
  Hitl: 'hitl',
  Custom: 'custom',
  Ghost: 'ghost',
  End: 'END',
  Default: 'defaultType',
};

export const PipelineNodeDisplayNames = {
  [PipelineNodeTypes.Tool]: 'Tool',
  [PipelineNodeTypes.Agent]: 'Agent',
  [PipelineNodeTypes.Pipeline]: 'Pipeline',
  [PipelineNodeTypes.Function]: 'Function',
  [PipelineNodeTypes.LLM]: 'LLM',
  [PipelineNodeTypes.Decision]: 'Decision',
  [PipelineNodeTypes.Condition]: 'Condition',
  [PipelineNodeTypes.Loop]: 'Loop',
  [PipelineNodeTypes.LoopFromTool]: 'Loop from tool',
  [PipelineNodeTypes.Router]: 'Router',
  [PipelineNodeTypes.StateModifier]: 'State modifier',
  [PipelineNodeTypes.Toolkit]: 'Toolkit',
  [PipelineNodeTypes.Mcp]: 'MCP',
  [PipelineNodeTypes.Code]: 'Code',
  [PipelineNodeTypes.Printer]: 'Printer',
  [PipelineNodeTypes.Hitl]: 'Human-in-the-loop',
  [PipelineNodeTypes.Custom]: 'Custom',
  [PipelineNodeTypes.Ghost]: 'Ghost',
  [PipelineNodeTypes.End]: 'End',
  [PipelineNodeTypes.Default]: 'Default',
};

export const NodeHeightMap = {
  [PipelineNodeTypes.Condition]: 450,
  [PipelineNodeTypes.Decision]: 450,
  [PipelineNodeTypes.LLM]: 460,
  [PipelineNodeTypes.Tool]: 340,
  [PipelineNodeTypes.Function]: 460,
  [PipelineNodeTypes.Loop]: 460,
  [PipelineNodeTypes.LoopFromTool]: 460,
  [PipelineNodeTypes.Custom]: 570,
  [PipelineNodeTypes.Printer]: 400,
  [PipelineNodeTypes.Default]: 570,
  [PIPELINE_STATE]: 40,
  [PipelineNodeTypes.End]: 60,
  [PipelineNodeTypes.Mcp]: 630,
  [PipelineNodeTypes.Toolkit]: 460,
  [PipelineNodeTypes.Agent]: 460,
  [PipelineNodeTypes.Pipeline]: 340,
  [PipelineNodeTypes.Code]: 500,
  [PipelineNodeTypes.Router]: 550,
  [PipelineNodeTypes.Hitl]: 550,
  [PipelineNodeTypes.StateModifier]: 400,
  [PipelineNodeTypes.Ghost]: 60,
};

export const PipelineNodeTypeNames = Object.entries(PipelineNodeTypes).reduce(
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {},
);

export const NodeDisplayLabels = {
  [PipelineNodeTypes.Tool]: 'Tool',
  [PipelineNodeTypes.Agent]: 'Agent',
  [PipelineNodeTypes.Pipeline]: 'Pipeline',
  [PipelineNodeTypes.Function]: 'Function',
  [PipelineNodeTypes.LLM]: 'LLM',
  [PipelineNodeTypes.Decision]: 'Decision',
  [PipelineNodeTypes.Condition]: 'Condition',
  [PipelineNodeTypes.Loop]: 'Loop',
  [PipelineNodeTypes.LoopFromTool]: 'Loop from tool',
  [PipelineNodeTypes.Router]: 'Router',
  [PipelineNodeTypes.StateModifier]: 'State modifier',
  [PipelineNodeTypes.Toolkit]: 'Toolkit',
  [PipelineNodeTypes.Mcp]: 'MCP',
  [PipelineNodeTypes.Code]: 'Code',
  [PipelineNodeTypes.Printer]: 'Printer',
  [PipelineNodeTypes.Hitl]: PipelineNodeDisplayNames[PipelineNodeTypes.Hitl],
  [PipelineNodeTypes.Custom]: 'Custom',
  [PipelineNodeTypes.Ghost]: 'Ghost',
  [PipelineNodeTypes.End]: 'END',
  [PipelineNodeTypes.Default]: 'Default',
};

export const ORIENTATION = {
  horizontal: 'horizontal',
  vertical: 'vertical',
};

export const OrientationKey = 'alita_ui.orientation';

export const LAYOUT_VERSION = '1.0';

export const StatueTypeMap = {
  str: 'String',
  list: 'List',
  number: 'Number',
  dict: 'Json',
};

export const agentTaskTypeOptions = [
  {
    label: 'F-String',
    value: 'fstring',
  },
  {
    label: 'Variable',
    value: 'variable',
  },
  {
    label: 'Fixed',
    value: 'fixed',
  },
];

export const InitialNodeId = {
  [PipelineNodeTypes.Tool]: 'Tool',
  [PipelineNodeTypes.Agent]: 'Agent',
  [PipelineNodeTypes.Pipeline]: 'Pipeline',
  [PipelineNodeTypes.LLM]: 'LLM',
  [PipelineNodeTypes.Code]: 'Code',
  [PipelineNodeTypes.Function]: 'Function',
  [PipelineNodeTypes.Condition]: 'Condition',
  [PipelineNodeTypes.Decision]: 'Decision',
  [PipelineNodeTypes.Loop]: 'Loop',
  [PipelineNodeTypes.End]: 'End',
  [PipelineNodeTypes.LoopFromTool]: 'LoopFromTool',
  [PipelineNodeTypes.Router]: 'Router',
  [PipelineNodeTypes.StateModifier]: 'StateModifier',
  [RUN_STATE_NODE]: 'RunState',
  [PipelineNodeTypes.Custom]: 'Custom',
  [PipelineNodeTypes.Ghost]: 'Ghost',
  [PipelineNodeTypes.Default]: 'Default',
  [PipelineNodeTypes.Toolkit]: 'Toolkit',
  [PipelineNodeTypes.Mcp]: 'MCP',
  [PipelineNodeTypes.Printer]: 'Printer',
  [PipelineNodeTypes.Hitl]: 'HITL',
};

// Common data patterns for node initialization
const createBaseNodeData = () => ({
  input: [],
  output: [],
});

const createTransitionNodeData = () => ({
  ...createBaseNodeData(),
  transition: PipelineNodeTypes.End,
});

const createStructuredOutputNodeData = () => ({
  ...createTransitionNodeData(),
  structured_output: false,
});

const createToolNodeData = () => ({
  tool: '',
  ...createStructuredOutputNodeData(),
});

const createFunctionNodeData = () => ({
  ...createToolNodeData(),
  function: undefined,
  input_mapping: {},
});

const createConditionNodeData = () => ({
  condition_input: [],
  condition_definition: '',
  conditional_outputs: [],
  default_output: '',
});

const createDecisionNodeData = () => ({
  input: [],
  description: '',
  nodes: [],
  default_output: '',
});

const createLoopNodeData = () => ({
  task: '',
  ...createToolNodeData(),
});

const createLoopFromToolNodeData = () => ({
  tool: '',
  loop_tool: '',
  variables_mapping: undefined,
  ...createStructuredOutputNodeData(),
});

const createRouterNodeData = () => ({
  default_output: '',
  routes: [],
  input: [],
  condition: '',
});

const createStateModifierNodeData = () => ({
  template: '',
  variables_to_clean: [],
  ...createBaseNodeData(),
});

const createCodeNodeData = () => ({
  code: {
    type: 'fixed',
    value: '',
  },
  ...createStructuredOutputNodeData(),
});

const createPrinterNodeData = () => ({
  transition: PipelineNodeTypes.End,
});

const createHitlNodeData = () => ({
  input: [],
  user_message: {
    type: 'fixed',
    value: '',
  },
  routes: {
    approve: '',
    edit: '',
    reject: PipelineNodeTypes.End,
  },
  edit_state_key: '',
});

export const InitialNodeData = {
  [PipelineNodeTypes.Tool]: createToolNodeData(),
  [PipelineNodeTypes.Agent]: createTransitionNodeData(),
  [PipelineNodeTypes.Pipeline]: createTransitionNodeData(),
  [PipelineNodeTypes.LLM]: createStructuredOutputNodeData(),
  [PipelineNodeTypes.Toolkit]: createFunctionNodeData(),
  [PipelineNodeTypes.Mcp]: createFunctionNodeData(),
  [PipelineNodeTypes.Function]: createFunctionNodeData(),
  [PipelineNodeTypes.Condition]: createConditionNodeData(),
  [PipelineNodeTypes.Decision]: createDecisionNodeData(),
  [PipelineNodeTypes.Loop]: createLoopNodeData(),
  [PipelineNodeTypes.LoopFromTool]: createLoopFromToolNodeData(),
  [PipelineNodeTypes.Router]: createRouterNodeData(),
  [PipelineNodeTypes.StateModifier]: createStateModifierNodeData(),
  [PipelineNodeTypes.Code]: createCodeNodeData(),
  [PipelineNodeTypes.Printer]: createPrinterNodeData(),
  [PipelineNodeTypes.Hitl]: createHitlNodeData(),
};
