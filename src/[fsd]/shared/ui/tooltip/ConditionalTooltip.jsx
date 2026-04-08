import { memo } from 'react';

import { Box, Tooltip } from '@mui/material';

import { useTextOverflow } from '@/[fsd]/shared/lib/hooks';

/**
 * Conditional Tooltip Component (Legacy support)
 * Only shows tooltip when text is actually truncated
 */
const ConditionalTooltip = memo(props => {
  const { children, title, placement = 'right', ...tooltipProps } = props;
  const { textRef, isOverflowing } = useTextOverflow(title);

  const styles = conditionalTooltipStyles();

  return (
    <Tooltip
      arrow
      title={isOverflowing ? title : ''}
      placement={placement}
      disableHoverListener={!isOverflowing}
      slotProps={{
        tooltip: {
          sx: styles.tooltip,
        },
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
      {...tooltipProps}
    >
      <Box
        component="span"
        ref={textRef}
        sx={styles.span}
      >
        {children}
      </Box>
    </Tooltip>
  );
});

/** @type {MuiSx} */
const conditionalTooltipStyles = () => ({
  tooltip: ({ palette, typography }) => ({
    backgroundColor: palette.background.tooltip.default,
    color: palette.text.button.primary,
    fontStyle: 'normal',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    maxWidth: '18.75rem',
    margin: '0.125rem',
    wordWrap: 'break-word',
    ...typography.labelSmall,
    '& .MuiTooltip-arrow': {
      color: palette.background.tooltip.default,
    },
  }),
  popper: ({ zIndex, vars }) => ({
    zIndex: (vars || zIndex).tooltip,
  }),
  span: {
    display: 'inline-block',
    maxWidth: '100%',
    overflow: 'hidden',
  },
});

ConditionalTooltip.displayName = 'ConditionalTooltip';
export default ConditionalTooltip;
