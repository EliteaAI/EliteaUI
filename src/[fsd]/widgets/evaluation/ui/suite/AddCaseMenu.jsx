import { memo, useCallback, useState } from 'react';

import { Box, Menu, MenuItem, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_COLORS } from '@/[fsd]/shared/ui/button/BaseBtn';
import ChatIcon from '@/components/Icons/ChatIcon';
import EditPenIcon from '@/components/Icons/EditPenIcon';
import FileCodeIcon from '@/components/Icons/FileCodeIcon';
import PlusIcon from '@/components/Icons/PlusIcon';

const ADD_CASE_MENU = {
  fromChatsRuns: 'fromChatsRuns',
  importFile: 'importFile',
  createManually: 'createManually',
};

const AddCaseMenu = memo(props => {
  const { onCreateManually, onImportFile, onFromChatsRuns, disabled = false } = props;

  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenMenu = useCallback(event => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleMenuItemClick = useCallback(
    menuItem => {
      handleCloseMenu();
      switch (menuItem) {
        case ADD_CASE_MENU.createManually:
          onCreateManually?.();
          break;
        case ADD_CASE_MENU.importFile:
          onImportFile?.();
          break;
        case ADD_CASE_MENU.fromChatsRuns:
          onFromChatsRuns?.();
          break;
        default:
          break;
      }
    },
    [handleCloseMenu, onCreateManually, onImportFile, onFromChatsRuns],
  );

  const styles = addCaseMenuStyles();

  return (
    <>
      <Button.BaseBtn
        color={BUTTON_COLORS.secondary}
        startIcon={<PlusIcon />}
        onClick={handleOpenMenu}
        disabled={disabled}
        sx={styles.addCaseButton}
        data-testid="add-case-button"
      >
        Case
      </Button.BaseBtn>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{
          paper: { sx: styles.menuPaper },
        }}
      >
        <MenuItem
          onClick={() => handleMenuItemClick(ADD_CASE_MENU.fromChatsRuns)}
          sx={styles.menuItem}
          data-testid="add-case-from-chats-runs"
        >
          <ChatIcon sx={styles.menuIcon} />
          <Typography sx={styles.menuText}>From chats & runs</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => handleMenuItemClick(ADD_CASE_MENU.importFile)}
          sx={styles.menuItem}
          data-testid="add-case-import-file"
        >
          <Box
            component="span"
            sx={styles.fileIcon}
          >
            <FileCodeIcon />
          </Box>
          <Typography sx={styles.menuText}>Import file</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => handleMenuItemClick(ADD_CASE_MENU.createManually)}
          sx={styles.menuItem}
          data-testid="add-case-create-manually"
        >
          <EditPenIcon sx={styles.menuIcon} />
          <Typography sx={styles.menuText}>Create manually</Typography>
        </MenuItem>
      </Menu>
    </>
  );
});

AddCaseMenu.displayName = 'AddCaseMenu';

/** @type {MuiSx} */
const addCaseMenuStyles = () => ({
  addCaseButton: ({ palette }) => ({
    alignSelf: 'flex-start',
    padding: '0.375rem 0.75rem',
    borderRadius: '1.25rem',
    borderColor: palette.border.lines,
    color: palette.text.secondary,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    fontWeight: 500,

    '& .MuiButton-startIcon svg': {
      width: '0.75rem',
      height: '0.75rem',
    },
    '& svg path': {
      fill: palette.text.secondary,
    },
    '&:hover': {
      borderColor: palette.border.lines,
      backgroundColor: palette.background.tabButton.default,
    },
  }),
  menuPaper: ({ palette }) => ({
    minWidth: '12rem',
    backgroundColor: palette.background.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
    marginTop: '0.25rem',
    marginLeft: '.25rem',

    '>ul': {
      padding: '0.25rem 0',
    },
  }),
  menuItem: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 1rem',
    backgroundColor: palette.background.secondary,
    '&:hover': {
      backgroundColor: palette.background.tabButton.default,
    },
  }),
  menuIcon: ({ palette }) => ({
    fontSize: '1rem',
    flexShrink: 0,
    '& path': {
      fill: palette.icon.fill.default,
    },
  }),
  fileIcon: ({ palette }) => ({
    display: 'inline-flex',
    flexShrink: 0,
    '& svg': {
      width: '1rem',
      height: '1rem',
    },
    '& path': {
      fill: palette.icon.fill.default,
    },
  }),
  menuText: ({ palette }) => ({
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.5rem',
    color: palette.text.secondary,
  }),
});

export default AddCaseMenu;
