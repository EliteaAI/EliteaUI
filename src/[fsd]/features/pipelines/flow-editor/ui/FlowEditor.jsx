import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { Box, Button, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { deepClone } from '@mui/x-data-grid/internals';

import { useTrackEvent } from '@/GA';
import { FlowEditorProvider } from '@/[fsd]/app/providers';
import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { PipelineStatus } from '@/[fsd]/features/pipelines/flow-editor/lib/constants/flowEditor.constants';
import {
  FlowEditorHelpers,
  LayoutHelpers,
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
  FlowEditorNodes,
  FlowEditorSettings,
  FlowEditorState,
} from '@/[fsd]/features/pipelines/flow-editor/ui';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import { useProjectType } from '@/[fsd]/shared/lib/hooks';
import ClipboardIcon from '@/assets/clipboard-icon.svg?react';
import CollapseIcon from '@/assets/collapse-second-icon.svg?react';
import ExpandIcon from '@/assets/expand-third-icon.svg?react';
import PolylineOutlinedIcon from '@/assets/polyline-outline-icon.svg?react';
import AlertDialogV2 from '@/components/AlertDialogV2';
import { actions } from '@/slices/pipeline';
import { useTheme } from '@emotion/react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

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

const FlowEditor = forwardRef((props, ref) => {
  const { setYamlJsonObject, stopRun, sx, disabled, ...leftProps } = props;
  const styles = flowEditorStyles();

  const trackEvent = useTrackEvent();

  const [expandAll, setExpandAll] = useState(true);
  const [isStateDrawerOpen, setIsStateDrawerOpen] = useState(false);

  const { setNodes, setEdges } = useSaveNodesAndEdges();
  const { projectType } = useProjectType();
  const {
    yamlJsonObject,
    nodes: initialNodes,
    edges: initialEdges,
    layout_version,
  } = useSelector(state => state.pipeline);
  const yamlJsonObjectRef = useRef(yamlJsonObject);
  const { nodes: cachedNodes, edges: cachedEdges } = useSelector(state => state.pipelineEditor);
  const theme = useTheme();
  const editorRef = useRef();
  const { fitView, getViewport, getZoom } = useReactFlow();
  const nodesInitialized = useNodesInitialized({
    includeHiddenNodes: true,
  });

  const [editorWidth, setEditorWidth] = useState(622);
  const [editorHeight, setEditorHeight] = useState(677);
  const { resetFlag } = useSelector(state => state.pipeline);
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
    confirmContent,
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
    if (resetFlag) {
      setFlowNodes(initialNodes);
      setFlowEdges(initialEdges);
      onResetRunParseStatus();
      dispatch(actions.clearResetFlag());

      // Force sync nodes to Redux after reset to ensure measured heights are available for save
      // Without this, pipelineEditor.nodes stays empty because flowNodes === initialNodes
      setTimeout(() => {
        setNodes(initialNodes);
        setEdges(initialEdges);

        // Fit view after sync completes
        if (initialNodes.length > 2) {
          fitView();
        }
      }, 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetFlag, initialNodes, initialEdges]);

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

      setFlowNodes(prevNodes => {
        return [...prevNodes.map(node => ({ ...node, selected: false })), newFlowNode];
      });

      trackEvent(GA_EVENT_NAMES.PIPELINE_NODE_CREATED, {
        [GA_EVENT_PARAMS.NODE_TYPE]: type,
        [GA_EVENT_PARAMS.PROJECT_TYPE]: projectType || 'unknown',
      });

      return newFlowNode;
    },
    [flowNodes, projectType, setFlowNodes, setYamlJsonObject, trackEvent],
  );

  const onAddNode = useCallback(
    type => {
      const viewPort = getViewport();
      const viewSize = getViewSize();
      const { xPos, yPos } = FlowEditorHelpers.calculatePositionForNewNode(
        (viewSize.width / 2 - 230 - viewPort.x) / viewPort.zoom,
        (viewSize.height / 2 - 200 - viewPort.y) / viewPort.zoom,
        flowNodes,
      );

      return onNodeCreateAtPosition(type, { x: xPos, y: yPos });
    },
    [getViewSize, getViewport, flowNodes, onNodeCreateAtPosition],
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
        const measuredNodes = FlowEditorHelpers.measureNodes(flowNodes, getZoom(), editorRef);
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
      hasRunsInProgress: () => pipelineRunNodes.some(node => node.data?.status === PipelineStatus.InProgress),
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
    onReconnect,
    onReconnectEnd,
    showConnectionDropdown,
    dropdownPosition,
    handleDropdownClose,
    handleNodeSelect,
    handleNodeCreate,
    availableTargets,
    availableNodeTypes,
  } = useIncompleteEdge({ onConnect, onNodeCreateAtPosition, yamlJsonObjectRef, disabled });

  // Keep the handlers object for ReactFlow props
  const handlers = { onConnectStart, onConnectEnd, onReconnect, onReconnectEnd };

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
    if (initialNodes.length > 2) {
      setTimeout(() => {
        fitView();
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes.length]);

  useEffect(() => {
    if (JSON.stringify(flowNodes) !== JSON.stringify(initialNodes) && !isRunningPipeline) {
      setTimeout(() => {
        setNodes(flowNodes);
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
      dispatch(actions.setLayoutVersion(FlowEditorConstants.LAYOUT_VERSION));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout_version, nodesInitialized]);

  return (
    <Box
      sx={[styles.container, sx]}
      ref={editorRef}
      {...leftProps}
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
          position="absolute"
          top={theme.spacing(2.5)}
          right={theme.spacing(2.5)}
          zIndex={100}
        >
          <Button
            variant="elitea"
            color="secondary"
            onClick={onToggleStateDrawer}
            startIcon={
              <Box sx={styles.iconScale}>
                <ClipboardIcon />
              </Box>
            }
            sx={styles.stateDrawerButton}
          >
            State
          </Button>
        </Box>
      )}
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
        expandAll={expandAll}
        disabled={disabled}
      >
        <ReactFlow
          panOnDrag // figma/sketch/design tool controls, panOnDrag should be disabled
          panOnScroll // figma/sketch/design tool controls, panOnScroll should be enabled
          selectionOnDrag // figma/sketch/design tool controls, selectionOnDrag should be enabled
          nodes={flowNodes}
          onNodesChange={onNodesChange}
          edges={flowEdges}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onBeforeDelete={onBeforeDelete}
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
            bgColor={theme.palette.background.secondary}
            size={1.5}
            offset={[0, 2]}
            gap={20}
          />
          <StyledControls>
            <Tooltip
              title="Toggle cards size"
              placement="right"
            >
              <Box
                component="span"
                sx={{
                  display: 'inline-flex',
                  borderBottom: `1px solid ${theme.palette.divider}`,
                }}
              >
                <ControlButton onClick={onExpandAll}>
                  {expandAll ? (
                    <CollapseIcon
                      sx={styles.icon}
                      fill={theme.palette.icon.fill.secondary}
                    />
                  ) : (
                    <ExpandIcon
                      sx={styles.icon}
                      fill={theme.palette.icon.fill.secondary}
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
                    fill={theme.palette.icon.fill.secondary}
                  />
                </ControlButton>
              </Box>
            </Tooltip>
          </StyledControls>
        </ReactFlow>
      </FlowEditorProvider>
      <FlowEditorState.StateDrawer
        isOpen={isStateDrawerOpen}
        onClose={onToggleStateDrawer}
        setYamlJsonObject={setYamlJsonObject}
        yamlJsonObject={yamlJsonObject}
        disabled={disabled}
      />
      <AlertDialogV2
        open={showDeleteConfirmDlg}
        alarm={true}
        title="Delete"
        confirmButtonTitle="Delete"
        content={confirmContent}
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />

      {/* Connection dropdown for incomplete edges */}
      <FlowEditorSettings.ConnectionDropdown
        open={showConnectionDropdown}
        anchorPosition={dropdownPosition}
        targetNodes={availableTargets}
        availableNodeTypes={availableNodeTypes}
        onNodeSelect={handleNodeSelect}
        onNodeCreate={handleNodeCreate}
        onClose={handleDropdownClose}
      />
    </Box>
  );
});

FlowEditor.displayName = 'FlowEditor';

const flowEditorStyles = () => ({
  container: {
    height: '100%',
    position: 'relative',
    width: '100%',
  },
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
    background: `${palette.background.tabPanel} !important`,
    color: palette.text.secondary,
    gap: spacing(0.75),
    fontSize: typography.body2.fontSize,
    fontWeight: 400,
    '&:hover': {
      background: `${palette.background.dataGrid.main} !important`,
      border: `.0625rem solid ${palette.border.flowNode}`,
    },
  }),
});

export default memo(FlowEditor);

const StyledControls = styled(Controls)(({ theme }) => ({
  border: `1px solid ${theme.palette.border.lines}`,
  borderRadius: '0.25rem',

  '& .react-flow__controls-button svg': {
    color: `${theme.palette.border.hover} !important`,
  },

  '& .react-flow__controls-button': {
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    '&:hover': {
      backgroundColor: theme.palette.border.table,

      '& svg': {
        color: `${theme.palette.icon.fill.secondary} !important`,
      },
    },
  },

  '& .react-flow__controls-button:first-of-type': {
    borderRadius: '0.25rem 0.25rem 0 0',
  },

  '& .react-flow__controls-button:last-child': {
    borderRadius: '0 0 0.25rem 0.25rem',
  },
}));
