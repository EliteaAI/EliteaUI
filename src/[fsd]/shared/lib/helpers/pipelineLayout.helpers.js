const isSamePosition = (a, b) => Math.round(a.x) === Math.round(b.x) && Math.round(a.y) === Math.round(b.y);

/**
 * True when a node the pipeline opened with now sits elsewhere on the canvas. Nodes added or removed
 * since then are YAML changes, so they are not compared here.
 */
export const hasLayoutChanged = (canvasNodes = [], initialNodes = []) => {
  if (!canvasNodes.length || !initialNodes.length) return false;
  const initialById = new Map(initialNodes.map(node => [node.id, node]));
  return canvasNodes.some(node => {
    const initialPosition = initialById.get(node.id)?.position;
    return Boolean(initialPosition && node.position) && !isSamePosition(node.position, initialPosition);
  });
};
