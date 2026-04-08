import { forwardRef, memo, useCallback } from 'react';

import { Tooltip, Typography } from '@mui/material';

import { useTextOverflow } from '@/[fsd]/shared/lib/hooks';

/**
 * Typography component with conditional tooltip
 * Shows tooltip only when text overflows
 */

const TypographyWithConditionalTooltip = forwardRef((props, ref) => {
  const { title, placement = 'right', children, sx, enterDelay = 100, ...typographyProps } = props;
  const { textRef, isOverflowing } = useTextOverflow(title);
  const styles = typographyWithConditionalTooltipStyles();

  const handleRef = useCallback(
    el => {
      textRef.current = el;
      if (ref) {
        if (typeof ref === 'function') ref(el);
        else ref.current = el;
      }
    },
    [ref, textRef],
  );

  return (
    <Tooltip
      title={isOverflowing ? title : ''}
      enterNextDelay={enterDelay}
      placement={placement}
      disableHoverListener={!isOverflowing}
      arrow
      slotProps={{
        tooltip: { sx: styles.tooltip },
        popper: {
          sx: styles.popper,
          modifiers: [
            {
              name: 'offset',
              options: { offset: [0, 8] },
            },
          ],
        },
      }}
    >
      <Typography
        ref={handleRef}
        sx={[styles.typography, sx]}
        {...typographyProps}
      >
        {children}
      </Typography>
    </Tooltip>
  );
});

TypographyWithConditionalTooltip.displayName = 'TypographyWithConditionalTooltip';

/** @type {MuiSx} */
const typographyWithConditionalTooltipStyles = () => ({
  tooltip: () => ({
    padding: '0.25rem 0.5rem',
    maxWidth: '18.75rem',
    wordWrap: 'break-word',
  }),
  popper: ({ zIndex, vars }) => ({
    zIndex: (vars || zIndex).tooltip,
  }),
  typography: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

export default memo(TypographyWithConditionalTooltip);
