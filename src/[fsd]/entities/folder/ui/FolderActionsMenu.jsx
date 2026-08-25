import { memo } from 'react';

import { Menu, MenuItem, Typography, useTheme } from '@mui/material';

import DeleteIcon from '@/components/Icons/DeleteIcon';
import EditPenIcon from '@/components/Icons/EditPenIcon';
import PinIcon from '@/components/Icons/PinIcon';

const FolderActionsMenu = memo(props => {
  const { anchorEl, folder, onClose, onPin, onEdit, onDelete } = props;
  const theme = useTheme();
  const isPinned = !!folder?.meta?.is_pinned;

  const styles = folderActionsMenuStyles();

  return (
    <Menu
      anchorEl={anchorEl}
      open={!!anchorEl}
      onClose={onClose}
      sx={styles.menu}
    >
      <MenuItem
        data-testid="folder-menu-pin"
        onClick={onPin}
      >
        <PinIcon
          sx={styles.menuIcon}
          fill={theme.palette.icon.fill.default}
        />
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          {isPinned ? 'Unpin' : 'Pin on top'}
        </Typography>
      </MenuItem>
      <MenuItem
        data-testid="folder-menu-edit"
        onClick={onEdit}
      >
        <EditPenIcon
          sx={styles.menuIcon}
          fill={theme.palette.icon.fill.default}
        />
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Edit
        </Typography>
      </MenuItem>
      <MenuItem
        data-testid="folder-menu-delete"
        onClick={onDelete}
      >
        <DeleteIcon
          sx={styles.menuIcon}
          fill={theme.palette.icon.fill.default}
        />
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Delete
        </Typography>
      </MenuItem>
    </Menu>
  );
});

FolderActionsMenu.displayName = 'FolderActionsMenu';

/** @type {MuiSx} */
const folderActionsMenuStyles = () => ({
  menu: {
    '& .MuiList-root': {
      minWidth: '12.5rem',
      padding: '0.5rem 0',
    },
    '& .MuiMenuItem-root': {
      minHeight: '2.5rem',
      padding: '0.5rem 0.5rem 0.5rem 1.25rem',
    },
  },
  menuIcon: {
    fontSize: '1rem',
    marginRight: '0.75rem',
  },
});

export default FolderActionsMenu;
