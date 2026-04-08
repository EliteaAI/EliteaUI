export const updateFlowNodeData = (node, dataKey, value) => ({
  ...node,
  data: {
    ...(node.data || {}),
    [dataKey]: value,
  },
});

/**
 * Generic function to update nested data property output
 */
const updateFlowNodeOutput = (node, propertyName, isDefault, targetId = null) => {
  if (!isDefault) {
    if (propertyName === 'condition' && targetId) {
      return updateFlowNodeData(node, propertyName, {
        ...(node.data?.[propertyName] || {}),
        conditional_outputs: node.data?.[propertyName]?.conditional_outputs?.filter(
          output => output !== targetId,
        ),
      });
    }
    return node;
  }

  return updateFlowNodeData(node, propertyName, {
    ...(node.data?.[propertyName] || {}),
    default_output: '',
  });
};

export const updateFlowNodeConditionOutput = (node, isDefault, targetId) => {
  return updateFlowNodeOutput(node, 'condition', isDefault, targetId);
};

export const updateFlowNodeDecisionOutput = (node, isDefault) => {
  return updateFlowNodeOutput(node, 'decision', isDefault);
};

export const renameFlowNode = (node, newId) => ({
  ...node,
  id: newId,
});

/**
 * Generic function to update flow nodes by ID with a transformation function
 */
const updateFlowNodesById = (setFlowNodes, nodeId, updateFn) => {
  setFlowNodes(prevNodes => prevNodes.map(node => (node.id === nodeId ? updateFn(node) : node)));
};

export const renameFlowNodeId = (setFlowNodes, oldNodeId, newNodeId) => {
  updateFlowNodesById(setFlowNodes, oldNodeId, node => ({
    ...node,
    id: newNodeId,
    data: {
      ...node.data,
    },
  }));
};

export const updateFlowNodeDataByKey = (setFlowNodes, nodeId, dataKey, dataValue) => {
  updateFlowNodesById(setFlowNodes, nodeId, node => ({
    ...node,
    data: {
      ...node.data,
      [dataKey]: dataValue,
    },
  }));
};
