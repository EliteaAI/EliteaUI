import { useCallback } from 'react';

import { buildErrorMessage } from '@/common/utils';

export const useContextStrategySubmit = ({
  selectedProjectId,
  conversationId,
  conversationInstructions,
  conversationPersona,
  updateContextStrategy,
  updateConversation,
  setActiveConversation,
  toastError,
}) => {
  const prepareRequestData = useCallback(
    values => {
      const { summary_llm_settings, ...otherFormData } = values;
      const { instructions, ...otherSummaryLLMSettings } = summary_llm_settings;

      return {
        projectId: selectedProjectId,
        conversationId,
        ...otherFormData,
        summary_llm_settings: otherSummaryLLMSettings,
        summary_instructions: instructions,
      };
    },
    [selectedProjectId, conversationId],
  );

  const shouldUpdateConversation = useCallback(
    (systemMessages, persona) => {
      return systemMessages !== conversationInstructions || persona !== conversationPersona;
    },
    [conversationInstructions, conversationPersona],
  );

  const updateConversationIfNeeded = useCallback(
    async (systemMessages, persona) => {
      if (!shouldUpdateConversation(systemMessages, persona)) {
        return;
      }

      await updateConversation({
        projectId: selectedProjectId,
        id: conversationId,
        instructions: systemMessages,
        meta: { persona },
      }).unwrap();
    },
    [selectedProjectId, conversationId, updateConversation, shouldUpdateConversation],
  );

  const updateActiveConversationState = useCallback(
    (systemMessages, persona, updatedStrategy) => {
      setActiveConversation(prev => ({
        ...prev,
        instructions: systemMessages,
        meta: {
          ...(prev?.meta || {}),
          persona,
          context_strategy: {
            ...updatedStrategy,
          },
        },
      }));
    },
    [setActiveConversation],
  );

  const handleSubmitError = useCallback(
    error => {
      if (error?.data?.details && Array.isArray(error.data.details)) {
        const serverErrors = {};
        error.data.details.forEach(detail => {
          const fieldName = detail.loc?.[0];
          if (fieldName) {
            serverErrors[fieldName] = detail.msg || 'Validation error';
          }
        });
        throw new Error(JSON.stringify(serverErrors));
      } else {
        toastError(error?.data?.error || 'Failed to update context strategy');
      }
    },
    [toastError],
  );

  const handleSubmit = useCallback(
    async (values, { setSubmitting, resetForm }) => {
      try {
        const { system_messages, persona } = values;
        const requestData = prepareRequestData(values);

        const result = await updateContextStrategy(requestData).unwrap();

        await updateConversationIfNeeded(system_messages, persona);

        if (!result.error) {
          updateActiveConversationState(system_messages, persona, result.updated_strategy);
          resetForm({ values });
        } else {
          toastError(buildErrorMessage(result.error) || 'Failed to update context strategy');
        }
      } catch (error) {
        handleSubmitError(error);
      } finally {
        setSubmitting(false);
      }
    },
    [
      prepareRequestData,
      updateContextStrategy,
      updateConversationIfNeeded,
      updateActiveConversationState,
      handleSubmitError,
      toastError,
    ],
  );

  return handleSubmit;
};
