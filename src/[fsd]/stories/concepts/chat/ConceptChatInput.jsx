// Chat concept: the input field and its «+» menu. A copy of src/[fsd]/features/chat/ui/chat-input/NewChatInput.jsx;
// the lines marked «concept:» are the only changes, everything else (keys, voice, speaking mode, files, «#», Stop,
// Inject) is the team's code.
// - concept: the context ring moves into the field, right, before the mic (from the bottom of the Participants panel);
//   shown when the chat has messages (a conversation id), as the panel's block is today;
// - concept: «who answers» (the model selector, or the agent / pipeline / skill panel) leaves the field and sits under
//   it, right-aligned. The model's button has no fill (ConceptModelButton); its ⚙ «Model Settings» and its list of
//   models are the team's. The agent, pipeline and skill panels are the team's AgentEditorPanel and SkillChatPanel,
//   only placed under the field;
// - concept: the placeholder names «#»: «Type your message… # for assistants»; with an agent answering —
//   «Reply to <name>…»; a skill's argument hint («~<skill> <hint>») stays as is;
// - concept: the placeholder stays while the field is empty, also with focus (UserInput hides it on focus today, and a
//   new chat focuses the field at once, so «# for assistants» would never be seen). In the product it is one line of
//   src/ComponentsLib/Chat/UserInput.jsx: placeholder={input?.placeholder}. Here Storybook patches that line for this
//   field only (CONCEPT_PATCHES in .storybook/main.js); UserInput.jsx itself is not edited.
// - concept: the «+» menu is ConceptPlusButton — no Invite Users, counts on its rows, modules with descriptions.
// The Participants panel stays as is, without its context ring (the ring is here now).
// - concept (the «whoAnswers» stories only): «who answers» under the field is one button with its list
//   (ConceptWhoAnswers) — it replaces the model's button with its ⚙, AgentEditorPanel and SkillChatPanel, and takes the
//   list of the Participants panel (hidden then); the model's ⚙ «Model settings» is in that list. The button flashes
//   once after a pick in «+».
// The host passes the chat's context_strategy, instructions, persona and setActiveConversation for the ring's card, as
// ParticipantsWrapper does now, and onShowToolkitEditor, which ChatBox has; Storybook adds these props to ChatBox through
// CONCEPT_PATCHES in .storybook/main.js.
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { Box, useTheme } from '@mui/material';

import UserInput from '@/ComponentsLib/Chat/UserInput';
import { useChatConfig, useSpeakingModeLoop } from '@/[fsd]/features/chat/lib/hooks';
import { ChatButton } from '@/[fsd]/features/chat/ui';
import AgentEditorPanel from '@/[fsd]/features/chat/ui/chat-input/AgentEditorPanel.jsx';
import SkillChatPanel from '@/[fsd]/features/chat/ui/chat-input/SkillChatPanel.jsx';
import { CHAT_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { ContextBudgetUI } from '@/[fsd]/widgets/context-budget';
import { ChatParticipantType } from '@/common/constants';

import ConceptModelButton from './ConceptModelButton';
import ConceptPlusButton from './ConceptPlusButton';
import { useConceptSwap } from './ConceptSwapContext';
import ConceptWhoAnswers from './ConceptWhoAnswers';

// concept: the placeholder names «#»
const DEV_PLACEHOLDER = 'Type your message...';
// the one who answers is named by its details, else by the chat participant's meta (a participant has no `name`)
const conceptPlaceholder = (placeholder, activeParticipant, activeParticipantDetails) => {
  if (placeholder && placeholder !== DEV_PLACEHOLDER) return placeholder;
  if (!activeParticipant || activeParticipant.entity_name === ChatParticipantType.Users) {
    return 'Type your message… # for assistants';
  }
  const name = activeParticipantDetails?.name || activeParticipant.meta?.name || activeParticipant.name;
  if (name) {
    return `Reply to ${name}…`;
  }
  return 'Type your message… # for assistants';
};

const ConceptChatInput = memo(
  forwardRef((props, ref) => {
    const {
      fromTheChat,
      conversationId,
      onSend,
      isLoading,
      isStreaming = false,
      isInjectable = false,
      onInject,
      onStopGeneration,
      disabledSend,
      isReadOnly = false,
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

      activeSkillUnavailableReason,

      onShowAgentEditor,
      onShowSkillEditor,
      onCloseSkillEditor,
      editingSkill,
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

      // the model's settings (⚙ next to the model's button), as on dev
      llmSettings,
      onSetLLMSettings,
      showWebhookSecret,
      showStepsLimit,

      // concept: the pencil of a toolkit row in the «who answers» list (ChatBox has it; today's field does not take it)
      onShowToolkitEditor,
      // concept: for the rows of «who answers», as the Participants panel gets them
      editingToolkit,
      selectedManager,
      newConversationSelectedManager,

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
      // concept: onAddNewUsers is not read — no «Invite Users» in «+» (people come from Share in the header)
      internal_tools = [],

      onClearChat,
      disableClearChat = false,
      projectId,

      // concept: the chat's values for the ring's card (Context settings, the Balanced / Full switch, Summarize now)
      contextStrategy,
      setActiveConversation,
      conversationInstructions,
      persona,

      // Participant management (for PlusChatButton submenus)
      onSelectParticipant,
      onCreateAgent,
      onCreatePipeline,
      onCreateSkill,
      onCreateToolkit,
      onDeleteParticipant,
      participants = [],

      slashHighlights = [],

      // Speaking mode
      isSpeakingMode = false,
      onSpeakingModeToggle,
      isTTSPlaying = false,
    } = props;
    const styles = conceptChatInputStyles();

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

    const handleInject = useCallback(
      question => {
        voiceButtonRef.current?.stop();
        onInject?.(question);
      },
      [onInject],
    );

    useEffect(() => {
      voiceButtonRef.current?.stop();
    }, [conversationId]);

    const onDrop = useCallback(
      event => {
        event.preventDefault();
        event.stopPropagation();

        if (disableAttachments || isLoading || isStreaming) {
          toastError('Attachments are not allowed.');
          return;
        }
        if (attachmentButtonRef.current) {
          attachmentButtonRef.current.onDrop(event);
        }
      },
      [disableAttachments, isLoading, isStreaming, toastError],
    );

    const handleFilePaste = useCallback(
      files => {
        // Use the AttachmentButton's file processing logic for pasted files
        if (disableAttachments || isLoading || isStreaming) {
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
      [disableAttachments, isLoading, isStreaming, onAttachFiles, toastError],
    );

    // concept: the «who answers» list replaces the panels below; the switch is the concept's whoAnswers
    const { whoAnswers: isWhoAnswersList } = useConceptSwap();

    // concept: the list's pencil opens the right editor, with the same branches as NewChat.jsx › onEditParticipant
    const onEditParticipant = useCallback(
      participant => {
        if (!participant) return;
        const { entity_name } = participant;
        if (entity_name === ChatParticipantType.Toolkits) {
          onShowToolkitEditor?.(participant);
        } else if (
          entity_name === ChatParticipantType.Pipelines ||
          (entity_name === ChatParticipantType.Applications &&
            (participant.entity_settings?.agent_type === 'pipeline' || participant.agent_type === 'pipeline'))
        ) {
          onShowPipelineEditor?.(participant);
        } else if (entity_name === ChatParticipantType.Applications) {
          onShowAgentEditor?.(participant);
        } else if (entity_name === ChatParticipantType.Skills) {
          onShowSkillEditor?.(participant);
        }
      },
      [onShowToolkitEditor, onShowSkillEditor, onShowPipelineEditor, onShowAgentEditor],
    );

    // concept: one flash of the «who answers» button after a pick in «+»
    const [pulseKey, setPulseKey] = useState(0);
    const onPicked = useCallback(() => setPulseKey(key => key + 1), []);

    // concept: «who answers» under the field — one button and its list
    const whoAnswersList = isAgentsPage ? (
      <ConceptModelButton
        dataTourTargetId={CHAT_TOUR_TARGET_IDS.modelSettings}
        selectedModel={selectedModel}
        onSelectModel={onSelectModel}
        models={modelList}
        disabled={disableSwitchingParticipant || isStreaming || isLoading}
      />
    ) : (
      <ConceptWhoAnswers
        conversationId={conversationId}
        participants={participants}
        activeParticipant={activeParticipant}
        activeParticipantDetails={activeParticipantDetails}
        selectedVersionId={selectedVersionId}
        onSelectVersion={onSelectVersion}
        variables={variables}
        onChangeVariables={onChangeVariables}
        modelList={modelList}
        selectedModel={selectedModel}
        onSelectModel={onSelectModel}
        selectSavedOrDefaultModel={selectSavedOrDefaultModel}
        onSelectParticipant={onSelectParticipant}
        onDeleteParticipant={onDeleteParticipant}
        onEditParticipant={onEditParticipant}
        llmSettings={llmSettings}
        onSetLLMSettings={onSetLLMSettings}
        showWebhookSecret={!!showWebhookSecret}
        showStepsLimit={!!showStepsLimit}
        internal_tools={internal_tools}
        onInternalToolsConfigChange={onInternalToolsConfigChange}
        disabled={disableSwitchingParticipant || isStreaming || isLoading}
        pulseKey={pulseKey}
        isEditorDirty={isEditorDirty}
        onShowVersionChangeAlert={onShowVersionChangeAlert}
        onCloseAgentEditor={onCloseAgentEditor}
        onClosePipelineEditor={onClosePipelineEditor}
        onCloseSkillEditor={onCloseSkillEditor}
        activeSkillUnavailableReason={activeSkillUnavailableReason}
        editingToolkit={editingToolkit}
        selectedManager={selectedManager}
        newConversationSelectedManager={newConversationSelectedManager}
      />
    );

    // concept: «who answers» under the field (dev: inside the field's bar, right)
    const whoAnswers = isWhoAnswersList ? (
      whoAnswersList
    ) : (
      <>
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
        {activeParticipant?.entity_name === ChatParticipantType.Skills && !isAgentsPage && (
          <SkillChatPanel
            activeParticipant={activeParticipant}
            participantDetails={activeParticipantDetails}
            onClickParticipant={onShowParticipantsList}
            selectedVersionId={selectedVersionId}
            onSelectVersion={onSelectVersion}
            onShowSkillEditor={onShowSkillEditor}
            onCloseSkillEditor={onCloseSkillEditor}
            editingSkill={editingSkill}
            isEditorDirty={isEditorDirty}
            onShowVersionChangeAlert={onShowVersionChangeAlert}
            unavailableReason={activeSkillUnavailableReason}
            disabled={isStreaming}
            onSwitchToModel={selectSavedOrDefaultModel}
            disableSwitchToModel={disableSwitchingParticipant || isLoading || isStreaming}
          />
        )}
        {(isAgentsPage || !activeParticipant) && (
          // concept: the model's button without fill, then the team's ⚙ (ConceptModelButton; dev: LLMModelSelector)
          <ConceptModelButton
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
      </>
    );

    return (
      <Box
        sx={styles.column}
        data-testid="concept-chat-input"
      >
        <UserInput
          dataTourTargetId={CHAT_TOUR_TARGET_IDS.messageInput}
          isStreaming={isStreaming}
          isInjectable={isInjectable}
          onInject={handleInject}
          onStop={onStopGeneration}
          attachments={attachments}
          onDeleteAttachment={onDeleteAttachment}
          isCreatingConversation={isCreatingConversation}
          slots={{
            footer: (
              <Box sx={styles.toolbar}>
                <Box sx={styles.toolbarLeft}>
                  {fromTheChat && (
                    // concept: the «+» menu (dev: PlusChatButton)
                    <ConceptPlusButton
                      attachmentButtonRef={attachmentButtonRef}
                      onAttachFiles={onAttachFiles}
                      disableAttachments={disableAttachments || isLoading || isStreaming}
                      participantDisablesAttachments={disableAttachments}
                      attachments={attachments}
                      limits={limits}
                      onInternalToolsConfigChange={onInternalToolsConfigChange}
                      internal_tools={internal_tools}
                      disableInternalTools={isLoading || isStreaming}
                      onSelectParticipant={onSelectParticipant}
                      onPicked={onPicked}
                      onCreateAgent={onCreateAgent}
                      onCreatePipeline={onCreatePipeline}
                      onCreateSkill={onCreateSkill}
                      onCreateToolkit={onCreateToolkit}
                      onDeleteParticipant={onDeleteParticipant}
                      participants={participants}
                    />
                  )}
                  {fromTheChat && onClearChat && (
                    <ChatButton.ClearChatButton
                      disabled={disableClearChat}
                      onClear={onClearChat}
                    />
                  )}
                  {!hideAttachments && !fromTheChat && (
                    <ChatButton.AttachmentButton
                      ref={attachmentButtonRef}
                      onAttachFiles={onAttachFiles}
                      disableAttachments={disableAttachments || isLoading || isStreaming}
                      attachments={attachments}
                      limits={limits}
                      testId="chat-attach-button"
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
                <Box sx={styles.toolbarRight}>
                  {/* concept: the context ring, in the field before the mic (dev: bottom of the Participants panel) */}
                  {fromTheChat && conversationId && (
                    <Box
                      data-tour={CHAT_TOUR_TARGET_IDS.contextBudget}
                      sx={styles.ring}
                    >
                      <ContextBudgetUI.ContextBudgetInfo
                        conversationId={conversationId}
                        collapsed
                        contextStrategy={contextStrategy}
                        setActiveConversation={setActiveConversation}
                        conversationInstructions={conversationInstructions}
                        persona={persona}
                      />
                    </Box>
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
              placeholder:
                isRecording || isSpeakingMode
                  ? 'Speak your message'
                  : conceptPlaceholder(placeholder, activeParticipant, activeParticipantDetails),
              color: theme.palette.text.secondary,
              iconColor: theme.palette.icon.default,
            },
            sendButton: {
              iconColor: theme.palette.icon.send,
              disabledBackground: theme.palette.components.button.background.primary.disabled,
              background: theme.palette.primary.main,
            },
            stopButton: {
              iconColor: theme.palette.icon.attention,
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
          disabledInput={isLoading || isReadOnly}
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
        <Box
          sx={styles.below}
          data-testid="concept-below"
        >
          {whoAnswers}
        </Box>
      </Box>
    );
  }),
);

ConceptChatInput.displayName = 'ConceptChatInput';

/** @type {MuiSx} */
const conceptChatInputStyles = () => ({
  // concept: the field and the row under it
  column: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    minWidth: 0,
  },
  below: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '.5rem',
    minHeight: '2rem',
    marginTop: '.375rem',
    paddingRight: '.25rem',
    minWidth: 0,
    overflow: 'hidden',
  },
  ring: {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  toolbar: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: { xs: '.125rem', sm: '.5rem' },
    justifyContent: 'space-between',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  toolbarLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: { xs: '.25rem', sm: '.5rem' },
    flexShrink: 0,
  },
  toolbarRight: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: { xs: '.25rem', sm: '.5rem' },
    minWidth: 0,
    flexShrink: 1,
    maxWidth: '100%',
    overflow: 'hidden',
  },
});

export default ConceptChatInput;
