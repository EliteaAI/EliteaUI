import { useCallback, useEffect, useMemo } from 'react';

import { useSetAttachmentStorageMutation } from '@/api/chat';
import { getAttachmentDisabledStatus, getAttachmentManagerId } from '@/common/attachmentUtils';

import { useSelectedProjectId } from '../useSelectedProject';
import useToast from '../useToast';
import { createAttachmentManagerService } from './attachmentManagerService';
import { useAttachmentState } from './useAttachmentState';

/**
 * Hook for managing attachments in active conversations
 * Follows Single Responsibility Principle - handles only conversation attachment logic
 * Uses Dependency Injection for better testability and loose coupling
 */
export default function useAttachments({
  activeConversation,
  setActiveConversation,
  activeParticipant,
  activeParticipantDetails,
}) {
  const projectId = useSelectedProjectId();
  const { toastError, toastSuccess } = useToast();
  const [setAttachmentStorageMutation, { isLoading: isSettingManager }] = useSetAttachmentStorageMutation();

  // Use shared attachment state management
  const { attachments, onAttachFiles, onDeleteAttachment, onClearAttachments } = useAttachmentState();

  // Use shared utility for determining disabled status
  const disableAttachments = useMemo(
    () => getAttachmentDisabledStatus(activeParticipant, activeParticipantDetails),
    [activeParticipant, activeParticipantDetails],
  );

  // Use shared utility for getting manager ID
  const selectedManager = useMemo(
    () => getAttachmentManagerId(activeConversation, activeConversation?.participants),
    [activeConversation],
  );

  // Create service instance with dependencies injected
  const attachmentManagerService = useMemo(
    () => createAttachmentManagerService(setAttachmentStorageMutation, toastError, toastSuccess),
    [setAttachmentStorageMutation, toastError, toastSuccess],
  );

  const onSelectAttachmentManager = useCallback(
    async (toolkit, onFinish) => {
      if (!activeConversation?.id || !projectId || !toolkit?.id) {
        return;
      }

      const result = await attachmentManagerService.setConversationAttachmentManager(
        projectId,
        activeConversation.id,
        toolkit.id,
      );

      if (result.success) {
        const updatedConversation = attachmentManagerService.updateConversationWithAttachmentParticipant(
          activeConversation,
          result.data,
        );
        setActiveConversation(updatedConversation);
        onFinish?.();
      }
    },
    [activeConversation, projectId, attachmentManagerService, setActiveConversation],
  );

  // Clear attachments when conversation changes
  useEffect(() => {
    onClearAttachments();
  }, [activeConversation?.id, onClearAttachments]);

  // Clear attachments when they become disabled
  useEffect(() => {
    if (disableAttachments) {
      onClearAttachments();
    }
  }, [disableAttachments, onClearAttachments]);

  return {
    attachments,
    selectedManager,
    isSettingManager,
    disableAttachments,
    onAttachFiles,
    onDeleteAttachment,
    onSelectAttachmentManager,
    onClearAttachments,
  };
}
