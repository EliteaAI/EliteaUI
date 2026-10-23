import { memo, useCallback, useRef, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';

import ContextBudgetPopover from './ContextBudgetPopover';

const RING_SIZE = 30;

/**
 * Collapsed participants panel: a circular budget indicator that opens the full budget card in a popover.
 */
const ContextBudgetRing = memo(props => {
  const { stats, utilizationColor, ...popoverProps } = props;

  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const styles = contextBudgetRingStyles(utilizationColor);

  const percentage = stats.utilizationPercentage;
  const windowLabel = stats.windowMode === 'full' ? 'Full' : 'Balanced';

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
        title={open ? '' : `Context ${percentage}% · ${windowLabel}`}
        placement="left"
      >
        <Box
          ref={anchorRef}
          role="button"
          tabIndex={0}
          aria-label={`Context management ${percentage}%`}
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
            value={Math.min(percentage, 100)}
            size={`${RING_SIZE / 16}rem`}
            thickness={4}
            sx={styles.progress}
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
        anchorRef={anchorRef}
        open={open}
        onClose={close}
        placement="left-end"
      />
    </>
  );
});

ContextBudgetRing.displayName = 'ContextBudgetRing';

/** @type {MuiSx} */
const contextBudgetRingStyles = utilizationColor => ({
  ring: ({ palette }) => ({
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  progress: {
    position: 'absolute',
    color: utilizationColor,
  },
  percentage: ({ palette }) => ({
    fontSize: '0.625rem',
    lineHeight: '0.75rem',
    color: palette.text.secondary,
  }),
});

export default ContextBudgetRing;
