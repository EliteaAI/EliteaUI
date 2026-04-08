import { memo } from 'react';

import { Box, IconButton, Tooltip, useTheme } from '@mui/material';

import ClearIcon from '@/components/Icons/ClearIcon';

const ClearChatButton = memo(({ disabled, onClear }) => {
  const theme = useTheme();

  return (
    <Tooltip
      placement="top"
      title="Clear the chat"
    >
      <Box component="span">
        <IconButton
          variant="elitea"
          color="secondary"
          aria-label="clear the chat"
          disabled={disabled}
          onClick={onClear}
          sx={styles.button}
        >
          <ClearIcon
            sx={styles.icon}
            fill={theme.palette.icon.fill.secondary}
          />
        </IconButton>
      </Box>
    </Tooltip>
  );
});

/** @type {MuiSx} */
const styles = {
  button: {
    marginLeft: '0rem',
  },
  icon: {
    fontSize: 16,
  },
};

ClearChatButton.displayName = 'ClearChatButton';

export default ClearChatButton;
