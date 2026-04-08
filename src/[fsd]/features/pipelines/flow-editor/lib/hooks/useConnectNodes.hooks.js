import { useCallback } from 'react';

import {
  ConnectionOperationsHelpers,
  EdgeOperationsHelpers,
  NodeTypeHelpers,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';

export const useConnectNodes = ({
  flowNodes,
  yamlJsonObjectRef,
  setFlowNodes,
  setYamlJsonObject,
  setFlowEdges,
  disabled,
}) => {
  const onConnect = useCallback(
    connection => {
      if (disabled) return;

      let result = null;
      let shouldChangeNodeIdMap = {};

      // Determine connection type and handle accordingly
      if (NodeTypeHelpers.isFromHitlNode(connection)) {
        result = ConnectionOperationsHelpers.handleFromHitlNodeConnection({
          connection,
          yamlJsonObjectRef,
          setYamlJsonObject,
        });
      } else if (NodeTypeHelpers.isFromConditionNode(connection)) {
        result = ConnectionOperationsHelpers.handleFromConditionNodeConnection({
          connection,
          yamlJsonObjectRef,
          setYamlJsonObject,
          setFlowNodes,
        });
      } else if (NodeTypeHelpers.isConnectToConditionNode(connection)) {
        result = ConnectionOperationsHelpers.handleToConditionNodeConnection({
          connection,
          yamlJsonObjectRef,
          setYamlJsonObject,
          setFlowNodes,
          flowNodes,
        });
        if (result?.shouldChangeNodeIdMap) {
          shouldChangeNodeIdMap = result.shouldChangeNodeIdMap;
        }
      } else if (NodeTypeHelpers.isFromRouterNode(connection)) {
        result = ConnectionOperationsHelpers.handleFromRouterNodeConnection({
          connection,
          yamlJsonObjectRef,
          setYamlJsonObject,
        });
      } else if (NodeTypeHelpers.isFromDecisionNode({ connection, yamlJsonObjectRef })) {
        result = ConnectionOperationsHelpers.handleFromDecisionNodeConnection({
          connection,
          yamlJsonObjectRef,
          setYamlJsonObject,
          setFlowNodes,
        });
      } else if (NodeTypeHelpers.isConnectToDecisionNode({ connection, yamlJsonObjectRef })) {
        result = ConnectionOperationsHelpers.handleToDecisionNodeConnection({
          connection,
          yamlJsonObjectRef,
          setYamlJsonObject,
          setFlowNodes,
          flowNodes,
        });
        if (result?.shouldChangeNodeIdMap) {
          shouldChangeNodeIdMap = result.shouldChangeNodeIdMap;
        }
      } else if (NodeTypeHelpers.isConnectToEndNode(connection)) {
        result = ConnectionOperationsHelpers.handleConnectionToEndNode({
          connection,
          yamlJsonObjectRef,
          setYamlJsonObject,
        });
      } else {
        result = ConnectionOperationsHelpers.handleNormalConnection({
          connection,
          yamlJsonObjectRef,
          setYamlJsonObject,
        });
      }

      // Early return if connection was rejected
      if (!result) return;

      // Create and apply edge changes
      const { showInterruptLabel = false, edgeToRemove = '', removeEdgePredicate } = result;
      const newEdge = EdgeOperationsHelpers.createNewEdge(connection, showInterruptLabel);
      ConnectionOperationsHelpers.applyEdgeChanges(
        setFlowEdges,
        newEdge,
        shouldChangeNodeIdMap,
        edgeToRemove,
        removeEdgePredicate,
      );
    },
    [disabled, flowNodes, setFlowEdges, setFlowNodes, setYamlJsonObject, yamlJsonObjectRef],
  );
  return onConnect;
};
