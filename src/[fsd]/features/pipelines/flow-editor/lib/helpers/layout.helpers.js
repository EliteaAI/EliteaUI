import dagre from '@dagrejs/dagre';

import { FlowEditorConstants } from '../constants';

const { ORIENTATION, PipelineNodeTypes } = FlowEditorConstants;

const getDefaultNodeSize = type => ({
  width:
    type === PipelineNodeTypes.End ? FlowEditorConstants.END_NODE_WIDTH : FlowEditorConstants.NODE_CARD_WIDTH,
  height:
    FlowEditorConstants.NodeHeightMap[type] || FlowEditorConstants.NodeHeightMap[PipelineNodeTypes.Default],
});

const getNodeSize = (node, flowNode) => {
  const defaults = getDefaultNodeSize(node.type);
  return {
    width: flowNode?.measured?.width || node.measured?.width || defaults.width,
    height: flowNode?.measured?.height || node.measured?.height || node.height || defaults.height,
  };
};

export const doLayout = ({ nodes, edges, flowNodes, orientation = ORIENTATION.vertical }) => {
  const isHorizontal = orientation === ORIENTATION.horizontal;
  const spacing =
    FlowEditorConstants.LAYOUT_SPACING[isHorizontal ? ORIENTATION.horizontal : ORIENTATION.vertical];
  const g = new dagre.graphlib.Graph();

  g.setGraph({
    rankdir: isHorizontal ? 'LR' : 'TB',
    nodesep: spacing.nodesep,
    ranksep: spacing.ranksep,
    marginx: FlowEditorConstants.LAYOUT_MARGIN,
    marginy: FlowEditorConstants.LAYOUT_MARGIN,
  });

  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach(node => {
    const foundFlowNode = flowNodes?.find(flowNode => flowNode.id === node.id);
    g.setNode(node.id, {
      label: node.data.label,
      ...getNodeSize(node, foundFlowNode),
    });
  });

  edges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const arrangedNode = g
    .nodes()
    .map(nodeId => {
      const node = g.node(nodeId);
      if (nodeId && node) {
        const { x, y, width, height } = node;
        const nodeData = nodes.find(flowNode => flowNode.id === nodeId);

        return {
          id: nodeId,
          type: nodeData?.type,
          // Dagre returns centres, React Flow expects the top-left corner
          position: {
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
    // Dagre merges parallel edges between two nodes, so restore every original edge
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

/**
 * Keeps the canvas positions and sizes of the parsed nodes. Only nodes the canvas doesn't know get a
 * position from an auto-arrange; with no canvas positions at all the whole pipeline is arranged.
 */
export const mergeCanvasPositions = ({
  nodes,
  edges,
  flowNodes = [],
  orientation = ORIENTATION.vertical,
}) => {
  const flowNodeById = new Map(
    flowNodes.filter(flowNode => flowNode?.position).map(flowNode => [flowNode.id, flowNode]),
  );
  const isPlaced = node => {
    const flowNode = flowNodeById.get(node.id);
    return Boolean(flowNode) && flowNode.type === node.type;
  };

  if (!nodes.some(isPlaced)) {
    return doLayout({ nodes, edges, flowNodes, orientation });
  }

  const arranged = nodes.every(isPlaced) ? null : doLayout({ nodes, edges, flowNodes, orientation });

  return {
    nodes: nodes.map(node => {
      if (!isPlaced(node)) return arranged.nodes.find(arrangedNode => arrangedNode.id === node.id) || node;
      const flowNode = flowNodeById.get(node.id);
      return {
        ...node,
        position: { ...flowNode.position },
        ...(flowNode.measured && { measured: { ...flowNode.measured } }),
      };
    }),
    edges,
  };
};
