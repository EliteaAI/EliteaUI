import { memo } from 'react';

import { Box, Divider, Tooltip } from '@mui/material';

import { ChatButton } from '@/[fsd]/features/chat/ui';
import { Button } from '@/[fsd]/shared/ui';
import { ViewRunHistoryButton } from '@/[fsd]/shared/ui/button';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';
import { ContextBudgetUI } from '@/[fsd]/widgets/context-budget';
import CloseIcon from '@/components/Icons/CloseIcon';

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
      <Divider
        orientation="vertical"
        flexItem
        sx={styles.divider}
      />
      <Tooltip
        title="Close"
        placement="top"
      >
        <Box component="span">
          <Button.BaseBtn
            variant={BUTTON_VARIANTS.secondary}
            startIcon={<CloseIcon sx={styles.closeIcon} />}
            onClick={onClose}
            aria-label="Close test panel"
            data-testid="pipeline-test-panel-close"
          />
        </Box>
      </Tooltip>
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
  divider: ({ palette }) => ({
    marginY: '0.25rem',
    borderColor: palette.border.lines,
  }),
  closeIcon: {
    fontSize: '1rem',
  },
});

export default TestPanelControls;
