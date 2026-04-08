import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

export const getOwnerNodeId = (nodeId, suffix) => nodeId.replace(suffix, '');

export const generateNewNodeIdWithSuffix = (nodeId, suffix) => `${nodeId}${suffix}`;

export const generateTimestampedNodeId = (prefix, suffix) => `${prefix}${new Date().getTime()}${suffix}`;

export const generateEndEdgeToRemove = sourceId =>
  `${FlowEditorConstants.EDGE_PREFIX}${sourceId}---EliteAPipelineEnd`;

export const removeNodeIdFromArray = (array, nodeId) => array?.filter(item => item !== nodeId);

export const addTargetToArray = (array, target) =>
  array?.find(item => item === target) ? array : [...(array || []), target];

export const clearFieldIfMatchesNodeId = (field, nodeId) => (field === nodeId ? '' : field);

export const findYamlNodeById = (yamlJsonObject, nodeId) =>
  yamlJsonObject.nodes?.find(node => node.id === nodeId);

export const findYamlNodeByIdWithSuffix = (yamlJsonObject, nodeId, suffix) => {
  const ownerNodeId = nodeId.replace(suffix, '');
  return findYamlNodeById(yamlJsonObject, ownerNodeId);
};
