import React, { memo } from 'react';

import { Box } from '@mui/material';

import { useDroppable } from '@dnd-kit/core';

import { getDropTargetStyles } from '../../lib/helpers';

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
    <Box sx={styles.wrapper(shouldShowDropFeedback || (isValidDropTarget && isActive && !isOver))}>
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
const droppableGroupedAreaStyles = () =>
  getDropTargetStyles({
    minHeight: '3.125rem',
    glowShadow: '0 0.125rem 0.5rem',
    glowAlpha: 0.15,
    hintBorderAlpha: 0.19,
    hintBackgroundAlpha: 0.02,
  });

export default DroppableGroupedArea;
