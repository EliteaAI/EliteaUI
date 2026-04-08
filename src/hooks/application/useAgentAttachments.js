import { useEffect, useMemo } from 'react';

import { useFormikContext } from 'formik';

import { useAttachmentState } from '../chat/useAttachmentState';

/**
 * Hook for managing attachments in agent/application context.
 * Simplified version - attachments are now handled via internal tools auto-injection
 * and always use the default attachment bucket.
 */
export default function useAgentAttachments({ agentVersionDetails }) {
  const formik = useFormikContext();

  // Use shared attachment state management
  const { attachments, onAttachFiles, onDeleteAttachment, onClearAttachments } = useAttachmentState();

  // Disable attachments if 'attachments' is not in the internal_tools list
  const disableAttachments = useMemo(
    () => !agentVersionDetails?.meta?.internal_tools?.includes('attachments'),
    [agentVersionDetails?.meta?.internal_tools],
  );

  // Clear attachments when they become disabled
  useEffect(() => {
    if (disableAttachments) {
      onClearAttachments();
    }
    return () => {
      onClearAttachments();
    };
  }, [disableAttachments, onClearAttachments]);

  // Clear attachments when version changes
  useEffect(() => {
    onClearAttachments();
  }, [formik?.values?.version_details?.id, onClearAttachments]);

  return {
    attachments,
    onAttachFiles,
    onDeleteAttachment,
    disableAttachments,
    onClearAttachments,
  };
}
