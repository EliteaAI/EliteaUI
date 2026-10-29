import { memo } from 'react';

import { Box } from '@mui/material';

import { useIsSmallWindow, useModal } from '@/[fsd]/shared/lib/hooks';
import { CONTEXT_WINDOW_COPY } from '@/[fsd]/widgets/context-budget/lib/constants';
import { useSummarizeContext } from '@/[fsd]/widgets/context-budget/lib/hooks';
import {
  ContextBudgetDetails,
  ContextBudgetHeader,
  ContextBudgetProgress,
  ContextBudgetStatsDisplay,
  ContextHighUsageBanner,
  ContextStrategyModal,
  ContextWindowModeSelector,
} from '@/[fsd]/widgets/context-budget/ui';

import SummarizeConfirmDialog from './SummarizeConfirmDialog';

const ContextBudgetExpanded = memo(props => {
  const {
    stats,
    isHighUtilization,
    canEdit,
    onSwitchMode,
    isSwitching,
    conversationId,
    contextStrategy,
    setActiveConversation,
    conversationInstructions,
    persona,
  } = props;

  const { isOpen, handleOpen, handleClose } = useModal();
  const { isSmallWindow } = useIsSmallWindow();
  const styles = contextBudgetExpandedStyles(isSmallWindow);
  const {
    isDialogOpen: isSummarizeDialogOpen,
    openDialog: openSummarizeDialog,
    closeDialog: closeSummarizeDialog,
    confirmSummarize,
    isSummarizing,
  } = useSummarizeContext({ conversationId });

  return (
    <Box
      sx={styles.container}
      data-testid="context-budget-panel"
    >
      <ContextBudgetHeader
        onEdit={handleOpen}
        canEdit={canEdit}
      />

      <Box sx={styles.selectorRow}>
        <ContextWindowModeSelector
          layout="stacked"
          value={stats.windowMode}
          onChange={onSwitchMode}
          disabled={!canEdit || isSwitching}
          disabledReason={!canEdit ? CONTEXT_WINDOW_COPY.NO_PERMISSION : undefined}
          balancedWindowTokens={stats.balancedWindowTokens}
          fullWindowTokens={stats.fullWindowTokens}
        />
      </Box>

      <ContextBudgetProgress
        stats={stats}
        utilizationPercentage={stats.utilizationPercentage}
        isHighUtilization={isHighUtilization}
      />

      {isHighUtilization && (
        <ContextHighUsageBanner
          isSummarizationEnabled={contextStrategy?.enable_summarization !== false}
          canEdit={canEdit}
          isSummarizing={isSummarizing}
          onSummarize={openSummarizeDialog}
        />
      )}

      <ContextBudgetStatsDisplay
        stats={stats}
        isCompact
        labelStyle={styles.statLabel}
        valueStyle={styles.statValue}
        rowStyle={styles.statRow}
        conversationId={conversationId}
      />

      <ContextBudgetDetails stats={stats} />

      <ContextStrategyModal
        open={isOpen}
        onClose={handleClose}
        conversationId={conversationId}
        contextStrategy={contextStrategy}
        setActiveConversation={setActiveConversation}
        stats={stats}
        conversationInstructions={conversationInstructions}
        persona={persona}
      />

      <SummarizeConfirmDialog
        open={isSummarizeDialogOpen}
        onClose={closeSummarizeDialog}
        onConfirm={confirmSummarize}
        confirming={isSummarizing}
      />
    </Box>
  );
});

ContextBudgetExpanded.displayName = 'ContextBudgetExpanded';

/** @type {MuiSx} */
const contextBudgetExpandedStyles = isSmallWindow => ({
  container: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    padding: '0.5rem 0',
    width: isSmallWindow ? '15.625rem' : '100%',
    background: palette.background.default.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
  }),
  selectorRow: {
    padding: '0.5rem 1rem 0',
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

export default ContextBudgetExpanded;
