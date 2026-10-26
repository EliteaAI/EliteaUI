import { deepClone } from '@mui/x-data-grid/internals';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';

const { PipelineNodeTypes } = FlowEditorConstants;

const withoutSpaces = value => value.replace(/\s/g, '');

/**
 * Returns the reason `newName` can't be used for the node `currentName`, or null.
 * Names are compared ignoring spaces, so "llm 1" clashes with "llm1".
 */
export const getNodeNameError = ({ newName, currentName, nodes = [], toolNames = [] }) => {
  if (!newName?.trim()) return 'Name is required';
  if (newName === currentName) return null;

  const foundNodeName = nodes.find(
    node => node.id !== currentName && withoutSpaces(node.id) === withoutSpaces(newName),
  );
  if (foundNodeName) return 'The name has been used by other nodes, please input a new name!';

  const foundToolName = toolNames.find(toolName => withoutSpaces(toolName) === withoutSpaces(newName));
  if (foundToolName) {
    return `The name conflicts with an existing toolkit name "${foundToolName}", please input a new name!`;
  }

  return null;
};

export const renameNodeInYaml = (prev, name, newName) => {
  const newNodes = [...(prev?.nodes || [])].map(node => {
    const newNode = node.id === name ? { ...node, id: newName } : { ...node };
    if (node.condition && node.type !== PipelineNodeTypes.Router) {
      newNode.condition = {
        ...node.condition,
        condition_definition: node.condition.condition_definition?.replaceAll(name, newName),
        conditional_outputs: node.condition.conditional_outputs?.map(item =>
          item === name ? newName : item,
        ),
        default_output: node.condition.default_output === name ? newName : node.condition.default_output,
      };
    } else if (node.decision) {
      newNode.decision = {
        ...node.decision,
        nodes: node.decision.nodes?.map(item => (item === name ? newName : item)),
        default_output: node.decision.default_output === name ? newName : node.decision.default_output,
      };
    } else if (node.type === PipelineNodeTypes.Decision) {
      newNode.nodes = node.nodes?.map(item => (item === name ? newName : item));
      newNode.default_output = node.default_output === name ? newName : node.default_output;
    } else if (node.transition === name) {
      newNode.transition = newName;
    }
    return newNode;
  });
  return {
    ...(prev || {}),
    entry_point: prev.entry_point === name ? newName : prev.entry_point,
    nodes: newNodes,
    interrupt_before: Array.isArray(prev.interrupt_before)
      ? prev.interrupt_before?.map(item => (item === name ? newName : item))
      : prev.interrupt_before,
    interrupt_after: Array.isArray(prev.interrupt_after)
      ? prev.interrupt_after?.map(item => (item === name ? newName : item))
      : prev.interrupt_after,
  };
};

export const renameNodeInFlowNodes = (prevNodes, name, newName) =>
  prevNodes.map(node => {
    const clonedNode = deepClone(node);
    const newNode =
      clonedNode.id === name
        ? { ...clonedNode, id: newName, data: { ...clonedNode.data, label: newName } }
        : { ...clonedNode };
    if (clonedNode.data.condition) {
      newNode.data.condition = {
        ...clonedNode.data.condition,
        condition_definition: clonedNode.data.condition.condition_definition?.replaceAll(name, newName),
        conditional_outputs: clonedNode.data.condition.conditional_outputs?.map(item =>
          item === name ? newName : item,
        ),
        default_output:
          clonedNode.data.condition.default_output === name
            ? newName
            : clonedNode.data.condition.default_output,
      };
    } else if (newNode.data.decision) {
      newNode.data.decision = {
        ...clonedNode.data.decision,
        nodes: clonedNode.data.decision.nodes?.map(item => (item === name ? newName : item)),
        default_output:
          clonedNode.data.decision.default_output === name
            ? newName
            : clonedNode.data.decision.default_output,
      };
    } else if (clonedNode.data.type === PipelineNodeTypes.Decision) {
      newNode.data.nodes = clonedNode.data.nodes?.map(item => (item === name ? newName : item));
      newNode.data.default_output =
        clonedNode.data.default_output === name ? newName : clonedNode.data.default_output;
    }
    return newNode;
  });

export const renameNodeInEdges = (prevEdges, name, newName) =>
  prevEdges.map(edge =>
    edge.source === name
      ? { ...edge, source: newName }
      : edge.target === name
        ? { ...edge, target: newName }
        : edge,
  );
