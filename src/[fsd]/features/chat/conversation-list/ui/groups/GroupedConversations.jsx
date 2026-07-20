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

  const { isGroupExpanded, toggleGroup, initializeExpansion, setSearchModeExpansion, exitSearchMode } =
    useDateGroupExpansion();

  const prevSearchModeRef = useRef(isSearchMode);
  const prevSearchQueryRef = useRef(searchQuery);
  const prevTotalConversationsRef = useRef(0);

  useEffect(() => {
    const searchModeChanged = prevSearchModeRef.current !== isSearchMode;
    const searchQueryChanged = prevSearchQueryRef.current !== searchQuery;
    const totalConversations = visibleGroups.reduce((sum, g) => sum + g.conversations.length, 0);
    const dataChanged = prevTotalConversationsRef.current !== totalConversations;

    if (isSearchMode && (searchModeChanged || searchQueryChanged || dataChanged)) {
      setSearchModeExpansion(visibleGroups.map(g => g.name));
    } else if (!isSearchMode && searchModeChanged) {
      exitSearchMode();
    }

    prevSearchModeRef.current = isSearchMode;
    prevSearchQueryRef.current = searchQuery;
    prevTotalConversationsRef.current = totalConversations;
  }, [isSearchMode, searchQuery, visibleGroups, setSearchModeExpansion, exitSearchMode]);

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
              hasMore={!group.exhausted && group.conversations.length < (group.total || 0)}
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
