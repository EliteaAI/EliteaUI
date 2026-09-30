import React, { memo } from 'react';

import { Box } from '@mui/material';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const DraggableConversationItem = memo(props => {
  const { conversation, children, isDragDisabled = false, isActive = false } = props;
  const styles = draggableConversationItemStyles();

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
      sx={styles.root(isDragDisabled)}
      className={isActive ? 'active-conversation' : ''}
    >
      {children}
    </Box>
  );
});

DraggableConversationItem.displayName = 'DraggableConversationItem';

/** @type {MuiSx} */
const draggableConversationItemStyles = () => ({
  root: isDragDisabled => ({
    position: 'relative',
    '&:active': {
      cursor: isDragDisabled ? 'default' : 'grabbing',
    },
    ...(!isDragDisabled && {
      '&:hover': {
        cursor: 'grab',
      },
    }),
    '&:has(+ .active-conversation) > *': {
      borderBottom: 'none !important',
    },
  }),
});

export default DraggableConversationItem;
