import { useCallback } from 'react';

import { useTrackEvent } from '@/GA';
import { GA_EVENT_NAMES, GA_EVENT_PARAMS } from '@/[fsd]/shared/lib/constants/analytic.constants';
import useToast from '@/hooks/useToast';

export const useShareLink = () => {
  const { toastInfo } = useToast();
  const trackEvent = useTrackEvent();

  const copyShareLink = useCallback(
    async (url, entityType, entityId, entityName) => {
      try {
        await navigator.clipboard.writeText(url);
        toastInfo('The link has been copied to the clipboard');
        trackEvent(GA_EVENT_NAMES.SHARE_LINK_COPIED, {
          [GA_EVENT_PARAMS.ENTITY_TYPE]: entityType || 'unknown',
          [GA_EVENT_PARAMS.ENTITY_ID]: entityId || 'unknown',
          [GA_EVENT_PARAMS.ENTITY_NAME]: entityName || 'unknown',
          [GA_EVENT_PARAMS.TIMESTAMP]: new Date().toISOString(),
        });
      } catch {
        toastInfo('Failed to copy the link to the clipboard');
      }
    },
    [toastInfo, trackEvent],
  );

  return { copyShareLink };
};
