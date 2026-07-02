import { memo } from 'react';

import DotMenu from '@/components/DotMenu';
import HeaderContainer from '@/components/HeaderContainer';

const ControlsDropdown = memo(({ menuItems = [], anchorButtonProps = {} }) => {
  const styles = controlsDropdownStyles();

  return (
    <HeaderContainer
      sx={{
        button: ({ palette }) => ({
          background: palette.background.userInputBackgroundActive,

          ':hover': {
            background: palette.background.button.secondary.hover,
          },
        }),
      }}
    >
      {menuItems.length > 0 && (
        <DotMenu
          sx={{ backrgound: 'red !important' }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          anchorButtonProps={anchorButtonProps}
          slotProps={{
            Paper: {
              sx: styles.menuPaper,
            },
            ListItemText: {
              sx: styles.listItemText,
              primaryTypographyProps: { variant: 'bodyMedium' },
            },
            ListItemIcon: {
              sx: styles.listItemIcon,
            },
          }}
        >
          {menuItems}
        </DotMenu>
      )}
    </HeaderContainer>
  );
});

ControlsDropdown.displayName = 'ControlsDropdown';

/** @type {MuiSx} */
const controlsDropdownStyles = () => ({
  menuPaper: {
    background: 'red !important',
  },
  listItemText: ({ palette }) => ({ color: palette.text.secondary }),
  listItemIcon: {
    minWidth: '1rem !important',
    marginRight: '.75rem',
  },
});

export default ControlsDropdown;
