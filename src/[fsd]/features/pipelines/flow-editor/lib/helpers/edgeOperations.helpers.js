export const updateNodeIdInEdge = (edge, shouldChangeNodeIdMap) => {
  const originalNodeId = Object.keys(shouldChangeNodeIdMap)[0];
  if (!originalNodeId) return edge;

  if (edge.source === originalNodeId) {
    return { ...edge, source: shouldChangeNodeIdMap[originalNodeId] };
  }
  if (edge.target === originalNodeId) {
    return { ...edge, target: shouldChangeNodeIdMap[originalNodeId] };
  }
  return edge;
};

export const createNewEdge = (connection, showInterruptLabel) => ({
  ...connection,
  type: 'custom',
  data: showInterruptLabel ? { label: 'Interrupt' } : undefined,
});

export const checkShowInterruptLabel = ({ interrupt_after, interrupt_before, connection }) =>
  interrupt_after?.includes(connection.source) || interrupt_before?.includes(connection.target);
