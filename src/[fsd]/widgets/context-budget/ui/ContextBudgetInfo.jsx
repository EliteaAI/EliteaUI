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
import ContextBudgetPill from './ContextBudgetPill';
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
    pill = false,
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
  // `compact` and `pill` are the Agents/Pipelines panels, whose model is not in currentChatModel;
  // the ring is `collapsed`
  const previewWindow =
    !compact && !pill && selectedModelWindow && selectedModelWindow !== model_window
      ? windowMode === CONTEXT_WINDOW_MODES.FULL
        ? selectedModelWindow
        : Math.min(BALANCED_WINDOW_TOKENS, selectedModelWindow)
      : null;

  const resolvedModelWindow = previewWindow ? selectedModelWindow : model_window;
  const resolvedEffectiveWindow = contextStatus.effective_window;
  // balancedWindowTokens: always derived from the model window, not from effectiveWindow,
  // so it stays stable during a mode switch (effectiveWindow is stale until the next API response).
  const balancedWindowTokens =
    resolvedModelWindow > 0 ? Math.min(BALANCED_WINDOW_TOKENS, resolvedModelWindow) : 0;
  const fullWindowTokens = resolvedModelWindow > 0 ? resolvedModelWindow : 0;

  // Prepare stats object for child components
  const stats = {
    strategyName: strategy_name.replace(/_/g, ' '),
    messageGroups: message_groups_in_context,
    summariesGenerated,
    currentTokens: current_tokens,
    maxTokens: max_tokens,
    currentTokensDisplay: formatNumberWithSpaces(current_tokens),
    maxTokensDisplay: max_tokens === 0 ? '-' : formatNumberWithSpaces(max_tokens),
    tokensDisplay: `${formatNumberWithSpaces(current_tokens)} / ${max_tokens === 0 ? '-' : formatNumberWithSpaces(max_tokens)}${contextStatus.manual_max_context_tokens ? ' (manual)' : ''}`,
    utilizationPercentage: utilizationData.percentage,
    windowMode,
    modelWindow: resolvedModelWindow,
    modelWindowPreview: previewWindow,
    windowSource: previewWindow ? 'model' : contextStatus.window_source,
    effectiveWindow: resolvedEffectiveWindow,
    safetyMargin: contextStatus.safety_margin,
    reservedOutput: contextStatus.reserved_output,
    reservedOutputSource: contextStatus.reserved_output_source,
    usableInput: contextStatus.usable_input,
    compactionThreshold: contextStatus.compaction_threshold,
    chatUsage: contextStatus.chat_usage,
    manualMaxTokensEnabled: !!contextStatus.manual_max_tokens_enabled,
    manualMaxContextTokens: contextStatus.manual_max_context_tokens,
    balancedWindowTokens,
    fullWindowTokens,
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
  if (collapsed || pill) {
    const TriggerView = pill ? ContextBudgetPill : ContextBudgetRing;
    return (
      <TriggerView
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
          contextStrategy={contextStrategy}
          setActiveConversation={setActiveConversation}
          stats={stats}
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
      contextStrategy={contextStrategy}
      setActiveConversation={setActiveConversation}
      conversationInstructions={conversationInstructions}
      persona={persona}
    />
  );
});

ContextBudgetInfo.displayName = 'ContextBudgetInfo';

export default ContextBudgetInfo;
