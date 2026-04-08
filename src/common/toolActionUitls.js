import { INTERNAL_TOOLS_LIST } from '@/[fsd]/shared/lib/constants/internalTools.constants';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

import { TOOL_ACTION_TYPES } from './constants';

/**
 * Backwards-compatibility fallback for internal tools recorded before display_name
 * was injected by the SDK.  Maps raw code name → human-readable title.
 * e.g. 'pyodide' → 'Python Sandbox', 'data_analysis' → 'Data Analysis'
 */
const resolveInternalToolDisplayName = rawName => {
  const entry = INTERNAL_TOOLS_LIST.find(t => t.name === rawName);
  return entry?.title ?? rawName;
};

const getToolkitTypeByName = (toolkitName, tools) => {
  const tool = tools?.find(item => item.name === toolkitName || item.toolkit_name === toolkitName);
  return tool ? tool.type : '';
};

const createBaseToolInfo = action => ({
  toolName: action?.name,
  toolContent: action?.content || '',
  message: action?.message || '',
  markdown: action?.markdown || false,
});

const handleLlmOrSummaryAction = action => ({
  ...createBaseToolInfo(action),
  toolkitName:
    action?.toolMeta?.ls_model_name ||
    (action?.type === TOOL_ACTION_TYPES.Summary ? action?.name : undefined),
  toolkitType: 'model',
  thinking: action?.thinking || '',
});

const findAgentTool = (action, tools, toolName) => {
  return action?.toolMeta?.langgraph_node === 'agent'
    ? tools?.find(tool => tool.type === ToolTypes.application.value && tool.name === toolName)
    : null;
};

const parseToolName = actionName => {
  const hasOldFormat = actionName.includes('___');

  if (hasOldFormat) {
    // Old format: toolkit___tool
    const splitNames = actionName.split('___');
    return {
      toolkitNameFromFormat: splitNames[0],
      rawToolName: splitNames[1],
    };
  }

  // New format: tool name only, toolkit in metadata
  return {
    toolkitNameFromFormat: '',
    rawToolName: actionName,
  };
};

const resolveToolkitType = (action, tools, toolkitName, foundAgentTool) => {
  // Priority 1: Check toolkit_type first (artifact, mcp, model, etc.)
  // This is flattened from backend's tool_meta.metadata.toolkit_type during message conversion
  if (action?.toolMeta?.toolkit_type && action.toolMeta.toolkit_type !== 'application') {
    return action.toolMeta.toolkit_type;
  }

  // Priority 2: Check agent_type for nested agent/pipeline identification
  // This is flattened from backend's tool_meta.metadata.agent_type during message conversion
  if (action?.toolMeta?.agent_type) {
    return action.toolMeta.agent_type === 'pipeline' ? 'pipeline' : 'application';
  }

  // Priority 3: Check agent_type from response metadata (backwards compatibility)
  if (action?.agent_type) {
    return action.agent_type === 'pipeline' ? 'pipeline' : 'application';
  }

  const toolByName = tools?.find(tool => tool.meta?.name?.replace('/', '') === toolkitName);
  if (toolByName?.entity_settings?.toolkit_type) return toolByName.entity_settings.toolkit_type;

  if (foundAgentTool) {
    return foundAgentTool.agent_type === 'pipeline' ? 'pipeline' : 'application';
  }

  if (action.toolMeta.toolkit_type) return action.toolMeta.toolkit_type;

  if (INTERNAL_TOOLS_LIST.some(tool => tool.toolkitNames.includes(toolkitName))) {
    return 'internal';
  }

  if (action?.toolMeta?.langgraph_node === 'agent') return 'application';

  const toolkitTypeByName = getToolkitTypeByName(toolkitName, tools);
  if (toolkitTypeByName) return toolkitTypeByName;

  if (action?.toolMeta?.mcp_server_url) return 'mcp';

  return '';
};

const handleToolAction = (action, tools) => {
  const { toolkitNameFromFormat, rawToolName } = parseToolName(action?.name);
  // Prefer display_name (user-friendly name injected by SDK) over toolkit_name (sanitised routing key)
  const toolkitName =
    action?.toolMeta?.display_name || action?.toolMeta?.toolkit_name || toolkitNameFromFormat;
  const foundAgentTool = findAgentTool(action, tools, rawToolName);

  const toolkitType = resolveToolkitType(action, tools, toolkitName, foundAgentTool);
  const isAgentOrPipeline = toolkitType === 'application' || toolkitType === 'pipeline';
  // Strip numeric suffixes (_1, _2, _3) added for duplicate tools
  const cleanToolName = isAgentOrPipeline ? rawToolName : rawToolName.replace(/_\d+$/, '');

  const defaultToolkitName =
    foundAgentTool?.name || (action?.toolMeta?.langgraph_node === 'agent' ? 'agent' : 'toolkit');

  // Backwards-compat: old history for internal tools lacks display_name; resolve from FE constants
  const resolvedToolkitName =
    !action?.toolMeta?.display_name && toolkitType === 'internal'
      ? resolveInternalToolDisplayName(action?.toolMeta?.toolkit_name || toolkitNameFromFormat)
      : toolkitName || defaultToolkitName;

  return {
    ...createBaseToolInfo(action),
    toolkitName: resolvedToolkitName,
    toolkitType,
    toolName: cleanToolName,
    iconMeta: action?.toolMeta?.icon_meta || foundAgentTool?.icon_meta,
    originalToolName: action?.original_name,
  };
};

const handleDefaultAction = action => ({
  ...createBaseToolInfo(action),
  toolkitName: action?.responseMetadata?.tool_name || 'Toolkit',
  toolkitType: action?.toolMeta?.toolkit_type || (action?.toolMeta?.mcp_server_url ? 'mcp' : ''),
});

const handleSwarmChildAction = action => ({
  toolName: null, // No sub-tool name
  toolkitName: action?.toolMeta?.agent_name || action?.name || 'Sub-agent',
  toolkitType: 'swarm_child',
  toolContent: action?.content || action?.toolOutputs || '',
  message: '',
  markdown: true, // Render content as markdown
});

export const getToolInfoFromAction = (action, tools) => {
  const actionType = action?.type;

  if (actionType === TOOL_ACTION_TYPES.Llm || actionType === TOOL_ACTION_TYPES.Summary) {
    return handleLlmOrSummaryAction(action);
  }

  if (actionType === TOOL_ACTION_TYPES.Tool) {
    return handleToolAction(action, tools);
  }

  if (actionType === TOOL_ACTION_TYPES.SwarmChild) {
    return handleSwarmChildAction(action);
  }

  return handleDefaultAction(action);
};
