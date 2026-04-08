import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import {
  FlowNodeUpdateHelpers,
  NodeOperationsHelpers,
  NodeTypeHelpers,
  YamlUpdateHelpers,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';

export const getConfirmContent = (nodes, edges) => {
  if (nodes.length && edges.length) return 'Are you sure to delete the selected nodes and edges?';

  if (nodes.length) {
    if (nodes.length < 2) return 'Are you sure to delete the selected node?';
    return 'Are you sure to delete the selected nodes?';
  }

  if (edges.length) {
    if (edges.length < 2) return 'Are you sure to delete the selected edge?';
    return 'Are you sure to delete the selected edges?';
  }

  return '';
};

/**
 * Updates a single YAML node by ID with a transformation function
 */
const updateYamlNodeById = (yamlJsonObject, nodeId, updateFn) => ({
  ...yamlJsonObject,
  nodes: yamlJsonObject.nodes?.map(yamlNode => (yamlNode.id === nodeId ? updateFn(yamlNode) : yamlNode)),
});

/**
 * Updates a single flow node by ID with a transformation function
 */
const updateFlowNodeById = (flowNodes, nodeId, updateFn) =>
  flowNodes.map(node => (node.id === nodeId ? updateFn(node) : node));

/**
 * Updates both YAML and flow nodes with paired transformations
 */
const updateYamlAndFlowNodes = (
  yamlJsonObject,
  flowNodes,
  yamlNodeId,
  flowNodeId,
  yamlUpdateFn,
  flowUpdateFn,
) => ({
  yamlJsonObject: updateYamlNodeById(yamlJsonObject, yamlNodeId, yamlUpdateFn),
  flowNodes: updateFlowNodeById(flowNodes, flowNodeId, flowUpdateFn),
});

/**
 * Clears a node property and sets transition to End
 */
const clearNodePropertyAndSetEnd = (yamlNode, propertyName) => ({
  ...yamlNode,
  [propertyName]: undefined,
  transition: FlowEditorConstants.PipelineNodeTypes.End,
});

/**
 * Generates a new timestamped node for renaming
 */
const generateRenamedNode = (node, nodeType, suffix) =>
  FlowNodeUpdateHelpers.renameFlowNode(
    node,
    NodeOperationsHelpers.generateTimestampedNodeId(nodeType, suffix),
  );

/**
 * Generic handler for clearing a node property (condition or decision)
 */
const handleSpecialNodeDeletion = (node, yamlJsonObject, suffix, clearFn) => {
  const ownerNodeId = NodeOperationsHelpers.getOwnerNodeId(node.id, suffix);
  return updateYamlNodeById(yamlJsonObject, ownerNodeId, clearFn);
};

export const handleConditionNodeDeletion = (node, yamlJsonObject) => {
  return handleSpecialNodeDeletion(
    node,
    yamlJsonObject,
    FlowEditorConstants.CONDITION_NODE_ID_SUFFIX,
    YamlUpdateHelpers.clearYamlNodeCondition,
  );
};

export const handleLegacyDecisionNodeDeletion = (node, yamlJsonObject) => {
  return handleSpecialNodeDeletion(
    node,
    yamlJsonObject,
    FlowEditorConstants.DECISION_NODE_ID_SUFFIX,
    YamlUpdateHelpers.clearYamlNodeDecision,
  );
};

export const cleanupNodeReferences = (yamlNode, nodeId) => {
  if (yamlNode.condition && yamlNode.type !== FlowEditorConstants.PipelineNodeTypes.Router) {
    return YamlUpdateHelpers.updateYamlNodeCondition(yamlNode, {
      [FlowEditorConstants.DEFAULT_OUTPUT]: NodeOperationsHelpers.clearFieldIfMatchesNodeId(
        yamlNode.condition[FlowEditorConstants.DEFAULT_OUTPUT],
        nodeId,
      ),
    });
  }

  if (yamlNode.decision) {
    return YamlUpdateHelpers.updateYamlNodeDecision(yamlNode, {
      [FlowEditorConstants.DEFAULT_OUTPUT]: NodeOperationsHelpers.clearFieldIfMatchesNodeId(
        yamlNode.decision[FlowEditorConstants.DEFAULT_OUTPUT],
        nodeId,
      ),
    });
  }

  if (yamlNode.type === FlowEditorConstants.PipelineNodeTypes.Decision) {
    return {
      ...yamlNode,
      [FlowEditorConstants.DEFAULT_OUTPUT]: NodeOperationsHelpers.clearFieldIfMatchesNodeId(
        yamlNode[FlowEditorConstants.DEFAULT_OUTPUT],
        nodeId,
      ),
    };
  }

  if (yamlNode.type === FlowEditorConstants.PipelineNodeTypes.Hitl) {
    return {
      ...yamlNode,
      transition: undefined,
      routes: Object.entries(yamlNode.routes || {}).reduce((result, [action, target]) => {
        return {
          ...result,
          [action]: target === nodeId ? '' : target,
        };
      }, {}),
    };
  }

  return YamlUpdateHelpers.updateYamlNodeTransition(
    yamlNode,
    NodeOperationsHelpers.clearFieldIfMatchesNodeId(yamlNode.transition, nodeId),
  );
};

export const handleNormalNodeDeletion = (node, yamlJsonObject) => {
  const result = {
    ...yamlJsonObject,
    nodes: yamlJsonObject.nodes
      ?.filter(yamlNode => yamlNode.id !== node.id)
      .map(yamlNode => cleanupNodeReferences(yamlNode, node.id)),
    // Clear entry_point if the deleted node was the entry point
    ...(yamlJsonObject.entry_point === node.id ? { entry_point: undefined } : {}),
  };
  return YamlUpdateHelpers.removeInterruptReferences(result, node.id);
};

export const handleEdgeToGhostNode = (edge, newFlowNodes) => {
  return newFlowNodes.filter(node => node.id !== edge.target);
};

export const handleEdgeToConditionNode = (edge, yamlJsonObject, newFlowNodes) => {
  return updateYamlAndFlowNodes(
    yamlJsonObject,
    newFlowNodes,
    edge.source,
    edge.target,
    yamlNode => clearNodePropertyAndSetEnd(yamlNode, 'condition'),
    node => generateRenamedNode(node, 'Condition', FlowEditorConstants.CONDITION_NODE_ID_SUFFIX),
  );
};

export const handleEdgeToLegacyDecisionNode = (edge, yamlJsonObject, newFlowNodes) => {
  return updateYamlAndFlowNodes(
    yamlJsonObject,
    newFlowNodes,
    edge.source,
    edge.target,
    yamlNode => clearNodePropertyAndSetEnd(yamlNode, 'decision'),
    node => generateRenamedNode(node, 'Decision', FlowEditorConstants.DECISION_NODE_ID_SUFFIX),
  );
};

export const handleEdgeFromConditionNode = (edge, yamlJsonObject, newFlowNodes) => {
  const ownerId = NodeOperationsHelpers.getOwnerNodeId(
    edge.source,
    FlowEditorConstants.CONDITION_NODE_ID_SUFFIX,
  );
  const isDefault = NodeTypeHelpers.isDefaultOutputHandle(edge.sourceHandle);

  return updateYamlAndFlowNodes(
    yamlJsonObject,
    newFlowNodes,
    ownerId,
    edge.source,
    yamlNode =>
      YamlUpdateHelpers.updateYamlNodeCondition(yamlNode, {
        ...(isDefault
          ? { [FlowEditorConstants.DEFAULT_OUTPUT]: '' }
          : {
              conditional_outputs: NodeOperationsHelpers.removeNodeIdFromArray(
                yamlNode.condition?.conditional_outputs,
                edge.target,
              ),
            }),
      }),
    node => FlowNodeUpdateHelpers.updateFlowNodeConditionOutput(node, isDefault, edge.target),
  );
};

export const handleEdgeFromLegacyDecisionNode = (edge, yamlJsonObject, newFlowNodes) => {
  const ownerId = NodeOperationsHelpers.getOwnerNodeId(
    edge.source,
    FlowEditorConstants.DECISION_NODE_ID_SUFFIX,
  );
  const isDefault = NodeTypeHelpers.isDefaultOutputHandle(edge.sourceHandle);

  if (!isDefault) {
    return { yamlJsonObject, flowNodes: newFlowNodes };
  }

  return updateYamlAndFlowNodes(
    yamlJsonObject,
    newFlowNodes,
    ownerId,
    edge.source,
    yamlNode =>
      YamlUpdateHelpers.updateYamlNodeDecision(yamlNode, { [FlowEditorConstants.DEFAULT_OUTPUT]: '' }),
    node => FlowNodeUpdateHelpers.updateFlowNodeDecisionOutput(node, isDefault),
  );
};

export const handleEdgeFromNewDecisionNode = (edge, yamlJsonObject, newFlowNodes) => {
  const isDefault = NodeTypeHelpers.isDefaultOutputHandle(edge.sourceHandle);

  return updateYamlAndFlowNodes(
    yamlJsonObject,
    newFlowNodes,
    edge.source,
    edge.source,
    yamlNode =>
      isDefault
        ? { ...yamlNode, [FlowEditorConstants.DEFAULT_OUTPUT]: '' }
        : {
            ...yamlNode,
            nodes: NodeOperationsHelpers.removeNodeIdFromArray(yamlNode.nodes, edge.target),
          },
    node => node, // Flow node doesn't need update - nodes array is only in YAML
  );
};

export const handleEdgeFromRouterNode = (edge, yamlJsonObject) => {
  const isDefault = NodeTypeHelpers.isDefaultOutputHandle(edge.sourceHandle);

  return updateYamlNodeById(yamlJsonObject, edge.source, yamlNode => ({
    ...yamlNode,
    ...(isDefault
      ? { [FlowEditorConstants.DEFAULT_OUTPUT]: '' }
      : { routes: NodeOperationsHelpers.removeNodeIdFromArray(yamlNode.routes, edge.target) }),
  }));
};

export const handleEdgeFromHitlNode = (edge, yamlJsonObject) => {
  const action = edge.sourceHandle?.replace(`${FlowEditorConstants.HITL_HANDLE_ID_SUFFIX}_`, '');

  if (!action) {
    return yamlJsonObject;
  }

  return updateYamlNodeById(yamlJsonObject, edge.source, yamlNode => ({
    ...yamlNode,
    transition: undefined,
    routes: {
      ...(yamlNode.routes || {}),
      [action]: '',
    },
  }));
};

export const handleEdgeFromNormalNode = (edge, yamlJsonObject) => {
  return updateYamlNodeById(yamlJsonObject, edge.source, yamlNode =>
    YamlUpdateHelpers.updateYamlNodeTransition(yamlNode, FlowEditorConstants.PipelineNodeTypes.End),
  );
};

export const processEdgeDeletion = (edge, flowNodes, yamlJsonObject, newFlowNodes) => {
  const targetNode = flowNodes.find(node => node.id === edge.target);
  if (!targetNode) {
    return { yamlJsonObject, flowNodes: newFlowNodes };
  }

  // Handle edge to special node types
  if (NodeTypeHelpers.isGhostNode(targetNode)) {
    return { yamlJsonObject, flowNodes: handleEdgeToGhostNode(edge, newFlowNodes) };
  }

  if (NodeTypeHelpers.isConditionNode(targetNode)) {
    return handleEdgeToConditionNode(edge, yamlJsonObject, newFlowNodes);
  }

  if (NodeTypeHelpers.isLegacyDecisionNode(targetNode)) {
    return handleEdgeToLegacyDecisionNode(edge, yamlJsonObject, newFlowNodes);
  }

  // Handle edge from special node types
  const sourceNode = flowNodes.find(node => node.id === edge.source);
  if (!sourceNode) {
    return { yamlJsonObject, flowNodes: newFlowNodes };
  }

  if (NodeTypeHelpers.isConditionNode(sourceNode)) {
    return handleEdgeFromConditionNode(edge, yamlJsonObject, newFlowNodes);
  }

  if (NodeTypeHelpers.isDecisionNode(sourceNode)) {
    if (NodeTypeHelpers.isLegacyDecisionNode(sourceNode)) {
      return handleEdgeFromLegacyDecisionNode(edge, yamlJsonObject, newFlowNodes);
    }
    return handleEdgeFromNewDecisionNode(edge, yamlJsonObject, newFlowNodes);
  }

  if (NodeTypeHelpers.isHitlHandle(edge.sourceHandle)) {
    return { yamlJsonObject: handleEdgeFromHitlNode(edge, yamlJsonObject), flowNodes: newFlowNodes };
  }

  if (NodeTypeHelpers.isRouterHandle(edge.sourceHandle)) {
    return { yamlJsonObject: handleEdgeFromRouterNode(edge, yamlJsonObject), flowNodes: newFlowNodes };
  }

  return { yamlJsonObject: handleEdgeFromNormalNode(edge, yamlJsonObject), flowNodes: newFlowNodes };
};
