import { forwardRef, memo, useCallback, useImperativeHandle, useRef } from 'react';

import { Box } from '@mui/material';

import { ChatBox } from '@/[fsd]/features/chat/ui';
import { WELCOME_MESSAGE_ID } from '@/common/constants';
import useIsPipelineYamlCodeDirty from '@/pages/Pipelines/useIsPipelineYamlCodeDirty';

import { UNSAVED_CHANGES_HINT } from '../lib/constants/testPanel.constants';
import TestPanelControls from './TestPanelControls';

/**
 * Pipeline Test panel. Stays mounted while closed: ChatBox owns the run socket, so hiding it keeps
 * runs and the conversation alive.
 */
const TestPanel = memo(
  forwardRef((props, ref) => {
    const {
      isOpen,
      width,
      panelRef,
      isFullWidth = false,
      settings,
      setActiveConversation,
      editorPanelRef,
      onShowHistory,
      onClose,
      resizeHandle,
    } = props;
    const { isStreaming, activeConversation } = settings;

    const chatBoxRef = useRef();
    // Same check as Save, so switching Flow/Yaml (a YAML re-dump) doesn't count as a change
    const isPipelineDirty = useIsPipelineYamlCodeDirty();

    useImperativeHandle(ref, () => ({
      stopRun: () => chatBoxRef.current?.stopAll(),
    }));

    const chatHistory = activeConversation?.chat_history;
    const isClearDisabled =
      !chatHistory?.length ||
      isStreaming ||
      (chatHistory.length === 1 && chatHistory[0].id === WELCOME_MESSAGE_ID);

    const handleClear = useCallback(() => {
      if (editorPanelRef?.current?.hasRunsInProgress?.()) chatBoxRef.current?.stopAll();
      chatBoxRef.current?.onClear();
    }, [editorPanelRef]);

    const styles = testPanelStyles(isOpen, width, isFullWidth);

    return (
      <Box
        ref={panelRef}
        sx={styles.root}
        aria-hidden={!isOpen}
        data-testid="pipeline-test-panel"
      >
        {resizeHandle}
        <Box sx={styles.header}>
          <TestPanelControls
            onShowHistory={onShowHistory}
            activeConversation={activeConversation}
            setActiveConversation={setActiveConversation}
            isClearDisabled={isClearDisabled}
            onClear={handleClear}
            onClose={onClose}
          />
        </Box>
        <Box sx={styles.chatCard}>
          <ChatBox
            {...settings}
            ref={chatBoxRef}
            setActiveConversation={setActiveConversation}
            sendBlockedReason={isPipelineDirty ? UNSAVED_CHANGES_HINT : ''}
            chatOnly
            type="chat"
            isAgentsPage
            inputPlaceholder="Type your message..."
          />
        </Box>
      </Box>
    );
  }),
);

TestPanel.displayName = 'TestPanel';

/** @type {MuiSx} */
const testPanelStyles = (isOpen, width, isFullWidth) => ({
  root: {
    position: 'relative',
    display: isOpen ? 'flex' : 'none',
    flexDirection: 'column',
    flexShrink: 0,
    width: isFullWidth ? '100%' : `${width / 16}rem`,
    maxWidth: isFullWidth ? '100%' : '50%',
    minWidth: isFullWidth ? undefined : '20rem',
    height: '100%',
    minHeight: isFullWidth ? 'calc(100vh - 13.75rem)' : undefined,
    boxSizing: 'border-box',
  },
  header: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: '1.75rem',
    marginTop: '0.25rem',
    marginBottom: '1rem',
  },
  // ChatBox draws the bordered card itself, so this is layout only
  chatCard: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column',
  },
});

export default TestPanel;
