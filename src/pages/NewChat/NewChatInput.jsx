import { forwardRef, useCallback, useRef } from 'react';

import { Box, IconButton } from '@mui/material';

import UserInput from '@/ComponentsLib/Chat/UserInput';
import Tooltip from '@/ComponentsLib/Tooltip';
import { ChatButton } from '@/[fsd]/features/chat/ui';
import { LLMModelSelector } from '@/[fsd]/widgets/LLMModelSelector';
import ChatBotIcon from '@/assets/chatbot-icon.svg?react';
import ModelIcon from '@/components/Icons/ModelIcon.jsx';
import { useChatConfig } from '@/hooks/useChatConfig';
import useToast from '@/hooks/useToast';
import AgentEditorPanel from '@/pages/NewChat/AgentEditorPanel.jsx';
import { useTheme } from '@emotion/react';

const NewChatInput = forwardRef((props, ref) => {
  const {
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
    internal_tools = [],
    projectId,

    slashHighlights = [],
  } = props;
  const theme = useTheme();
  const { toastError } = useToast();
  const { limits } = useChatConfig();
  const attachmentButtonRef = useRef(null);

  const onClickChatBot = useCallback(() => {
    onShowParticipantsList();
  }, [onShowParticipantsList]);

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
              {!hideAttachments && (
                <ChatButton.AttachmentButton
                  ref={attachmentButtonRef}
                  onAttachFiles={onAttachFiles}
                  disableAttachments={disableAttachments || isLoading || isStreaming}
                  attachments={attachments}
                  limits={limits}
                  isUploadingAttachments={isUploadingAttachments}
                  uploadProgress={uploadProgress}
                />
              )}
              {!isAgentsPage && (
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
              gap={{ xs: '.25rem', sm: '.5rem', md: '1rem' }}
              sx={{
                minWidth: 0,
                flexShrink: 1,
                maxWidth: '100%',
                overflow: 'hidden',
              }}
            >
              {!activeParticipant && !isAgentsPage && (
                <Tooltip
                  placement="top"
                  title="Switch to assistant"
                >
                  <IconButton
                    variant="elitea"
                    color="secondary"
                    aria-label="chatbot"
                    onClick={onClickChatBot}
                    disabled={disableSwitchingParticipant}
                    sx={{ marginLeft: '0rem' }}
                  >
                    <ChatBotIcon
                      sx={{ fontSize: '1rem' }}
                      fill={theme.palette.icon.fill.secondary}
                    />
                  </IconButton>
                </Tooltip>
              )}
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
                  />
                )}
              {(isAgentsPage || !activeParticipant) && (
                <LLMModelSelector
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
              {!isAgentsPage && activeParticipant && (
                <Tooltip title="Switch to model">
                  <Box component="span">
                    <IconButton
                      onClick={selectSavedOrDefaultModel}
                      color="secondary"
                      variant="elitea"
                      disabled={disableSwitchingParticipant || isLoading || isStreaming}
                    >
                      <ModelIcon
                        fontSize="inherit"
                        fill={
                          disableSwitchingParticipant || isLoading || isStreaming
                            ? theme.palette.icon.fill.disabled
                            : theme.palette.icon.fill.secondary
                        }
                      />
                    </IconButton>
                  </Box>
                </Tooltip>
              )}
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
          placeholder,
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
      disabledSend={disabledSend}
      disabledInput={isLoading}
      onSend={onSend}
      onNormalKeyDown={onNormalKeyDown}
      onInputChange={onInputChange}
      tooltipOfSendButton={tooltipOfSendButton}
      showLoading={isLoading}
      onFilePaste={handleFilePaste}
      isUploadingAttachments={isUploadingAttachments}
      uploadProgress={uploadProgress}
      ref={ref}
    />
  );
});

NewChatInput.displayName = 'NewChatInput';

export default NewChatInput;
