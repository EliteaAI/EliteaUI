import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import FolderIcon from '@/components/Icons/FolderIcon';

const FolderItem = memo(props => {
  const { folder, isSelected, onClick } = props;

  const styles = folderItemStyles(isSelected);

  const handleClick = useCallback(() => {
    onClick?.(folder);
  }, [folder, onClick]);

  return (
    <Box
      sx={styles.container}
      onClick={handleClick}
      data-testid={`folder-item-${folder.id}`}
    >
      <FolderIcon sx={styles.icon} />
      <Typography
        variant="labelSmall"
        sx={styles.name}
      >
        {folder.name}
      </Typography>
      {folder.entities_count != null && (
        <Typography
          variant="labelSmall"
          sx={styles.count}
        >
          {folder.entities_count}
        </Typography>
      )}
    </Box>
  );
});

FolderItem.displayName = 'FolderItem';

/** @type {MuiSx} */
const folderItemStyles = isSelected => ({
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    backgroundColor: isSelected ? palette.background.tabButton.active : 'transparent',
    '&:hover': {
      backgroundColor: palette.background.tabButton.hover,
    },
  }),
  icon: ({ palette }) => ({
    fontSize: '1rem',
    color: isSelected ? palette.primary.main : palette.icon.fill.secondary,
    flexShrink: 0,
  }),
  name: ({ palette }) => ({
    color: isSelected ? palette.text.primary : palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  }),
  count: ({ palette }) => ({
    color: palette.text.secondary,
    flexShrink: 0,
  }),
});

export default FolderItem;
