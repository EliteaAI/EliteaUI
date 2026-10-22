import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, CircularProgress, ClickAwayListener, Grow, Paper, Popper, Typography } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useModal } from '@/[fsd]/shared/lib/hooks';

import ContextBudgetDetails from './ContextBudgetDetails';
import ContextBudgetHeader from './ContextBudgetHeader';
import ContextBudgetProgress from './ContextBudgetProgress';
import ContextBudgetStatsDisplay from './ContextBudgetStatsDisplay';
import ContextStrategyModal from './ContextStrategyModal';

const RING_SIZE = 30;

/**
 * Collapsed participants panel: a circular budget indicator that opens the full budget card in a popover.
 */
const ContextBudgetRing = memo(props => {
  const {
    stats,
    isHighUtilization,
    utilizationColor,
    canEdit,
    onSwitchMode,
    isSwitching,
    conversationId,
    contextStatus,
    contextStrategy,
    setActiveConversation,
    conversationInstructions,
    persona,
  } = props;

  const anchorRef = useRef(null);
  const paperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const { isOpen: isModalOpen, handleOpen: handleModalOpen, handleClose: handleModalClose } = useModal();
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

  const isModalOpenRef = useRef(isModalOpen);
  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  // Focus can leave the popover (e.g. after the quick switch re-renders), so listen on the document
  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = event => {
      if (event.key === 'Escape' && !isModalOpenRef.current) {
        close();
        anchorRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, close]);

  // The edit modal is opened only after the popover closes and the switch tooltips are disabled,
  // so only the anchor (which toggles itself) and the paper need to be excluded
  const handleClickAway = useCallback(
    event => {
      if (anchorRef.current?.contains(event.target) || paperRef.current?.contains(event.target)) return;
      close();
    },
    [close],
  );

  const handleEdit = useCallback(() => {
    close();
    handleModalOpen();
  }, [close, handleModalOpen]);

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

      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement="left-end"
        strategy="fixed"
        transition
        sx={styles.popper}
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps}>
            <Paper
              ref={paperRef}
              sx={styles.paper}
              role="dialog"
              aria-label="Context management"
              data-testid="context-budget-popover"
            >
              <ClickAwayListener onClickAway={handleClickAway}>
                <Box sx={styles.content}>
                  <ContextBudgetHeader
                    onEdit={handleEdit}
                    canEdit={canEdit}
                  />
                  <ContextBudgetProgress
                    tokensDisplay={stats.tokensDisplay}
                    utilizationPercentage={percentage}
                    isHighUtilization={isHighUtilization}
                  />
                  <ContextBudgetStatsDisplay
                    stats={stats}
                    isCompact
                    labelStyle={styles.statLabel}
                    valueStyle={styles.statValue}
                    rowStyle={styles.statRow}
                    conversationId={conversationId}
                  />
                  <ContextBudgetDetails
                    stats={stats}
                    canEdit={canEdit}
                    onSwitchMode={onSwitchMode}
                    isSwitching={isSwitching}
                  />
                </Box>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>

      <ContextStrategyModal
        open={isModalOpen}
        onClose={handleModalClose}
        conversationId={conversationId}
        currentContextStatus={contextStatus}
        contextStrategy={contextStrategy}
        setActiveConversation={setActiveConversation}
        stats={stats}
        isHighUtilization={isHighUtilization}
        conversationInstructions={conversationInstructions}
        persona={persona}
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
  popper: {
    zIndex: 1300,
  },
  paper: ({ palette }) => ({
    width: '18rem',
    padding: '0.5rem 0',
    backgroundColor: palette.background.default.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
  }),
  content: {
    display: 'flex',
    flexDirection: 'column',
  },
  statRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0 1rem',
    alignSelf: 'stretch',
  },
  statLabel: ({ palette }) => ({
    flex: 1,
    color: palette.text.primary,
  }),
  statValue: ({ palette }) => ({
    color: palette.text.secondary,
    textTransform: 'capitalize',
  }),
});

export default ContextBudgetRing;
