import { useMemo } from 'react';

import { Box } from '@mui/material';

import PinIconFilled from '@/assets/pin-filled-icon.svg?react';
import PinIconOutlined from '@/assets/pin-icon.svg?react';

export const usePinMenu = props => {
  const { isPinned, onTogglePin, isLoading, key } = props;

  const menuItem = useMemo(
    () => ({
      // Optional caller-supplied `key` (ELITEA-2049) — DotMenu.jsx wires
      // `testId: item.key`, so without a `key` this item never renders a
      // `data-testid`. Default stays `undefined` to preserve existing
      // behaviour for the other usePinMenu() callers (SkillControls.jsx,
      // ToolkitsControls.jsx, CredentialsControls.jsx) that don't pass one —
      // same multi-caller shape as ForkEntityButton.jsx's
      // FORK_MENU_ITEM_KEY_BY_ENTITY map.
      ...(key ? { key } : {}),
      label: isPinned ? 'Unpin from top' : 'Pin to top',
      icon: (
        <Box sx={pinMenuIconStyles.container}>
          {isPinned ? (
            <PinIconFilled sx={pinMenuIconStyles.icon} />
          ) : (
            <PinIconOutlined sx={pinMenuIconStyles.icon} />
          )}
        </Box>
      ),
      disabled: isLoading,
      onClick: onTogglePin,
    }),
    [isPinned, isLoading, onTogglePin, key],
  );

  return {
    pinMenuItem: menuItem,
  };
};

/** @type {MuiSx} */
const pinMenuIconStyles = {
  container: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: palette.icon.fill.default,
  }),
  icon: {
    fontSize: '1rem',
  },
};
