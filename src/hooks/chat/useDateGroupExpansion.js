import { useCallback, useRef, useState } from 'react';

import { genConversationId } from '@/common/utils';

// Extract constants to follow coding standards
const DEFAULT_GROUP_ORDER = ['Today', 'Yesterday', 'This Week', 'Older'];
const DEFAULT_EXPANDED_GROUP = 'Today';

const useDateGroupExpansion = () => {
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [initialGroupSet, setInitialGroupSet] = useState(false);

  // Use refs for values that don't need to trigger re-renders
  const searchModeRef = useRef(false);
  const savedNormalExpansionRef = useRef(null);

  const toggleGroup = useCallback(groupName => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  }, []);

  const isGroupExpanded = useCallback(
    groupName => {
      return expandedGroups.has(groupName);
    },
    [expandedGroups],
  );

  const enterSearchMode = useCallback(
    groupsWithResults => {
      if (!searchModeRef.current) {
        searchModeRef.current = true;

        // Save current expansion state using ref (no re-render)
        savedNormalExpansionRef.current = new Set(expandedGroups);

        // Expand all groups that have search results
        const groupsToExpand = new Set(groupsWithResults);
        setExpandedGroups(groupsToExpand);
      }
    },
    [expandedGroups],
  );

  const exitSearchMode = useCallback((activeConversationGroup = null) => {
    if (searchModeRef.current) {
      searchModeRef.current = false;

      if (activeConversationGroup) {
        setExpandedGroups(new Set([activeConversationGroup]));
      } else {
        // Restore saved expansion state or default
        const savedExpansion = savedNormalExpansionRef.current;
        if (savedExpansion && savedExpansion.size > 0) {
          setExpandedGroups(new Set(savedExpansion));
        } else {
          setExpandedGroups(new Set([DEFAULT_EXPANDED_GROUP]));
        }
      }

      // Clear saved state
      savedNormalExpansionRef.current = null;
    }
  }, []); // No dependencies needed since we use refs

  const initializeExpansion = useCallback(
    (groups, selectedConversationId) => {
      if (!groups || groups.length === 0 || searchModeRef.current) return;

      const groupContainsSelectedConversation = groups.find(group =>
        group.conversations.some(conversation => genConversationId(conversation) === selectedConversationId),
      );

      if (groupContainsSelectedConversation) {
        setExpandedGroups(prev => new Set([...prev, groupContainsSelectedConversation.name]));
        return;
      }

      // Always expand Today if it exists
      const todayGroup = groups.find(g => g.name === DEFAULT_EXPANDED_GROUP);
      if (todayGroup) {
        setExpandedGroups(prev => new Set([...prev, DEFAULT_EXPANDED_GROUP]));
        return;
      }

      // Find first available group if Today doesn't exist
      if (!initialGroupSet) {
        for (const groupName of DEFAULT_GROUP_ORDER) {
          const group = groups.find(g => g.name === groupName);
          if (group) {
            setExpandedGroups(new Set([groupName]));
            setInitialGroupSet(true);
            break;
          }
        }
      }
    },
    [initialGroupSet],
  );

  const expandTodayGroup = useCallback(() => {
    setExpandedGroups(prev => new Set([...prev, DEFAULT_EXPANDED_GROUP]));
  }, []);

  return {
    isGroupExpanded,
    toggleGroup,
    expandTodayGroup,
    initializeExpansion,
    enterSearchMode,
    exitSearchMode,
    isSearchMode: searchModeRef.current,
  };
};

export default useDateGroupExpansion;
