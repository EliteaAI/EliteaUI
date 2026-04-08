import { useMemo } from 'react';

import { getAttachmentDisabledStatus } from '@/common/attachmentUtils';

import { useAttachmentState } from './useAttachmentState';

/**
 * Hook for managing attachments in new conversation contexts.
 * Simplified version - attachments are now handled via internal tools auto-injection
 * and always use the default attachment bucket.
 */
export default function useNewConversationAttachments({ selectedParticipant }) {
  // Use shared utility for determining disabled status
  const disableAttachments = useMemo(
    () => getAttachmentDisabledStatus(selectedParticipant, selectedParticipant),
    [selectedParticipant],
  );

  // Use shared attachment state management
  const { attachments, onAttachFiles, onDeleteAttachment, onClearAttachments } = useAttachmentState();

  return {
    attachments,
    disableAttachments,
    onAttachFiles,
    onDeleteAttachment,
    onClearAttachments,
  };
}
