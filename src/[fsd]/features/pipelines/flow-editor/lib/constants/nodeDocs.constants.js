import { PipelineNodeTypes } from './flowEditor.constants';

const DOCS_NODES_URL = 'https://docs.elitea.ai/how-tos/pipelines/nodes';

export const NODE_DOCS_URLS = {
  [PipelineNodeTypes.LLM]: `${DOCS_NODES_URL}/interaction-nodes#llm-node`,
  [PipelineNodeTypes.Agent]: `${DOCS_NODES_URL}/interaction-nodes#agent-node`,
  [PipelineNodeTypes.Toolkit]: `${DOCS_NODES_URL}/execution-nodes#toolkit-node`,
  [PipelineNodeTypes.Mcp]: `${DOCS_NODES_URL}/execution-nodes#mcp-node`,
  [PipelineNodeTypes.Code]: `${DOCS_NODES_URL}/execution-nodes#code-node`,
  [PipelineNodeTypes.Router]: `${DOCS_NODES_URL}/control-flow-nodes#router-node`,
  [PipelineNodeTypes.Decision]: `${DOCS_NODES_URL}/control-flow-nodes#decision-node`,
  [PipelineNodeTypes.Hitl]: `${DOCS_NODES_URL}/control-flow-nodes#human-in-the-loop-node`,
  [PipelineNodeTypes.StateModifier]: `${DOCS_NODES_URL}/utility-nodes#state-modifier-node`,
  [PipelineNodeTypes.Printer]: `${DOCS_NODES_URL}/utility-nodes#printer-node`,
  // Custom is deprecated but has no migration guide
  [PipelineNodeTypes.Custom]: `${DOCS_NODES_URL}/execution-nodes#custom-node`,
};

export const MIGRATION_GUIDE_TOOLTIP = 'Open migration guide';
