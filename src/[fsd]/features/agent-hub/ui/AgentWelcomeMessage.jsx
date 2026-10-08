import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import { Button } from '@/[fsd]/shared/ui';
import { BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button';

const AgentWelcomeMessage = memo(props => {
  const { welcome_message, testId } = props;
  const messageRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
    setIsTruncated(false);
  }, [welcome_message]);

  useEffect(() => {
    if (!isExpanded && messageRef.current) {
      setIsTruncated(messageRef.current.scrollHeight > messageRef.current.clientHeight);
    }
  }, [isExpanded, welcome_message]);

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const styles = agentWelcomeMessageStyles();

  return (
    <Box
      sx={styles.container(isExpanded)}
      data-testid={testId}
    >
      <Typography
        variant="subtitle"
        sx={styles.header}
      >
        Welcome Message
      </Typography>
      {welcome_message?.trim() ? (
        <Box sx={styles.messageContainer(isExpanded)}>
          <Typography
            ref={messageRef}
            variant="bodyMedium"
            sx={styles.messageText(isExpanded)}
          >
            {welcome_message}
          </Typography>
          {isTruncated && (
            <Box sx={styles.showMoreRow}>
              <Button.BaseBtn
                variant={BUTTON_VARIANTS.auxiliary}
                onClick={handleToggle}
                data-testid="catalog-agent-modal-show-more-welcome-message"
              >
                <Typography variant="labelSmall">{isExpanded ? 'Show less' : 'Show more'}</Typography>
              </Button.BaseBtn>
            </Box>
          )}
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
  container: isExpanded => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    width: '100%',
    flex: '0 1 auto',
    alignItems: 'center',
    ...(isExpanded ? {} : { maxHeight: '12.5rem' }),
  }),
  header: ({ palette }) => ({
    color: palette.text.tertiary,
    flexShrink: 0,
  }),
  messageContainer: isExpanded => ({
    width: '100%',
    overflow: isExpanded ? 'visible' : 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.5rem',
  }),
  messageText:
    isExpanded =>
    ({ palette }) => ({
      color: palette.text.secondary,
      width: '100%',
      wordBreak: 'break-word',
      ...(!isExpanded && {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: 8,
      }),
    }),
  showMoreRow: {
    width: '100%',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  emptyText: ({ palette }) => ({
    color: palette.text.tertiary,
    textAlign: 'center',
  }),
});

export default AgentWelcomeMessage;
