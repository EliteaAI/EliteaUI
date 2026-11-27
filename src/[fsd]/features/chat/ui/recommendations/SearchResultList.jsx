import { memo, useEffect, useMemo, useRef } from 'react';

import { getChatParticipantUniqueId } from '@/[fsd]/features/chat/participants/lib/helpers';
import { ChatParticipantType, PAGE_SIZE } from '@/common/constants';
import useParticipants from '@/hooks/chat/useParticipants';

import NewParticipantList from './NewParticipantList';

const SearchResultList = memo(props => {
  const {
    query,
    onSelectParticipant,
    stopProcessingSymbols,
    existingParticipants = [],
    onClose = () => {},
    excludePublic = false,
    onlyExisting = false,
  } = props;

  const mismatchedTimerRef = useRef(0);
  const { participants, isLoading, isFetching, onLoadMore, total } = useParticipants({
    sortBy: 'name',
    sortOrder: 'asc',
    pageSize: PAGE_SIZE,
    query,
    types: [ChatParticipantType.Applications, ChatParticipantType.Pipelines, ChatParticipantType.Skills],
    projectFilter: 'all',
    forceSkip: false,
    excludePublic,
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

  // Someone who may not change the chat's participants picks from those already in it (#7757)
  const shownParticipants = useMemo(
    () =>
      onlyExisting
        ? participants.filter(participant => existingParticipantUids.includes(participant.participantId))
        : participants,
    [existingParticipantUids, onlyExisting, participants],
  );

  return (
    <NewParticipantList
      onSelectParticipant={onSelectParticipant}
      isLoading={isLoading}
      isFetching={isFetching}
      participants={shownParticipants}
      existingParticipantUids={existingParticipantUids}
      onClose={onClose}
      resetPageDependencies={resetPageDependencies}
      onLoadMore={onLoadMore}
      total={onlyExisting ? shownParticipants.length : total}
      title={'Search results'}
    />
  );
});

SearchResultList.displayName = 'SearchResultList';

export default SearchResultList;
