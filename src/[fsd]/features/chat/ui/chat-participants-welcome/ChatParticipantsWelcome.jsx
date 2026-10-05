import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Collapse, Typography, useTheme } from '@mui/material';

import {
  getParticipantWelcomeKey,
  isWelcomeMessageParticipant,
} from '@/[fsd]/features/chat/participants/lib/helpers';
import { useParticipantsWelcomeMessages } from '@/[fsd]/features/chat/participants/lib/hooks';
import ArrowDownIcon from '@/components/Icons/ArrowDownIcon';

import ChatParticipantWelcomeItem from './ChatParticipantWelcomeItem';

/**
 * Welcome message of the active agent/pipeline, sticky at the top of the chat history.
 * Rendered from participants (not chat_history), so it never becomes part of the LLM context.
 *
 * Expanded while the chat has no user messages and collapsed once one is sent. It expands again
 * mid-chat only for a greeting the user has not seen yet: a newly added participant or a version
 * switch. Selecting another existing participant keeps the current state.
 */
const ChatParticipantsWelcome = memo(props => {
  const { conversationId, participants, activeParticipant, userMessageCount = 0 } = props;

  const theme = useTheme();
  const activeParticipants = useMemo(
    () => (activeParticipant ? [activeParticipant] : []),
    [activeParticipant],
  );
  const { entries, isLoading } = useParticipantsWelcomeMessages(activeParticipants);
  const [expanded, setExpanded] = useState(userMessageCount === 0);

  const participantKeys = useMemo(
    () => (participants || []).filter(isWelcomeMessageParticipant).map(getParticipantWelcomeKey).join('|'),
    [participants],
  );
  // Welcome keys of the conversation's participants, to tell additions/version switches from selection.
  const knownKeysRef = useRef({ conversationId: undefined, keys: null });
  // Greetings added mid-chat that should expand the block once their participant is the active one.
  const pendingKeysRef = useRef(new Set());
  const prevUserMessageCountRef = useRef(userMessageCount);

  useEffect(() => {
    if (!participants) return;

    const keys = new Set(participantKeys ? participantKeys.split('|') : []);
    const known = knownKeysRef.current;

    if (known.conversationId !== conversationId || known.keys === null) {
      knownKeysRef.current = { conversationId, keys };
      pendingKeysRef.current = new Set();
      setExpanded(userMessageCount === 0);
      return;
    }

    keys.forEach(key => {
      if (!known.keys.has(key)) pendingKeysRef.current.add(key);
    });
    knownKeysRef.current = { conversationId, keys };
    // userMessageCount is read only to pick the initial state of a newly opened conversation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, participantKeys]);

  const activeEntryKey = entries[0]?.key;

  useEffect(() => {
    if (isLoading || !activeEntryKey || !pendingKeysRef.current.has(activeEntryKey)) return;
    pendingKeysRef.current.delete(activeEntryKey);
    setExpanded(true);
  }, [activeEntryKey, isLoading, participantKeys]);

  useEffect(() => {
    if (userMessageCount > prevUserMessageCountRef.current) {
      setExpanded(false);
      pendingKeysRef.current = new Set();
    }
    prevUserMessageCountRef.current = userMessageCount;
  }, [userMessageCount]);

  const onToggle = useCallback(() => setExpanded(prev => !prev), []);

  const onKeyDown = useCallback(
    event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onToggle();
      }
    },
    [onToggle],
  );

  const styles = chatParticipantsWelcomeStyles();

  if (!entries.length) return null;

  return (
    <Box
      data-testid="chat-participants-welcome"
      sx={styles.root}
    >
      <Box
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        data-testid="chat-participants-welcome-toggle"
        sx={styles.header}
        onClick={onToggle}
        onKeyDown={onKeyDown}
      >
        <ArrowDownIcon
          width={16}
          height={16}
          fill={theme.palette.icon.default}
          style={styles.arrowIcon(expanded)}
        />
        <Typography
          variant="labelSmall"
          color="text.secondary"
        >
          {entries.length > 1 ? `Welcome messages (${entries.length})` : 'Welcome message'}
        </Typography>
      </Box>
      <Collapse
        in={expanded}
        unmountOnExit
      >
        <Box sx={styles.list}>
          {entries.map(entry => (
            <ChatParticipantWelcomeItem
              key={entry.key}
              participant={entry.participant}
              message={entry.message}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
});

ChatParticipantsWelcome.displayName = 'ChatParticipantsWelcome';

/** @type {MuiSx} */
const chatParticipantsWelcomeStyles = () => ({
  root: ({ palette }) => ({
    position: 'sticky',
    top: 0,
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    margin: '0 0 0.5rem',
    padding: '0.75rem 0 0.5rem',
    backgroundColor: palette.background.default.primary,
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: 'fit-content',
    cursor: 'pointer',
    userSelect: 'none',
  },
  arrowIcon: expanded => ({
    transition: 'transform 0.2s ease',
    transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)',
  }),
  // Keeps a long greeting from covering the conversation while sticky.
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    paddingTop: '0.75rem',
    maxHeight: '40vh',
    overflowY: 'auto',
  },
});

export default ChatParticipantsWelcome;
