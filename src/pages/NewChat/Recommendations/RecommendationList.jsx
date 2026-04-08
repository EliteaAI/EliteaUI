import { useEffect, useMemo, useRef } from 'react';

import { getChatParticipantUniqueId } from '@/common/utils';

import NewParticipantList from './NewParticipantList';
import useRecommendations from './useRecommendations';

export default function RecommendationList({
  onSelectParticipant,
  existingParticipants = [],
  onClose = () => {},
}) {
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

  return (
    <NewParticipantList
      onSelectParticipant={onSelectParticipant}
      isLoading={isLoading}
      participants={recommendations}
      existingParticipantUids={existingParticipantUids}
      onClose={onClose}
    />
  );
}
