import { useMemo } from 'react';

import { Box } from '@mui/material';

import PinIconFilled from '@/assets/pin-filled-icon.svg?react';
import PinIconOutlined from '@/assets/pin-icon.svg?react';

export const usePinMenu = props => {
  const { isPinned, onTogglePin, isLoading } = props;

  const menuItem = useMemo(
    () => ({
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
    [isPinned, isLoading, onTogglePin],
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
