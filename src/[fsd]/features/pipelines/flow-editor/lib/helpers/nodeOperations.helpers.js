import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

import { getNodeNameError } from './nodeRename.helpers';

const { PipelineNodeTypes } = FlowEditorConstants;

const NON_DUPLICABLE_NODE_TYPES = [PipelineNodeTypes.End, PipelineNodeTypes.Ghost];

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

export const canDuplicateNodeType = type => Boolean(type) && !NON_DUPLICABLE_NODE_TYPES.includes(type);

// <name>_copy, then <name>_copy_2, <name>_copy_3, … : the first name a manual rename would accept
export const getDuplicateNodeId = ({ name, nodes = [], toolNames = [] }) => {
  const isFree = newName => !getNodeNameError({ newName, currentName: null, nodes, toolNames });
  const baseName = `${name}_copy`;
  if (isFree(baseName)) return baseName;
  for (let index = 2; ; index++) {
    const newName = `${baseName}_${index}`;
    if (isFree(newName)) return newName;
  }
};

// The copy starts disconnected: every outgoing connection field is cleared
export const clearNodeConnections = yamlNode => {
  const node = { ...yamlNode };
  delete node.transition;
  switch (node.type) {
    case PipelineNodeTypes.Router:
    case PipelineNodeTypes.Decision:
      return {
        ...node,
        [node.type === PipelineNodeTypes.Router ? 'routes' : 'nodes']: [],
        default_output: '',
      };
    case PipelineNodeTypes.Hitl:
      return { ...node, routes: { approve: '', edit: '', reject: '' } };
    default:
      return node;
  }
};

export const duplicateYamlNode = (yamlNode, newId) =>
  clearNodeConnections({ ...structuredClone(yamlNode), id: newId });
