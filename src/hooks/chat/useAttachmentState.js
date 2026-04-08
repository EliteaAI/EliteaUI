import { useCallback, useState } from 'react';

/**
 * Custom hook for basic attachment state management (CRUD operations)
 * Follows Single Responsibility Principle - handles only attachment state management
 *
 * @param {Array} initialAttachments - Initial attachments array (default: [])
 * @returns {Object} Attachment state and operations
 */
export const useAttachmentState = (initialAttachments = []) => {
  const [attachments, setAttachments] = useState(initialAttachments);

  const onAttachFiles = selectedFiles => {
    setAttachments(prev => [...prev, ...selectedFiles]);
  };

  const onDeleteAttachment = index => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Keep useCallback for functions used as dependencies in other useEffect hooks
  const onClearAttachments = useCallback(() => {
    setAttachments([]);
  }, []);

  const replaceAttachments = newAttachments => {
    setAttachments(newAttachments);
  };

  return {
    attachments,
    onAttachFiles,
    onDeleteAttachment,
    onClearAttachments,
    replaceAttachments,
  };
};

export default useAttachmentState;
