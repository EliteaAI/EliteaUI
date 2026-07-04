import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

import BaseBtn from './BaseBtn';

const CopyToClipboardButton = memo(props => {
  const { label, value, tooltip, copyMessage, 'data-testid': dataTestId } = props;
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
        <BaseBtn
          variant="elitea"
          color="tertiary"
          onClick={onClick}
          data-testid={dataTestId}
        >
          <Typography
            color={theme.palette.text.secondary}
            variant="bodyMedium"
          >
            {value}
          </Typography>
        </BaseBtn>
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
