import { createAttachmentManagerData } from '@/common/attachmentUtils';
import { ToolTypes } from '@/pages/Applications/Components/Tools/consts';

/**
 * Factory function for creating attachment manager service
 * Follows Single Responsibility Principle - handles only attachment manager business logic
 * Follows Open/Closed Principle - extensible for different manager types
 */
export const createAttachmentManagerService = (setAttachmentStorageMutation, toastError, toastSuccess) => {
  /**
   * Set attachment manager for a conversation
   * Follows Interface Segregation Principle - focused interface for conversation operations
   */
  const setConversationAttachmentManager = async (projectId, conversationId, toolkitId) => {
    try {
      const { data, error } = await setAttachmentStorageMutation({
        projectId,
        conversationId,
        toolkit_id: toolkitId,
      });

      if (error) {
        toastError?.('Failed to set attachment storage');
        return { success: false, error, data: null };
      }

      toastSuccess?.('Attachment storage set successfully');
      return { success: true, error: null, data };
    } catch (err) {
      toastError?.(err);
      return { success: false, error: err, data: null };
    }
  };

  /**
   * Set attachment manager for an agent/application
   * Follows Interface Segregation Principle - focused interface for agent operations
   */
  const setAgentAttachmentManager = async (projectId, applicationId, versionId, toolkitId) => {
    try {
      const { data, error } = await setAttachmentStorageMutation({
        projectId,
        applicationId,
        versionId,
        toolkit_id: toolkitId,
      });

      if (error) {
        toastError?.('Failed to set attachment manager');
        return { success: false, error, data: null };
      }

      const successMessage = toolkitId
        ? 'Attachment manager set successfully'
        : 'Attachment manager removed successfully';

      toastSuccess?.(successMessage);
      return { success: true, error: null, data };
    } catch (err) {
      toastError?.(err);
      return { success: false, error: err, data: null };
    }
  };

  /**
   * Update conversation with new attachment participant
   * Follows Single Responsibility Principle - handles only conversation state update
   */
  const updateConversationWithAttachmentParticipant = (conversation, participantData) => {
    const existingParticipant = conversation.participants?.find(
      participant => participant.id === participantData?.id,
    );

    return {
      ...conversation,
      attachment_participant_id: participantData?.id || '',
      participants: existingParticipant
        ? conversation.participants
        : [
            ...(conversation.participants || []),
            {
              ...participantData,
              entity_settings: {
                toolkit_type: ToolTypes.artifact.value,
              },
            },
          ],
    };
  };

  /**
   * Update formik values with new toolkit
   * Follows Single Responsibility Principle - handles only formik state update
   */
  const updateFormikWithToolkit = (formik, toolkit, isNewToolkit = false) => {
    const currentVersionDetails = formik.values?.version_details || {};
    const currentTools = currentVersionDetails.tools || [];
    const currentMeta = currentVersionDetails.meta || {};

    const updatedTools = isNewToolkit
      ? [...currentTools, createAttachmentManagerData(toolkit)]
      : currentTools;

    const updatedMeta = {
      ...currentMeta,
      attachment_toolkit_id: toolkit?.id,
    };

    const updatedVersionDetails = {
      ...currentVersionDetails,
      tools: updatedTools,
      meta: updatedMeta,
    };

    if (formik.dirty) {
      formik.setFieldValue('version_details', updatedVersionDetails);
    } else {
      formik.resetForm({
        values: {
          ...formik.values,
          version_details: updatedVersionDetails,
        },
      });
    }
  };

  return {
    setConversationAttachmentManager,
    setAgentAttachmentManager,
    updateConversationWithAttachmentParticipant,
    updateFormikWithToolkit,
  };
};
