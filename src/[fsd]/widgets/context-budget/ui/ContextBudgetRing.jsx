import { memo, useCallback, useRef, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';

import ContextBudgetPopover from './ContextBudgetPopover';

const RING_SIZE = 26;

const thousands = value => `${Math.round((value || 0) / 1000)}k`;

const contextRingTitle = stats => {
  const used = stats.utilizationPercentage;
  const windowLabel = stats.windowMode === 'full' ? 'Full' : 'Balanced';
  return [
    `Context window · ${windowLabel}`,
    `${used}% used (${Math.max(0, 100 - used)}% left)`,
    `${thousands(stats.currentTokens)} / ${thousands(stats.maxTokens)} tokens used`,
  ].join('\n');
};

/**
 * Chat input: a circular budget indicator that opens the full budget card in a popover above it.
 */
const ContextBudgetRing = memo(props => {
  const { stats, utilizationColor, isHighUtilization, ...popoverProps } = props;

  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const styles = contextBudgetRingStyles(isHighUtilization ? utilizationColor : null);

  const percentage = stats.utilizationPercentage;

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
        title={open ? '' : <Box sx={styles.tooltip}>{contextRingTitle(stats)}</Box>}
        placement="top"
      >
        <Box
          ref={anchorRef}
          role="button"
          tabIndex={0}
          aria-label={`Context ${percentage}% used`}
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={toggle}
          onKeyDown={handleKeyDown}
          sx={styles.ring}
          data-testid="context-budget-ring"
        >
          <CircularProgress
            variant="determinate"
            value={100}
            size={`${RING_SIZE / 16}rem`}
            thickness={4}
            sx={styles.track}
          />
          <CircularProgress
            variant="determinate"
            value={Math.min(Math.max(percentage, 2), 100)}
            size={`${RING_SIZE / 16}rem`}
            thickness={4}
            sx={styles.progress}
            data-testid="context-budget-ring-progress"
          />
          <Typography
            variant="caption"
            sx={styles.percentage}
          >
            {percentage}
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
        placement="top-end"
      />
    </>
  );
});

ContextBudgetRing.displayName = 'ContextBudgetRing';

/** @type {MuiSx} */
const contextBudgetRingStyles = alertColor => ({
  ring: ({ palette }) => ({
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: `${RING_SIZE / 16}rem`,
    height: `${RING_SIZE / 16}rem`,
    borderRadius: '50%',
    cursor: 'pointer',
    '&:focus-visible': {
      outline: `0.125rem solid ${palette.border.focus || palette.primary.main}`,
      outlineOffset: '0.125rem',
    },
  }),
  track: ({ palette }) => ({
    position: 'absolute',
    color: palette.border.lines,
  }),
  progress: ({ palette }) => ({
    position: 'absolute',
    color: alertColor || palette.icon.default,
  }),
  percentage: ({ palette }) => ({
    fontSize: '0.625rem',
    lineHeight: '0.75rem',
    color: palette.text.secondary,
  }),
  tooltip: {
    whiteSpace: 'pre-line',
  },
});

export default ContextBudgetRing;
