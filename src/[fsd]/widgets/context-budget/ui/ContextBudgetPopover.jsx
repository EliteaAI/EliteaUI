import { memo, useCallback, useEffect, useRef } from 'react';

import { Box, ClickAwayListener, Grow, Paper, Popper } from '@mui/material';

import { useModal } from '@/[fsd]/shared/lib/hooks';

import ContextBudgetDetails from './ContextBudgetDetails';
import ContextBudgetHeader from './ContextBudgetHeader';
import ContextBudgetProgress from './ContextBudgetProgress';
import ContextBudgetStatsDisplay from './ContextBudgetStatsDisplay';
import ContextStrategyModal from './ContextStrategyModal';

/**
 * Full context budget card in a popper, anchored to a compact trigger (ring or pill), plus the edit modal.
 */
const ContextBudgetPopover = memo(props => {
  const {
    anchorRef,
    open,
    onClose,
    placement = 'left-end',
    stats,
    isHighUtilization,
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

  const paperRef = useRef(null);
  const { isOpen: isModalOpen, handleOpen: handleModalOpen, handleClose: handleModalClose } = useModal();
  const styles = contextBudgetPopoverStyles();

  const isModalOpenRef = useRef(isModalOpen);
  useEffect(() => {
    isModalOpenRef.current = isModalOpen;
  }, [isModalOpen]);

  // Focus can leave the popover (e.g. after the quick switch re-renders), so listen on the document
  useEffect(() => {
    if (!open) return undefined;
    const handleEscape = event => {
      if (event.key === 'Escape' && !isModalOpenRef.current) {
        onClose();
        anchorRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose, anchorRef]);

  // The edit modal is opened only after the popover closes and the switch tooltips are disabled,
  // so only the anchor (which toggles itself) and the paper need to be excluded
  const handleClickAway = useCallback(
    event => {
      if (anchorRef.current?.contains(event.target) || paperRef.current?.contains(event.target)) return;
      onClose();
    },
    [anchorRef, onClose],
  );

  const handleEdit = useCallback(() => {
    onClose();
    handleModalOpen();
  }, [onClose, handleModalOpen]);

  return (
    <>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        placement={placement}
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
                    utilizationPercentage={stats.utilizationPercentage}
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

ContextBudgetPopover.displayName = 'ContextBudgetPopover';

/** @type {MuiSx} */
const contextBudgetPopoverStyles = () => ({
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

export default ContextBudgetPopover;
