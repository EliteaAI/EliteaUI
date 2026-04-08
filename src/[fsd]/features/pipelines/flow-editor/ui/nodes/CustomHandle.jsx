import { memo, useMemo } from 'react';

import { Box, Typography, useTheme } from '@mui/material';

import { FlowEditorConstants } from '@/[fsd]/features/pipelines/flow-editor/lib/constants';
import { useNodeCardContext } from '@/[fsd]/features/pipelines/flow-editor/lib/hooks';
import PlusIcon from '@/assets/plus-icon.svg?react';
import { Handle, Position, useEdges, useNodeId, useReactFlow } from '@xyflow/react';

const CustomHandle = memo(props => {
  const {
    type,
    id,
    isConnectable,
    label = '',
    orientation = FlowEditorConstants.ORIENTATION.vertical,
    isRunningPipeline,
    isPerforming,
    style: specifiedStyle = {},
  } = props;

  const theme = useTheme();
  const nodeId = useNodeId();
  const edges = useEdges();
  const finalLabel = useMemo(() => label || (type === 'source' ? 'Output' : 'Input'), [label, type]);

  // Get isExpanded from NodeCard context (null if not within NodeCard)
  const nodeCardContext = useNodeCardContext();
  const isExpanded = nodeCardContext?.isExpanded;
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
        ? orientation === FlowEditorConstants.ORIENTATION.horizontal
          ? Position.Right
          : Position.Bottom
        : orientation === FlowEditorConstants.ORIENTATION.horizontal
          ? Position.Left
          : Position.Top,
    [type, orientation],
  );

  const styles = customHandleStyles({
    theme,
    orientation,
    isPerforming,
    isRunningPipeline,
    isConnectedEdgeSelected,
    specifiedStyle,
    isExpanded,
  });

  return (
    <Handle
      type={type}
      id={id}
      style={styles.handle}
      position={position}
      isConnectable={isConnectable}
      onClick={handleClick}
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
          {type === 'source' && (
            <>
              {/* Connecting vertical line */}
              <Box sx={styles.verticalLineStyles} />
              {/* Plus icon circle - part of the main handle's connectable area */}
              <Box sx={styles.plusCircle}>
                <PlusIcon style={styles.plusIcon} />
              </Box>
            </>
          )}
        </>
      )}
    </Handle>
  );
});

const customHandleStyles = ({
  theme,
  orientation,
  isPerforming,
  isRunningPipeline,
  isConnectedEdgeSelected,
  specifiedStyle,
  isExpanded,
}) => {
  const borderStyle = isPerforming ? '.125rem dashed' : '.0625rem solid';
  const borderColor =
    isPerforming || (!isRunningPipeline && isConnectedEdgeSelected)
      ? theme.palette.primary.main
      : theme.palette.border.flowNode;

  // Adjust handle size based on expansion state
  const handleSize = isExpanded === false ? '.75rem' : '1.5rem';
  const handlePadding = isExpanded === false ? '0rem' : '.25rem .75rem';
  const backgroundColor = isExpanded ? theme.palette.background.chatBkg : theme.palette.border.flowNode;

  return {
    handle:
      orientation === FlowEditorConstants.ORIENTATION.horizontal
        ? {
            width: handleSize,
            padding: handlePadding,
            height: 'auto',
            borderRadius: '1.25rem',
            backgroundColor,
            border: `${borderStyle} ${borderColor}`,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2,
            ...(specifiedStyle || {}),
          }
        : {
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
            ...(specifiedStyle || {}),
          },
    verticalLineStyles: {
      position: 'absolute',
      top: '1.4375rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '.125rem',
      height: '.3125rem',
      backgroundColor: borderColor,
      borderRadius: '.0625rem',
      zIndex: 9,
    },
    plusCircle: {
      position: 'absolute',
      top: '1.75rem',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '1rem',
      height: '1rem',
      borderRadius: '50%',
      backgroundColor: theme.palette.background.chatBkg,
      border: `${borderStyle} ${borderColor}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '.625rem',
      color: theme.palette.text.secondary,
      zIndex: 10,
      '&:hover': {
        borderColor: theme.palette.primary.main,
        color: theme.palette.primary.main,
      },
    },
    plusIcon: { width: '.625rem', height: '10px' },
  };
};

CustomHandle.displayName = 'CustomHandle';

export default CustomHandle;
