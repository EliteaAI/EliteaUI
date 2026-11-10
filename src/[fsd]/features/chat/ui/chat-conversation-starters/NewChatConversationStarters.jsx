import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Link } from '@mui/material';

import { ConversationStartersLayoutHelpers } from '@/[fsd]/features/chat/lib/helpers';
import { EllipsisTextWithTooltip } from '@/components/ConversationStarters';

// Mount it with a key per conversation and participant, so a new chat or another participant starts collapsed.
const NewChatConversationStarters = memo(props => {
  const { conversationStarters, onSendStarter } = props;

  const [isExpanded, setIsExpanded] = useState(false);

  const filteredStarters = useMemo(
    () => conversationStarters?.filter(item => item.trim()) || [],
    [conversationStarters],
  );

  const { visibleCount, hiddenCount } = ConversationStartersLayoutHelpers.getNewChatStartersListLayout(
    filteredStarters.length,
    isExpanded,
  );

  const handleToggle = useCallback(() => setIsExpanded(prev => !prev), []);

  const styles = newChatConversationStartersStyles();

  if (!filteredStarters.length) return null;

  return (
    <Box sx={styles.container}>
      {filteredStarters.slice(0, visibleCount).map((item, index) => (
        <EllipsisTextWithTooltip
          key={index}
          text={item}
          onClick={onSendStarter(item)}
          sx={styles.starterItem}
          textSX={styles.starterTextSX}
          testId="chat-conversation-starter-tile"
        />
      ))}
      {hiddenCount > 0 && (
        <Link
          component="button"
          type="button"
          variant="bodyMedium"
          underline="hover"
          onClick={handleToggle}
          aria-expanded={isExpanded}
          sx={styles.showMoreLink}
          data-testid="chat-conversation-starters-show-more-link"
        >
          {isExpanded ? 'Show less' : `Show ${hiddenCount} more`}
        </Link>
      )}
    </Box>
  );
});

NewChatConversationStarters.displayName = 'NewChatConversationStarters';

/** @type {MuiSx} */
const newChatConversationStartersStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    boxSizing: 'border-box',
    gap: '0.5rem',
    padding: '0.5rem 0',
  },
  starterItem: {
    width: '100%',
    height: '2.5rem',
    borderRadius: '0.75rem',
  },
  starterTextSX: {
    WebkitLineClamp: 1,
  },
  showMoreLink: ({ palette }) => ({
    alignSelf: 'flex-start',
    padding: '0.25rem 1rem',
    color: palette.text.secondary,
    '&:hover': {
      color: palette.text.primary,
    },
  }),
});

export default NewChatConversationStarters;
