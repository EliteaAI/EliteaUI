import { memo } from 'react';

import { Box, CircularProgress } from '@mui/material';

import Tooltip from '@/ComponentsLib/Tooltip';
import { RunStatusConstants } from '@/[fsd]/features/chat/lib/constants';

const { UNREAD_REASON } = RunStatusConstants;

const UNREAD_TITLES = {
  [UNREAD_REASON.newResponse]: 'New response',
  [UNREAD_REASON.waiting]: 'Waiting for your answer',
};

// Spinner while a chat generates, dot when it ended or asked something while not open (EL-7385)
const ConversationRunIndicator = memo(props => {
  const { isRunning = false, unread = null } = props;

  const styles = conversationRunIndicatorStyles(unread);

  if (isRunning)
    return (
      <Tooltip
        title="Generating…"
        placement="top"
      >
        <Box
          component="span"
          data-testid="chat-list-item-running-icon"
          sx={styles.wrapper}
        >
          <CircularProgress
            size="0.75rem"
            thickness={5}
          />
        </Box>
      </Tooltip>
    );

  if (!UNREAD_TITLES[unread]) return null;

  return (
    <Tooltip
      title={UNREAD_TITLES[unread]}
      placement="top"
    >
      <Box
        component="span"
        data-testid="chat-list-item-unread-badge"
        data-reason={unread}
        sx={styles.wrapper}
      >
        <Box
          component="span"
          sx={styles.dot}
        />
      </Box>
    </Tooltip>
  );
});

ConversationRunIndicator.displayName = 'ConversationRunIndicator';

/** @type {MuiSx} */
const conversationRunIndicatorStyles = unread => ({
  wrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '0.875rem',
    height: '0.875rem',
    flexShrink: 0,
  },
  // An icon glyph: the token goes on color, the shape paints with it
  dot: ({ palette }) => ({
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    color: unread === UNREAD_REASON.waiting ? palette.icon.attention : palette.icon.accent,
    backgroundColor: 'currentColor',
  }),
});

export default ConversationRunIndicator;
