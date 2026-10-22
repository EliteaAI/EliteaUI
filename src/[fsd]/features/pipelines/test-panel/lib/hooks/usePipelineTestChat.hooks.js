import { useCallback, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { usePipelineChat } from '@/[fsd]/features/pipelines/lib/hooks';
import { LLMSettingsConstants } from '@/[fsd]/shared/lib/constants';
import {
  useRestoredConversation,
  useRunHistoryNavigation,
  useSelectedProjectId,
} from '@/[fsd]/shared/lib/hooks';
import { isReasoningFamilyFromStored } from '@/[fsd]/shared/lib/utils';
import useUploadAttachments from '@/hooks/chat/useUploadAttachments';
import RouteDefinitions from '@/routes';

const { DEFAULT_MAX_TOKENS, DEFAULT_REASONING_EFFORT, DEFAULT_TEMPERATURE } = LLMSettingsConstants;

/**
 * Chat state of the pipeline Test panel: conversation, LLM settings and the ChatBox `settings` bag.
 * `editorPanelRef` forwards run events to the canvas.
 */
export const usePipelineTestChat = ({
  applicationId,
  editorPanelRef,
  unsavedLLMSettings,
  setUnsavedLLMSettings,
}) => {
  const { goToRunHistory } = useRunHistoryNavigation({
    entityId: applicationId,
    historyRoute: RouteDefinitions.PipelineRunHistory,
  });
  const { restoredConversationID, onRestoreConversationComplete } = useRestoredConversation();

  const { values: formValues, initialValues, setFieldValue } = useFormikContext();
  const projectId = useSelectedProjectId();

  const handleRcvAgentEvent = useCallback(
    event => {
      editorPanelRef.current?.onRcvAgentEvent(event);
    },
    [editorPanelRef],
  );

  const handleDeleteAllRunNodes = useCallback(() => {
    editorPanelRef.current?.deleteAllRunNodes();
  }, [editorPanelRef]);

  const handleStopRun = useCallback(() => {
    editorPanelRef.current?.onStopRun();
  }, [editorPanelRef]);

  const {
    llm_settings: rawLlmSettings,
    tools,
    id: currentVersionId,
    type = 'chat',
  } = formValues?.version_details || {};
  // `llm_settings: null` from the API would crash the destructure below, so coerce it to `{}`
  const llm_settings = useMemo(() => rawLlmSettings || {}, [rawLlmSettings]);

  // Only one of temperature/reasoning_effort applies (issue #5821); the family is inferred from what is stored
  const {
    model_name,
    model_project_id,
    max_tokens = DEFAULT_MAX_TOKENS,
    temperature,
    reasoning_effort,
  } = llm_settings;
  const isReasoningFamily = isReasoningFamilyFromStored(llm_settings);

  const interaction_uuid = useMemo(() => `pipeline_${applicationId}_${Date.now()}`, [applicationId]);

  const memoizedLlmSettings = useMemo(
    () => ({
      model_name: llm_settings?.model_name,
      model_project_id: llm_settings?.model_project_id,
      temperature: llm_settings?.temperature,
      max_tokens: llm_settings?.max_tokens,
      reasoning_effort: llm_settings?.reasoning_effort,
    }),
    [llm_settings],
  );

  const handleSetLLMSettings = useCallback(
    newSettings => {
      // eslint-disable-next-line no-unused-vars
      const { steps_limit, ...llmSettings } = newSettings;
      const currentModelName = formValues?.version_details?.llm_settings?.model_name;
      const currentModelProjectId = formValues?.version_details?.llm_settings?.model_project_id;
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
    [setFieldValue, formValues?.version_details?.llm_settings, initialValues],
  );

  const { uploadAttachments, isUploading: isUploadingAttachments, uploadProgress } = useUploadAttachments();

  const {
    activeConversation,
    activeParticipant,
    isLoadingConversation,
    isStreaming,
    setChatHistory,
    setActiveConversation,
    onDeleteMessage,
    onDeleteAllMessages,
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
  } = usePipelineChat({
    pipelineId: applicationId,
    pipelineName: formValues?.name,
    pipelineVersionDetails: formValues?.version_details,
    projectId,
    setFieldValue,
    currentLLMSettings: {
      model_name,
      model_project_id,
      max_tokens,
      ...(isReasoningFamily
        ? { reasoning_effort: reasoning_effort ?? DEFAULT_REASONING_EFFORT }
        : { temperature: temperature ?? DEFAULT_TEMPERATURE }),
    },
    deleteAllRunNodes: handleDeleteAllRunNodes,
    restoredConversationID,
    onRestoreConversationComplete,
  });

  const { conversation_starters: conversationStarters = [] } = useMemo(
    () => formValues?.version_details || {},
    [formValues?.version_details],
  );

  const settings = useMemo(
    () => ({
      activeConversation,
      activeParticipant,
      setChatHistory,
      isLoadingConversation,
      onDeleteMessage,
      onDeleteAllMessages,
      onSend,
      onSelectThisParticipant,
      onClearActiveParticipant,
      onChangeParticipantSettings,
      isStreaming,
      onStopStreaming,
      llmSettings: memoizedLlmSettings,
      onSetLLMSettings: handleSetLLMSettings,
      type,
      conversationStarters,
      isFullScreenChat: false,
      isAgentsPage: true,
      tools,
      currentVersionId,
      application_id: applicationId,
      onStopRun: handleStopRun,
      onRcvAgentEvent: handleRcvAgentEvent,
      deleteAllRunNodes: handleDeleteAllRunNodes,
      interaction_uuid,
      activeParticipantDetails,
      disableAttachments,
      attachments,
      onAttachFiles,
      onDeleteAttachment,
      existingToolkitIds:
        formValues?.version_details?.tools?.filter(t => t.type === 'toolkit').map(t => t.id) || [],
      onClearAttachments,
      uploadAttachments,
      isUploadingAttachments,
      uploadProgress,
      unsavedLLMSettings,
      setUnsavedLLMSettings,
    }),
    [
      activeConversation,
      activeParticipant,
      setChatHistory,
      isLoadingConversation,
      onDeleteMessage,
      onDeleteAllMessages,
      onSend,
      onSelectThisParticipant,
      onClearActiveParticipant,
      onChangeParticipantSettings,
      isStreaming,
      onStopStreaming,
      handleSetLLMSettings,
      type,
      conversationStarters,
      tools,
      currentVersionId,
      applicationId,
      handleStopRun,
      handleRcvAgentEvent,
      handleDeleteAllRunNodes,
      interaction_uuid,
      activeParticipantDetails,
      attachments,
      disableAttachments,
      onAttachFiles,
      onDeleteAttachment,
      uploadAttachments,
      isUploadingAttachments,
      uploadProgress,
      formValues?.version_details?.tools,
      onClearAttachments,
      memoizedLlmSettings,
      unsavedLLMSettings,
      setUnsavedLLMSettings,
    ],
  );

  return { settings, setActiveConversation, goToRunHistory };
};
