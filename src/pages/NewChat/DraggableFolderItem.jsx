import React from 'react';

import { Box } from '@mui/material';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DraggableFolderItem = props => {
  const { folder, children, isDragDisabled = false } = props;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: `folder-${folder.id}`,
    disabled: isDragDisabled || folder.isNew,
    data: {
      type: 'folder',
      folder,
    },
  });

  const styles = draggableFolderItemStyles({
    isDragging,
    isDragDisabled,
    folder,
    transform,
  });

  const dragStyle = styles.getDragStyle;

  return (
    <Box
      ref={setNodeRef}
      style={dragStyle}
      {...attributes}
      {...listeners}
      sx={styles.container}
    >
      {children}
      {isDragging && <Box sx={styles.dragOverlay} />}
    </Box>
  );
};

export default DraggableFolderItem;

const draggableFolderItemStyles = ({ isDragging, isDragDisabled, folder, transform }) => ({
  container: {
    position: 'relative',
    '&:active': {
      cursor: isDragDisabled || folder.isNew ? 'default' : 'grabbing',
    },
    userSelect: 'none',
    WebkitUserSelect: 'none',
  },
  getDragStyle: {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragDisabled || folder.isNew ? 'default' : 'grab',
    transition: isDragging
      ? 'opacity 0.2s ease-in-out'
      : 'opacity 0.2s ease-in-out, transform 0.2s ease-in-out',
    zIndex: isDragging ? 1000 : 'auto',
  },
  dragOverlay: ({ palette }) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    border: `2px dashed ${palette.primary.main}`,
    borderRadius: '6px',
    backgroundColor: `${palette.primary.main}10`,
    pointerEvents: 'none',
    zIndex: 1000,
  }),
});
