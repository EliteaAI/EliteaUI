import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

const { PipelineNodeTypes } = FlowEditorConstants;

export const isEmptyMappingValue = mapping => {
  const value = mapping?.value;
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return !value.trim();
  if (Array.isArray(value)) return !value.length;
  return false;
};

const getMissingRequiredInputs = (yamlNode, requiredInputs = []) =>
  requiredInputs.filter(key => isEmptyMappingValue(yamlNode?.input_mapping?.[key]));

/**
 * Reasons a node still needs configuration, shown as the card's "Needs configuration" state.
 * `requiredInputs` comes from the selected tool's schema, which only the node component resolves.
 */
export const getNodeConfigIssues = (yamlNode, { requiredInputs = [] } = {}) => {
  if (!yamlNode) return [];

  const issues = [];
  const hasToolkit = Boolean(yamlNode.toolkit_name || yamlNode.tool);

  switch (yamlNode.type) {
    case PipelineNodeTypes.Agent:
      if (!yamlNode.tool) issues.push('Select an agent');
      break;
    case PipelineNodeTypes.Toolkit:
      if (!hasToolkit) issues.push('Select a toolkit');
      else if (!yamlNode.tool) issues.push('Select a tool');
      break;
    case PipelineNodeTypes.Mcp:
      if (!hasToolkit) issues.push('Select an MCP');
      else if (!yamlNode.tool) issues.push('Select a tool');
      break;
    case PipelineNodeTypes.Decision:
      if (!yamlNode.nodes?.length && !yamlNode.decision?.nodes?.length) {
        issues.push('Add at least one decision option');
      }
      break;
    case PipelineNodeTypes.Router:
      if (!yamlNode.routes?.length) issues.push('Add at least one route');
      break;
    case PipelineNodeTypes.Hitl:
      if (yamlNode.routes?.edit && !(yamlNode.edit_state_key || '').trim()) {
        issues.push('Provide an edit state key before using the Edit route');
      }
      break;
    default:
      break;
  }

  const missingInputs = getMissingRequiredInputs(yamlNode, requiredInputs);
  if (missingInputs.length) {
    issues.push(
      `Fill in the required input${missingInputs.length > 1 ? 's' : ''}: ${missingInputs.join(', ')}`,
    );
  }

  return issues;
};
