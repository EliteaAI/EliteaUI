import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Box, Tooltip, useTheme } from '@mui/material';
import { deepClone } from '@mui/x-data-grid/internals';

import { useTrackEvent } from '@/GA';
import { PIPELINE_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { PipelineStatus } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import {
  FlowEditorHelpers,
  LayoutHelpers,
  NodeCardHelpers,
  ParsePipelineHelpers,
} from '@/[fsd]/features/pipelines/flow-editor/lib/helpers';
import {
  useConnectNodes,
  useCtrlASelectAll,
  useDeleteItems,
  useIncompleteEdge,
  useRunEvent,
  useSaveNodesAndEdges,
} from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import {
  FlowEditorEmptyState,
  FlowEditorNodePanel,
  FlowEditorNodes,
  FlowEditorSettings,
  FlowEditorState,
} from '@/[fsd]/features/pipelines/flow-editor/ui';
import { AnalyticConstants } from '@/[fsd]/shared/lib/constants';
import { FlowEditorProvider } from '@/[fsd]/shared/lib/context';
import { Button, Modal } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ClipboardIcon from '@/assets/clipboard-icon.svg?react';
import CollapseIcon from '@/assets/collapse-second-icon.svg?react';
import ExpandIcon from '@/assets/expand-third-icon.svg?react';
import PolylineOutlinedIcon from '@/assets/polyline-outline-icon.svg?react';
import { actions, selectActivePipeline } from '@/slices/pipeline';
import {
  Background,
  ControlButton,
  Controls,
  ReactFlow,
  SelectionMode,
  applyEdgeChanges,
  applyNodeChanges,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  useStore,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const { GA_EVENT_NAMES, GA_EVENT_PARAMS } = AnalyticConstants;

const END_NODE_OFFSET = { x: 160, y: 120 };

// The first fit waits for React Flow to measure the nodes; until then they stay hidden
const INITIAL_FIT_DELAY = 150;

const selectIsMiniZoom = state => NodeCardHelpers.isMiniCardZoom(state.transform[2]);

// Clicks on these canvas nodes never open the configuration panel
const NON_CONFIGURABLE_NODE_TYPES = [
  FlowEditorConstants.PipelineNodeTypes.End,
  FlowEditorConstants.PipelineNodeTypes.Ghost,
  FlowEditorConstants.RUN_STATE_NODE,
];

// Esc inside a dialog, menu, popover or text field belongs to that control, not to the panel
const isEscapeHandledElsewhere = target =>
  Boolean(
    target?.closest?.('[role="dialog"], [role="presentation"], [role="menu"], [role="listbox"]') ||
    target?.closest?.('input, textarea, [contenteditable="true"]'),
  );

const edgeTypes = {
  custom: FlowEditorNodes.CustomEdge,
};

const nodeTypes = {
  [FlowEditorConstants.PipelineNodeTypes.Tool]: FlowEditorNodes.ToolNode,
  [FlowEditorConstants.PipelineNodeTypes.Agent]: FlowEditorNodes.AgentNode,
  [FlowEditorConstants.PipelineNodeTypes.Pipeline]: FlowEditorNodes.SubgraphNode,
  [FlowEditorConstants.PipelineNodeTypes.LLM]: FlowEditorNodes.LLMNode,
  [FlowEditorConstants.PipelineNodeTypes.Code]: FlowEditorNodes.CodeNode,
  [FlowEditorConstants.PipelineNodeTypes.Function]: FlowEditorNodes.FunctionNode,
  [FlowEditorConstants.PipelineNodeTypes.Condition]: FlowEditorNodes.ConditionNode,
  [FlowEditorConstants.PipelineNodeTypes.Decision]: FlowEditorNodes.DecisionNode,
  [FlowEditorConstants.PipelineNodeTypes.Loop]: FlowEditorNodes.LoopNode,
  [FlowEditorConstants.PipelineNodeTypes.End]: FlowEditorNodes.EndNode,
  [FlowEditorConstants.PipelineNodeTypes.LoopFromTool]: FlowEditorNodes.LoopToolNode,
  [FlowEditorConstants.PipelineNodeTypes.Router]: FlowEditorNodes.RouterNode,
  [FlowEditorConstants.PipelineNodeTypes.StateModifier]: FlowEditorNodes.StateModifierNode,
  [FlowEditorConstants.RUN_STATE_NODE]: FlowEditorNodes.RunStateNode,
  [FlowEditorConstants.PipelineNodeTypes.Custom]: FlowEditorNodes.DefaultNode,
  [FlowEditorConstants.PipelineNodeTypes.Ghost]: FlowEditorNodes.GhostNode,
  [FlowEditorConstants.PipelineNodeTypes.Default]: FlowEditorNodes.DefaultNode,
  [FlowEditorConstants.PipelineNodeTypes.Toolkit]: FlowEditorNodes.ToolkitNode,
  [FlowEditorConstants.PipelineNodeTypes.Mcp]: FlowEditorNodes.McpNode,
  [FlowEditorConstants.PipelineNodeTypes.Printer]: FlowEditorNodes.PrinterNode,
  [FlowEditorConstants.PipelineNodeTypes.Hitl]: FlowEditorNodes.HITLNode,
};

const FlowEditor = memo(
  forwardRef((props, ref) => {
    const {
      setYamlJsonObject,
      stopRun,
      sx,
      disabled,
      isVisible = true,
      onNodeIssuesChange,
      ...leftProps
    } = props;
    const styles = flowEditorStyles();

    const trackEvent = useTrackEvent();

    const [expandAll, setExpandAll] = useState(true);
    const [isStateDrawerOpen, setIsStateDrawerOpen] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    // The node the panel shows; it outlives the selection while the close animation runs
    const [panelNodeId, setPanelNodeId] = useState(null);
    const [nodeIssuesById, setNodeIssuesById] = useState({});
    const isDraggingNodeRef = useRef(false);

    const { setNodes, setEdges } = useSaveNodesAndEdges();

    const {
      yamlJsonObject,
      nodes: initialNodes,
      edges: initialEdges,
      layout_version,
      resetFlag,
      resetVersion,
    } = useSelector(selectActivePipeline);
    const yamlJsonObjectRef = useRef(yamlJsonObject);
    const { nodes: cachedNodes, edges: cachedEdges } = useSelector(state => state.pipelineEditor);
    const theme = useTheme();
    const editorRef = useRef();
    const { fitView, getViewport, getZoom, setCenter } = useReactFlow();
    const nodesInitialized = useNodesInitialized({
      includeHiddenNodes: true,
    });

    // Nodes stay invisible until the opening fit (or auto-arrange) is done, so they don't jump on open
    const [isViewportReady, setIsViewportReady] = useState(() => initialNodes.length <= 2);
    const revealTimerRef = useRef();

    const fitThenReveal = useCallback(() => {
      setIsViewportReady(false);
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = setTimeout(() => {
        fitView();
        requestAnimationFrame(() => setIsViewportReady(true));
      }, INITIAL_FIT_DELAY);
    }, [fitView]);

    useEffect(() => () => clearTimeout(revealTimerRef.current), []);

    const [editorWidth, setEditorWidth] = useState(622);
    const [editorHeight, setEditorHeight] = useState(677);
    const dispatch = useDispatch();

    useEffect(() => {
      yamlJsonObjectRef.current = yamlJsonObject;
    }, [yamlJsonObject]);

    const getViewSize = useCallback(
      () => ({
        height: editorHeight,
        width: editorWidth,
      }),
      [editorHeight, editorWidth],
    );

    const [flowNodes, setFlowNodes] = useNodesState(cachedNodes.length ? cachedNodes : initialNodes);
    const [flowEdges, setFlowEdges] = useEdgesState(cachedEdges.length ? cachedEdges : initialEdges);

    // Last full-size (not mini, expanded) measurement per node id
    const fullNodeSizesRef = useRef({});
    const isMiniZoom = useStore(selectIsMiniZoom);

    useEffect(() => {
      if (isMiniZoom || !expandAll) return;
      flowNodes.forEach(node => {
        if (node.measured) fullNodeSizesRef.current[node.id] = node.measured;
      });
    }, [flowNodes, isMiniZoom, expandAll]);
    const {
      onStopRun,
      deleteRunNode,
      deleteAllRunNodes,
      onRcvAgentEvent,
      onResetRunParseStatus,
      isRunningPipeline,
      pipelineRunNodes,
    } = useRunEvent(setFlowNodes, yamlJsonObject, flowNodes);

    const handleStopRun = useCallback(
      id => {
        stopRun();
        onStopRun(id);
      },
      [onStopRun, stopRun],
    );

    const {
      showDeleteConfirmDlg,
      nodesToDelete,
      onBeforeDelete,
      handleDeleteNode,
      onConfirmDelete,
      onCancelDelete,
    } = useDeleteItems({
      display: sx?.display,
      yamlJsonObject,
      flowNodes,
      flowEdges,
      setYamlJsonObject,
      setFlowNodes,
      setFlowEdges,
      disabled,
    });

    const handleDeleteNodeRef = useRef(handleDeleteNode);

    useEffect(() => {
      handleDeleteNodeRef.current = handleDeleteNode;
    }, [handleDeleteNode]);

    const onDeleteNode = useCallback(nodeId => {
      handleDeleteNodeRef.current(nodeId);
    }, []);

    useEffect(() => {
      // Only process resets when this tab is visible. When hidden, selectActivePipeline returns
      // the active tab's data (global key), so resetFlag/initialNodes/initialEdges belong to a
      // different pipeline. Processing them here would corrupt state.pipelineEditor for that tab.
      if (!isVisible || !resetFlag) return;

      setFlowNodes(initialNodes);
      setFlowEdges(initialEdges);
      onResetRunParseStatus();
      dispatch(actions.clearResetFlag(resetVersion));

      // Force sync nodes to Redux after reset to ensure measured heights are available for save
      // Without this, pipelineEditor.nodes stays empty because flowNodes === initialNodes
      setTimeout(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);
      }, 150);

      if (initialNodes.length > 2) fitThenReveal();
      else setIsViewportReady(true);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isVisible, resetFlag, resetVersion, initialNodes, initialEdges]);

    useCtrlASelectAll({
      display: sx?.display,
      setFlowNodes,
      setFlowEdges,
    });

    const onNodeCreateAtPosition = useCallback(
      (type, position) => {
        const newNode = FlowEditorHelpers.generateNodeIdByType(type, flowNodes);

        // Check if entry_point needs to be set
        const shouldSetEntryPoint =
          type !== FlowEditorConstants.PipelineNodeTypes.Condition &&
          type !== FlowEditorConstants.PipelineNodeTypes.End &&
          !yamlJsonObjectRef.current?.entry_point;

        if (type !== FlowEditorConstants.PipelineNodeTypes.Condition) {
          setYamlJsonObject(prevValue => ({
            ...(prevValue || {}),
            nodes: [...(prevValue?.nodes || []), newNode],
            // Set entry_point to the first added node if not already set
            ...(shouldSetEntryPoint ? { entry_point: newNode.id } : {}),
          }));
        }
        const label = type === FlowEditorConstants.PipelineNodeTypes.Condition ? 'Condition' : newNode.id;

        const newFlowNode = {
          id: newNode.id,
          type,
          data: {
            label,
          },
          position: position || { x: 0, y: 0 },
          selected: true,
        };
        if (type === FlowEditorConstants.PipelineNodeTypes.Condition) {
          newFlowNode.data.condition = {
            condition_input: [],
            condition_definition: '',
            conditional_outputs: [],
            default_output: '',
          };
        } else if (type === FlowEditorConstants.PipelineNodeTypes.Decision) {
          newFlowNode.data.decision = {
            input: [],
            description: '',
            nodes: [],
            default_output: '',
          };
        }

        const isFirstNode = !yamlJsonObjectRef.current?.nodes?.filter(Boolean).length;
        const endNodePosition = {
          x: newFlowNode.position.x + END_NODE_OFFSET.x,
          y:
            newFlowNode.position.y +
            (FlowEditorConstants.NodeHeightMap[type] ||
              FlowEditorConstants.NodeHeightMap[FlowEditorConstants.PipelineNodeTypes.Default]) +
            END_NODE_OFFSET.y,
        };

        setFlowNodes(prevNodes => {
          const deselectedNodes = prevNodes.map(node => {
            const isEndNode = node.type === FlowEditorConstants.PipelineNodeTypes.End;
            return isFirstNode && isEndNode
              ? { ...node, position: endNodePosition, selected: false }
              : { ...node, selected: false };
          });
          const hasEndNode = prevNodes.some(node => node.type === FlowEditorConstants.PipelineNodeTypes.End);

          return hasEndNode
            ? [...deselectedNodes, newFlowNode]
            : [...deselectedNodes, newFlowNode, ParsePipelineHelpers.createEndNode(endNodePosition)];
        });

        trackEvent(GA_EVENT_NAMES.PIPELINE_NODE_CREATED, {
          [GA_EVENT_PARAMS.NODE_TYPE]: type,
        });
        setSelectedNodeId(newNode.id);

        return newFlowNode;
      },
      [flowNodes, setFlowNodes, setYamlJsonObject, trackEvent],
    );

    const onAddNode = useCallback(
      type => {
        const viewPort = getViewport();
        // The new node opens the overlaying node panel, so it must land left of it
        const viewSize = {
          ...getViewSize(),
          width: Math.max(
            getViewSize().width - FlowEditorConstants.NODE_PANEL_WIDTH,
            FlowEditorConstants.NODE_CARD_WIDTH,
          ),
        };
        const size = {
          width: FlowEditorConstants.NODE_CARD_WIDTH,
          height:
            FlowEditorConstants.NodeHeightMap[type] ||
            FlowEditorConstants.NodeHeightMap[FlowEditorConstants.PipelineNodeTypes.Default],
        };
        const isEmpty = !yamlJsonObjectRef.current?.nodes?.filter(Boolean).length;
        const sizedNodes = NodeCardHelpers.isMiniCardZoom(viewPort.zoom)
          ? NodeCardHelpers.withFullNodeSizes(flowNodes, fullNodeSizesRef.current)
          : flowNodes;
        // While the pipeline is empty End is hidden, so it must not block the new node
        const occupiedNodes = isEmpty
          ? sizedNodes.filter(node => node.type !== FlowEditorConstants.PipelineNodeTypes.End)
          : sizedNodes;
        const { x, y, isInView } = FlowEditorHelpers.findFreeNodePosition({
          viewRect: {
            x: -viewPort.x / viewPort.zoom,
            y: -viewPort.y / viewPort.zoom,
            width: viewSize.width / viewPort.zoom,
            height: viewSize.height / viewPort.zoom,
          },
          nodes: occupiedNodes,
          size,
        });

        const newNode = onNodeCreateAtPosition(type, { x, y });
        if (!isInView) {
          setCenter(x + size.width / 2, y + size.height / 2, { zoom: viewPort.zoom, duration: 300 });
        }
        return newNode;
      },
      [getViewSize, getViewport, flowNodes, onNodeCreateAtPosition, setCenter],
    );

    const calculateLayoutNodes = useCallback(
      (parsedYamlJson, shouldDoLayout, layoutAll, expanded) => {
        const { nodes, edges } = ParsePipelineHelpers.parseYaml(
          parsedYamlJson,
          FlowEditorConstants.ORIENTATION.vertical,
        );
        let finalNodes = nodes;
        let finalEdges = edges;
        if (shouldDoLayout) {
          const zoom = getZoom();
          const measuredNodes = NodeCardHelpers.isMiniCardZoom(zoom)
            ? NodeCardHelpers.withFullNodeSizes(flowNodes, fullNodeSizesRef.current)
            : FlowEditorHelpers.measureNodes(flowNodes, zoom, editorRef);
          const { nodes: layoutNodes, edges: layoutEdges } = LayoutHelpers.doLayout({
            nodes,
            edges,
            flowNodes: measuredNodes,
            orientation: FlowEditorConstants.ORIENTATION.vertical,
            expanded,
          });
          finalNodes = layoutNodes;
          finalEdges = layoutEdges;
        }

        setFlowNodes(prevNodes => {
          const newNodes = finalNodes.map(node => {
            const foundNode = prevNodes.find(
              prevNode => prevNode.type === node.type && prevNode.id === node.id,
            );
            return foundNode
              ? {
                  ...foundNode,
                  position: !layoutAll ? foundNode.position : node.position,
                  data: { ...node.data },
                }
              : node;
          });
          return newNodes;
        });
        setFlowEdges(pervEdges =>
          finalEdges.map(edge => {
            const foundEdge = pervEdges.find(
              prevEdge =>
                prevEdge.source === edge.source && prevEdge.target === edge.target && edge.id === prevEdge.id,
            );
            return foundEdge ? { ...foundEdge, data: { ...foundEdge.data } } : edge;
          }),
        );
      },
      [flowNodes, getZoom, setFlowEdges, setFlowNodes],
    );

    useImperativeHandle(
      ref,
      () => ({
        fitView: () => {
          if (flowNodes.length > 2) {
            setTimeout(() => {
              fitView();
            }, 100);
          }
        },
        onAddNode,
        onRcvAgentEvent,
        setFlowEdges,
        setFlowNodes,
        deleteAllRunNodes,
        getCurrentExpandState: () => expandAll,
        calculateLayoutNodes: (parsedYamlJson, shouldDoLayout, layoutAll, explicitExpandState) => {
          const finalExpandState = explicitExpandState !== undefined ? explicitExpandState : expandAll;
          return calculateLayoutNodes(parsedYamlJson, shouldDoLayout, layoutAll, finalExpandState);
        },
        stopCurrentRun: () => onStopRun(pipelineRunNodes[pipelineRunNodes.length - 1]?.id || ''), // stop the last run node
        hasRunsInProgress: () =>
          pipelineRunNodes.some(node => node.data?.status === PipelineStatus.InProgress),
      }),
      [
        fitView,
        flowNodes.length,
        onAddNode,
        onRcvAgentEvent,
        setFlowEdges,
        setFlowNodes,
        deleteAllRunNodes,
        calculateLayoutNodes,
        expandAll,
        onStopRun,
        pipelineRunNodes,
      ],
    );

    const onNodesChange = useCallback(
      changes => {
        setFlowNodes(nds =>
          applyNodeChanges(
            changes,
            nds.map(nd => ({ ...nd, measured: deepClone(nd.measured) })),
          ),
        );
      },
      [setFlowNodes],
    );
    const onEdgesChange = useCallback(
      changes => {
        setFlowEdges(eds =>
          applyEdgeChanges(
            changes,
            eds.map(ed => ({ ...ed })),
          ),
        );
      },
      [setFlowEdges],
    );

    const onConnect = useConnectNodes({
      flowNodes,
      yamlJsonObjectRef,
      setFlowNodes,
      setYamlJsonObject,
      setFlowEdges,
      disabled,
    });

    const {
      onConnectStart,
      onConnectEnd,
      openFromHandle,
      onReconnect,
      onReconnectEnd,
      showConnectionDropdown,
      dropdownPosition,
      dropdownAnchorEl,
      handleDropdownClose,
      handleNodeSelect,
      handleNodeCreate,
      availableTargets,
      availableNodeTypes,
    } = useIncompleteEdge({ onConnect, onNodeCreateAtPosition, yamlJsonObjectRef, disabled });

    // Keep the handlers object for ReactFlow props
    const handlers = { onConnectStart, onConnectEnd, onReconnect, onReconnectEnd };

    // Stable callback for the "+" under each Output, so the node context doesn't change every render
    const openFromHandleRef = useRef(openFromHandle);

    useEffect(() => {
      openFromHandleRef.current = openFromHandle;
    }, [openFromHandle]);

    const onAddFromHandle = useCallback(args => {
      openFromHandleRef.current(args);
    }, []);

    const closeNodePanel = useCallback(() => {
      setSelectedNodeId(null);
      setFlowNodes(prevNodes =>
        prevNodes.some(node => node.selected)
          ? prevNodes.map(node => (node.selected ? { ...node, selected: false } : node))
          : prevNodes,
      );
    }, [setFlowNodes]);

    const onNodeClick = useCallback((_event, node) => {
      if (isDraggingNodeRef.current) return;
      if (NON_CONFIGURABLE_NODE_TYPES.includes(node.type)) {
        setSelectedNodeId(null);
        return;
      }
      setSelectedNodeId(node.id);
    }, []);

    const onNodeDragStart = useCallback(() => {
      isDraggingNodeRef.current = true;
    }, []);

    const onNodeDragStop = useCallback(() => {
      // React Flow fires the click after the drag stop, so release the guard on the next tick
      setTimeout(() => {
        isDraggingNodeRef.current = false;
      }, 0);
    }, []);

    const onPaneClick = useCallback(() => {
      setSelectedNodeId(null);
    }, []);

    const onNodeRenamed = useCallback((previousId, newId) => {
      setSelectedNodeId(prevId => (prevId === previousId ? newId : prevId));
      setPanelNodeId(prevId => (prevId === previousId ? newId : prevId));
    }, []);

    const onNodePanelExited = useCallback(() => {
      setPanelNodeId(null);
    }, []);

    const reportNodeIssues = useCallback((nodeId, issues) => {
      setNodeIssuesById(prev => {
        const previousIssues = prev[nodeId] || [];
        if (
          previousIssues.length === issues.length &&
          previousIssues.every((issue, index) => issue === issues[index])
        ) {
          return prev;
        }
        const next = { ...prev };
        if (issues.length) next[nodeId] = issues;
        else delete next[nodeId];
        return next;
      });
    }, []);

    useEffect(() => {
      onNodeIssuesChange?.(nodeIssuesById);
    }, [nodeIssuesById, onNodeIssuesChange]);

    const selectedFlowNode = useMemo(
      () => (selectedNodeId ? flowNodes.find(node => node.id === selectedNodeId) : null),
      [flowNodes, selectedNodeId],
    );
    // The selected node renders in the same commit the drawer opens, so the open animation has content
    // to measure. After deselection the last node stays until the close animation ends; a deleted node
    // has no flow node left, so the panel closes empty.
    const isNodePanelOpen = Boolean(selectedFlowNode);
    const panelFlowNode = useMemo(
      () => selectedFlowNode || (panelNodeId ? flowNodes.find(node => node.id === panelNodeId) : null),
      [flowNodes, panelNodeId, selectedFlowNode],
    );

    useEffect(() => {
      if (selectedNodeId) setPanelNodeId(selectedNodeId);
    }, [selectedNodeId]);

    // Deleted, renamed away by YAML, or reset: the panel has nothing left to show
    useEffect(() => {
      if (selectedNodeId && !selectedFlowNode) setSelectedNodeId(null);
    }, [selectedFlowNode, selectedNodeId]);

    useEffect(() => {
      if (!selectedNodeId || !isVisible) return;
      const onKeyDown = event => {
        if (event.key !== 'Escape' || event.defaultPrevented || isEscapeHandledElsewhere(event.target))
          return;
        closeNodePanel();
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }, [closeNodePanel, isVisible, selectedNodeId]);

    const onReLayout = specifiedExpandAll => {
      calculateLayoutNodes(yamlJsonObject, true, true, specifiedExpandAll || expandAll);
      setTimeout(() => {
        fitView();
      }, 100);
    };

    const onExpandAll = () => {
      setExpandAll(prev => !prev);
      setTimeout(() => {
        onReLayout(!expandAll);
      }, 200);
    };

    const isEmptyPipeline = !yamlJsonObject?.nodes?.filter(Boolean).length;

    // End stays in the flow state but is not rendered until the first node is added
    const visibleFlowNodes = useMemo(
      () =>
        isEmptyPipeline
          ? flowNodes.filter(node => node.type !== FlowEditorConstants.PipelineNodeTypes.End)
          : flowNodes,
      [flowNodes, isEmptyPipeline],
    );

    const onToggleStateDrawer = useCallback(() => {
      setIsStateDrawerOpen(prev => !prev);
    }, []);

    useEffect(() => {
      let resizeObserver = null;
      if ('ResizeObserver' in window) {
        resizeObserver = new ResizeObserver(entries => {
          for (const entry of entries) {
            setEditorHeight(entry.target.offsetHeight);
            setEditorWidth(entry.target.offsetWidth);
          }
        });
        resizeObserver.observe(editorRef.current);
      }
      return () => {
        resizeObserver?.disconnect();
      };
    }, []);

    useEffect(() => {
      if (initialNodes.length > 2) fitThenReveal();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialNodes.length]);

    useEffect(() => {
      if (JSON.stringify(flowNodes) !== JSON.stringify(initialNodes) && !isRunningPipeline) {
        setTimeout(() => {
          // Mini cards must not leak their collapsed sizes into the saved pipeline_settings
          setNodes(
            NodeCardHelpers.isMiniCardZoom(getZoom())
              ? NodeCardHelpers.withFullNodeSizes(flowNodes, fullNodeSizesRef.current)
              : flowNodes,
          );
        }, 100);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flowNodes]);

    useEffect(() => {
      if (JSON.stringify(flowEdges) !== JSON.stringify(initialEdges)) {
        setTimeout(() => {
          setEdges(flowEdges);
        }, 100);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flowEdges]);

    useEffect(() => {
      if (layout_version !== FlowEditorConstants.LAYOUT_VERSION && nodesInitialized) {
        onReLayout();
        // Keeps the nodes hidden through the auto-arrange so the reorder isn't visible either
        if (flowNodes.length > 2) fitThenReveal();
        dispatch(actions.setLayoutVersion(FlowEditorConstants.LAYOUT_VERSION));
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layout_version, nodesInitialized]);

    return (
      <Box
        sx={[sx, styles.root(sx?.display === 'none')]}
        {...leftProps}
      >
        <FlowEditorProvider
          setFlowEdges={setFlowEdges}
          setFlowNodes={setFlowNodes}
          editorHeight={editorHeight}
          editorWidth={editorWidth}
          yamlJsonObject={yamlJsonObject}
          setYamlJsonObject={setYamlJsonObject}
          deleteRunNode={deleteRunNode}
          isRunningPipeline={isRunningPipeline}
          handleDeleteNode={onDeleteNode}
          onAddFromHandle={disabled ? undefined : onAddFromHandle}
          expandAll={expandAll}
          disabled={disabled}
          reportNodeIssues={reportNodeIssues}
          onConnectNodes={onConnect}
        >
          <Box
            sx={styles.container(isViewportReady)}
            data-tour={PIPELINE_TOUR_TARGET_IDS.flowDesigner}
            ref={editorRef}
          >
            <Box sx={styles.stateBar}>
              <FlowEditorNodes.RunStateNodeGroup
                deleteRunNode={deleteRunNode}
                handleStopRun={handleStopRun}
                yamlJsonObject={yamlJsonObject}
                editorHeight={editorHeight}
                editorWidth={editorWidth}
                nodes={pipelineRunNodes}
              />
            </Box>
            {!isStateDrawerOpen && (
              <Box
                sx={styles.stateButton(theme)}
                data-tour={PIPELINE_TOUR_TARGET_IDS.state}
              >
                <Button.BaseBtn
                  variant={BUTTON_VARIANTS.elitea}
                  color={BUTTON_COLORS.secondary}
                  onClick={onToggleStateDrawer}
                  startIcon={
                    <Box sx={styles.iconScale}>
                      <ClipboardIcon />
                    </Box>
                  }
                  sx={styles.stateDrawerButton}
                  data-testid="pipeline-state-drawer-toggle-button"
                >
                  State
                </Button.BaseBtn>
              </Box>
            )}
            <ReactFlow
              panOnDrag // figma/sketch/design tool controls, panOnDrag should be disabled
              panOnScroll // figma/sketch/design tool controls, panOnScroll should be enabled
              selectionOnDrag // figma/sketch/design tool controls, selectionOnDrag should be enabled
              nodes={visibleFlowNodes}
              onNodesChange={onNodesChange}
              edges={flowEdges}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onBeforeDelete={onBeforeDelete}
              onNodeClick={onNodeClick}
              onNodeDragStart={onNodeDragStart}
              onNodeDragStop={onNodeDragStop}
              onPaneClick={onPaneClick}
              {...handlers}
              colorMode={theme.palette.mode === 'dark' ? 'dark' : 'light'}
              proOptions={{ hideAttribution: true }}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              zoomOnDoubleClick={false}
              selectionMode={SelectionMode.Partial} // enabled adding nodes to a selection that are only partially selected.
              minZoom={0.1}
              defaultViewport={styles.defaultViewport}
            >
              <Background
                color={theme.palette.border.lines}
                bgColor={theme.palette.background.default.secondary}
                size={1.5}
                offset={[0, 2]}
                gap={20}
              />
              <Box sx={styles.flowControls}>
                <Controls>
                  <Tooltip
                    title="Toggle cards size"
                    placement="right"
                  >
                    <Box
                      component="span"
                      sx={{
                        display: 'inline-flex',
                        borderBottom: `0.0625rem solid ${theme.palette.divider}`,
                      }}
                    >
                      <ControlButton onClick={onExpandAll}>
                        {expandAll ? (
                          <CollapseIcon
                            sx={styles.icon}
                            fill={theme.palette.icon.secondary}
                          />
                        ) : (
                          <ExpandIcon
                            sx={styles.icon}
                            fill={theme.palette.icon.secondary}
                          />
                        )}
                      </ControlButton>
                    </Box>
                  </Tooltip>
                  <Tooltip
                    title="Auto-arrange"
                    placement="right"
                  >
                    <Box
                      component="span"
                      sx={{ display: 'inline-flex' }}
                    >
                      <ControlButton onClick={onReLayout}>
                        <PolylineOutlinedIcon
                          sx={styles.icon}
                          fill={theme.palette.icon.secondary}
                        />
                      </ControlButton>
                    </Box>
                  </Tooltip>
                </Controls>
              </Box>
            </ReactFlow>
            {isEmptyPipeline && (
              <FlowEditorEmptyState.FlowEmptyState
                onAddNode={onAddNode}
                disabled={disabled}
              />
            )}
            <FlowEditorState.StateDrawer
              isOpen={isStateDrawerOpen}
              onClose={onToggleStateDrawer}
              setYamlJsonObject={setYamlJsonObject}
              yamlJsonObject={yamlJsonObject}
              disabled={disabled}
            />
            <FlowEditorNodePanel.NodeConfigDrawer
              open={isNodePanelOpen}
              onExited={onNodePanelExited}
              container={editorRef.current}
            >
              {panelFlowNode && (
                <FlowEditorNodePanel.NodeConfigPanel
                  flowNode={panelFlowNode}
                  NodeComponent={nodeTypes[panelFlowNode.type]}
                  onClose={closeNodePanel}
                  onRenamed={onNodeRenamed}
                />
              )}
            </FlowEditorNodePanel.NodeConfigDrawer>
            <Modal.DeleteEntityModal
              open={showDeleteConfirmDlg}
              onClose={onCancelDelete}
              onConfirm={onConfirmDelete}
              name={nodesToDelete[0]?.data?.label || nodesToDelete[0]?.id || ''}
              inlineExtraContent=" node? It can't be restored."
            />

            {/* Connection dropdown for incomplete edges */}
            <FlowEditorSettings.ConnectionDropdown
              open={showConnectionDropdown}
              anchorPosition={dropdownPosition}
              anchorEl={dropdownAnchorEl}
              targetNodes={availableTargets}
              availableNodeTypes={availableNodeTypes}
              onNodeSelect={handleNodeSelect}
              onNodeCreate={handleNodeCreate}
              onClose={handleDropdownClose}
            />
          </Box>
        </FlowEditorProvider>
      </Box>
    );
  }),
);

FlowEditor.displayName = 'FlowEditor';

/** @type {MuiSx} */
const flowEditorStyles = () => ({
  root: isHidden => ({
    display: isHidden ? 'none' : 'flex',
    minWidth: 0,
  }),
  stateButton: theme => ({
    position: 'absolute',
    top: theme.spacing(2.5),
    right: theme.spacing(2.5),
    zIndex: 100,
  }),
  // Only the nodes and edges layer fades in; the dotted background and controls stay visible
  container: isViewportReady => ({
    height: '100%',
    position: 'relative',
    flex: 1,
    minWidth: 0,
    '& .react-flow__viewport': {
      opacity: isViewportReady ? 1 : 0,
      transition: isViewportReady ? 'opacity 0.15s ease-in' : 'none',
    },
  }),
  stateBar: {
    position: 'absolute',
    top: '1.25rem',
    left: '1.25rem',
    zIndex: 100,
    display: 'flex',
    gap: '.75rem',
    width: 'calc(100% - 2.5rem)',
    minWidth: '25rem',
    overflowX: 'scroll',
    pointerEvents: 'none', // Allow events to pass through the container
    '& > *': {
      pointerEvents: 'auto', // Re-enable events for child components
    },
  },
  defaultViewport: {
    x: 0,
    y: 0,
    zoom: 0.75,
  },
  icon: {
    fontSize: '1rem',
  },
  iconScale: {
    transform: 'scale(0.8)',
  },
  stateDrawerButton: ({ spacing, palette, typography }) => ({
    height: spacing(4.5),
    padding: spacing(0.75, 1.5),
    borderRadius: spacing(1),
    border: `.0625rem solid ${palette.border.lines}`,
    background: `${palette.background.default.tertiary} !important`,
    color: palette.text.secondary,
    gap: spacing(0.75),
    fontSize: typography.body2.fontSize,
    fontWeight: 400,
    '&:hover': {
      background: `${palette.components.dataGrid.background.main} !important`,
      border: `.0625rem solid ${palette.components.flowEditor.node.border}`,
    },
  }),
  flowControls: ({ palette }) => ({
    '& .react-flow__controls': {
      border: `0.0625rem solid ${palette.border.lines}`,
      borderRadius: '0.25rem',
    },
    '& .react-flow__controls-button svg': {
      color: `${palette.icon.default} !important`,
    },
    '& .react-flow__controls-button': {
      backgroundColor: palette.background.paper,
      borderBottom: `0.0625rem solid ${palette.divider}`,
      '&:hover': {
        backgroundColor: palette.components.table.border,
        '& svg': {
          color: `${palette.icon.secondary} !important`,
        },
      },
    },
    '& .react-flow__controls-button:first-of-type': {
      borderRadius: '0.25rem 0.25rem 0 0',
    },
    '& .react-flow__controls-button:last-child': {
      borderRadius: '0 0 0.25rem 0.25rem',
    },
  }),
});

export default FlowEditor;
