import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CloseIcon from '@/assets/close-icon.svg?react';
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
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.icon}
          onClick={onClose}
          sx={styles.closeButton}
          data-testid="folder-view-close-btn"
        >
          <Box
            component={CloseIcon}
            sx={styles.closeIcon}
          />
        </Button.BaseBtn>
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
    padding: '0 1rem 0.75rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  folderInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    minWidth: 0,
    overflow: 'hidden',
  },
  folderIcon: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.fill.default,
    flexShrink: 0,
  }),
  folderName: ({ palette }) => ({
    color: palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginLeft: '0.5rem',
  }),
  count: ({ palette }) => ({
    color: palette.text.primary,
    flexShrink: 0,
  }),
  closeButton: ({ palette }) => ({
    color: palette.icon.fill.default,
    backgroundColor: 'transparent',
    '&:hover': {
      color: palette.icon.fill.secondary,
      backgroundColor: palette.background.button.secondary.default,
    },
  }),
  closeIcon: {
    width: '0.75rem !important',
    height: '0.75rem !important',
  },
});

export default FolderViewHeader;
