import { memo, useCallback, useMemo } from 'react';

import { Box } from '@mui/material';

import { EllipsisTextWithTooltip } from '@/components/ConversationStarters';

const ChatConversationStarters = memo(props => {
  const { onSend, conversation_starters } = props;

  const handleClick = useCallback(
    starter => () => {
      onSend(starter);
    },
    [onSend],
  );

  const filteredStarters = useMemo(
    () => conversation_starters?.filter(item => item?.trim()) || [],
    [conversation_starters],
  );

  const startersCount = filteredStarters.length;

  const styles = chatConversationStartersStyles(startersCount);

  if (filteredStarters.length === 0) return null;

  return (
    <Box sx={styles.container}>
      {filteredStarters.map((item, index) => (
        <EllipsisTextWithTooltip
          key={index}
          text={item}
          onClick={handleClick(item)}
          sx={styles.starterItem}
          textSX={styles.starterText}
        />
      ))}
    </Box>
  );
});

ChatConversationStarters.displayName = 'ChatConversationStarters';

/** @type {MuiSx} */
const chatConversationStartersStyles = startersCount => ({
  container: {
    display: 'grid',
    width: '100%',
    maxWidth: '100%',
    height: 'auto',
    boxSizing: 'border-box',
    gap: '0.5rem',
    padding: '0.5rem',
    overflow: 'hidden',

    ...(startersCount <= 3 && {
      gridTemplateColumns: `repeat(${startersCount}, 1fr)`,
    }),

    ...(startersCount === 4 && {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gridTemplateRows: 'repeat(2, 1fr)',
    }),
  },

  starterItem: {
    height: 'auto',
    minHeight: '2.5rem',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },

  starterText: {
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
});

export default ChatConversationStarters;
