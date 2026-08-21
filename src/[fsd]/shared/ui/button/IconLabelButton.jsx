import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import BaseBtn, { BUTTON_VARIANTS } from './BaseBtn';

const IconLabelButton = memo(props => {
  const { label, icon, tooltip, ariaLabel, testId, disabled = false, onClick, ...restProps } = props;

  return (
    <Tooltip
      title={tooltip}
      placement="top"
    >
      {/* A disabled button emits no pointer events, so the tooltip needs this wrapper to stay live. */}
      <Box
        component="span"
        sx={{ display: 'inline-flex' }}
      >
        <BaseBtn
          variant={BUTTON_VARIANTS.iconLabel}
          size="small"
          aria-label={ariaLabel}
          data-testid={testId}
          disabled={disabled}
          onClick={onClick}
          startIcon={icon}
          {...restProps}
        >
          {label}
        </BaseBtn>
      </Box>
    </Tooltip>
  );
});

IconLabelButton.displayName = 'IconLabelButton';

export default IconLabelButton;
