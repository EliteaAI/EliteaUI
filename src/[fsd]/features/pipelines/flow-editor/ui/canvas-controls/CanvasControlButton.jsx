import { forwardRef, memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

const CanvasControlButton = memo(
  forwardRef((props, ref) => {
    const { title, icon, onClick, disabled, isActive = false, testId, ...restProps } = props;

    const styles = canvasControlButtonStyles(isActive);

    return (
      <Tooltip
        title={title}
        placement="right"
      >
        <Box
          component="span"
          sx={styles.wrapper}
        >
          <Button.BaseBtn
            ref={ref}
            variant={BUTTON_VARIANTS.tertiary}
            startIcon={icon}
            onClick={onClick}
            disabled={disabled}
            aria-label={title}
            data-testid={testId}
            sx={styles.button}
            {...restProps}
          />
        </Box>
      </Tooltip>
    );
  }),
);

CanvasControlButton.displayName = 'CanvasControlButton';

/** @type {MuiSx} */
const canvasControlButtonStyles = isActive => ({
  wrapper: {
    display: 'inline-flex',
  },
  button: ({ palette }) => ({
    width: '2rem',
    height: '2rem',
    minWidth: '2rem',
    padding: 0,
    borderRadius: '0.375rem',
    color: isActive ? palette.icon.secondary : palette.icon.default,
    '&:hover': {
      color: palette.icon.secondary,
    },
    '& .MuiButton-startIcon': {
      margin: 0,
    },
    '& svg': {
      width: '1rem',
      height: '1rem',
    },
  }),
});

export default CanvasControlButton;
