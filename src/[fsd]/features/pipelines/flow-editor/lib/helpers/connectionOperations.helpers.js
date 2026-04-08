import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import {
  ConditionDecisionBuildersHelpers,
  EdgeOperationsHelpers,
  FlowEditorHelpers,
  FlowNodeUpdateHelpers,
  NodeOperationsHelpers,
  NodeTypeHelpers,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { addEdge } from '@xyflow/react';

export const updateYamlAndFlowNode = ({
  yamlNode,
  nodeId,
  updateData,
  yamlJsonObjectRef,
  setYamlJsonObject,
  setFlowNodes,
  dataKey,
  dataValue,
}) => {
  if (yamlNode) {
    FlowEditorHelpers.batchUpdateYamlNode(
      yamlNode.id,
      updateData,
      yamlJsonObjectRef.current,
      setYamlJsonObject,
    );
  }
  FlowNodeUpdateHelpers.updateFlowNodeDataByKey(setFlowNodes, nodeId, dataKey, dataValue);
};

export const updateConditionNodeData = ({
  nodeId,
  yamlNode,
  connection,
  yamlJsonObjectRef,
  setYamlJsonObject,
  setFlowNodes,
}) => {
  const newCondition = ConditionDecisionBuildersHelpers.buildNewCondition(yamlNode, connection);

  updateYamlAndFlowNode({
    yamlNode,
    nodeId,
    updateData: { condition: { ...newCondition }, transition: undefined },
    yamlJsonObjectRef,
    setYamlJsonObject,
    setFlowNodes,
    dataKey: 'condition',
    dataValue: { ...newCondition },
  });
};

export const updateLegacyDecisionNodeData = ({
  nodeId,
  yamlNode,
  connection,
  yamlJsonObjectRef,
  setYamlJsonObject,
  setFlowNodes,
}) => {
  const newDecision = ConditionDecisionBuildersHelpers.buildNewDecision(yamlNode, connection);

  updateYamlAndFlowNode({
    yamlNode,
    nodeId,
    updateData: { decision: { ...newDecision }, transition: undefined },
    yamlJsonObjectRef,
    setYamlJsonObject,
    setFlowNodes,
    dataKey: 'decision',
    dataValue: { ...newDecision },
  });
};

export const applyEdgeChanges = (
  setFlowEdges,
  newEdge,
  shouldChangeNodeIdMap,
  edgeToRemove,
  removeEdgePredicate,
) => {
  setFlowEdges(eds => {
    const updatedNewEdge = EdgeOperationsHelpers.updateNodeIdInEdge(newEdge, shouldChangeNodeIdMap);
    const newEdges = eds
      .map(edge => EdgeOperationsHelpers.updateNodeIdInEdge(edge, shouldChangeNodeIdMap))
      .filter(edge => edge.id !== edgeToRemove)
      .filter(edge => !removeEdgePredicate?.(edge));
    return addEdge(updatedNewEdge, newEdges);
  });
};

const getHitlRouteAction = sourceHandle => {
  return sourceHandle?.replace(`${FlowEditorConstants.HITL_HANDLE_ID_SUFFIX}_`, '');
};

const buildHitlEdgeId = (sourceId, action, targetId) => {
  return `${FlowEditorConstants.EDGE_PREFIX}${sourceId}${action}---${targetId}`;
};

export const handleFromHitlNodeConnection = ({ connection, yamlJsonObjectRef, setYamlJsonObject }) => {
  const action = getHitlRouteAction(connection.sourceHandle);
  const yamlNode = NodeOperationsHelpers.findYamlNodeById(yamlJsonObjectRef.current, connection.source);

  if (!action || !yamlNode || yamlNode.type !== FlowEditorConstants.PipelineNodeTypes.Hitl) {
    return null;
  }

  if (
    connection.target?.endsWith(FlowEditorConstants.CONDITION_NODE_ID_SUFFIX) ||
    connection.target?.endsWith(FlowEditorConstants.DECISION_NODE_ID_SUFFIX)
  ) {
    return null;
  }

  if (action === 'edit' && connection.target === FlowEditorConstants.PipelineNodeTypes.End) {
    return null;
  }

  const currentTarget = yamlNode.routes?.[action] || '';

  FlowEditorHelpers.batchUpdateYamlNode(
    yamlNode.id,
    {
      routes: {
        ...(yamlNode.routes || {}),
        [action]: connection.target,
      },
      transition: undefined,
    },
    yamlJsonObjectRef.current,
    setYamlJsonObject,
  );

  connection.id = buildHitlEdgeId(connection.source, action, connection.target);

  const showInterruptLabel =
    connection.target !== FlowEditorConstants.PipelineNodeTypes.End &&
    EdgeOperationsHelpers.checkShowInterruptLabel({
      interrupt_after: yamlJsonObjectRef.current?.interrupt_after,
      interrupt_before: yamlJsonObjectRef.current?.interrupt_before,
      connection,
    });

  return {
    showInterruptLabel,
    edgeToRemove: currentTarget ? buildHitlEdgeId(connection.source, action, currentTarget) : '',
    removeEdgePredicate: edge =>
      edge.source === connection.source && edge.sourceHandle === connection.sourceHandle,
  };
};

export const handleNormalConnection = ({ connection, yamlJsonObjectRef, setYamlJsonObject }) => {
  const showInterruptLabel = EdgeOperationsHelpers.checkShowInterruptLabel({
    interrupt_after: yamlJsonObjectRef.current?.interrupt_after,
    interrupt_before: yamlJsonObjectRef.current?.interrupt_before,
    connection,
  });
  const yamlNode = NodeOperationsHelpers.findYamlNodeById(yamlJsonObjectRef.current, connection.source);
  if (yamlNode) {
    FlowEditorHelpers.updateYamlNode(
      yamlNode.id,
      'transition',
      connection.target,
      yamlJsonObjectRef.current,
      setYamlJsonObject,
    );
  }
  const edgeToRemove = `${FlowEditorConstants.EDGE_PREFIX}${connection.source}---EliteAPipelineEnd`;
  return { showInterruptLabel, edgeToRemove };
};

export const handleConnectionToEndNode = ({ connection, yamlJsonObjectRef, setYamlJsonObject }) => {
  const yamlNode = NodeOperationsHelpers.findYamlNodeById(yamlJsonObjectRef.current, connection.source);
  if (
    !yamlNode ||
    (yamlNode?.transition && yamlNode?.transition !== FlowEditorConstants.PipelineNodeTypes.End) ||
    yamlNode?.condition ||
    yamlNode?.decision
  ) {
    return;
  }
  const showInterruptLabel = EdgeOperationsHelpers.checkShowInterruptLabel({
    interrupt_after: yamlJsonObjectRef.current?.interrupt_after,
    connection,
  });
  if (yamlNode) {
    FlowEditorHelpers.updateYamlNode(
      yamlNode.id,
      'transition',
      connection.target,
      yamlJsonObjectRef.current,
      setYamlJsonObject,
    );
  }
  return { showInterruptLabel };
};

export const handleFromConditionNodeConnection = ({
  connection,
  yamlJsonObjectRef,
  setYamlJsonObject,
  setFlowNodes,
}) => {
  if (NodeTypeHelpers.cannotConnectToConditionOrDecision({ connection, yamlJsonObjectRef })) {
    return null;
  }
  const showInterruptLabel = yamlJsonObjectRef.current?.interrupt_before?.includes(connection.target);
  const yamlNode = NodeOperationsHelpers.findYamlNodeByIdWithSuffix(
    yamlJsonObjectRef.current,
    connection.source,
    FlowEditorConstants.CONDITION_NODE_ID_SUFFIX,
  );
  updateConditionNodeData({
    nodeId: connection.source,
    yamlNode,
    connection,
    yamlJsonObjectRef,
    setYamlJsonObject,
    setFlowNodes,
  });
  return { showInterruptLabel, edgeToRemove: '' };
};

/**
 * Generic handler for connecting to condition or decision nodes
 */
const handleToSpecialNodeConnection = ({
  connection,
  yamlJsonObjectRef,
  setYamlJsonObject,
  setFlowNodes,
  flowNodes,
  propertyName,
  suffix,
}) => {
  if (
    NodeTypeHelpers.isFromConditionNode(connection) ||
    NodeTypeHelpers.isFromDecisionNode({ connection, yamlJsonObjectRef }) ||
    NodeTypeHelpers.isFromRouterNode(connection)
  ) {
    return null;
  }
  const showInterruptLabel = EdgeOperationsHelpers.checkShowInterruptLabel({
    interrupt_after: yamlJsonObjectRef.current?.interrupt_after,
    connection,
  });
  const foundFlowNode = flowNodes.find(node => node.id === connection.target);
  const yamlNode = NodeOperationsHelpers.findYamlNodeById(yamlJsonObjectRef.current, connection.source);
  const newNodeId = NodeOperationsHelpers.generateNewNodeIdWithSuffix(connection.source, suffix);
  const shouldChangeNodeIdMap = { [connection.target]: newNodeId };

  if (yamlNode) {
    FlowEditorHelpers.updateYamlNode(
      yamlNode.id,
      propertyName,
      { ...(foundFlowNode?.data?.[propertyName] || {}) },
      yamlJsonObjectRef.current,
      setYamlJsonObject,
    );
    FlowNodeUpdateHelpers.renameFlowNodeId(setFlowNodes, connection.target, newNodeId);
  }

  return {
    showInterruptLabel,
    edgeToRemove: NodeOperationsHelpers.generateEndEdgeToRemove(connection.source),
    shouldChangeNodeIdMap,
  };
};

export const handleToConditionNodeConnection = ({
  connection,
  yamlJsonObjectRef,
  setYamlJsonObject,
  setFlowNodes,
  flowNodes,
}) => {
  return handleToSpecialNodeConnection({
    connection,
    yamlJsonObjectRef,
    setYamlJsonObject,
    setFlowNodes,
    flowNodes,
    propertyName: 'condition',
    suffix: FlowEditorConstants.CONDITION_NODE_ID_SUFFIX,
  });
};

export const handleFromRouterNodeConnection = ({ connection, yamlJsonObjectRef, setYamlJsonObject }) => {
  if (NodeTypeHelpers.cannotConnectToConditionOrDecision({ connection, yamlJsonObjectRef })) {
    return null;
  }

  const showInterruptLabel = EdgeOperationsHelpers.checkShowInterruptLabel({
    interrupt_after: yamlJsonObjectRef.current?.interrupt_after,
    interrupt_before: yamlJsonObjectRef.current?.interrupt_before,
    connection,
  });

  const yamlNode = NodeOperationsHelpers.findYamlNodeById(yamlJsonObjectRef.current, connection.source);
  if (yamlNode) {
    if (connection.sourceHandle?.endsWith(FlowEditorConstants.DEFAULT_OUTPUT)) {
      FlowEditorHelpers.updateYamlNode(
        yamlNode.id,
        FlowEditorConstants.DEFAULT_OUTPUT,
        connection.target,
        yamlJsonObjectRef.current,
        setYamlJsonObject,
      );
    } else {
      FlowEditorHelpers.updateYamlNode(
        yamlNode.id,
        'routes',
        [...(yamlNode.routes || []), connection.target],
        yamlJsonObjectRef.current,
        setYamlJsonObject,
      );
    }
  }

  return {
    showInterruptLabel,
    edgeToRemove: NodeOperationsHelpers.generateEndEdgeToRemove(connection.source),
  };
};

export const handleFromDecisionNodeConnection = ({
  connection,
  yamlJsonObjectRef,
  setYamlJsonObject,
  setFlowNodes,
}) => {
  if (NodeTypeHelpers.cannotConnectToConditionOrDecision({ connection, yamlJsonObjectRef })) {
    return null;
  }

  const showInterruptLabel = EdgeOperationsHelpers.checkShowInterruptLabel({
    interrupt_after: yamlJsonObjectRef.current?.interrupt_after,
    connection,
  });

  const yamlNode = NodeOperationsHelpers.findYamlNodeByIdWithSuffix(
    yamlJsonObjectRef.current,
    connection.source,
    FlowEditorConstants.DECISION_NODE_ID_SUFFIX,
  );

  const isLegacyDecisionNode = connection.source.endsWith(FlowEditorConstants.DECISION_NODE_ID_SUFFIX);
  if (isLegacyDecisionNode) {
    updateLegacyDecisionNodeData({
      nodeId: connection.source,
      yamlNode,
      connection,
      yamlJsonObjectRef,
      setYamlJsonObject,
      setFlowNodes,
    });
  } else {
    if (!connection.sourceHandle?.endsWith(FlowEditorConstants.DEFAULT_OUTPUT)) {
      if (!yamlNode.nodes?.find(item => item === connection.target)) {
        FlowEditorHelpers.batchUpdateYamlNode(
          yamlNode.id,
          { nodes: [...(yamlNode.nodes || []), connection.target] },
          yamlJsonObjectRef.current,
          setYamlJsonObject,
        );
      }
    } else {
      FlowEditorHelpers.updateYamlNode(
        yamlNode.id,
        FlowEditorConstants.DEFAULT_OUTPUT,
        connection.target,
        yamlJsonObjectRef.current,
        setYamlJsonObject,
      );
    }
  }

  return { showInterruptLabel, edgeToRemove: '' };
};

export const handleToDecisionNodeConnection = ({
  connection,
  yamlJsonObjectRef,
  setYamlJsonObject,
  setFlowNodes,
  flowNodes,
}) => {
  if (
    NodeTypeHelpers.isFromConditionNode(connection) ||
    NodeTypeHelpers.isFromDecisionNode({ connection, yamlJsonObjectRef }) ||
    NodeTypeHelpers.isFromRouterNode(connection)
  ) {
    return null;
  }

  const isLegacyDecisionNode = connection.target.endsWith(FlowEditorConstants.DECISION_NODE_ID_SUFFIX);

  if (isLegacyDecisionNode) {
    return handleToSpecialNodeConnection({
      connection,
      yamlJsonObjectRef,
      setYamlJsonObject,
      setFlowNodes,
      flowNodes,
      propertyName: 'decision',
      suffix: FlowEditorConstants.DECISION_NODE_ID_SUFFIX,
    });
  } else {
    return handleNormalConnection({ connection, yamlJsonObjectRef, setYamlJsonObject });
  }
};
