import React, { memo } from 'react';

import { Box, alpha } from '@mui/material';

import { useDroppable } from '@dnd-kit/core';

/**
 * Droppable area for ungrouped conversations
 */
const DroppableGroupedArea = memo(props => {
  const { children, isDropDisabled = false, isValidDropTarget = true, isActive = true } = props;
  const styles = droppableGroupedAreaStyles();

  const { isOver, setNodeRef } = useDroppable({
    id: 'ungrouped-conversations',
    disabled: isDropDisabled || !isValidDropTarget,
    data: {
      type: 'ungrouped',
    },
  });

  const shouldShowDropFeedback = isOver && isActive && isValidDropTarget;

  return (
    <Box
      sx={{
        // Add padding when drag is active to ensure border has space
        padding: shouldShowDropFeedback || (isValidDropTarget && isActive && !isOver) ? '0.125rem' : 0,
        transition: 'padding 0.2s ease-in-out',
      }}
    >
      <Box
        ref={setNodeRef}
        sx={styles.dropZone}
      >
        {children}

        {/* Absolute positioned border overlay - always visible */}
        {shouldShowDropFeedback && <Box sx={styles.activeDropBorder} />}

        {/* Subtle hover state for valid drop targets */}
        {isValidDropTarget && isActive && !isOver && <Box sx={styles.validDropHint} />}

        {/* Dimmed overlay for invalid drop targets */}
        {!isValidDropTarget && isActive && <Box sx={styles.disabledOverlay} />}
      </Box>
    </Box>
  );
});

DroppableGroupedArea.displayName = 'DroppableGroupedArea';

/** @type {MuiSx} */
const droppableGroupedAreaStyles = () => ({
  dropZone: {
    position: 'relative',
    minHeight: '3.125rem',
    borderRadius: '.375rem',
    transition: 'all 0.2s ease-in-out',
  },
  activeDropBorder: ({ palette }) => ({
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    border: `.125rem dashed ${palette.primary.main}`,
    borderRadius: '.5rem',
    backgroundColor: alpha(palette.primary.main, 0.08),
    pointerEvents: 'none',
    zIndex: 999,
    boxShadow: `0 .125rem .5rem ${alpha(palette.primary.main, 0.15)}`,
  }),
  validDropHint: ({ palette }) => ({
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    border: `.0625rem solid ${palette.primary.main}30`,
    borderRadius: '.4375rem',
    backgroundColor: `${palette.primary.main}05`,
    pointerEvents: 'none',
    zIndex: 998,
  }),
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ({ palette }) => palette.background.overlay.dim,
    borderRadius: '.375rem',
    pointerEvents: 'none',
    zIndex: 997,
  },
});

export default DroppableGroupedArea;
