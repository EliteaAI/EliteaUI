import { memo } from 'react';

import { MenuItem, Typography } from '@mui/material';

const SkillRowMenuItem = memo(props => {
  const { icon, label, onClick, disabled } = props;
  const styles = skillRowMenuItemStyles();

  return (
    <MenuItem
      onClick={onClick}
      sx={styles.menuItem}
      disabled={disabled}
    >
      {icon}
      <Typography variant="labelMedium">{label}</Typography>
    </MenuItem>
  );
});

SkillRowMenuItem.displayName = 'SkillRowMenuItem';

export default SkillRowMenuItem;

/** @type {MuiSx} */
export const skillRowMenuItemStyles = () => ({
  menuItem: ({ palette }) => ({
    minWidth: '13.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 1.25rem',
    '& .MuiTypography-root': {
      color: palette.text.secondary,
    },
  }),
});
