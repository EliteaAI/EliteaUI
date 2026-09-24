import { memo } from 'react';

import { Box } from '@mui/material';

// Fixed-size icon slot for menu items; accepts both SVGR icons and SvgIcon components.
const MenuItemIcon = memo(props => {
  const { icon: IconComponent } = props;

  const styles = menuItemIconStyles();

  return (
    <Box sx={styles.root}>
      <IconComponent style={styles.icon} />
    </Box>
  );
});

MenuItemIcon.displayName = 'MenuItemIcon';

/** @type {MuiSx} */
const menuItemIconStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '1rem',
    height: '1rem',
    color: palette.icon.default,
  }),
  // Plain style object: SVGR icons don't support sx.
  icon: {
    fontSize: '1rem',
  },
});

export default MenuItemIcon;
