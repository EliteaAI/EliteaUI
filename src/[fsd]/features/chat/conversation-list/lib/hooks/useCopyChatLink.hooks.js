import { useCallback } from 'react';

import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';
import { SearchParams } from '@/common/constants';
import { getBasename } from '@/routes';

export const useCopyChatLink = () => {
  const projectId = useSelectedProjectId();
  const { toastInfo } = useToast();

  return useCallback(
    async (conversation, message) => {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const url = `${baseUrl}${getBasename()}/${projectId}/chat/${conversation.id}?name=${encodeURIComponent(conversation.name)}&${SearchParams.SharedChat}=1`;
      await navigator.clipboard?.writeText(url).catch(() => {});
      toastInfo(message);
    },
    [projectId, toastInfo],
  );
};
