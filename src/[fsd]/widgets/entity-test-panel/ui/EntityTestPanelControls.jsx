import { memo } from 'react';

import { ChatButton } from '@/[fsd]/features/chat/ui';
import { ViewRunHistoryButton } from '@/[fsd]/shared/ui/button';
import { ContextBudgetUI } from '@/[fsd]/widgets/context-budget';
import FullScreenToggle from '@/components/Chat/FullScreenToggle';

import TestPanelCloseButton from './TestPanelCloseButton';

const NO_CONTEXT_STRATEGY = {};

const EntityTestPanelControls = memo(props => {
  const {
    activeConversation,
    setActiveConversation,
    isFullScreen,
    setIsFullScreen,
    isClearDisabled,
    onClear,
    onShowHistory,
    onClose,
    testIdPrefix,
  } = props;

  return (
    <>
      {activeConversation?.id && setActiveConversation && (
        <ContextBudgetUI.ContextBudgetInfo
          pill
          conversationId={activeConversation.id}
          contextStrategy={activeConversation.meta?.context_strategy ?? NO_CONTEXT_STRATEGY}
          setActiveConversation={setActiveConversation}
          conversationInstructions={activeConversation.instructions}
        />
      )}
      <FullScreenToggle
        isFullScreenChat={isFullScreen}
        setIsFullScreenChat={setIsFullScreen}
      />
      <ChatButton.ClearChatButton
        disabled={isClearDisabled}
        onClear={onClear}
      />
      {onShowHistory && (
        <ViewRunHistoryButton
          compact
          tooltip="Run History"
          onShowHistory={onShowHistory}
          testId={`${testIdPrefix}-run-history-button`}
        />
      )}
      <TestPanelCloseButton
        onClose={onClose}
        testId={`${testIdPrefix}-test-panel-close`}
      />
    </>
  );
});

EntityTestPanelControls.displayName = 'EntityTestPanelControls';

export default EntityTestPanelControls;
