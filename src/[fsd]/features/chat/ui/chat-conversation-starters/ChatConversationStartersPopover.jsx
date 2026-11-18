import { memo, useCallback } from 'react';

import { Box, Popover } from '@mui/material';

import { EllipsisTextWithTooltip } from '@/components/ConversationStarters';

const ChatConversationStartersPopover = memo(props => {
  const { anchorEl, starters, onSelect, onClose } = props;

  const styles = chatConversationStartersPopoverStyles(anchorEl?.offsetWidth);

  const handleSelect = useCallback(starter => () => onSelect(starter), [onSelect]);

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
      transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      slotProps={{
        paper: {
          sx: styles.paper,
          role: 'dialog',
          'aria-label': 'All chat starters',
          'data-testid': 'chat-conversation-starters-popover',
        },
      }}
    >
      <Box sx={styles.list}>
        {starters.map((item, index) => (
          <EllipsisTextWithTooltip
            key={index}
            text={item}
            onClick={handleSelect(item)}
            sx={styles.item}
            focusable
            testId="chat-conversation-starters-popover-item"
          />
        ))}
      </Box>
    </Popover>
  );
});

ChatConversationStartersPopover.displayName = 'ChatConversationStartersPopover';

// A one-line row is 2.5rem (1.5rem line + 1rem padding). Capping at six of them plus the gaps and the
// list padding keeps the popover at most six rows tall; two-line rows simply start scrolling sooner.
const MAX_VISIBLE_ROWS_HEIGHT = 'calc(6 * 2.5rem + 5 * 0.5rem + 1rem)';

/** @type {MuiSx} */
const chatConversationStartersPopoverStyles = anchorWidth => ({
  paper: ({ palette }) => ({
    width: anchorWidth ? `${anchorWidth / 16}rem` : 'auto',
    maxWidth: 'calc(100vw - 2rem)',
    maxHeight: MAX_VISIBLE_ROWS_HEIGHT,
    marginTop: '-0.5rem',
    borderRadius: '0.75rem',
    border: `0.0625rem solid ${palette.border.lines}`,
    backgroundColor: palette.background.default.secondary,
  }),
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.5rem',
  },
  item: {
    flexShrink: 0,
  },
});

export default ChatConversationStartersPopover;
