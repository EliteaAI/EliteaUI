import React from 'react';

import { Box, useTheme } from '@mui/material';

import { useDroppable } from '@dnd-kit/core';

/**
 * Droppable area for ungrouped conversations
 */
const DroppableUngroupedArea = ({
  children,
  isDropDisabled = false,
  isValidDropTarget = true,
  isActive = true,
}) => {
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
          minHeight: '50px',
          borderRadius: '6px',
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
              border: `2px dashed ${theme.palette.primary.main}`,
              borderRadius: '8px',
              backgroundColor: `${theme.palette.primary.main}15`,
              pointerEvents: 'none',
              zIndex: 999, // Very high z-index to ensure it's always on top
              boxShadow: `0 2px 8px ${theme.palette.primary.main}25`, // Subtle glow
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
              border: `1px solid ${theme.palette.primary.main}30`,
              borderRadius: '7px',
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
              borderRadius: '6px',
              pointerEvents: 'none',
              zIndex: 997,
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default DroppableUngroupedArea;
