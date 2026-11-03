import { forwardRef, memo, useEffect, useImperativeHandle, useRef } from 'react';

import { Box, Typography } from '@mui/material';

import { ChatBox } from '@/[fsd]/features/chat/ui';
import { withRunStepsLimit } from '@/[fsd]/features/skill/lib/helpers';
import { useFocusRunInput, useSkillRunChat, useSkillVersionModel } from '@/[fsd]/features/skill/lib/hooks';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { ContextBudgetUI } from '@/[fsd]/widgets/context-budget';
import useUploadAttachments from '@/hooks/chat/useUploadAttachments';
import { ContentContainer } from '@/pages/Common/Components/StyledComponents';

const NO_STARTERS = [];
const NO_CONTEXT_STRATEGY = {};
const NO_LLM_SETTINGS = {};
const NOOP = () => {};

/**
 * Persisted run of the saved skill version. The Test panel toolbar clears it through the ref and
 * learns whether clearing is allowed from `onClearStateChange`.
 */
const SkillRunPanel = memo(
  forwardRef((props, ref) => {
    const {
      skillId,
      skillName,
      versionDetails,
      runConversationId,
      onRunConversationChange,
      onOpenRunVersion,
      onClearStateChange,
      focusRequest,
      onFocusHandled,
    } = props;
    const projectId = useSelectedProjectId();
    const panelRef = useRef(null);
    const {
      llmSettings: versionLLMSettings,
      canEditVersionModel,
      unsavedVersionLLMSettings,
      onSetLLMSettings: onSetVersionLLMSettings,
    } = useSkillVersionModel();

    const {
      activeConversation,
      activeParticipant,
      activeParticipantDetails,
      isStreaming,
      isReadOnly,
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
    const hasUnsavedVersionModel = Boolean(unsavedVersionLLMSettings);
    useEffect(() => {
      if (canEditVersionModel && !hasUnsavedVersionModel) setUnsavedLLMSettings(null);
    }, [canEditVersionModel, hasUnsavedVersionModel, setUnsavedLLMSettings]);
    const { uploadAttachments, isUploading: isUploadingAttachments, uploadProgress } = useUploadAttachments();

    const hasMessages = Boolean(activeConversation?.chat_history?.length);
    const isChatReady = Boolean(activeConversation && activeParticipant);
    const isClearDisabled = isStreaming || !(hasMessages || activeConversation?.id);

    useImperativeHandle(ref, () => ({ clear: onStartNewRun }), [onStartNewRun]);

    useEffect(() => {
      onClearStateChange?.(isClearDisabled);
    }, [isClearDisabled, onClearStateChange]);

    useFocusRunInput({ containerRef: panelRef, focusRequest, isReady: isChatReady, onFocusHandled });
    const styles = skillRunPanelStyles();

    return (
      <ContentContainer
        ref={panelRef}
        data-testid="skill-run-panel"
        sx={styles.container}
      >
        <Box sx={styles.mainContainer}>
          {activeConversation?.id && (
            <Box sx={styles.topBarContainer}>
              <ContextBudgetUI.ContextBudgetInfo
                conversationId={activeConversation.id}
                compact
                contextStrategy={activeConversation?.meta?.context_strategy ?? NO_CONTEXT_STRATEGY}
                setActiveConversation={setActiveConversation}
                conversationInstructions={activeConversation?.instructions}
              />
            </Box>
          )}

          {isReadOnly && (
            <Typography
              variant="bodySmall"
              color="text.secondary"
              data-testid="skill-run-read-only"
            >
              This run belongs to another user, so it is read-only. Clear the chat to start your own run.
            </Typography>
          )}
          {isChatReady ? (
            <Box sx={styles.chatBoxContainer}>
              <ChatBox
                inputPlaceholder="Type your message..."
                conversationStarters={NO_STARTERS}
                llmSettings={canEditVersionModel ? (versionLLMSettings ?? NO_LLM_SETTINGS) : llmSettings}
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
                onSetLLMSettings={canEditVersionModel ? onSetVersionLLMSettings : onSetLLMSettings}
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
                unsavedLLMSettings={
                  canEditVersionModel
                    ? withRunStepsLimit(unsavedVersionLLMSettings, unsavedLLMSettings)
                    : unsavedLLMSettings
                }
                setUnsavedLLMSettings={setUnsavedLLMSettings}
                isReadOnly={isReadOnly}
              />
            </Box>
          ) : (
            <Box sx={styles.initializingContainer}>
              <Typography
                variant="bodyMedium"
                color="text.secondary"
              >
                Initializing run...
              </Typography>
            </Box>
          )}
        </Box>
      </ContentContainer>
    );
  }),
);

SkillRunPanel.displayName = 'SkillRunPanel';

/** @type {MuiSx} */
const skillRunPanelStyles = () => ({
  container: {
    height: '100% !important',
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
