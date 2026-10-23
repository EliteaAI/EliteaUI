import { memo, useCallback, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import TokensIcon from '@/assets/tokens-icon.svg?react';

import ContextBudgetPopover from './ContextBudgetPopover';

/**
 * Toolbar pill: context icon + utilization %, opens the full budget card in a popover.
 */
const ContextBudgetPill = memo(props => {
  const { stats, isHighUtilization, utilizationColor, ...popoverProps } = props;

  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const styles = contextBudgetPillStyles(isHighUtilization ? utilizationColor : null);

  const { utilizationPercentage, maxTokens, messageGroups, summariesGenerated } = stats;
  const percentageLabel = maxTokens === 0 ? '-' : `${utilizationPercentage}%`;
  const tooltip = [
    `Context ${percentageLabel}`,
    `Messages ${messageGroups ?? 0}`,
    `Summaries ${summariesGenerated ?? 0}`,
  ].join(' · ');

  const toggle = useCallback(() => setOpen(prev => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      } else if (event.key === 'Escape') {
        close();
      }
    },
    [toggle, close],
  );

  return (
    <>
      <Tooltip
        title={open ? '' : tooltip}
        placement="top"
      >
        <Box
          ref={anchorRef}
          role="button"
          tabIndex={0}
          aria-label={`Context management ${percentageLabel}`}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={toggle}
          onKeyDown={handleKeyDown}
          sx={styles.pill}
          data-testid="context-budget-pill"
        >
          <TokensIcon style={styles.icon} />
          <Typography
            variant="labelSmall"
            sx={styles.label}
          >
            {percentageLabel}
          </Typography>
        </Box>
      </Tooltip>

      <ContextBudgetPopover
        {...popoverProps}
        stats={stats}
        isHighUtilization={isHighUtilization}
        anchorRef={anchorRef}
        open={open}
        onClose={close}
        placement="bottom-end"
      />
    </>
  );
});

ContextBudgetPill.displayName = 'ContextBudgetPill';

/** @type {MuiSx} */
const contextBudgetPillStyles = thresholdColor => ({
  pill: ({ palette }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.375rem',
    height: '1.75rem',
    padding: '0 0.75rem',
    borderRadius: '1rem',
    cursor: 'pointer',
    color: thresholdColor || palette.icon.secondary,
    backgroundColor: palette.components.button.background.secondary.default,
    '&:hover': {
      backgroundColor: palette.components.button.background.secondary.hover,
    },
    '&:active': {
      backgroundColor: palette.components.button.background.secondary.pressed,
    },
    '&:focus-visible': {
      outline: `0.125rem solid ${palette.border.focus || palette.primary.main}`,
      outlineOffset: '0.125rem',
    },
  }),
  // SVGR icon: plain style object, not sx
  icon: {
    width: '0.75rem',
    height: '0.875rem',
  },
  label: ({ palette }) => ({
    color: thresholdColor || palette.text.secondary,
  }),
});

export default ContextBudgetPill;
