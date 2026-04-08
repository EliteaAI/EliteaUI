import { useEffect, useMemo, useRef } from 'react';

import { Box, Skeleton, Typography } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';
import { groupConversationsByDate } from '@/common/dateGroupUtils';
import useDateGroupExpansion from '@/hooks/chat/useDateGroupExpansion';

import DateGroup from './DateGroup';

export const UngroupedConversations = ({
  ungroupedConversations,
  totalConversationsAmount,
  renderConversationItem,
  onLoadMore,
  isLoadMoreConversations,
  ungroupedConversationsCount,
  enableDragAndDrop = false,
  getDropAreaState,
  selectedConversationId,
  isSearchMode = false,
  searchQuery = '',
}) => {
  const dateGroups = useMemo(() => {
    return groupConversationsByDate(ungroupedConversations);
  }, [ungroupedConversations]);

  const { isGroupExpanded, toggleGroup, initializeExpansion, enterSearchMode, exitSearchMode } =
    useDateGroupExpansion();

  // Use refs to track previous values and prevent unnecessary updates
  const prevSearchModeRef = useRef(isSearchMode);
  const prevSearchQueryRef = useRef(searchQuery);

  // Handle search mode transitions
  useEffect(() => {
    const searchModeChanged = prevSearchModeRef.current !== isSearchMode;
    const searchQueryChanged = prevSearchQueryRef.current !== searchQuery;

    if (isSearchMode && (searchModeChanged || searchQueryChanged)) {
      // Enter search mode and expand groups with matches
      const groupsWithMatches = dateGroups.filter(group =>
        group.conversations.some(conv => conv.name?.toLowerCase().includes(searchQuery.toLowerCase())),
      );
      enterSearchMode(groupsWithMatches.map(g => g.name));
    } else if (!isSearchMode && searchModeChanged) {
      // Exit search mode and restore default expansion
      exitSearchMode();
    }

    // Update refs
    prevSearchModeRef.current = isSearchMode;
    prevSearchQueryRef.current = searchQuery;
  }, [isSearchMode, searchQuery, dateGroups, enterSearchMode, exitSearchMode]); // Add missing dependencies

  // Initialize expansion when not in search mode
  useEffect(() => {
    if (!isSearchMode) {
      initializeExpansion(dateGroups, selectedConversationId);
    }
  }, [dateGroups, initializeExpansion, selectedConversationId, isSearchMode]);

  return (
    <>
      {ungroupedConversations.length > 0 && (
        <Box>
          {dateGroups.map(group => (
            <DateGroup
              key={group.name}
              group={group}
              renderConversationItem={renderConversationItem}
              enableDragAndDrop={enableDragAndDrop}
              getDropAreaState={getDropAreaState}
              isExpanded={isGroupExpanded(group.name)}
              onToggleExpanded={toggleGroup}
              selectedConversationId={selectedConversationId}
            />
          ))}
        </Box>
      )}
      {ungroupedConversations.length === 0 && totalConversationsAmount === 0 && (
        <Typography
          variant="bodyMedium"
          color="text.button.disabled"
        >
          Still no conversations created.
        </Typography>
      )}
      {isLoadMoreConversations &&
        Array.from({ length: 4 }).map((_, index) => (
          <Box
            sx={{ marginBottom: '8px', minHeight: '74px', width: '100%' }}
            key={index}
          >
            <Skeleton
              animation="wave"
              variant="rectangular"
              width="100%"
              height="74px"
            />
          </Box>
        ))}
      <ListInfiniteMoreLoader
        listCurrentSize={ungroupedConversations?.length}
        totalAvailableCount={ungroupedConversationsCount}
        onLoadMore={onLoadMore}
      />
    </>
  );
};
