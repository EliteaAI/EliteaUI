import { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { useApplicationChat } from '@/[fsd]/features/agent/lib/hooks';
import { useRestoredConversation, useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { isTestChatClearDisabled } from '@/[fsd]/widgets/entity-test-panel';
import useUploadAttachments from '@/hooks/chat/useUploadAttachments';

/**
 * Chat state of the agent Test panel: the conversation, ChatBox settings and the model settings bridge
 * into the agent form.
 */
export const useAgentTestChat = ({ applicationId, unsavedLLMSettings, setUnsavedLLMSettings }) => {
  const projectId = useSelectedProjectId();
  const { restoredConversationID, onRestoreConversationComplete } = useRestoredConversation();
  const {
    values: { version_details = {}, id, name } = {},
    initialValues,
    setFieldValue,
  } = useFormikContext();

  const handleSetLLMSettings = useCallback(
    newSettings => {
      // eslint-disable-next-line no-unused-vars
      const { steps_limit, ...llmSettings } = newSettings;
      const currentModelName = version_details?.llm_settings?.model_name;
      const currentModelProjectId = version_details?.llm_settings?.model_project_id;
      const isModelSwitch =
        'model_name' in llmSettings &&
        (llmSettings.model_name !== currentModelName ||
          llmSettings.model_project_id !== currentModelProjectId);

      if (isModelSwitch) {
        const initialLlmSettings = initialValues?.version_details?.llm_settings;

        if (
          initialLlmSettings?.model_name === llmSettings.model_name &&
          initialLlmSettings?.model_project_id === llmSettings.model_project_id
        ) {
          setFieldValue('version_details.llm_settings', initialLlmSettings);
        } else {
          const cleaned = Object.fromEntries(Object.entries(llmSettings).filter(([, v]) => v !== null));
          setFieldValue('version_details.llm_settings', cleaned);
        }
      } else {
        Object.entries(llmSettings).forEach(([key, value]) => {
          setFieldValue(`version_details.llm_settings.${key}`, value);
        });
      }
    },
    [setFieldValue, version_details?.llm_settings, initialValues],
  );

  const {
    activeConversation,
    activeParticipant,
    isStreaming,
    isLoadingConversation,
    setChatHistory,
    setActiveConversation,
    onDeleteAllMessages,
    onDeleteMessage,
    onChangeParticipantSettings,
    onSend,
    onSelectThisParticipant,
    onClearActiveParticipant,
    onStopStreaming,
    activeParticipantDetails,
    attachments,
    disableAttachments,
    onAttachFiles,
    onDeleteAttachment,
    onClearAttachments,
  } = useApplicationChat({
    applicationId: id || applicationId,
    applicationName: name,
    applicationVersionDetails: version_details,
    projectId,
    restoredConversationID,
    onRestoreConversationComplete,
    setFieldValue: (path, value) => {
      if (path.includes('llm_settings')) {
        const key = path.split('.').pop();
        handleSetLLMSettings({ [key]: value });
      }
    },
  });

  const { uploadAttachments, isUploading: isUploadingAttachments, uploadProgress } = useUploadAttachments();

  const llmSettings = useMemo(
    () => ({
      selection: version_details?.llm_settings?.selection,
      model_name: version_details?.llm_settings?.model_name,
      model_project_id: version_details?.llm_settings?.model_project_id,
      temperature: version_details?.llm_settings?.temperature,
      max_tokens: version_details?.llm_settings?.max_tokens,
      reasoning_effort: version_details?.llm_settings?.reasoning_effort,
    }),
    [version_details?.llm_settings],
  );

  const settings = useMemo(
    () => ({
      conversationStarters: version_details?.conversation_starters || [],
      existingToolkitIds: version_details?.tools?.filter(t => t.type === 'artifact').map(t => t.id) || [],
      llmSettings,
      activeParticipant,
      activeConversation,
      setActiveConversation,
      activeParticipantDetails,
      isStreaming,
      setChatHistory,
      onDeleteMessage,
      onDeleteAllMessages,
      onChangeParticipantSettings,
      onSelectThisParticipant,
      onClearActiveParticipant,
      onStopStreaming,
      enableMentions: false,
      isLoadingConversation,
      isAgentsPage: true,
      onSetLLMSettings: handleSetLLMSettings,
      showWebhookSecret: false,
      onSend,
      attachments,
      disableAttachments,
      onAttachFiles,
      onDeleteAttachment,
      onClearAttachments,
      uploadAttachments,
      isUploadingAttachments,
      uploadProgress,
      unsavedLLMSettings,
      setUnsavedLLMSettings,
    }),
    [
      version_details?.conversation_starters,
      version_details?.tools,
      llmSettings,
      activeParticipant,
      activeConversation,
      setActiveConversation,
      activeParticipantDetails,
      isStreaming,
      setChatHistory,
      onDeleteMessage,
      onDeleteAllMessages,
      onChangeParticipantSettings,
      onSelectThisParticipant,
      onClearActiveParticipant,
      onStopStreaming,
      isLoadingConversation,
      handleSetLLMSettings,
      onSend,
      attachments,
      disableAttachments,
      onAttachFiles,
      onDeleteAttachment,
      onClearAttachments,
      uploadAttachments,
      isUploadingAttachments,
      uploadProgress,
      unsavedLLMSettings,
      setUnsavedLLMSettings,
    ],
  );

  const isClearDisabled = isTestChatClearDisabled(activeConversation?.chat_history, isStreaming);

  return {
    settings,
    activeConversation,
    activeParticipant,
    setActiveConversation,
    isClearDisabled,
  };
};
