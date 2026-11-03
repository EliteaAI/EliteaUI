import { forwardRef, memo } from 'react';

import { Box, Typography } from '@mui/material';

import { ChatBox } from '@/[fsd]/features/chat/ui';

const AgentTestChat = memo(
  forwardRef((props, ref) => {
    const { settings } = props;
    const { activeConversation, activeParticipant } = settings;

    const styles = agentTestChatStyles();

    if (!activeConversation || !activeParticipant) {
      return (
        <Box sx={styles.initializing}>
          <Typography
            variant="bodyMedium"
            color="text.secondary"
          >
            Initializing chat...
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={styles.chat}>
        <ChatBox
          {...settings}
          ref={ref}
          inputPlaceholder="Type your message..."
        />
      </Box>
    );
  }),
);

AgentTestChat.displayName = 'AgentTestChat';

/** @type {MuiSx} */
const agentTestChatStyles = () => ({
  initializing: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '12.5rem',
  },
  chat: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
  },
});

export default AgentTestChat;
