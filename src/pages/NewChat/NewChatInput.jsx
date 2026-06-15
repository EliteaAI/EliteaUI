import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { Box } from '@mui/material';

import UserInput from '@/ComponentsLib/Chat/UserInput';
import { useSpeakingModeLoop } from '@/[fsd]/features/chat/lib/hooks';
import { ChatButton } from '@/[fsd]/features/chat/ui';
import { PlusChatButton } from '@/[fsd]/features/chat/ui/chat-button';
import AgentEditorPanel from '@/[fsd]/features/chat/ui/chat-input/AgentEditorPanel.jsx';
import { CHAT_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { LLMModelSelector } from '@/[fsd]/widgets/llm-model-selector';
import { useChatConfig } from '@/hooks/useChatConfig';
import useToast from '@/hooks/useToast';
import { useTheme } from '@emotion/react';

const NewChatInput = forwardRef((props, ref) => {
  const {
    fromTheChat,
    conversationId,
    onSend,
    isLoading,
    isStreaming = false,
    onStopGeneration,
    disabledSend,
    placeholder = '',
    clearInputAfterSubmit = true,
    onNormalKeyDown,
    onInputChange,
    tooltipOfSendButton,
    isCreatingConversation = false,

    onShowParticipantsList,

    selectedVersionId,
    onSelectVersion,

    variables = [],
    onChangeVariables,

    activeParticipant,
    activeParticipantDetails,

    modelList = [],
    onSelectModel,
    selectedModel,
    selectSavedOrDefaultModel,

    onShowAgentEditor,
    onShowPipelineEditor,
    onCloseAgentEditor,
    onClosePipelineEditor,

    isEditorDirty,
    onShowVersionChangeAlert,
    onRefreshParticipantDetails,
    disableSwitchingParticipant = false,
    users = [],
    onMentionChange = () => {},

    // New prop to indicate if we're on agents page
    isAgentsPage = false,

    // LLM Settings props for modal dialog
    llmSettings = {},
    onSetLLMSettings,
    showWebhookSecret = false,
    showStepsLimit = false,

    //attachment
    onAttachFiles,
    attachments = [],
    onDeleteAttachment,
    disableAttachments = false,
    hideAttachments = false,
    isUploadingAttachments = false,
    uploadProgress = 0,

    //internal tools config
    onInternalToolsConfigChange,
    onAddNewUsers,
    internal_tools = [],
    projectId,

    // Participant management (for PlusChatButton submenus)
    onSelectParticipant,
    onCreateAgent,
    onCreatePipeline,
    onCreateToolkit,
    onDeleteParticipant,
    participants = [],

    slashHighlights = [],

    // Speaking mode
    isSpeakingMode = false,
    onSpeakingModeToggle,
    isTTSPlaying = false,
  } = props;
  const theme = useTheme();
  const { toastError } = useToast();
  const { limits } = useChatConfig();
  const attachmentButtonRef = useRef(null);
  const userInputRef = useRef(null);
  const voiceButtonRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  const {
    isRecording: isSpeakingModeRecording,
    pauseForRegeneration,
    notifyManualEdit,
  } = useSpeakingModeLoop({
    isSpeakingMode,
    inputRef: userInputRef,
    isStreaming,
    isTTSPlaying,
  });

  const handleInputChange = useCallback(
    value => {
      onInputChange?.(value);
      notifyManualEdit();
    },
    [onInputChange, notifyManualEdit],
  );

  // Expose a stable imperative API while delegating each call to the latest UserInput handle.
  useImperativeHandle(
    ref,
    () => ({
      focus: () => userInputRef.current?.focus?.(),
      reset: () => userInputRef.current?.reset?.(),
      getInputContent: () => userInputRef.current?.getInputContent?.(),
      getCursorPosition: () => userInputRef.current?.getCursorPosition?.(),
      setValue: (...args) => userInputRef.current?.setValue?.(...args),
      replaceRange: (...args) => userInputRef.current?.replaceRange?.(...args),
      removeSymbol: (...args) => userInputRef.current?.removeSymbol?.(...args),
      sendQuestion: (...args) => userInputRef.current?.sendQuestion?.(...args),
      insertTextAtCursor: (...args) => userInputRef.current?.insertTextAtCursor?.(...args),
      mentionUser: (...args) => userInputRef.current?.mentionUser?.(...args),
      pauseSpeakingMode: () => pauseForRegeneration(),
    }),
    [pauseForRegeneration],
  );

  const handleVoiceRecordingChange = useCallback(
    recording => {
      setIsRecording(recording);
      if (recording && isSpeakingMode) {
        onSpeakingModeToggle?.();
      }
    },
    [isSpeakingMode, onSpeakingModeToggle],
  );

  const handleSend = useCallback(
    (question, inputContent) => {
      voiceButtonRef.current?.stop();
      onSend?.(question, inputContent);
    },
    [onSend],
  );

  useEffect(() => {
    voiceButtonRef.current?.stop();
  }, [conversationId]);

  const onDrop = useCallback(
    event => {
      event.preventDefault();
      event.stopPropagation();

      if (disableAttachments) {
        toastError('Attachments are not allowed.');
        return;
      }
      if (attachmentButtonRef.current) {
        attachmentButtonRef.current.onDrop(event);
      }
    },
    [disableAttachments, toastError],
  );

  const handleFilePaste = useCallback(
    files => {
      // Use the AttachmentButton's file processing logic for pasted files
      if (disableAttachments) {
        toastError('Attachments are not allowed.');
        return;
      }
      if (attachmentButtonRef.current && onAttachFiles) {
        // Ensure files is always an array
        const fileArray = Array.isArray(files) ? files : [files];

        // Create a mock event with the pasted files to reuse AttachmentButton's validation
        const mockEvent = {
          dataTransfer: {
            files: fileArray,
          },
          preventDefault: () => {},
        };

        // Use the AttachmentButton's onDrop method which handles file validation
        attachmentButtonRef.current.onDrop(mockEvent);
      }
    },
    [disableAttachments, onAttachFiles, toastError],
  );

  return (
    <UserInput
      dataTourTargetId={CHAT_TOUR_TARGET_IDS.messageInput}
      isStreaming={isStreaming}
      onStop={onStopGeneration}
      attachments={attachments}
      onDeleteAttachment={onDeleteAttachment}
      isCreatingConversation={isCreatingConversation}
      slots={{
        footer: (
          <Box
            flex={1}
            display="flex"
            alignItems="center"
            gap={{ xs: '.125rem', sm: '.5rem' }}
            justifyContent="space-between"
            sx={{
              maxWidth: '100%',
              overflow: 'hidden',
            }}
          >
            <Box
              display="flex"
              alignItems="center"
              gap={{ xs: '.25rem', sm: '.5rem' }}
              sx={{
                // Left side should not shrink - it has fixed-size icon buttons
                flexShrink: 0,
              }}
            >
              {fromTheChat && (
                <PlusChatButton
                  attachmentButtonRef={attachmentButtonRef}
                  onAttachFiles={onAttachFiles}
                  disableAttachments={disableAttachments || isLoading || isStreaming}
                  participantDisablesAttachments={disableAttachments}
                  attachments={attachments}
                  limits={limits}
                  onInviteUsers={onAddNewUsers}
                  onInternalToolsConfigChange={onInternalToolsConfigChange}
                  internal_tools={internal_tools}
                  disableInternalTools={isLoading || isStreaming}
                  onSelectParticipant={onSelectParticipant}
                  onCreateAgent={onCreateAgent}
                  onCreatePipeline={onCreatePipeline}
                  onCreateToolkit={onCreateToolkit}
                  onDeleteParticipant={onDeleteParticipant}
                  participants={participants}
                />
              )}
              {!hideAttachments && !fromTheChat && (
                <ChatButton.AttachmentButton
                  ref={attachmentButtonRef}
                  onAttachFiles={onAttachFiles}
                  disableAttachments={disableAttachments || isLoading || isStreaming}
                  attachments={attachments}
                  limits={limits}
                />
              )}
              {!isAgentsPage && !fromTheChat && (
                <ChatButton.ChatInternalToolsConfigButton
                  onInternalToolsConfigChange={onInternalToolsConfigChange}
                  internal_tools={internal_tools}
                  projectId={projectId}
                  disabled={isLoading || isStreaming}
                />
              )}
            </Box>
            <Box
              flex={1}
              display="flex"
              alignItems="center"
              justifyContent="flex-end"
              gap={{ xs: '.25rem', sm: '.5rem' }}
              sx={{
                minWidth: 0,
                flexShrink: 1,
                maxWidth: '100%',
                overflow: 'hidden',
              }}
            >
              {(activeParticipant?.entity_name === 'application' ||
                activeParticipant?.entity_name === 'pipeline') &&
                !isAgentsPage && (
                  <AgentEditorPanel
                    activeParticipant={activeParticipant}
                    participantDetails={activeParticipantDetails}
                    onClickParticipant={onShowParticipantsList}
                    selectedVersionId={selectedVersionId}
                    onSelectVersion={onSelectVersion}
                    variables={variables}
                    onChangeVariables={onChangeVariables}
                    disabled={isStreaming}
                    onShowAgentEditor={onShowAgentEditor}
                    onShowPipelineEditor={onShowPipelineEditor}
                    onCloseAgentEditor={onCloseAgentEditor}
                    onClosePipelineEditor={onClosePipelineEditor}
                    isEditorDirty={isEditorDirty}
                    onShowVersionChangeAlert={onShowVersionChangeAlert}
                    onRefreshParticipantDetails={onRefreshParticipantDetails}
                    onSwitchToModel={selectSavedOrDefaultModel}
                    disableSwitchToModel={disableSwitchingParticipant || isLoading || isStreaming}
                  />
                )}
              {(isAgentsPage || !activeParticipant) && (
                <LLMModelSelector
                  dataTourTargetId={CHAT_TOUR_TARGET_IDS.modelSettings}
                  selectedModel={selectedModel}
                  onSelectModel={onSelectModel}
                  models={modelList}
                  disabled={disableSwitchingParticipant || isStreaming || isLoading}
                  llmSettings={llmSettings}
                  onSetLLMSettings={onSetLLMSettings}
                  showWebhookSecret={showWebhookSecret}
                  showStepsLimit={showStepsLimit}
                />
              )}
              <ChatButton.VoiceButton
                ref={voiceButtonRef}
                inputRef={userInputRef}
                disabled={isLoading || isStreaming || isSpeakingMode}
                onRecordingChange={handleVoiceRecordingChange}
              />
            </Box>
          </Box>
        ),
      }}
      slotProps={{
        footerContainer: {
          overflow: 'scroll',
        },
        container: {
          onDrop,
        },
        input: {
          placeholder: isRecording || isSpeakingMode ? 'Speak your message' : placeholder,
          color: theme.palette.text.secondary,
          iconColor: theme.palette.icon.fill.default,
        },
        sendButton: {
          iconColor: theme.palette.icon.fill.send,
          disabledBackground: theme.palette.background.button.primary.disabled,
          background: theme.palette.primary.main,
        },
        stopButton: {
          iconColor: theme.palette.icon.fill.attention,
        },
        mentionUser: {
          users,
          onMentionChange,
        },
        highlight: {
          ranges: slashHighlights,
          color: theme.palette.primary.main,
        },
      }}
      clearInputAfterSend={clearInputAfterSubmit}
      disabledSend={disabledSend || isRecording}
      disabledInput={isLoading}
      onSend={handleSend}
      onNormalKeyDown={onNormalKeyDown}
      onInputChange={handleInputChange}
      tooltipOfSendButton={tooltipOfSendButton}
      showLoading={isLoading}
      onFilePaste={handleFilePaste}
      isUploadingAttachments={isUploadingAttachments}
      uploadProgress={uploadProgress}
      isRecording={isRecording || isSpeakingModeRecording}
      isSpeakingMode={isSpeakingMode}
      onEnterSpeakingMode={onSpeakingModeToggle}
      onExitSpeakingMode={onSpeakingModeToggle}
      ref={userInputRef}
    />
  );
});

NewChatInput.displayName = 'NewChatInput';

export default NewChatInput;
