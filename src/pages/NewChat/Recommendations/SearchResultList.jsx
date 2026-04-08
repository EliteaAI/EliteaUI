import { useEffect, useMemo, useRef } from 'react';

import { ChatParticipantType, PAGE_SIZE } from '@/common/constants';
import { getChatParticipantUniqueId } from '@/common/utils';
import useParticipants from '@/hooks/chat/useParticipants';

import NewParticipantList from './NewParticipantList';

export default function SearchResultList({
  query,
  onSelectParticipant,
  stopProcessingSymbols,
  existingParticipants = [],
  onClose = () => {},
}) {
  const mismatchedTimerRef = useRef(0);
  const { participants, isLoading, isFetching, onLoadMore, total } = useParticipants({
    sortBy: 'name',
    sortOrder: 'asc',
    pageSize: PAGE_SIZE,
    query,
    types: [ChatParticipantType.Applications, ChatParticipantType.Toolkits],
    projectFilter: 'all',
    forceSkip: !query,
  });
  const existingParticipantUids = useMemo(
    () => existingParticipants?.map(participant => getChatParticipantUniqueId(participant) || []),
    [existingParticipants],
  );

  const stopProcessingSymbolsRef = useRef(stopProcessingSymbols);

  useEffect(() => {
    if (participants.length) {
      if (mismatchedTimerRef.current !== -1) {
        clearTimeout(mismatchedTimerRef.current);
        mismatchedTimerRef.current = -1;
      }
    }
  }, [participants]);

  useEffect(() => {
    stopProcessingSymbolsRef.current = stopProcessingSymbols;
  }, [stopProcessingSymbols]);

  useEffect(() => {
    if (!isFetching && !participants.length && query && mismatchedTimerRef.current === -1) {
      // If no results found, set a timer to stop processing symbols after 3 seconds
      mismatchedTimerRef.current = setTimeout(() => {
        if (stopProcessingSymbolsRef.current) {
          stopProcessingSymbolsRef.current();
          mismatchedTimerRef.current = -1;
        }
      }, 3000);
    }
  }, [isFetching, participants.length, query]);

  const resetPageDependencies = useMemo(() => [query], [query]);

  return (
    <NewParticipantList
      onSelectParticipant={onSelectParticipant}
      isLoading={isLoading}
      isFetching={isFetching}
      participants={participants}
      existingParticipantUids={existingParticipantUids}
      onClose={onClose}
      resetPageDependencies={resetPageDependencies}
      onLoadMore={onLoadMore}
      total={total}
      title={'Search results'}
    />
  );
}
