import { memo } from 'react';

import { Box } from '@mui/material';

import { ChatButton } from '@/[fsd]/features/chat/ui';
import { ViewRunHistoryButton } from '@/[fsd]/shared/ui/button';
import { ContextBudgetUI } from '@/[fsd]/widgets/context-budget';
import { EntityTestPanelUI } from '@/[fsd]/widgets/entity-test-panel';

const TestPanelControls = memo(props => {
  const { onShowHistory, activeConversation, setActiveConversation, isClearDisabled, onClear, onClose } =
    props;

  const styles = testPanelControlsStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="pipeline-test-panel-controls"
    >
      {onShowHistory && (
        <ViewRunHistoryButton
          compact
          tooltip="Run History"
          onShowHistory={onShowHistory}
        />
      )}
      {activeConversation?.id && (
        <ContextBudgetUI.ContextBudgetInfo
          pill
          conversationId={activeConversation.id}
          contextStrategy={activeConversation.meta?.context_strategy || {}}
          setActiveConversation={setActiveConversation}
          conversationInstructions={activeConversation.instructions}
        />
      )}
      <ChatButton.ClearChatButton
        disabled={isClearDisabled}
        onClear={onClear}
      />
      <EntityTestPanelUI.TestPanelCloseButton
        onClose={onClose}
        testId="pipeline-test-panel-close"
      />
    </Box>
  );
});

TestPanelControls.displayName = 'TestPanelControls';

/** @type {MuiSx} */
const testPanelControlsStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
});

export default TestPanelControls;
