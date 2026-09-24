import React, { memo } from 'react';

import { Box } from '@mui/material';

import { useDroppable } from '@dnd-kit/core';

import { getDropTargetStyles } from '../../lib/helpers';

const DroppableFolderItem = memo(props => {
  const { folder, children, isDropDisabled = false, isValidDropTarget = true, isActive = true } = props;
  const styles = droppableFolderItemStyles();

  const { isOver, setNodeRef } = useDroppable({
    id: `folder-${folder.id}`,
    disabled: isDropDisabled || !isValidDropTarget,
    data: {
      type: 'folder',
      folder,
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

DroppableFolderItem.displayName = 'DroppableFolderItem';

/** @type {MuiSx} */
const droppableFolderItemStyles = () =>
  getDropTargetStyles({
    glowShadow: '0 0.25rem 0.75rem',
    glowAlpha: 0.19,
    hintBorderAlpha: 0.25,
    hintBackgroundAlpha: 0.03,
  });

export default DroppableFolderItem;
