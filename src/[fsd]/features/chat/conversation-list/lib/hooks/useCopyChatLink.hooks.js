import { useCallback } from 'react';

import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { SearchParams } from '@/common/constants';
import { getBasename } from '@/routes';

import { useCopyToClipboard } from './useCopyToClipboard.hooks';

export const useCopyChatLink = () => {
  const projectId = useSelectedProjectId();
  const copyToClipboard = useCopyToClipboard();

  return useCallback(
    (conversation, message) => {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const url = `${baseUrl}${getBasename()}/${projectId}/chat/${conversation.id}?name=${encodeURIComponent(conversation.name)}&${SearchParams.SharedChat}=1`;
      return copyToClipboard(url, message);
    },
    [copyToClipboard, projectId],
  );
};
