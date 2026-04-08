import { memo } from 'react';

import { Box } from '@mui/material';

import { useModal } from '@/[fsd]/shared/lib/hooks';
import {
  ContextBudgetHeader,
  ContextBudgetProgress,
  ContextBudgetStatsDisplay,
  ContextStrategyModal,
} from '@/[fsd]/widgets/ContextBudget/ui';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';

const ContextBudgetExpanded = memo(props => {
  const {
    stats,
    isHighUtilization,
    conversationId,
    contextStatus,
    contextStrategy,
    setActiveConversation,
    conversationInstructions,
    persona,
  } = props;

  const { isOpen, handleOpen, handleClose } = useModal();
  const { isSmallWindow } = useIsSmallWindow();
  const styles = contextBudgetExpandedStyles(isSmallWindow);

  return (
    <Box sx={styles.container}>
      <ContextBudgetHeader onEdit={handleOpen} />

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

      <ContextStrategyModal
        open={isOpen}
        onClose={handleClose}
        conversationId={conversationId}
        currentContextStatus={contextStatus}
        contextStrategy={contextStrategy}
        setActiveConversation={setActiveConversation}
        stats={stats}
        isHighUtilization={isHighUtilization}
        conversationInstructions={conversationInstructions}
        persona={persona}
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
    background: palette.background.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: '0.5rem',
  }),
  statRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0 1rem',
    alignSelf: 'stretch',
  },
  statLabel: ({ palette }) => ({
    flex: 1,
    color: palette.text.default,
  }),
  statValue: ({ palette }) => ({
    color: palette.text.secondary,
    textTransform: 'capitalize',
  }),
});

export default ContextBudgetExpanded;
