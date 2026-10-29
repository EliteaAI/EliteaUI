import { memo, useCallback, useContext, useMemo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { useNodeCardContext } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import { FlowEditorContext } from '@/[fsd]/shared/lib/context';
import PlusIcon from '@/assets/plus-icon.svg?react';
import { Handle, Position, useEdges, useNodeId, useReactFlow } from '@xyflow/react';

const CustomHandle = memo(props => {
  const {
    type,
    id,
    isConnectable,
    label = '',
    orientation: orientationOverride,
    offset,
    outputIndex,
    outputCount = 1,
    isRunningPipeline,
    isPerforming,
    style: specifiedStyle = {},
    testId,
  } = props;

  const theme = useTheme();
  const nodeId = useNodeId();
  const edges = useEdges();
  const finalLabel = useMemo(() => label || (type === 'source' ? 'Output' : 'Input'), [label, type]);

  // Get isExpanded from NodeCard context (null if not within NodeCard)
  const nodeCardContext = useNodeCardContext();
  const isExpanded = nodeCardContext?.isExpanded;
  const {
    onAddFromHandle,
    orientation: contextOrientation,
    isCanvasLocked,
  } = useContext(FlowEditorContext) || {};
  const orientation = orientationOverride || contextOrientation || FlowEditorConstants.ORIENTATION.vertical;
  const isHorizontal = orientation === FlowEditorConstants.ORIENTATION.horizontal;
  // A locked canvas keeps its edges: no new connections and no node created from a handle
  const isHandleConnectable = Boolean(isConnectable) && !isCanvasLocked;
  const canAddFromHandle =
    type === 'source' && isHandleConnectable && !isRunningPipeline && Boolean(onAddFromHandle);

  const handleAddClick = useCallback(
    event => {
      // Keep the handle's edge selection and the node selection out of this click
      event.stopPropagation();
      onAddFromHandle({ nodeId, handleId: id || null, anchorEl: event.currentTarget });
    },
    [id, nodeId, onAddFromHandle],
  );
  // Get connected edges for this handle
  const connectedEdges = useMemo(() => {
    return edges.filter(edge => {
      if (type === 'source') {
        return edge.source === nodeId && (edge.sourceHandle === id || !id || !edge.sourceHandle);
      } else {
        return edge.target === nodeId && (edge.targetHandle === id || !id || !edge.targetHandle);
      }
    });
  }, [edges, type, nodeId, id]);
  const selectedEdges = useMemo(() => connectedEdges.filter(edge => edge.selected), [connectedEdges]);

  const { setEdges } = useReactFlow();
  // Handle click to select/deselect connected edges
  const handleClick = event => {
    event.stopPropagation(); // Prevent node selection

    if (connectedEdges.length !== selectedEdges.length) {
      setEdges(currentEdges =>
        currentEdges.map(edge => {
          return connectedEdges.find(e => e.id === edge.id)
            ? { ...edge, selected: true }
            : { ...edge, selected: false };
        }),
      );
    } else {
      setEdges(currentEdges => currentEdges.map(edge => ({ ...edge, selected: false })));
    }
  };
  // Check if any edge connected to this handle is selected
  const isConnectedEdgeSelected = useMemo(() => {
    return edges.some(edge => {
      if (!edge.selected) return false;

      if (type === 'source') {
        // For source handles, check if this handle is the source of any selected edge
        return (
          edge.source === nodeId &&
          (edge.sourceHandle === id || (!id && !edge.sourceHandle) || edge.sourceHandle === undefined)
        );
      } else {
        // For target handles, check if this handle is the target of any selected edge
        return (
          edge.target === nodeId &&
          (edge.targetHandle === id || (!id && !edge.targetHandle) || edge.targetHandle === undefined)
        );
      }
    });
  }, [edges, type, nodeId, id]);

  const position = useMemo(
    () =>
      type === 'source'
        ? isHorizontal
          ? Position.Right
          : Position.Bottom
        : isHorizontal
          ? Position.Left
          : Position.Top,
    [type, isHorizontal],
  );

  const styles = customHandleStyles({
    theme,
    isHorizontal,
    offset,
    outputIndex,
    outputCount,
    isPerforming,
    isRunningPipeline,
    isConnectedEdgeSelected,
    specifiedStyle,
    isExpanded,
    canAddFromHandle,
  });

  return (
    <Handle
      type={type}
      id={id}
      style={styles.handle}
      position={position}
      isConnectable={isHandleConnectable}
      onClick={handleClick}
      data-testid={testId}
    >
      {isExpanded && (
        <>
          <Typography
            variant="labelTiny"
            color="text.secondary"
          >
            {finalLabel}
          </Typography>
          {/* Plus icon circle with connecting line for source handles when expanded */}
          {type === 'source' && !isCanvasLocked && (
            <>
              <Box sx={styles.connectorLine} />
              {/* Plus icon circle - part of the main handle's connectable area */}
              <Box
                sx={styles.plusCircle}
                onClick={canAddFromHandle ? handleAddClick : undefined}
                data-testid={`pipeline-node-add-from-output-${nodeId}${id ? `-${id}` : ''}`}
              >
                <PlusIcon style={styles.plusIcon} />
              </Box>
            </>
          )}
        </>
      )}
    </Handle>
  );
});

// Left to right, several outputs stack on the right edge below the card header (4.125rem), so they
// never cover its badges; a mini card is header only, so there they sit around its middle.
// Top to bottom they spread along the bottom edge by `offset`.
const STACKED_OUTPUT_TOP = 5.125;
const STACKED_OUTPUT_STEP = 1.625;
const MINI_OUTPUT_STEP = 1;

const getHandleOffsetStyle = ({ isHorizontal, isExpanded, offset, outputIndex, outputCount }) => {
  if (!isHorizontal) return offset ? { left: offset } : {};
  if (outputIndex === undefined) return {};
  if (isExpanded === false) {
    return { top: `calc(50% + ${(outputIndex - (outputCount - 1) / 2) * MINI_OUTPUT_STEP}rem)` };
  }
  return { top: `${STACKED_OUTPUT_TOP + outputIndex * STACKED_OUTPUT_STEP}rem` };
};

/** @type {MuiSx} */
const customHandleStyles = ({
  theme,
  isHorizontal,
  offset,
  outputIndex,
  outputCount,
  isPerforming,
  isRunningPipeline,
  isConnectedEdgeSelected,
  specifiedStyle,
  isExpanded,
  canAddFromHandle,
}) => {
  const { card } = theme.palette.components.flowEditor;
  const borderStyle = '.0625rem solid';
  const borderColor = isPerforming
    ? card.border.running
    : !isRunningPipeline && isConnectedEdgeSelected
      ? card.border.selected
      : card.handle.border;

  // Adjust handle size based on expansion state
  const handleSize = isExpanded === false ? '.75rem' : '1.5rem';
  const handlePadding = isExpanded === false ? '0rem' : '.25rem .75rem';
  const backgroundColor = isExpanded ? card.handle.background.default : card.handle.background.collapsed;

  // The "+" sits past the Output pill: below it top to bottom, right of it left to right
  const connectorLine = isHorizontal
    ? {
        top: '50%',
        left: 'calc(100% - .0625rem)',
        transform: 'translateY(-50%)',
        width: '.3125rem',
        height: '.125rem',
      }
    : { top: '1.4375rem', left: '50%', transform: 'translateX(-50%)', width: '.125rem', height: '.3125rem' };
  const plusCircle = isHorizontal
    ? { top: '50%', left: 'calc(100% + .25rem)', transform: 'translateY(-50%)' }
    : { top: '1.75rem', left: '50%', transform: 'translateX(-50%)' };

  return {
    handle: {
      width: isExpanded ? 'auto' : handleSize,
      padding: handlePadding,
      height: handleSize,
      borderRadius: isExpanded ? '1.25rem' : '.375rem',
      backgroundColor,
      border: `${borderStyle} ${borderColor}`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
      ...getHandleOffsetStyle({ isHorizontal, isExpanded, offset, outputIndex, outputCount }),
      ...(specifiedStyle || {}),
    },
    connectorLine: {
      position: 'absolute',
      ...connectorLine,
      backgroundColor: borderColor,
      borderRadius: '.0625rem',
      zIndex: 9,
    },
    plusCircle: {
      position: 'absolute',
      ...plusCircle,
      width: '1rem',
      height: '1rem',
      borderRadius: '50%',
      backgroundColor: card.handle.background.default,
      border: `${borderStyle} ${borderColor}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '.625rem',
      color: theme.palette.icon.secondary,
      zIndex: 10,
      cursor: canAddFromHandle ? 'pointer' : 'inherit',
      '&:hover': {
        borderColor: card.border.selected,
        color: theme.palette.primary.main,
      },
    },
    plusIcon: { width: '.625rem', height: '0.625rem' },
  };
};

CustomHandle.displayName = 'CustomHandle';

export default CustomHandle;
