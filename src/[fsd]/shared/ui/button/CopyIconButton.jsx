import { memo, useCallback } from 'react';

import { Box, Tooltip } from '@mui/material';

import CopyIcon from '@/components/Icons/CopyIcon';
import useToast from '@/hooks/useToast';

import BaseBtn, { BUTTON_VARIANTS } from './BaseBtn';

const CopyIconButton = memo(props => {
  const { value = '', tooltip = 'Copy to clipboard', tooltipPlacement = 'top', iconSx, sx } = props;

  const { toastSuccess, toastError } = useToast();

  const handleCopy = useCallback(() => {
    navigator.clipboard
      .writeText(value)
      .then(() => toastSuccess('Copied to clipboard.'))
      .catch(() => toastError('Failed to copy to clipboard.'));
  }, [value, toastSuccess, toastError]);

  return (
    <Tooltip
      title={tooltip}
      placement={tooltipPlacement}
    >
      <Box component={'span'}>
        <BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          size="small"
          disabled={!value}
          startIcon={<CopyIcon sx={iconSx} />}
          onClick={handleCopy}
          sx={sx}
        />
      </Box>
    </Tooltip>
  );
});

CopyIconButton.displayName = 'CopyIconButton';

export default CopyIconButton;
