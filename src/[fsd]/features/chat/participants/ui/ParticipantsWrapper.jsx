import React, { memo, useMemo } from 'react';

import { Grid } from '@mui/material';

import { ParticipantDetailsProvider } from '@/[fsd]/features/chat/participants/lib/context/ParticipantDetailsContext';
import { getChatParticipantUniqueId } from '@/[fsd]/features/chat/participants/lib/helpers';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';
import useIsSmallWindow from '@/hooks/useIsSmallWindow';
import { useTheme } from '@emotion/react';

import Participants from './Participants';

const ParticipantsWrapper = memo(props => {
  const {
    hidden,
    collapsed,
    rightPanelWidth,
    activeConversation,
    editingToolkit,
    onParticipantsCollapsed,
    activeParticipant,
    onDeleteParticipant,
    onSelectParticipant,
    onChangeParticipantSettings,
    onEditParticipant,
    setActiveConversation,
    selectedManager,
    newConversationSelectedManager,
  } = props;

  const theme = useTheme();
  const styles = participantWrapperStyles({ theme, collapsed, rightPanelWidth });

  const { isSmallWindow } = useIsSmallWindow();
  const { checkPermission } = useCheckPermission();

  const disabledAdd = useMemo(
    () => activeConversation?.isPlayback || !checkPermission(PERMISSIONS.users.view),
    [activeConversation, checkPermission],
  );

  if (hidden) return null;

  return (
    <Grid
      size={{ xs: 12, lg: collapsed ? 0.5 : 3 }}
      sx={styles[`${isSmallWindow ? 'small' : 'large'}ScreenParticipantsWrapper`]}
    >
      <ParticipantDetailsProvider participants={activeConversation?.participants || []}>
        <Participants
          disabledEdit={activeConversation?.isPlayback}
          collapsed={collapsed}
          selectedManager={selectedManager}
          onCollapsed={onParticipantsCollapsed}
          activeParticipantId={getChatParticipantUniqueId(activeParticipant)}
          participants={activeConversation?.participants || []}
          onDeleteParticipant={onDeleteParticipant}
          onSelectParticipant={onSelectParticipant}
          onUpdateParticipant={onChangeParticipantSettings}
          onEditParticipant={onEditParticipant}
          disabledAdd={disabledAdd}
          editingToolkit={editingToolkit}
          conversationId={
            !activeConversation?.isNew && !activeConversation?.isPlayback ? activeConversation?.id : undefined
          }
          contextStrategy={activeConversation?.meta?.context_strategy || {}}
          setActiveConversation={setActiveConversation}
          conversationInstructions={activeConversation?.instructions || ''}
          persona={activeConversation?.meta?.persona}
          newConversationSelectedManager={newConversationSelectedManager}
        />
      </ParticipantDetailsProvider>
    </Grid>
  );
});

ParticipantsWrapper.displayName = 'ParticipantsWrapper';

/** @type {MuiSx} */
const participantWrapperStyles = ({ theme, collapsed, rightPanelWidth }) => ({
  smallScreenParticipantsWrapper: {
    height: 'auto',
    boxSizing: 'border-box',
    marginBottom: '1rem',
    paddingRight: '1rem',
    paddingLeft: {
      lg: '1rem',
    },
  },
  largeScreenParticipantsWrapper: {
    height: '100%',
    boxSizing: 'border-box',
    paddingRight: '1rem',
    paddingLeft: {
      lg: collapsed ? '1.25rem' : '1.5rem',
    },

    maxWidth: collapsed ? '5rem !important' : `${rightPanelWidth}px !important`,
    minWidth: collapsed ? '5rem !important' : `${rightPanelWidth}px !important`,

    [theme.breakpoints.down('lg')]: {
      maxWidth: '100% !important',
      minWidth: '100% !important',
    },
  },
});

export default ParticipantsWrapper;
