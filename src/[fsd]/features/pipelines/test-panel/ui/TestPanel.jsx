import { forwardRef, memo, useCallback, useImperativeHandle, useRef } from 'react';

import { ChatBox } from '@/[fsd]/features/chat/ui';
import { EntityTestPanelUI, isTestChatClearDisabled } from '@/[fsd]/widgets/entity-test-panel';
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

    const isClearDisabled = isTestChatClearDisabled(activeConversation?.chat_history, isStreaming);

    const handleClear = useCallback(() => {
      if (editorPanelRef?.current?.hasRunsInProgress?.()) chatBoxRef.current?.stopAll();
      chatBoxRef.current?.onClear();
    }, [editorPanelRef]);

    return (
      <EntityTestPanelUI.EntityTestPanelShell
        panelRef={panelRef}
        isOpen={isOpen}
        width={width}
        isFullWidth={isFullWidth}
        resizeHandle={resizeHandle}
        testId="pipeline-test-panel"
        controls={
          <TestPanelControls
            onShowHistory={onShowHistory}
            activeConversation={activeConversation}
            setActiveConversation={setActiveConversation}
            isClearDisabled={isClearDisabled}
            onClear={handleClear}
            onClose={onClose}
          />
        }
      >
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
      </EntityTestPanelUI.EntityTestPanelShell>
    );
  }),
);

TestPanel.displayName = 'TestPanel';

export default TestPanel;
