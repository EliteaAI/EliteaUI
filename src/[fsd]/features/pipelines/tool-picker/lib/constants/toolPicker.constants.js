import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

const { PipelineNodeTypes } = FlowEditorConstants;

export const APPLICATION_TOOL_TYPE = 'application';

export const TOOL_REF_KINDS = {
  toolkit: 'toolkit',
  application: 'application',
};

// Nodes whose `tool` (without `toolkit_name`) names an attached agent or pipeline
export const APPLICATION_REF_NODE_TYPES = [
  PipelineNodeTypes.Agent,
  PipelineNodeTypes.Pipeline,
  PipelineNodeTypes.Tool,
  PipelineNodeTypes.Loop,
  PipelineNodeTypes.LoopFromTool,
];

export const PICKER_KINDS = {
  toolkit: 'toolkit',
  mcp: 'mcp',
  agent: 'agent',
  pipeline: 'pipeline',
};

export const PICKER_PAGE_SIZE = 20;

export const PICKER_SEARCH_DEBOUNCE = 300;

// Backend answers for a relation that is already in the requested state
export const IDEMPOTENT_RELATION_ERRORS = ['Already exists relation', 'Already removed relation'];

export const PIPELINE_TOOL_GROUPS = [
  { kind: PICKER_KINDS.toolkit, title: 'Toolkits' },
  { kind: PICKER_KINDS.mcp, title: 'MCPs' },
  { kind: PICKER_KINDS.agent, title: 'Agents' },
  { kind: PICKER_KINDS.pipeline, title: 'Pipelines' },
];

// Card actions shown on card hover, as on the agent tool card
export const PIPELINE_TOOL_CARD_ACTION_CLASS = 'pipeline-tool-card-action';
