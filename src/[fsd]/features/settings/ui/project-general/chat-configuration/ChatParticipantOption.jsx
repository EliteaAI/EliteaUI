import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { ParticipantConstants } from '@/[fsd]/features/chat/participants/lib/constants';
import { ChatParticipantHelpers } from '@/[fsd]/features/settings/lib/helpers';
import { PUBLIC_PROJECT_ID } from '@/common/constants';

import ChatParticipantIcon from './ChatParticipantIcon';
import ChatParticipantPublicBadge from './ChatParticipantPublicBadge';

const PUBLIC_LABEL = 'Public';

const ChatParticipantOption = memo(props => {
  const { option } = props;

  const styles = chatParticipantOptionStyles();
  const isPublic = option.project_id === PUBLIC_PROJECT_ID;

  return (
    <Box sx={styles.root}>
      <ChatParticipantIcon
        participant={option}
        withBackground
      />
      <Typography
        variant="bodyMedium"
        color="text.secondary"
        sx={styles.name}
      >
        {option.name}
      </Typography>
      {isPublic && (
        <ChatParticipantPublicBadge
          label={
            ChatParticipantHelpers.isCatalogSkill(option) ? ParticipantConstants.CATALOG_LABEL : PUBLIC_LABEL
          }
        />
      )}
    </Box>
  );
});

ChatParticipantOption.displayName = 'ChatParticipantOption';

/** @type {MuiSx} */
const chatParticipantOptionStyles = () => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: 1,
    minWidth: 0,
  },
  name: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
});

export default ChatParticipantOption;
