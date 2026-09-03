import { forwardRef, memo } from 'react';

import SmartToyIcon from '@mui/icons-material/SmartToy';
import { Box, Chip, ListItemAvatar, Typography } from '@mui/material';

import { useParticipantEntityIcon, useParticipantName } from '@/[fsd]/features/chat/participants/lib/hooks';
import { ChatParticipantType, WELCOME_MESSAGE_ID } from '@/common/constants.js';
import CreatedTimeInfo from '@/components/Chat/CreatedTimeInfo';
import EntityIcon from '@/components/EntityIcon';
import EliteAIcon from '@/components/Icons/EliteAIcon';

const ApplicationAnswerHeader = memo(
  forwardRef((props, ref) => {
    const {
      participant,
      created_at,
      isSwarmChild,
      swarmAgentName,
      verticalMode,
      messageId,
      onClickReplyTo,
      styles,
    } = props;

    const participantName = useParticipantName(participant);
    const entityIcon = useParticipantEntityIcon(participant);

    if (isSwarmChild && swarmAgentName) {
      return (
        <Box
          sx={[styles.headerRow, { pr: 2 }]}
          ref={ref}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={swarmAgentName}
              size="small"
              color="primary"
              variant="outlined"
              icon={<SmartToyIcon fontSize="small" />}
            />
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Sub-agent response
            </Typography>
          </Box>
          <Box sx={styles.timeWrapper}>
            <CreatedTimeInfo created_at={created_at} />
          </Box>
        </Box>
      );
    }

    if (verticalMode) {
      return (
        <Box
          sx={styles.headerRow}
          ref={ref}
        >
          <Box sx={styles.headerLeft}>
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
              sx={styles.entityIcon}
              imageStyle={styles.imageStyle}
              showBackgroundColor={participant.entity_name !== ChatParticipantType.Dummy}
              specifiedFontSize={15}
            />
            <Typography
              variant="bodySmall"
              color="text.secondary"
              sx={styles.participantName}
            >
              {participantName}
            </Typography>
            {messageId !== WELCOME_MESSAGE_ID && (
              <>
                <Typography variant="bodySmall">to</Typography>
                <Typography
                  variant="bodySmall"
                  sx={styles.replyToText}
                  onClick={onClickReplyTo}
                >
                  Message
                </Typography>
              </>
            )}
          </Box>
          <Box sx={styles.timeWrapper}>
            <CreatedTimeInfo created_at={created_at} />
          </Box>
        </Box>
      );
    }

    return (
      <ListItemAvatar sx={styles.listItemAvatar}>
        <EliteAIcon sx={styles.eliteaIcon} />
      </ListItemAvatar>
    );
  }),
);

ApplicationAnswerHeader.displayName = 'ApplicationAnswerHeader';

export default ApplicationAnswerHeader;
