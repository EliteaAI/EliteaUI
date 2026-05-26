import { useMemo } from 'react';

import { getAttachmentDisabledStatus } from '@/[fsd]/entities/attachment/lib';

import { useAttachmentState } from './useAttachmentState';

/**
 * Hook for managing attachments in new conversation contexts.
 * Simplified version - attachments are now handled via internal tools auto-injection
 * and always use the default attachment bucket.
 */
export default function useNewConversationAttachments({ selectedParticipant, activeParticipantDetails }) {
  // Use shared utility for determining disabled status.
  // Prefer activeParticipantDetails when it has been fetched (has version_details),
  // because it reflects the latest saved state (e.g. after toggling attachment in the pipeline editor).
  // Fall back to selectedParticipant (which already carries version_details from the initial load)
  // until activeParticipantDetails is populated by the API call.
  const disableAttachments = useMemo(() => {
    const detailsForCheck = activeParticipantDetails?.version_details
      ? activeParticipantDetails
      : selectedParticipant;
    return getAttachmentDisabledStatus(selectedParticipant, detailsForCheck);
  }, [selectedParticipant, activeParticipantDetails]);

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
