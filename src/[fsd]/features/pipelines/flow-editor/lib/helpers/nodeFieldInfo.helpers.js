import { PipelineNodeTypes } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import {
  COMMON_NODE_FIELD_INFO,
  NODE_FIELD_INFO,
} from '@/[fsd]/features/pipelines/flow-editor/lib/constants/nodeFieldInfo.constants';

export const getToolParamFallbackInfo = param => `Value passed to the tool's ${param} argument.`;

export const getAgentInputFallbackInfo = variable => `Value passed to the agent's ${variable} input.`;

export const getValueDataTypeInfo = (dataType = 'string') => `Value of ${dataType} type is expected`;

export const getNodeFieldInfo = (nodeType, fieldKey) =>
  NODE_FIELD_INFO[nodeType]?.[fieldKey] || COMMON_NODE_FIELD_INFO[fieldKey] || '';

// Field texts of one node type: `getNodeFieldInfoOf(type)(fieldKey)`
export const getNodeFieldInfoOf = nodeType => fieldKey => getNodeFieldInfo(nodeType, fieldKey);

// Agent Task and Chat history have fixed texts; other agent inputs and tool parameters show their
// own description, or a fallback. Tool parameters never use the fixed texts: a parameter may be named `input`
export const getInputMappingFieldInfo = (nodeType, key, description) => {
  const isAgent = nodeType === PipelineNodeTypes.Agent;
  const fixedInfo = isAgent ? NODE_FIELD_INFO[nodeType][key] : undefined;
  if (fixedInfo) return fixedInfo;
  if (description) return description;
  return isAgent ? getAgentInputFallbackInfo(key) : getToolParamFallbackInfo(key);
};
