import { memo, useMemo, useRef } from 'react';

import { Box, Typography } from '@mui/material';

import { ChatBox } from '@/[fsd]/features/chat/ui';
import { useSkillRunChat } from '@/[fsd]/features/skill/lib/hooks/useSkillRunChat.hooks';
import { ViewRunHistoryButton } from '@/[fsd]/shared/ui/button';
import { ContextBudgetUI } from '@/[fsd]/widgets/context-budget';
import FullScreenToggle from '@/components/Chat/FullScreenToggle';
import useUploadAttachments from '@/hooks/chat/useUploadAttachments';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import { ContentContainer } from '@/pages/Common/Components/StyledComponents';

import SkillRunActions from './SkillRunActions';

const NO_STARTERS = [];
const NOOP = () => {};

const SkillRunPanel = memo(props => {
  const {
    skillId,
    skillName,
    versionDetails,
    runConversationId,
    onRunConversationChange,
    onOpenRunVersion,
    isFullScreenChat,
    setIsFullScreenChat,
    onShowHistory,
  } = props;
  const projectId = useSelectedProjectId();
  const boxRef = useRef();

  const {
    activeConversation,
    activeParticipant,
    activeParticipantDetails,
    isStreaming,
    isLoadingConversation,
    llmSettings,
    unsavedLLMSettings,
    setUnsavedLLMSettings,
    setChatHistory,
    setActiveConversation,
    onSend,
    onStartNewRun,
    onDeleteAllMessages,
    onDeleteMessage,
    onStopStreaming,
    onSetLLMSettings,
    attachments,
    onAttachFiles,
    onDeleteAttachment,
    onClearAttachments,
  } = useSkillRunChat({
    projectId,
    skillId,
    skillName,
    versionDetails,
    runConversationId,
    onRunConversationChange,
    onOpenRunVersion,
  });
  const { uploadAttachments, isUploading: isUploadingAttachments, uploadProgress } = useUploadAttachments();

  const hasMessages = Boolean(activeConversation?.chat_history?.length);
  const styles = useMemo(() => skillRunPanelStyles(isFullScreenChat), [isFullScreenChat]);

  return (
    <ContentContainer
      data-testid="skill-run-panel"
      sx={styles.container}
    >
      <Box sx={styles.mainContainer}>
        <Box sx={styles.topBarContainer}>
          {activeConversation?.id && (
            <ContextBudgetUI.ContextBudgetInfo
              conversationId={activeConversation.id}
              compact
              contextStrategy={activeConversation?.meta?.context_strategy || {}}
              setActiveConversation={setActiveConversation}
              conversationInstructions={activeConversation?.instructions}
            />
          )}
          <Box sx={styles.controlsContainer}>
            <FullScreenToggle
              isFullScreenChat={isFullScreenChat}
              setIsFullScreenChat={setIsFullScreenChat}
            />
            <SkillRunActions
              canStartNewRun={!isStreaming && Boolean(activeConversation?.id || hasMessages)}
              canDeleteMessages={!isStreaming && hasMessages && Boolean(activeConversation?.id)}
              onStartNewRun={onStartNewRun}
              onDeleteAllMessages={onDeleteAllMessages}
            />
            {onShowHistory && (
              <ViewRunHistoryButton
                onShowHistory={onShowHistory}
                testId="skill-run-history-button"
              />
            )}
          </Box>
        </Box>

        {activeConversation && activeParticipant ? (
          <Box sx={styles.chatBoxContainer}>
            <ChatBox
              ref={boxRef}
              inputPlaceholder="Type your message..."
              conversationStarters={NO_STARTERS}
              llmSettings={llmSettings}
              activeParticipant={activeParticipant}
              activeConversation={activeConversation}
              setActiveConversation={setActiveConversation}
              activeParticipantDetails={activeParticipantDetails}
              onSelectThisParticipant={NOOP}
              onClearActiveParticipant={NOOP}
              isStreaming={isStreaming}
              setChatHistory={setChatHistory}
              onDeleteMessage={onDeleteMessage}
              onDeleteAllMessages={onDeleteAllMessages}
              onStopStreaming={onStopStreaming}
              enableMentions={false}
              isLoadingConversation={isLoadingConversation}
              isAgentsPage
              onSetLLMSettings={onSetLLMSettings}
              showWebhookSecret={false}
              onSend={onSend}
              attachments={attachments}
              disableAttachments={false}
              onAttachFiles={onAttachFiles}
              onDeleteAttachment={onDeleteAttachment}
              onClearAttachments={onClearAttachments}
              uploadAttachments={uploadAttachments}
              isUploadingAttachments={isUploadingAttachments}
              uploadProgress={uploadProgress}
              unsavedLLMSettings={unsavedLLMSettings}
              setUnsavedLLMSettings={setUnsavedLLMSettings}
            />
          </Box>
        ) : (
          <Box sx={styles.initializingContainer}>
            <Typography
              variant="body1"
              color="text.secondary"
            >
              Initializing run...
            </Typography>
          </Box>
        )}
      </Box>
    </ContentContainer>
  );
});

SkillRunPanel.displayName = 'SkillRunPanel';

/** @type {MuiSx} */
const skillRunPanelStyles = isFullScreenChat => ({
  container: {
    height: isFullScreenChat ? 'calc(100vh - 6.5625rem)' : '100% !important',
  },
  mainContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    gap: '0.75rem',
  },
  topBarContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    width: '100%',
  },
  controlsContainer: {
    display: 'flex',
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '0.5rem',
  },
  initializingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '12.5rem',
  },
  chatBoxContainer: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
  },
});

export default SkillRunPanel;
