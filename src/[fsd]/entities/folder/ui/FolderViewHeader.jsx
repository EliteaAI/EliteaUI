import { memo } from 'react';

import CloseIcon from '@mui/icons-material/Close';
import { Box, IconButton, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import FolderIcon from '@/components/Icons/FolderIcon';

const FolderViewHeader = memo(props => {
  const { folder, entitiesCount = 0, onClose } = props;

  const styles = folderViewHeaderStyles();

  if (!folder) return null;

  return (
    <Box sx={styles.container}>
      <Box sx={styles.folderInfo}>
        <FolderIcon sx={styles.folderIcon} />
        <Typography
          variant="headingSmall"
          sx={styles.folderName}
        >
          {folder.name}
        </Typography>
        <Typography
          variant="bodyMedium"
          sx={styles.count}
        >
          ({entitiesCount})
        </Typography>
      </Box>
      <StyledTooltip
        title="Close folder"
        placement="top"
      >
        <IconButton
          onClick={onClose}
          sx={styles.closeButton}
          data-testid="folder-view-close-btn"
        >
          <CloseIcon sx={styles.closeIcon} />
        </IconButton>
      </StyledTooltip>
    </Box>
  );
});

FolderViewHeader.displayName = 'FolderViewHeader';

/** @type {MuiSx} */
const folderViewHeaderStyles = () => ({
  container: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  folderInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
    overflow: 'hidden',
  },
  folderIcon: ({ palette }) => ({
    fontSize: '1.25rem',
    color: palette.icon.fill.default,
    flexShrink: 0,
  }),
  folderName: ({ palette }) => ({
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  count: ({ palette }) => ({
    color: palette.text.primary,
    flexShrink: 0,
  }),
  closeButton: ({ palette }) => ({
    padding: '0.25rem',
    color: palette.icon.fill.default,
    '&:hover': {
      backgroundColor: palette.background.button.secondary.default,
    },
  }),
  closeIcon: {
    fontSize: '1.25rem',
  },
});

export default FolderViewHeader;
