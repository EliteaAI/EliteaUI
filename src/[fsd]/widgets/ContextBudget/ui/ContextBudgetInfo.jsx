import { memo } from 'react';

import { useModal } from '@/[fsd]/shared/lib/hooks';
import { useGetContextStatusQuery } from '@/api/chat';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { formatNumberWithSpaces } from '@/utils/stringUtils';

import { useContextUtilization } from '../lib/hooks/useContextUtilization.hooks';
import ContextBudgetCollapsed from './ContextBudgetCollapsed';
import ContextBudgetCompact from './ContextBudgetCompact';
import ContextBudgetExpanded from './ContextBudgetExpanded';
import ContextStrategyModal from './ContextStrategyModal';

/**
 * Main context budget component - orchestrates data fetching and view selection
 */
const ContextBudgetInfo = memo(props => {
  const {
    conversationId,
    collapsed = false,
    compact = false,
    contextStrategy = {},
    setActiveConversation,
    conversationInstructions,
    persona,
  } = props;

  const selectedProjectId = useSelectedProjectId();
  const { isOpen, handleOpen, handleClose } = useModal();

  const {
    data: contextStatus,
    isLoading,
    error,
  } = useGetContextStatusQuery(
    { projectId: selectedProjectId, conversationId },
    { skip: !conversationId || !selectedProjectId },
  );

  const utilization = contextStatus?.utilization || 0;
  const utilizationData = useContextUtilization(utilization);

  if (isLoading || error || !contextStatus) {
    return null;
  }

  const { current_tokens, max_tokens, message_groups_in_context, strategy_name, context_analytics } =
    contextStatus;
  const summariesGenerated = context_analytics?.summaries_generated || 0;

  // Prepare stats object for child components
  const stats = {
    strategyName: strategy_name.replace(/_/g, ' '),
    messageGroups: message_groups_in_context,
    summariesGenerated,
    currentTokens: current_tokens,
    maxTokens: max_tokens,
    tokensDisplay: `${formatNumberWithSpaces(current_tokens)} / ${max_tokens === 0 ? '-' : formatNumberWithSpaces(max_tokens)}`,
    utilizationPercentage: utilizationData.percentage,
  };

  // Common props for all views
  const commonProps = {
    stats,
    isHighUtilization: utilizationData.isHigh,
  };

  // Render appropriate view based on props
  if (collapsed) {
    return <ContextBudgetCollapsed {...commonProps} />;
  }

  if (compact) {
    return (
      <>
        <ContextBudgetCompact
          {...commonProps}
          onEdit={handleOpen}
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
          isHighUtilization={utilizationData.isHigh}
          conversationInstructions={conversationInstructions}
          persona={persona}
        />
      </>
    );
  }

  return (
    <ContextBudgetExpanded
      {...commonProps}
      conversationId={conversationId}
      contextStatus={contextStatus}
      contextStrategy={contextStrategy}
      setActiveConversation={setActiveConversation}
      conversationInstructions={conversationInstructions}
      persona={persona}
    />
  );
});

ContextBudgetInfo.displayName = 'ContextBudgetInfo';

export default ContextBudgetInfo;
