import { memo } from 'react';

import { useSelector } from 'react-redux';

import { useModal, useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { useGetContextStatusQuery } from '@/api';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import { formatNumberWithSpaces } from '@/utils/stringUtils';

import { BALANCED_WINDOW_TOKENS, CONTEXT_WINDOW_MODES } from '../lib/constants';
import { useContextUtilization } from '../lib/hooks/useContextUtilization.hooks';
import { useContextWindowSwitch } from '../lib/hooks/useContextWindowSwitch.hooks';
import ContextBudgetCompact from './ContextBudgetCompact';
import ContextBudgetExpanded from './ContextBudgetExpanded';
import ContextBudgetRing from './ContextBudgetRing';
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

  const { checkPermission } = useCheckPermission();
  const canEdit = checkPermission(PERMISSIONS.chat.edit);
  const { switchMode, isSwitching } = useContextWindowSwitch({
    conversationId,
    contextStrategy,
    setActiveConversation,
  });
  // Preview the selected model's window before the next response resolves it on the backend
  const selectedModelWindow = useSelector(state => state.chat?.currentChatModel?.context_window);

  const utilization = contextStatus?.utilization || 0;
  const utilizationData = useContextUtilization(utilization, contextStatus?.current_tokens || 0, {
    usableInput: contextStatus?.usable_input,
    compactionThreshold: contextStatus?.manual_max_context_tokens ?? contextStatus?.compaction_threshold,
  });

  if (isLoading || error || !contextStatus) {
    return null;
  }

  const {
    current_tokens,
    max_tokens,
    message_groups_in_context,
    strategy_name,
    context_analytics,
    window_mode,
    model_window,
  } = contextStatus;
  const summariesGenerated = context_analytics?.summaries_generated || 0;
  const windowMode = contextStrategy?.context_window_mode || window_mode || CONTEXT_WINDOW_MODES.BALANCED;
  const previewWindow =
    !compact && selectedModelWindow && selectedModelWindow !== model_window
      ? windowMode === CONTEXT_WINDOW_MODES.FULL
        ? selectedModelWindow
        : Math.min(BALANCED_WINDOW_TOKENS, selectedModelWindow)
      : null;

  // Prepare stats object for child components
  const stats = {
    strategyName: strategy_name.replace(/_/g, ' '),
    messageGroups: message_groups_in_context,
    summariesGenerated,
    currentTokens: current_tokens,
    maxTokens: max_tokens,
    tokensDisplay: `${formatNumberWithSpaces(current_tokens)} / ${max_tokens === 0 ? '-' : formatNumberWithSpaces(max_tokens)}${contextStatus.manual_max_context_tokens ? ' (manual)' : ''}`,
    utilizationPercentage: utilizationData.percentage,
    windowMode,
    modelWindow: previewWindow ? selectedModelWindow : model_window,
    modelWindowPreview: previewWindow,
    windowSource: previewWindow ? 'model' : contextStatus.window_source,
    effectiveWindow: contextStatus.effective_window,
    safetyMargin: contextStatus.safety_margin,
    reservedOutput: contextStatus.reserved_output,
    reservedOutputSource: contextStatus.reserved_output_source,
    usableInput: contextStatus.usable_input,
    compactionThreshold: contextStatus.compaction_threshold,
    chatUsage: contextStatus.chat_usage,
    manualMaxTokensEnabled: !!contextStatus.manual_max_tokens_enabled,
    manualMaxContextTokens: contextStatus.manual_max_context_tokens,
  };

  // Common props for all views
  const commonProps = {
    stats,
    isHighUtilization: utilizationData.isHigh,
    utilizationColor: utilizationData.color,
    canEdit,
    onSwitchMode: switchMode,
    isSwitching,
  };

  // Render appropriate view based on props
  if (collapsed) {
    return (
      <ContextBudgetRing
        {...commonProps}
        conversationId={conversationId}
        contextStatus={contextStatus}
        contextStrategy={contextStrategy}
        setActiveConversation={setActiveConversation}
        conversationInstructions={conversationInstructions}
        persona={persona}
      />
    );
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
