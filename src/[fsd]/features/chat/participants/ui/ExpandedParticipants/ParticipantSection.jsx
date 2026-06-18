import { memo } from 'react';

import { Box } from '@mui/material';

import { getChatParticipantUniqueId } from '@/[fsd]/features/chat/participants/lib/helpers';
import ParticipantsAccordion from '@/[fsd]/features/chat/participants/ui/ExpandedParticipants/ParticipantsAccordion';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';

import ParticipantItem from './ParticipantItem';

const ParticipantSection = memo(props => {
  const {
    disabledEdit,
    participants,
    collapsed,
    activeParticipantId,
    onSelectParticipant,
    onDeleteParticipant,
    onEditParticipant,
    onRefresh,
    entityType,
    editingToolkit,
    selectedManager,
    newConversationSelectedManager,
  } = props;

  const { isSmallWindow } = useIsSmallWindow();

  return (
    <Box sx={styles.mainContainer(collapsed, isSmallWindow)}>
      <ParticipantsAccordion
        title={`${entityType.toLowerCase() !== 'mcp' ? entityType : 'MCP'}s`}
        onRefresh={onRefresh}
      >
        <Box sx={styles.participantItemsContainer}>
          {participants.map((participant, index) => (
            <ParticipantItem
              disabledEdit={disabledEdit}
              onClickItem={onSelectParticipant}
              key={participant.id || participant.name + index}
              collapsed={false}
              participant={participant}
              isActive={activeParticipantId === getChatParticipantUniqueId(participant)}
              onDelete={onDeleteParticipant}
              onEdit={onEditParticipant}
              editingToolkit={editingToolkit}
              isAttachement={
                (newConversationSelectedManager || selectedManager) === participant.entity_meta?.id
              }
            />
          ))}
        </Box>
      </ParticipantsAccordion>
    </Box>
  );
});

ParticipantSection.displayName = 'ParticipantSection';

/** @type MuiSx ./ParticipantSection.jsx */
const styles = {
  mainContainer: (collapsed, isSmallWindow) => ({
    gap: '.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: !collapsed || isSmallWindow ? 'flex-start' : 'center',
    msOverflowStyle: 'none',
    scrollbarWidth: 'none',

    '::-webkit-scrollbar': {
      display: 'none',
    },
    height: 'auto',
    paddingTop: !collapsed || isSmallWindow ? '0rem' : '.5rem',
    width: '100%',
  }),
  participantItemsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '.5rem',
  },
};

export default ParticipantSection;
