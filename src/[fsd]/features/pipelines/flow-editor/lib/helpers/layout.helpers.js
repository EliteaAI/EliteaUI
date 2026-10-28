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

const getRect = node => ({ ...node.position, ...getNodeSize(node) });

const isOverlapping = (a, b, gap) =>
  a.x < b.x + b.width + gap &&
  b.x < a.x + a.width + gap &&
  a.y < b.y + b.height + gap &&
  b.y < a.y + a.height + gap;

/**
 * Keeps the canvas positions and sizes of the parsed nodes. A node the canvas doesn't know keeps its
 * arranged offset from a placed neighbour, then moves along the flow until it overlaps no card; with no
 * canvas positions at all the whole pipeline is arranged.
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

  const positionedById = new Map(
    nodes.filter(isPlaced).map(node => {
      const flowNode = flowNodeById.get(node.id);
      return [
        node.id,
        {
          ...node,
          position: { ...flowNode.position },
          ...(flowNode.measured && { measured: { ...flowNode.measured } }),
        },
      ];
    }),
  );

  if (positionedById.size < nodes.length) {
    const isHorizontal = orientation === ORIENTATION.horizontal;
    const { nodesep } =
      FlowEditorConstants.LAYOUT_SPACING[isHorizontal ? ORIENTATION.horizontal : ORIENTATION.vertical];
    const arrangedById = new Map(
      doLayout({ nodes, edges, flowNodes, orientation }).nodes.map(node => [node.id, node]),
    );
    const getOffset = anchorId => {
      const anchor = positionedById.get(anchorId);
      const arrangedAnchor = arrangedById.get(anchorId);
      if (!anchor || !arrangedAnchor) return null;
      return {
        x: anchor.position.x - arrangedAnchor.position.x,
        y: anchor.position.y - arrangedAnchor.position.y,
      };
    };

    nodes
      .filter(node => !isPlaced(node))
      .forEach(node => {
        const arrangedNode = arrangedById.get(node.id) || node;
        const anchorEdge =
          edges.find(edge => edge.target === node.id && positionedById.has(edge.source)) ||
          edges.find(edge => edge.source === node.id && positionedById.has(edge.target));
        const offset = (anchorEdge &&
          getOffset(anchorEdge.target === node.id ? anchorEdge.source : anchorEdge.target)) || { x: 0, y: 0 };
        const candidate = {
          ...arrangedNode,
          position: { x: arrangedNode.position.x + offset.x, y: arrangedNode.position.y + offset.y },
        };

        let blocker = [...positionedById.values()].find(placed =>
          isOverlapping(getRect(candidate), getRect(placed), nodesep),
        );
        while (blocker) {
          const blockerRect = getRect(blocker);
          candidate.position = isHorizontal
            ? { ...candidate.position, x: blockerRect.x + blockerRect.width + nodesep }
            : { ...candidate.position, y: blockerRect.y + blockerRect.height + nodesep };
          blocker = [...positionedById.values()].find(placed =>
            isOverlapping(getRect(candidate), getRect(placed), nodesep),
          );
        }
        positionedById.set(node.id, candidate);
      });
  }

  return {
    nodes: nodes.map(node => positionedById.get(node.id) || node),
    edges,
  };
};
