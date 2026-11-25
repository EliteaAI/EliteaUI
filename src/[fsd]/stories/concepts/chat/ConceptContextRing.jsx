// Concept copy of src/[fsd]/widgets/context-budget/ui/ContextBudgetRing.jsx — the context ring moves from the bottom of
// the right Participants panel into the input field, next to the mic.
// What changes against the team's ring:
// - 26 px instead of 30 px, to sit in the field's 28 px button row; the number stays inside, no «%»;
// - quiet colour: the bar's icon grey while the chat is far from the limit; the team's warning colour from the compaction
//   threshold and the error colour at the limit stay (useContextUtilization), the green «all is well» goes;
// - the tooltip in three lines above the ring: «Context window · Balanced», «N% used (M% left)», «Xk / Yk tokens used»;
// - the card (ContextBudgetPopover, unchanged) opens above the ring, not to its left; there is no panel to expand into.
// Data, the card's content, Context settings and Summarize now are the team's: ContextBudgetInfo passes the chat's
// values from the field (ConceptChatInput) to the card, as it does from the Participants panel on dev.
import { memo, useCallback, useRef, useState } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import ContextBudgetPopover from '@/[fsd]/widgets/context-budget/ui/ContextBudgetPopover';

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

const ConceptContextRing = memo(props => {
  const {
    stats,
    utilizationColor,
    isHighUtilization,
    // In the field the ring always opens its card; the panel's «expand» props are not passed on
    // eslint-disable-next-line no-unused-vars -- taken out so the card does not get them
    expandable,
    // eslint-disable-next-line no-unused-vars -- taken out so the card does not get them
    onCollapse,
    toggleFocusRef,
    ...popoverProps
  } = props;

  const anchorRef = useRef(null);
  const [open, setOpen] = useState(false);
  const styles = conceptContextRingStyles(isHighUtilization ? utilizationColor : null);

  const percentage = stats.utilizationPercentage;

  const setAnchorRef = useCallback(
    node => {
      anchorRef.current = node;
      toggleFocusRef?.(node);
    },
    [toggleFocusRef],
  );
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
          ref={setAnchorRef}
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

ConceptContextRing.displayName = 'ConceptContextRing';

/** @type {MuiSx} */
const conceptContextRingStyles = alertColor => ({
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
      outline: `0.125rem solid ${palette.primary.main}`,
      outlineOffset: '0.125rem',
    },
  }),
  track: ({ palette }) => ({
    position: 'absolute',
    color: palette.components.input.text.placeholder,
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

export default ConceptContextRing;
