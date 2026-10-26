import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

import { isEmptyMappingValue } from './nodeConfig.helpers';

const { PipelineNodeTypes, PipelineNodeDisplayNames } = FlowEditorConstants;

const pluralize = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

export const toPreviewText = value => {
  if (value === undefined || value === null) return '';
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.replace(/\s+/g, ' ').trim();
};

const getFirstLine = value => {
  if (typeof value !== 'string') return toPreviewText(value);
  return (
    value
      .split('\n')
      .find(line => line.trim())
      ?.trim() || ''
  );
};

const joinList = list => (Array.isArray(list) ? list.filter(Boolean).join(', ') : '');

const getHitlRoutesSummary = (routes = {}) =>
  [
    ['Approve', routes.approve],
    ['Edit', routes.edit],
    ['Reject', routes.reject],
  ]
    .filter(([, target]) => target)
    .map(([label, target]) => `${label} → ${target}`)
    .join(' · ');

const getToolNamesSummary = (toolNames = {}) => {
  const toolkits = Object.keys(toolNames);
  if (!toolkits.length) return '';
  const toolsCount = toolkits.reduce(
    (count, toolkit) => count + (Array.isArray(toolNames[toolkit]) ? toolNames[toolkit].length : 0),
    0,
  );
  return `${pluralize(toolkits.length, 'toolkit')} · ${pluralize(toolsCount, 'tool')}`;
};

const getParamsSummary = (yamlNode, requiredInputs = []) => {
  if (!requiredInputs.length) return '';
  const setCount = requiredInputs.filter(key => !isEmptyMappingValue(yamlNode?.input_mapping?.[key])).length;
  return `Params ${setCount}/${requiredInputs.length} set`;
};

/**
 * Two read-only lines shown on a view-only node card: `primary` and a muted `secondary`.
 * `type` is the flow node type, so deprecated and legacy nodes resolve even without a YAML node.
 */
export const getNodeSummary = (yamlNode, { type, isDeprecated = false, requiredInputs = [] } = {}) => {
  if (isDeprecated) {
    return { primary: PipelineNodeDisplayNames[type] || type, secondary: '⚠ Deprecated' };
  }
  if (!yamlNode) return { primary: '', secondary: '' };

  switch (yamlNode.type) {
    case PipelineNodeTypes.Agent:
      return { primary: yamlNode.tool || '', secondary: toPreviewText(yamlNode.input_mapping?.task?.value) };
    case PipelineNodeTypes.Code:
      return { primary: getFirstLine(yamlNode.code?.value), secondary: joinList(yamlNode.output) };
    case PipelineNodeTypes.Decision:
      return {
        primary: toPreviewText(yamlNode.description),
        secondary: yamlNode.nodes?.length ? pluralize(yamlNode.nodes.length, 'output') : '',
      };
    case PipelineNodeTypes.Hitl:
      return {
        primary: toPreviewText(yamlNode.user_message?.value),
        secondary: getHitlRoutesSummary(yamlNode.routes),
      };
    case PipelineNodeTypes.LLM:
      return {
        primary: toPreviewText(yamlNode.input_mapping?.task?.value),
        secondary: getToolNamesSummary(yamlNode.tool_names),
      };
    case PipelineNodeTypes.Mcp:
    case PipelineNodeTypes.Toolkit: {
      const toolkit = yamlNode.toolkit_name || '';
      const tool = yamlNode.tool || '';
      return {
        primary: toolkit && tool ? `${toolkit} › ${tool}` : toolkit || tool,
        secondary: getParamsSummary(yamlNode, requiredInputs),
      };
    }
    case PipelineNodeTypes.Printer:
      return { primary: toPreviewText(yamlNode.final_message), secondary: '' };
    case PipelineNodeTypes.Router:
      return {
        primary: toPreviewText(yamlNode.condition),
        secondary: yamlNode.routes?.length ? pluralize(yamlNode.routes.length, 'route') : '',
      };
    case PipelineNodeTypes.StateModifier:
      return { primary: toPreviewText(yamlNode.template), secondary: joinList(yamlNode.output) };
    default:
      return { primary: '', secondary: '' };
  }
};
