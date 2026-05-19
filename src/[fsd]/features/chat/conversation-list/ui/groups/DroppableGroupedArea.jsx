import React, { memo } from 'react';

import { Box, useTheme } from '@mui/material';

import { useDroppable } from '@dnd-kit/core';

/**
 * Droppable area for ungrouped conversations
 */
const DroppableGroupedArea = memo(props => {
  const { children, isDropDisabled = false, isValidDropTarget = true, isActive = true } = props;

  const theme = useTheme();
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
        padding: shouldShowDropFeedback || (isValidDropTarget && isActive && !isOver) ? '2px' : '0px',
        transition: 'padding 0.2s ease-in-out',
      }}
    >
      <Box
        ref={setNodeRef}
        sx={{
          position: 'relative',
          minHeight: '3.125rem',
          borderRadius: '.375rem',
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {children}

        {/* Absolute positioned border overlay - always visible */}
        {shouldShowDropFeedback && (
          <Box
            sx={{
              position: 'absolute',
              top: -2,
              left: -2,
              right: -2,
              bottom: -2,
              border: `.125rem dashed ${theme.palette.primary.main}`,
              borderRadius: '.5rem',
              backgroundColor: `${theme.palette.primary.main}15`,
              pointerEvents: 'none',
              zIndex: 999, // Very high z-index to ensure it's always on top
              boxShadow: `0 .125rem .5rem ${theme.palette.primary.main}25`, // Subtle glow
            }}
          />
        )}

        {/* Subtle hover state for valid drop targets */}
        {isValidDropTarget && isActive && !isOver && (
          <Box
            sx={{
              position: 'absolute',
              top: -1,
              left: -1,
              right: -1,
              bottom: -1,
              border: `.0625rem solid ${theme.palette.primary.main}30`,
              borderRadius: '.4375rem',
              backgroundColor: `${theme.palette.primary.main}05`,
              pointerEvents: 'none',
              zIndex: 998,
            }}
          />
        )}

        {/* Dimmed overlay for invalid drop targets */}
        {!isValidDropTarget && isActive && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.3)',
              borderRadius: '.375rem',
              pointerEvents: 'none',
              zIndex: 997,
            }}
          />
        )}
      </Box>
    </Box>
  );
});

DroppableGroupedArea.displayName = 'DroppableGroupedArea';

export default DroppableGroupedArea;
