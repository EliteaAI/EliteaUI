import { useCallback } from 'react';

import { SHARE_MESSAGES } from '@/[fsd]/features/chat/conversation-list/lib/constants';
import { useToast } from '@/[fsd]/shared/lib/hooks';

export const useCopyToClipboard = () => {
  const { toastInfo, toastError } = useToast();

  return useCallback(
    async (text, message) => {
      try {
        await navigator.clipboard.writeText(text);
        toastInfo(message);
      } catch {
        toastError(SHARE_MESSAGES.copyFailed);
      }
    },
    [toastError, toastInfo],
  );
};
