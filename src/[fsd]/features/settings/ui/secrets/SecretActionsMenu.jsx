import { memo } from 'react';

import { Menu, MenuItem, Typography, useTheme } from '@mui/material';

import DeleteIcon from '@/components/Icons/DeleteIcon.jsx';
import EditPenIcon from '@/components/Icons/EditPenIcon.jsx';
import LockSimple from '@/components/Icons/LockSimple.jsx';

const SecretActionsMenu = memo(({ rowId, isNew, isDefault, anchorEl, onClose, onEdit, onHide, onDelete }) => {
  const theme = useTheme();

  return (
    <Menu
      id={`basic-menu-${rowId}`}
      anchorEl={anchorEl}
      open={!!anchorEl}
      onClose={onClose}
      slotProps={{
        list: {
          'aria-labelledby': 'basic-button',
        },
      }}
      sx={{
        '& .MuiList-root': {
          minWidth: '12.5rem',
          padding: '0.5rem 0',
        },
        '& .MuiMenuItem-root': {
          minHeight: '2.5rem',
          padding: '0.5rem 0.5rem 0.5rem 1.25rem',
        },
      }}
    >
      <MenuItem
        onClick={onEdit}
        disabled={isDefault}
      >
        <EditPenIcon
          sx={{ fontSize: '1rem', marginRight: '0.75rem' }}
          fill={theme.palette.icon.fill.default}
        />
        <Typography
          variant="labelMedium"
          color="text.secondary"
        >
          Edit value
        </Typography>
      </MenuItem>
      {!isNew && (
        <MenuItem
          onClick={onHide}
          disabled={isDefault}
        >
          <LockSimple
            sx={{ fontSize: '1rem', marginRight: '0.75rem' }}
            fill={theme.palette.icon.fill.default}
          />
          <Typography
            variant="labelMedium"
            color="text.secondary"
          >
            Hide
          </Typography>
        </MenuItem>
      )}
      <MenuItem
        onClick={onDelete}
        disabled={isDefault}
      >
        <DeleteIcon
          sx={{ fontSize: '1rem', marginRight: '0.75rem' }}
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

SecretActionsMenu.displayName = 'SecretActionsMenu';

export default SecretActionsMenu;
