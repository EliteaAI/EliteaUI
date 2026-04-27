import { memo, useCallback } from 'react';

import { Box, Button, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

const CopyToClipboardButton = memo(props => {
  const { label, value, tooltip, copyMessage } = props;
  const theme = useTheme();
  const { toastInfo } = useToast();

  const onClick = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    toastInfo(copyMessage);
  }, [copyMessage, toastInfo, value]);

  return (
    <Box sx={styles.container}>
      <Typography variant="bodyMedium">{label}</Typography>
      <StyledTooltip
        title={tooltip}
        placement="top"
      >
        <Button
          variant="alita"
          color="tertiary"
          onClick={onClick}
        >
          <Typography
            color={theme.palette.text.secondary}
            variant="bodyMedium"
          >
            {value}
          </Typography>
        </Button>
      </StyledTooltip>
    </Box>
  );
});

CopyToClipboardButton.displayName = 'CopyToClipboardButton';

/** @type {MuiSx} */
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.25rem',
  },
};

export default CopyToClipboardButton;
