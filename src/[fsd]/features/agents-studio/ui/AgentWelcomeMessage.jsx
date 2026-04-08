import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const AgentWelcomeMessage = memo(props => {
  const { welcome_message } = props;
  const styles = agentWelcomeMessageStyles();

  return (
    <Box sx={styles.container}>
      <Typography
        variant="subtitle"
        sx={styles.header}
      >
        Welcome Message
      </Typography>
      {welcome_message?.trim() ? (
        <Box sx={styles.messageContainer}>
          <Typography
            variant="bodyMedium"
            sx={styles.messageText}
          >
            {welcome_message}
          </Typography>
        </Box>
      ) : (
        <Typography
          variant="bodySmall"
          sx={styles.emptyText}
        >
          No welcome message set – the agent will start without a greeting.
        </Typography>
      )}
    </Box>
  );
});

AgentWelcomeMessage.displayName = 'AgentWelcomeMessage';

/** @type {MuiSx} */
const agentWelcomeMessageStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    flex: '0 1 auto',
    alignItems: 'center',
    maxHeight: '12.5rem',
  },
  header: ({ palette }) => ({
    color: palette.text.tertiary,
    flexShrink: 0,
  }),
  messageContainer: {
    width: '100%',
    overflow: 'hidden',
  },
  messageText: ({ palette }) => ({
    color: palette.text.secondary,
    width: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    wordBreak: 'break-word',
    WebkitLineClamp: 8,
  }),
  emptyText: ({ palette }) => ({
    color: palette.text.tertiary,
    textAlign: 'center',
  }),
});

export default AgentWelcomeMessage;
