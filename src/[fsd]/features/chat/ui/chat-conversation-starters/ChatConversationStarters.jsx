import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, ButtonBase, Typography } from '@mui/material';

import { conversationStartersHelpers } from '@/[fsd]/features/agent/lib/helpers';
import { ConversationStartersLayoutHelpers } from '@/[fsd]/features/chat/lib/helpers';
import { EllipsisTextWithTooltip } from '@/components/ConversationStarters';

import ChatConversationStartersPopover from './ChatConversationStartersPopover';

const ChatConversationStarters = memo(props => {
  const { onSend, conversation_starters } = props;

  const containerRef = useRef(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleClick = useCallback(
    starter => () => {
      onSend(starter);
    },
    [onSend],
  );

  const filteredStarters = useMemo(
    () =>
      conversation_starters?.filter(starter => conversationStartersHelpers.toString(starter).trim()) || [],
    [conversation_starters],
  );

  const startersCount = filteredStarters.length;
  const { tileCount, moreCount } = ConversationStartersLayoutHelpers.getChatStartersGridLayout(startersCount);

  // The starters are hidden (an empty list) once one is sent or the user starts typing; the popover goes too.
  useEffect(() => {
    if (!moreCount) setIsPopoverOpen(false);
  }, [moreCount]);

  const handleOpenPopover = useCallback(() => setIsPopoverOpen(true), []);
  const handleClosePopover = useCallback(() => setIsPopoverOpen(false), []);

  const handleSelectFromPopover = useCallback(
    starter => {
      setIsPopoverOpen(false);
      onSend(starter);
    },
    [onSend],
  );

  const styles = chatConversationStartersStyles(
    Math.min(startersCount, ConversationStartersLayoutHelpers.MAX_STARTER_TILES),
  );

  if (filteredStarters.length === 0) return null;

  return (
    <Box
      ref={containerRef}
      sx={styles.container}
    >
      {filteredStarters.slice(0, tileCount).map((item, index) => (
        <EllipsisTextWithTooltip
          key={index}
          text={item}
          onClick={handleClick(item)}
          sx={styles.starterItem}
          textSX={styles.starterText}
          testId="chat-conversation-starter-tile"
        />
      ))}
      {moreCount > 0 && (
        <>
          <ButtonBase
            sx={styles.moreTile}
            onClick={handleOpenPopover}
            aria-haspopup="dialog"
            aria-expanded={isPopoverOpen}
            data-testid="chat-conversation-starters-more-tile"
          >
            <Typography
              component="span"
              variant="bodyMedium"
              color="text.secondary"
            >
              +{moreCount} more
            </Typography>
          </ButtonBase>
          <ChatConversationStartersPopover
            anchorEl={isPopoverOpen ? containerRef.current : null}
            starters={filteredStarters}
            onSelect={handleSelectFromPopover}
            onClose={handleClosePopover}
          />
        </>
      )}
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

  moreTile: ({ palette }) => ({
    minHeight: '2.5rem',
    width: '100%',
    boxSizing: 'border-box',
    justifyContent: 'flex-start',
    padding: '0.5rem 1rem',
    borderRadius: '0.75rem',
    background: palette.components.conversation.background.starter.strong,
    '&:hover': {
      background: palette.components.conversation.background.starter.subtle,
    },
    '&.Mui-focusVisible': {
      outline: `0.0625rem solid ${palette.border.hover}`,
    },
  }),
});

export default ChatConversationStarters;
