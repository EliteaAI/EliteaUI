import { memo, useCallback, useState } from 'react';

import { Box, Menu } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import MoveTo from '@/components/Icons/MoveTo';

import { useFolderMenuActions } from '../lib/hooks';
import CreateFolderDialog from './CreateFolderDialog';
import FolderMenuContent from './FolderMenuContent';

const MoveToFolderButton = memo(props => {
  const { entityId, entityType, currentFolderId, isVisible = false } = props;

  const styles = moveToFolderButtonStyles();

  const [anchorEl, setAnchorEl] = useState(null);
  const isMenuOpen = Boolean(anchorEl);

  const handleButtonClick = useCallback(event => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(event => {
    event?.stopPropagation?.();
    setAnchorEl(null);
  }, []);

  const {
    folderEntityType,
    folders,
    isLoading,
    createDialogOpen,
    handleFolderClick,
    handleRemoveFromFolder,
    handleCreateFolderClick,
    handleFolderCreated,
    handleCloseCreateDialog,
  } = useFolderMenuActions({ entityId, entityType, currentFolderId, onAction: handleMenuClose });

  const buttonStyles = moveToFolderButtonVisibilityStyles(isVisible || isMenuOpen);

  if (!folderEntityType) return null;

  return (
    <>
      <StyledTooltip
        title="Move to folder"
        placement="top"
        enterDelay={1000}
        enterNextDelay={1000}
      >
        <Box component="span">
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.icon}
            onClick={handleButtonClick}
            disabled={isLoading}
            sx={buttonStyles.button}
            data-testid={`move-to-folder-btn-${entityId}`}
          >
            <MoveTo sx={{ fontSize: '1rem' }} />
          </Button.BaseBtn>
        </Box>
      </StyledTooltip>

      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        onClick={e => e.stopPropagation()}
        slotProps={{
          paper: { sx: styles.menuPaper },
          list: { sx: styles.menuList },
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <FolderMenuContent
          folders={folders}
          currentFolderId={currentFolderId}
          onCreateClick={handleCreateFolderClick}
          onFolderClick={handleFolderClick}
          onRemoveClick={handleRemoveFromFolder}
        />
      </Menu>

      <CreateFolderDialog
        open={createDialogOpen}
        onClose={handleCloseCreateDialog}
        onFolderCreated={handleFolderCreated}
        entityType={folderEntityType}
      />
    </>
  );
});

MoveToFolderButton.displayName = 'MoveToFolderButton';

/** @type {MuiSx} */
const moveToFolderButtonVisibilityStyles = isVisible => ({
  button: ({ palette }) => ({
    width: '1.75rem',
    height: '1.75rem',
    minWidth: '1.75rem',
    padding: 0,
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.2s ease-in-out',
    color: palette.icon.fill.default,
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: palette.background.button.secondary.default,
    },
  }),
});

/** @type {MuiSx} */
const moveToFolderButtonStyles = () => ({
  menuPaper: ({ palette }) => ({
    minWidth: '12rem',
    maxWidth: '18rem',
    backgroundColor: palette.background.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
  }),
  menuList: {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '20rem',
  },
});

export default MoveToFolderButton;
