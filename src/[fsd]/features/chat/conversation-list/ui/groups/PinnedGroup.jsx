import { memo } from 'react';

import { Box, Collapse } from '@mui/material';

import { PINNED_GROUP } from '@/[fsd]/features/chat/conversation-list/lib/constants';

import GroupHeader from './GroupHeader';

// Pinned folders and pinned chats under one header that folds like a date group
const PinnedGroup = memo(props => {
  const { isExpanded, onToggle, children } = props;

  const styles = pinnedGroupStyles();

  return (
    <Box data-testid={`chat-conversation-group-header-${PINNED_GROUP.name}`}>
      <GroupHeader
        title={PINNED_GROUP.displayName}
        isExpanded={isExpanded}
        onToggle={onToggle}
      />
      <Collapse in={isExpanded}>
        <Box sx={styles.content}>{children}</Box>
      </Collapse>
    </Box>
  );
});

PinnedGroup.displayName = 'PinnedGroup';

/** @type {MuiSx} */
const pinnedGroupStyles = () => ({
  // The space under a group belongs to its open part: a folded group is one row high, like a folder
  content: {
    paddingLeft: '1rem',
    paddingBottom: '0.5rem',
  },
});

export default PinnedGroup;
