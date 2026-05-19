import React, { memo, useEffect, useMemo, useRef } from 'react';

import { Box, Typography } from '@mui/material';

import { DATE_GROUP_DISPLAY_NAMES } from '@/[fsd]/features/chat/conversation-list/lib/constants';
import { useDateGroupExpansion } from '@/[fsd]/features/chat/conversation-list/lib/hooks';

import DateGroup from './DateGroup';

const GroupedConversations = memo(props => {
  const {
    dateGroups,
    totalConversationsAmount,
    renderConversationItem,
    onLoadMoreInGroup,
    loadingGroups,
    enableDragAndDrop = false,
    getDropAreaState,
    selectedConversationId,
    isSearchMode = false,
    searchQuery = '',
  } = props;

  const visibleGroups = useMemo(
    () => dateGroups.filter(group => group.conversations?.length > 0),
    [dateGroups],
  );

  const { isGroupExpanded, toggleGroup, initializeExpansion, enterSearchMode, exitSearchMode } =
    useDateGroupExpansion();

  const prevSearchModeRef = useRef(isSearchMode);
  const prevSearchQueryRef = useRef(searchQuery);

  useEffect(() => {
    const searchModeChanged = prevSearchModeRef.current !== isSearchMode;
    const searchQueryChanged = prevSearchQueryRef.current !== searchQuery;

    if (isSearchMode && (searchModeChanged || searchQueryChanged)) {
      const groupsWithMatches = visibleGroups.filter(group =>
        group.conversations.some(conv => conv.name?.toLowerCase().includes(searchQuery.toLowerCase())),
      );
      enterSearchMode(groupsWithMatches.map(g => g.name));
    } else if (!isSearchMode && searchModeChanged) {
      exitSearchMode();
    }

    prevSearchModeRef.current = isSearchMode;
    prevSearchQueryRef.current = searchQuery;
  }, [isSearchMode, searchQuery, visibleGroups, enterSearchMode, exitSearchMode]);

  useEffect(() => {
    if (!isSearchMode) initializeExpansion(visibleGroups, selectedConversationId);
  }, [visibleGroups, initializeExpansion, selectedConversationId, isSearchMode]);

  return (
    <>
      {visibleGroups.length > 0 && (
        <Box>
          {visibleGroups.map(group => (
            <DateGroup
              key={group.name}
              group={{
                ...group,
                displayName: DATE_GROUP_DISPLAY_NAMES[group.name] || group.name,
              }}
              renderConversationItem={renderConversationItem}
              enableDragAndDrop={enableDragAndDrop}
              getDropAreaState={getDropAreaState}
              isExpanded={isGroupExpanded(group.name)}
              onToggleExpanded={toggleGroup}
              selectedConversationId={selectedConversationId}
              hasMore={group.conversations.length < (group.total || 0)}
              onLoadMore={() => onLoadMoreInGroup?.(group.name)}
              isLoadingMore={loadingGroups?.has(group.name)}
            />
          ))}
        </Box>
      )}
      {visibleGroups.length === 0 && totalConversationsAmount === 0 && (
        <Typography
          variant="bodyMedium"
          color="text.button.disabled"
        >
          Still no conversations created.
        </Typography>
      )}
    </>
  );
});

GroupedConversations.displayName = 'GroupedConversations';

export default GroupedConversations;
