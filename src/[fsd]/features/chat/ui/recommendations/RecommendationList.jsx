import { memo, useEffect, useMemo, useRef } from 'react';

import { useRecommendations } from '@/[fsd]/features/chat/lib/hooks/useRecommendations.hooks';
import { getChatParticipantUniqueId } from '@/[fsd]/features/chat/participants/lib/helpers';

import NewParticipantList from './NewParticipantList';

const RecommendationList = memo(props => {
  const { onSelectParticipant, existingParticipants = [], onClose = () => {}, onlyExisting = false } = props;

  const { recommendations, isFetching, isLoading } = useRecommendations();
  const existingParticipantUids = useMemo(
    () => existingParticipants?.map(participant => getChatParticipantUniqueId(participant) || []),
    [existingParticipants],
  );
  const isLoadingRef = useRef(isLoading);
  useEffect(() => {
    isLoadingRef.current = isLoading;
  }, [isLoading]);
  const isFetchingRef = useRef(isFetching);
  useEffect(() => {
    isFetchingRef.current = isFetching;
  }, [isFetching]);

  // Someone who may not change the chat's participants picks from those already in it (#7757)
  const shownParticipants = useMemo(
    () =>
      onlyExisting
        ? recommendations.filter(participant => existingParticipantUids.includes(participant.participantId))
        : recommendations,
    [existingParticipantUids, onlyExisting, recommendations],
  );

  return (
    <NewParticipantList
      onSelectParticipant={onSelectParticipant}
      isLoading={isLoading}
      participants={shownParticipants}
      existingParticipantUids={existingParticipantUids}
      onClose={onClose}
    />
  );
});

RecommendationList.displayName = 'RecommendationList';

export default RecommendationList;
