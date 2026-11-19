import { memo, useCallback, useMemo } from 'react';

import { Box, Collapse, Skeleton } from '@mui/material';

import ListInfiniteMoreLoader from '@/ComponentsLib/ListInfiniteMoreLoader';

import GroupHeader from './GroupHeader';

const DateGroup = memo(props => {
  const {
    group,
    renderConversationItem,
    enableDragAndDrop = false,
    getDropAreaState,
    isExpanded,
    onToggleExpanded,
    onLoadMore,
    isLoadingMore = false,
  } = props;
  const styles = dateGroupStyles();

  const handleToggleExpanded = useCallback(() => {
    onToggleExpanded(group.name);
  }, [group.name, onToggleExpanded]);

  const dropAreaState = useMemo(() => {
    if (enableDragAndDrop && getDropAreaState)
      return getDropAreaState(`date-group-${group.name.toLowerCase().replace(' ', '-')}`);

    return {};
  }, [enableDragAndDrop, getDropAreaState, group.name]);

  // eslint-disable-next-line no-unused-vars
  const { isValidDropTarget, isActive, ...otherDropState } = dropAreaState;

  return (
    // data-testid scopes BOTH the group's header row AND its own Collapse'd
    // conversation items (rendered in this same component instance, below) —
    // the reliable way for automation to assert "conversation X is under
    // Today specifically" (ELITEA-2095), not just "X and Today both exist
    // somewhere on the page".
    <Box data-testid={`chat-conversation-group-header-${group.name}`}>
      <GroupHeader
        title={group.displayName || group.name}
        isExpanded={isExpanded}
        onToggle={handleToggleExpanded}
      />

      <Collapse in={isExpanded}>
        <Box sx={styles.content}>
          {group.conversations.map(conversation => renderConversationItem(conversation))}

          {isLoadingMore &&
            Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={`skeleton-${index}`}
                animation="wave"
                variant="rectangular"
                width="100%"
                height="2.25rem"
                sx={styles.skeleton}
              />
            ))}

          <ListInfiniteMoreLoader
            listCurrentSize={group.conversations?.length || 0}
            totalAvailableCount={group.total || 0}
            onLoadMore={onLoadMore}
            isLoading={isLoadingMore}
          />
        </Box>
      </Collapse>
    </Box>
  );
});

DateGroup.displayName = 'DateGroup';

/** @type {MuiSx} */
const dateGroupStyles = () => ({
  // The space under a group belongs to its open part: a folded group is one row high, like a folder
  content: {
    paddingLeft: '1rem',
    paddingBottom: '0.5rem',
  },
  skeleton: {
    borderRadius: '.375rem',
    marginBottom: '0.125rem',
  },
});

export default DateGroup;
