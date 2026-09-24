import { memo } from 'react';

import { Box } from '@mui/material';

import Markdown from '@/[fsd]/shared/ui/markdown';

const ChatWelcomeMessage = memo(props => {
  const { message, sx = {} } = props;
  const styles = chatWelcomeMessageStyles();

  if (!message?.trim()) return null;

  return (
    <Box
      data-testid="chat-new-conversation-welcome-message"
      sx={[styles.root, sx]}
    >
      <Markdown renderHtml={false}>{message}</Markdown>
    </Box>
  );
});

ChatWelcomeMessage.displayName = 'ChatWelcomeMessage';

/** @type {MuiSx} */
const chatWelcomeMessageStyles = () => ({
  root: ({ palette }) => ({
    width: '100%',
    maxHeight: '12.5rem',
    overflowY: 'auto',
    marginTop: '0.5rem',
    padding: '0.75rem 1rem',
    boxSizing: 'border-box',
    borderRadius: '0.75rem',
    backgroundColor: palette.background.aiAnswerBkg,
    color: palette.text.secondary,
    wordBreak: 'break-word',
  }),
});

export default ChatWelcomeMessage;
