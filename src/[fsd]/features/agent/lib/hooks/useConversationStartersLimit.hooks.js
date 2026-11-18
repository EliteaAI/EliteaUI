import { useCallback } from 'react';

import { useDispatch } from 'react-redux';

import {
  TAG_PLATFORM_SETTINGS,
  platformSettingsApi,
  useGetPlatformSettingsQuery,
} from '@/api/platformSettings';
import { MAX_CONVERSATION_STARTERS } from '@/common/constants';

// Refetch on mount: an admin can change the limit at any time, and each editor should open with the
// current value instead of the one cached by an earlier page
export const useConversationStartersLimit = () => {
  const { data: platformSettings } = useGetPlatformSettingsQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

  return platformSettings?.conversation_starters_max ?? MAX_CONVERSATION_STARTERS;
};

// For save paths: invalidating refetches the editor's own subscription, without adding one per caller
export const useRefetchConversationStartersLimit = () => {
  const dispatch = useDispatch();

  return useCallback(() => {
    dispatch(platformSettingsApi.util.invalidateTags([TAG_PLATFORM_SETTINGS]));
  }, [dispatch]);
};
