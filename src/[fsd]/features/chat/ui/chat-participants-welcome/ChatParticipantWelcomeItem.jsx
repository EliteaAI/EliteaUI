import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { useParticipantEntityIcon, useParticipantName } from '@/[fsd]/features/chat/participants/lib/hooks';
import { ChatWelcomeMessage } from '@/[fsd]/features/chat/ui/chat-welcome-message';
import { ChatParticipantType } from '@/common/constants';
import EntityIcon from '@/components/EntityIcon';

const ChatParticipantWelcomeItem = memo(props => {
  const { participant, message } = props;

  const participantName = useParticipantName(participant);
  const entityIcon = useParticipantEntityIcon(participant);

  const styles = chatParticipantWelcomeItemStyles();

  return (
    <Box
      data-testid="chat-participant-welcome-item"
      sx={styles.root}
    >
      <Box sx={styles.header}>
        <EntityIcon
          forMessage
          icon={entityIcon}
          entityType={
            participant.entity_settings?.agent_type !== ChatParticipantType.Pipelines
              ? participant.entity_name
              : ChatParticipantType.Pipelines
          }
          agentType={participant.entity_settings?.agent_type}
          editable={false}
          showBackgroundColor
          specifiedFontSize={15}
        />
        <Typography
          variant="bodySmall"
          color="text.secondary"
          sx={styles.name}
        >
          {participantName}
        </Typography>
      </Box>
      <ChatWelcomeMessage
        message={message}
        sx={styles.message}
      />
    </Box>
  );
});

ChatParticipantWelcomeItem.displayName = 'ChatParticipantWelcomeItem';

/** @type {MuiSx} */
const chatParticipantWelcomeItemStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    minWidth: 0,
  },
  name: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  message: {
    marginTop: 0,
  },
});

export default ChatParticipantWelcomeItem;
