import React from 'react';

import { Box } from '@mui/material';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

/**
 * Wrapper component to make conversation items draggable
 */
const DraggableConversationItem = ({ conversation, children, isDragDisabled = false, isActive = false }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: conversation.id,
    disabled: isDragDisabled, // Don't disable for active conversations, only for explicit reasons
    data: {
      type: 'conversation',
      conversation,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragDisabled ? 'default' : 'grab',
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      sx={{
        position: 'relative',
        '&:active': {
          cursor: isDragDisabled ? 'default' : 'grabbing',
        },
        // Add visual feedback for draggable items
        ...(!isDragDisabled && {
          '&:hover': {
            cursor: 'grab',
          },
        }),
        '&:has(+ .active-conversation) > *': {
          borderBottom: 'none !important',
        },
      }}
      className={isActive ? 'active-conversation' : ''}
    >
      {children}
    </Box>
  );
};

export default DraggableConversationItem;
