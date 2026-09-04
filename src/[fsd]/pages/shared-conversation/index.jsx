import { memo, useCallback, useState } from 'react';

import { useParams } from 'react-router-dom';

import { Box, CircularProgress, Typography } from '@mui/material';

import {
  useGetSharedConversationQuery,
  useUnlockSharedConversationMutation,
} from '@/[fsd]/features/chat/conversation-list/api/sharedLinksApi';
import { ErrorTrace } from '@/[fsd]/features/chat/ui';
import { Input } from '@/[fsd]/shared/ui';
import BaseBtn, { BUTTON_COLORS, BUTTON_VARIANTS } from '@/[fsd]/shared/ui/button/BaseBtn';

import GroupAttachmentList from './GroupAttachmentList';
import MessageItemRenderer from './MessageItemRenderer';
import ParticipantAvatar from './ParticipantAvatar';

const SharedConversationPage = memo(() => {
  const { token } = useParams();

  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [cookieSet, setCookieSet] = useState(false);

  const { data, isLoading, isError, error, refetch } = useGetSharedConversationQuery(
    { token },
    { skip: !token },
  );

  const [unlockConversation, { isLoading: isUnlocking }] = useUnlockSharedConversationMutation();

  const styles = sharedConversationPageStyles();

  const handleUnlock = useCallback(async () => {
    setPasswordError('');
    try {
      await unlockConversation({ token, password }).unwrap();
      setCookieSet(true);
      refetch();
    } catch (err) {
      const status = err?.status;
      if (status === 403) {
        setPasswordError('Incorrect password. Please try again.');
      } else if (status === 404) {
        setPasswordError('This link is no longer available.');
      } else {
        setPasswordError('An error occurred. Please try again.');
      }
    }
  }, [password, refetch, token, unlockConversation]);

  const handlePasswordKeyDown = useCallback(
    e => {
      if (e.key === 'Enter' && password.trim()) handleUnlock();
    },
    [handleUnlock, password],
  );

  if (!token) {
    return (
      <Box sx={styles.centeredContainer}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Link not found
        </Typography>
        <Typography
          variant="bodyMedium"
          color="text.disabled"
          sx={styles.subtitleText}
        >
          This shared conversation link is invalid or has been removed.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={styles.centeredContainer}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (isError && error?.status === 410) {
    return (
      <Box sx={styles.centeredContainer}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Link expired
        </Typography>
        <Typography
          variant="bodyMedium"
          color="text.disabled"
          sx={styles.subtitleText}
        >
          This shared conversation link has expired.
        </Typography>
      </Box>
    );
  }

  if ((isError && error?.status === 401) || data?.password_required) {
    if (cookieSet) {
      return (
        <Box sx={styles.centeredContainer}>
          <CircularProgress size={32} />
        </Box>
      );
    }
    return (
      <Box sx={styles.centeredContainer}>
        <Box sx={styles.passwordCard}>
          <Typography
            variant="headingSmall"
            color="text.secondary"
          >
            Password required
          </Typography>
          <Typography
            variant="bodyMedium"
            color="text.disabled"
            sx={styles.subtitleText}
          >
            This conversation is password protected. Enter the password to view it.
          </Typography>
          <Input.StyledInputEnhancer
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handlePasswordKeyDown}
            error={!!passwordError}
            helperText={passwordError || ''}
            variant="standard"
          />
          <BaseBtn
            variant={BUTTON_VARIANTS.elitea}
            color={BUTTON_COLORS.primary}
            fullWidth
            onClick={handleUnlock}
            disabled={isUnlocking || !password.trim()}
            loading={isUnlocking}
          >
            Unlock
          </BaseBtn>
        </Box>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={styles.centeredContainer}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          Link not found
        </Typography>
        <Typography
          variant="bodyMedium"
          color="text.disabled"
          sx={styles.subtitleText}
        >
          This shared conversation link is invalid or has been removed.
        </Typography>
      </Box>
    );
  }

  if (!data?.messages) {
    return (
      <Box sx={styles.centeredContainer}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  const conversation = data;

  return (
    <Box sx={styles.pageRoot}>
      <Box sx={styles.header}>
        <Typography
          variant="headingSmall"
          color="text.secondary"
        >
          {conversation.conversation_name}
        </Typography>
        <Typography
          variant="bodySmall2"
          color="text.disabled"
        >
          Shared conversation · Read only
          {conversation.expires_at
            ? ` · Expires ${new Date(conversation.expires_at).toLocaleDateString()}`
            : ''}
        </Typography>
      </Box>

      <Box sx={styles.messagesContainer}>
        {conversation.messages.length === 0 && (
          <Typography
            variant="bodyMedium"
            color="text.disabled"
            sx={styles.emptyText}
          >
            No messages to display for this scope.
          </Typography>
        )}
        {conversation.messages.map(group => (
          <Box
            key={group.id}
            sx={styles.messageGroup}
          >
            <Box sx={styles.authorRow}>
              <ParticipantAvatar
                participantType={group.participant_type}
                participantAgentType={group.participant_agent_type}
                participantIcon={group.participant_icon}
                authorName={group.author_name}
              />
              <Typography
                variant="bodySmall"
                color="text.secondary"
              >
                {group.author_name || (group.author_type === 'user' ? 'User' : 'Assistant')}
              </Typography>
              <Typography
                variant="bodySmall"
                color="text.disabled"
              >
                {new Date(group.created_at).toLocaleString()}
              </Typography>
            </Box>
            <Box sx={styles.messageBody}>
              {group.is_error ? (
                <ErrorTrace
                  headline={
                    group.items.find(i => i.type === 'text_message')?.content ||
                    group.error ||
                    'Unknown error'
                  }
                  trace={group.error}
                />
              ) : (
                <>
                  {group.items.map((item, itemIndex) => (
                    <MessageItemRenderer
                      key={itemIndex}
                      item={item}
                    />
                  ))}
                  <GroupAttachmentList
                    items={group.items}
                    token={token}
                    groupId={group.id}
                  />
                </>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
});

SharedConversationPage.displayName = 'SharedConversationPage';

/** @type {MuiSx} */
const sharedConversationPageStyles = () => ({
  centeredContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    bgcolor: 'background.secondary',
    textAlign: 'center',
  },
  subtitleText: {
    marginTop: '0.5rem',
    maxWidth: '28rem',
  },
  passwordCard: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '2rem',
    borderRadius: '0.75rem',
    background: palette.background.default.secondary,
    border: `0.0625rem solid ${palette.border.lines}`,
    width: '100%',
    maxWidth: '24rem',
    textAlign: 'center',
  }),
  pageRoot: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    bgcolor: 'background.secondary',
  },
  header: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '1.5rem 2rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    background: palette.background.default.secondary,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  }),
  messagesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    padding: '0.75rem 2rem',
    maxWidth: '52rem',
    width: '100%',
    margin: '0 auto',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: '3rem',
  },
  messageGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem 0',
  },
  authorRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0 0.25rem',
  },
  messageBody: ({ palette }) => ({
    background: palette.background.aiAnswerBkg,
    borderRadius: '0.5rem',
    padding: '0.75rem 1rem',
    boxShadow: palette.boxShadow.aiAnswer,
    color: palette.text.secondary,
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.375rem',
    width: '100%',
    boxSizing: 'border-box',
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  }),
});

export default SharedConversationPage;
