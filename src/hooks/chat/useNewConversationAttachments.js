import { useMemo } from 'react';

import { getAttachmentDisabledStatus } from '@/[fsd]/entities/attachment/lib';

import { useAttachmentState } from './useAttachmentState';

/**
 * Hook for managing attachments in new conversation contexts.
 * Simplified version - attachments are now handled via internal tools auto-injection
 * and always use the default attachment bucket.
 */
const useNewConversationAttachments = ({ selectedParticipant, activeParticipantDetails }) => {
  // selectedParticipant.version_details is set (fresh) by onSelectVersion whenever the user
  // switches versions. Prefer it when available; fall back to activeParticipantDetails (the
  // background-fetched details from NewChat) for the initial state before any version switch.
  const disableAttachments = useMemo(() => {
    const detailsForCheck = selectedParticipant?.version_details
      ? selectedParticipant
      : activeParticipantDetails?.version_details
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
};
export default useNewConversationAttachments;
