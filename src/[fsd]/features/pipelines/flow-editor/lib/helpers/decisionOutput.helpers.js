export const getBorderColorAndTooltip = (edges, nodes, id, target) => {
  // Check if target node exists first, before checking edges
  const targetNodeExists = nodes?.find(node => node.id === target);

  if (!targetNodeExists) {
    return { borderColor: 'rejected', tooltip: "Corresponding node doesn't exist" };
  }

  if (edges?.find(edge => edge.source === id && edge.target === target)) {
    return { borderColor: 'published', tooltip: '' };
  }

  return { borderColor: 'onModeration', tooltip: 'Not connected to the corresponding node' };
};
