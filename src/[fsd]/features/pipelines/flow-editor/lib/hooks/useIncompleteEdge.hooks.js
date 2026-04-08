import { useCallback, useMemo, useState } from 'react';

import { FlowEditorHelpers } from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import { addEdge, reconnectEdge, useReactFlow } from '@xyflow/react';

import { PipelineNodeTypes } from '../constants/flowEditor.constants';

export const useIncompleteEdge = ({ onConnect, onNodeCreateAtPosition, yamlJsonObjectRef, disabled }) => {
  const reactFlowInstance = useReactFlow();
  const { setNodes, setEdges, screenToFlowPosition } = reactFlowInstance;
  const [showConnectionDropdown, setShowConnectionDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const [currentGhostNode, setCurrentGhostNode] = useState(null);
  const [sourceNodeId, setSourceNodeId] = useState(null);
  const [sourceHandle, setSourceHandle] = useState(null);

  // Reusable cleanup function for ghost nodes and edges
  const cleanupGhostNode = useCallback(
    ghostNode => {
      if (ghostNode) {
        setNodes(nodes => nodes.filter(node => node.id !== ghostNode.id));
        setEdges(edges => edges.filter(edge => edge.target !== ghostNode.id));
      }
    },
    [setNodes, setEdges],
  );

  // Reset all dropdown state
  const resetDropdownState = useCallback(() => {
    setShowConnectionDropdown(false);
    setDropdownPosition(null);
    setCurrentGhostNode(null);
    setSourceNodeId(null);
    setSourceHandle(null);
  }, []);

  const onConnectEnd = (event, connectionState) => {
    if (connectionState.isValid || connectionState.fromHandle.type === 'target' || disabled) {
      return;
    }

    const fromNodeId = connectionState.fromNode.id;
    const { clientX, clientY } = 'changedTouches' in event ? event.changedTouches[0] : event;

    // Regular incomplete connection logic
    const id = `ghost-${Date.now()}`;
    const newNode = {
      id,
      type: 'ghost',
      position: screenToFlowPosition({
        x: clientX,
        y: clientY,
      }),
      data: {},
      draggable: false,
      selectable: false,
      deletable: false,
    };

    const newEdge = {
      id: `${fromNodeId}->${id}`,
      source: fromNodeId,
      sourceHandle: connectionState.fromHandle?.id || null,
      target: id,
      reconnectable: 'target',
      type: 'custom',
    };

    setNodes(nodes => nodes.concat(newNode));
    setEdges(edges => addEdge(newEdge, edges));

    // Show connection dropdown at ghost node position
    setCurrentGhostNode(newNode);
    setSourceNodeId(fromNodeId);
    setSourceHandle(connectionState.fromHandle?.id || null);
    setDropdownPosition({ x: clientX, y: clientY });
    setShowConnectionDropdown(true);
  };

  const onReconnect = (oldEdge, newConnection) => {
    setEdges(edges => reconnectEdge(oldEdge, newConnection, edges));
  };

  const onReconnectEnd = useCallback(
    (event, oldEdge, handleType) => {
      if (handleType === 'source') {
        setNodes(nodes => {
          return nodes.filter(node => {
            const isGhost = node.type === 'ghost';
            const isTarget = node.id === oldEdge.target;

            return !(isGhost && isTarget);
          });
        });

        setEdges(edges => edges.filter(edge => edge.id !== oldEdge.id));
      }
    },
    [setNodes, setEdges],
  );

  const handleDropdownClose = useCallback(() => {
    // Clean up ghost node and edge when dropdown is closed without selection
    cleanupGhostNode(currentGhostNode);
    resetDropdownState();
  }, [currentGhostNode, cleanupGhostNode, resetDropdownState]);

  const handleNodeSelect = useCallback(
    selectedNode => {
      if (!currentGhostNode || !sourceNodeId || !onConnect) return;

      // Remove the ghost node and its edge
      cleanupGhostNode(currentGhostNode);

      // Create connection object that matches ReactFlow's onConnect format
      const connection = {
        source: sourceNodeId,
        target: selectedNode.id,
        sourceHandle,
        targetHandle: null,
      };

      // Call onConnect manually - this will trigger all the pipeline logic
      onConnect(connection);
      resetDropdownState();
    },
    [currentGhostNode, sourceNodeId, sourceHandle, onConnect, cleanupGhostNode, resetDropdownState],
  );

  const handleNodeCreate = useCallback(
    nodeType => {
      if (!currentGhostNode || !sourceNodeId || !onNodeCreateAtPosition) return;

      // Create new node at ghost position
      const newNode = onNodeCreateAtPosition(nodeType, currentGhostNode.position);

      // Remove the ghost node and its edge immediately
      cleanupGhostNode(currentGhostNode);

      // Create the connection immediately without timeout since we have the newNode
      // The node was already added to yamlJsonObjectRef.current in onNodeCreateAtPosition
      const connection = {
        source: sourceNodeId,
        target: newNode.id,
        sourceHandle,
        targetHandle: null,
      };

      // Use requestAnimationFrame to ensure React has completed the render cycle
      // This is more reliable than setTimeout for React state updates
      setTimeout(() => {
        onConnect(connection);
      }, 0);

      resetDropdownState();
    },
    [
      currentGhostNode,
      sourceNodeId,
      sourceHandle,
      onNodeCreateAtPosition,
      onConnect,
      cleanupGhostNode,
      resetDropdownState,
    ],
  );

  const availableTargets = useMemo(() => {
    const flowNodes = reactFlowInstance.getNodes();
    const sourceNodeType = flowNodes.find(node => node.id === sourceNodeId)?.type;
    if (!sourceNodeId || !flowNodes) return [];

    const sourceNode = flowNodes.find(node => node.id === sourceNodeId);
    const sourceYamlNode = yamlJsonObjectRef.current?.nodes?.find(node => node.id === sourceNodeId);

    if (!sourceNode) return [];

    // Get current nodes and edges inside useMemo to avoid function dependencies
    const allEdges = reactFlowInstance.getEdges();
    const sourceFlags = FlowEditorHelpers.getNodeTypeFlags(sourceNodeId, sourceHandle, sourceYamlNode);

    // Get already connected target nodes from this source and handle
    const connectedTargets = allEdges.filter(edge => edge.source === sourceNodeId).map(edge => edge.target);

    return flowNodes
      .filter(node => {
        // Basic exclusions
        if (node.id === sourceNodeId || node.type === 'ghost') return false;
        // Exclude "end" node if connecting from "hitl" node
        if (
          sourceNodeType === PipelineNodeTypes.Hitl &&
          sourceHandle?.includes('edit') &&
          node.type === PipelineNodeTypes.End
        )
          return false;

        // Exclude already connected nodes
        if (connectedTargets.includes(node.id)) return false;

        // Apply connection rules using helper function
        const targetFlags = FlowEditorHelpers.getTargetNodeTypeFlags(node);
        return FlowEditorHelpers.canConnectToTarget(sourceFlags, targetFlags, sourceYamlNode);
      })
      .sort((a, b) => {
        // Put "end" node at the end of the list
        if (a.id.toLowerCase() === 'end') return 1;
        if (b.id.toLowerCase() === 'end') return -1;
        return a.id.localeCompare(b.id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceNodeId, sourceHandle]);

  const availableNodeTypes = useMemo(() => {
    const flowNodes = reactFlowInstance.getNodes();
    if (!sourceNodeId || !flowNodes) return [];

    const sourceNode = flowNodes.find(node => node.id === sourceNodeId);
    if (!sourceNode) return [];

    const sourceYamlNode = yamlJsonObjectRef.current?.nodes?.find(node => node.id === sourceNodeId);
    const sourceFlags = FlowEditorHelpers.getNodeTypeFlags(sourceNodeId, sourceHandle, sourceYamlNode);

    // Get all available node types except those that should be excluded
    const allNodeTypes = FlowEditorHelpers.getAllowedNodeTypes();

    return allNodeTypes.filter(nodeType => FlowEditorHelpers.canCreateNodeType(nodeType, sourceFlags));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceNodeId, sourceHandle]);

  return {
    onConnectEnd,
    onReconnect,
    onReconnectEnd,
    // Dropdown related state and handlers
    showConnectionDropdown,
    dropdownPosition,
    currentGhostNode,
    handleDropdownClose,
    handleNodeSelect,
    handleNodeCreate,
    availableTargets,
    availableNodeTypes,
  };
};
