import { useMemo } from 'react';

import { useTheme } from '@mui/material';

const DARK_PROPS = { primary: { variant: 'positive' }, secondary: { variant: 'neutral' } };
const LIGHT_PROPS = {
  primary: { variant: 'elitea', color: 'primary' },
  secondary: { variant: 'elitea', color: 'secondary' },
};

/**
 * The button props of the Action needed card. The dark theme reuses the chat authorization prompt look
 * (green and blue); the light theme uses the standard page buttons (primary and secondary), like Save and Cancel.
 */
export const useActionButtonProps = () => {
  const { palette } = useTheme();
  return useMemo(() => (palette.mode === 'dark' ? DARK_PROPS : LIGHT_PROPS), [palette.mode]);
};
