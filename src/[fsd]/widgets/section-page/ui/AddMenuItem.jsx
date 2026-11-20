import { memo, useCallback } from 'react';

import { ListItemIcon, MenuItem, Typography } from '@mui/material';

const AddMenuItem = memo(props => {
  const { icon, label, onSelect, onClose, testId } = props;

  const handleClick = useCallback(() => {
    onClose?.();
    onSelect();
  }, [onClose, onSelect]);

  const styles = addMenuItemStyles();

  return (
    <MenuItem
      onClick={handleClick}
      data-testid={testId}
    >
      <ListItemIcon sx={styles.icon}>{icon}</ListItemIcon>
      <Typography
        variant="bodyMedium"
        sx={styles.label}
      >
        {label}
      </Typography>
    </MenuItem>
  );
});

AddMenuItem.displayName = 'AddMenuItem';

/** @type {MuiSx} */
const addMenuItemStyles = () => ({
  icon: ({ palette }) => ({
    minWidth: '1.75rem !important',
    '& svg': { width: '1rem', height: '1rem' },
    '& path': { fill: palette.icon.default },
  }),
  label: ({ palette }) => ({
    color: palette.text.secondary,
  }),
});

export default AddMenuItem;
