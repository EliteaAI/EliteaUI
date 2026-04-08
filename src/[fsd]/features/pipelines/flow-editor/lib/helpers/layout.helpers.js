import dagre from '@dagrejs/dagre';

import { FlowEditorConstants } from '../constants';

export const doLayout = ({
  nodes,
  edges,
  flowNodes,
  orientation = FlowEditorConstants.ORIENTATION.vertical,
  expanded = true,
}) => {
  // Create a new directed graph
  const g = new dagre.graphlib.Graph();

  // Set an object for the graph label with increased spacing for edge labels
  g.setGraph({
    rankdir: orientation === FlowEditorConstants.ORIENTATION.horizontal ? 'LR' : 'TB',
    align: orientation === FlowEditorConstants.ORIENTATION.horizontal ? 'DL' : 'UL',
    nodesep: orientation === FlowEditorConstants.ORIENTATION.horizontal ? 400 : 700, // Increased node separation
    ranksep: 250, // Increased rank separation from 200px to 250px for edge labels
    marginx: 60, // Increased horizontal margin
    marginy: 60, // Increased vertical margin
  });

  // Default to assigning a new object as a label for each new edge.
  g.setDefaultEdgeLabel(() => {
    return {};
  });

  // Add nodes to the graph with dynamic sizing
  nodes.forEach(node => {
    const foundFlowNode = flowNodes?.find(flowNode => flowNode.id === node.id);

    // Use measured height if available, fallback to type-based height
    const nodeHeight = expanded
      ? foundFlowNode?.measured?.height ||
        node.measured?.height ||
        node.height ||
        FlowEditorConstants.NodeHeightMap[node.type] ||
        500
      : 44;
    g.setNode(node.id, {
      label: node.data.label,
      width: 460,
      height: nodeHeight,
    });
  });

  // Add edges to the graph
  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  // Run the Dagre layout algorithm
  dagre.layout(g);

  // Create the React Flow elements array with proper position calculation
  const arrangedNode = g
    .nodes()
    .map(nodeId => {
      const node = g.node(nodeId);
      if (nodeId && node) {
        const { x, y, width, height } = node;
        const nodeData = nodes.find(flowNode => flowNode.id === nodeId);

        return {
          id: nodeId,
          type: nodeData?.type, // Include the type from your nodes data
          position: {
            // Convert from Dagre's center coordinates to React Flow's top-left coordinates
            // This ensures nodes don't overlap and have proper spacing
            x: x - width / 2,
            y: y - height / 2,
          },
          data: nodeData?.data,
          selected: nodeData?.selected,
          measured: {
            width,
            height,
          },
        };
      } else {
        return undefined;
      }
    })
    .filter(node => !!node && !!node.type);
  const arrangedEdges = [];
  g.edges().forEach(item => {
    // If there are multiple edges between two nodes, then they will be reduced to only by layout
    // We should restore them
    const edgeData = edges.filter(edge => edge.source === item.v && edge.target === item.w);
    edgeData.forEach(edge => {
      arrangedEdges.push({
        ...edge,
      });
    });
  });
  return {
    nodes: arrangedNode,
    edges: arrangedEdges,
  };
};
