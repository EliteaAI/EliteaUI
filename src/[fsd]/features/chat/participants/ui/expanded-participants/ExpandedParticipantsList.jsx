import { memo, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import { groupParticipantsByKind, isSavedConversation } from '@/[fsd]/features/chat/participants/lib/helpers';
import { useIsMcpVisible, useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';
import { ChatParticipantType } from '@/common/constants';

import { UsersAccessCard } from '../users-access';
import UsersParticipantDropdown from '../users-participant-dropdown';
import ParticipantSection from './ParticipantSection';
import ParticipantsAccordion from './ParticipantsAccordion';
import UserParticipantItem from './UserParticipantItem';

const ENTITY_SECTIONS = [
  { type: ChatParticipantType.Applications, entityType: 'Agent' },
  { type: ChatParticipantType.Pipelines, entityType: 'Pipeline' },
  { type: ChatParticipantType.Skills, entityType: 'Skill' },
  { type: ChatParticipantType.Toolkits, entityType: 'Toolkit' },
  { type: 'mcp', entityType: 'MCP' },
];

const ExpandedPerticapantsList = memo(props => {
  const {
    participants,
    conversation,
    onAccessSaved,
    componentWidth,
    onSelectParticipant,
    onDeleteParticipant,
    onEditParticipant,
    disabledAdd,
    disabledEdit,
    activeParticipantId,
    editingToolkit,
    selectedManager,
    newConversationSelectedManager,
  } = props;

  const selectedProjectId = useSelectedProjectId();
  const isMcpVisible = useIsMcpVisible();

  const styles = expandedPerticapantsListStyles();

  const user = useSelector(state => state.user);

  const [isUsersSectionHovered, setIsUsersSectionHovered] = useState(false);

  const isPrivateProject = selectedProjectId == user.personal_project_id;
  const isSaved = isSavedConversation(conversation);

  const users = useMemo(
    () =>
      participants
        .filter(participant => participant.entity_name === ChatParticipantType.Users)
        .sort((a, b) => a.id - b.id),
    [participants],
  );

  const usersToDisplay = useMemo(() => {
    if (componentWidth <= 200) return users.slice(0, 3);

    return users.slice(0, 5);
  }, [users, componentWidth]);

  const groupedByType = useMemo(
    () => groupParticipantsByKind(participants, isMcpVisible),
    [isMcpVisible, participants],
  );

  return (
    <>
      {!isPrivateProject && isSaved && (
        <UsersAccessCard
          conversation={conversation}
          onSelectParticipant={onSelectParticipant}
          onAccessSaved={onAccessSaved}
        />
      )}

      {!isPrivateProject && !isSaved && !!usersToDisplay?.length && (
        <ParticipantsAccordion title="Users">
          <Box
            sx={styles.usersSection}
            onMouseEnter={() => setIsUsersSectionHovered(true)}
            onMouseLeave={() => setIsUsersSectionHovered(false)}
          >
            <Box sx={styles.usersDisplayContainer}>
              {usersToDisplay.map((participant, index) => (
                <UserParticipantItem
                  key={ChatParticipantType.Users + index}
                  participant={participant}
                  onClickItem={onSelectParticipant}
                />
              ))}
              <Typography
                variant="bodyMedium"
                color="text.primary"
                sx={styles.usersCountText}
                data-testid="chat-participants-users-overflow-count"
              >
                {users.length > usersToDisplay.length ? `+${users.length - usersToDisplay.length}` : ''}
              </Typography>
            </Box>
            <UsersParticipantDropdown
              showTrigger={isUsersSectionHovered}
              users={users}
              onSelectUser={onSelectParticipant}
              onDeleteUser={onDeleteParticipant}
              disabledAdd={disabledAdd}
              currentUserId={user.id}
              placement="left-start"
              slotProps={{
                IconButton: {
                  sx: styles.usersIconButton,
                },
                Paper: {
                  sx: styles.usersDropdownPaper,
                },
              }}
            />
          </Box>
        </ParticipantsAccordion>
      )}

      {ENTITY_SECTIONS.map(section => {
        const group = groupedByType[section.type];
        if (!group || group.participants?.length === 0) return null;
        if (section.type === 'mcp' && !isMcpVisible) return null;

        return (
          <ParticipantSection
            key={section.type}
            disabledEdit={disabledEdit}
            participants={group}
            collapsed={false}
            activeParticipantId={activeParticipantId}
            onSelectParticipant={onSelectParticipant}
            onDeleteParticipant={onDeleteParticipant}
            onEditParticipant={onEditParticipant}
            entityType={section.entityType}
            editingToolkit={editingToolkit}
            selectedManager={selectedManager}
            newConversationSelectedManager={newConversationSelectedManager}
          />
        );
      })}
    </>
  );
});

ExpandedPerticapantsList.displayName = 'ExpandedPerticapantsList';

/** @type {MuiSx} */
const expandedPerticapantsListStyles = () => ({
  usersSection: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '2.5rem',
    background: palette.background.surface.interactive.default,

    '&:hover': {
      background: palette.background.interactiveItem.hover,
    },

    padding: '.375rem .75rem',
    borderRadius: '.5rem',
  }),
  usersDisplayContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
  },
  usersCountText: {
    marginLeft: '.25rem',
  },
  usersIconButton: ({ palette }) => ({
    padding: '.375rem',
    fontSize: '1rem',

    '&:hover': {
      backgroundColor: palette.background.overlay.medium,

      '& > *': { color: palette.icon.secondary },
      '& svg': { fill: palette.icon.secondary },

      '& .MuiSvgIcon-root path': {
        fill: `${palette.icon.secondary} !important`,
      },
    },
  }),
  usersDropdownPaper: {
    marginTop: '.5rem',
    marginLeft: '0rem',
  },
});

export default ExpandedPerticapantsList;
