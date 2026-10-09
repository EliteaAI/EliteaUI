import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import CloseIcon from '@/components/Icons/CloseIcon';

const SwitchToModelButton = memo(props => {
  const { onClick, disabled, testId } = props;

  const styles = switchToModelButtonStyles();

  return (
    <Tooltip
      placement="top"
      title="Switch to model"
    >
      <Box
        component="span"
        sx={styles.anchor}
      >
        <Button.BaseBtn
          variant={BUTTON_VARIANTS.tertiary}
          startIcon={<CloseIcon sx={styles.icon} />}
          aria-label="switch to model"
          data-testid={testId}
          disabled={disabled}
          onClick={onClick}
        />
      </Box>
    </Tooltip>
  );
});

SwitchToModelButton.displayName = 'SwitchToModelButton';

/** @type {MuiSx} */
const switchToModelButtonStyles = () => ({
  anchor: {
    display: 'inline-flex',
    flexShrink: 0,
  },
  icon: {
    fontSize: '1rem',
  },
});

export default SwitchToModelButton;
