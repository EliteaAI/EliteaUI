import { useCallback } from 'react';

import { useProjectMemberIdsQuery } from '@/api';

// Project member ids for an Everyone mention in a whole-team chat, loaded as soon as Everyone is picked
export const useEveryoneMentionIds = ({ projectId, isMentioningEveryone, isWholeTeamChat, toastError }) => {
  const isNeeded = isMentioningEveryone && isWholeTeamChat;
  const { data, isFetching, isError, refetch } = useProjectMemberIdsQuery(
    { projectId },
    { skip: !isNeeded || !projectId },
  );

  // False keeps the message in the input: sending without the ids would reach only the joined members
  const canSendToEveryone = useCallback(() => {
    if (!isNeeded || !isError) return true;
    toastError('Failed to load the project members to mention. Please try again.');
    refetch();
    return false;
  }, [isError, isNeeded, refetch, toastError]);

  return {
    everyoneMemberIds: isWholeTeamChat ? data : undefined,
    isFetchingEveryoneIds: isFetching,
    canSendToEveryone,
  };
};
