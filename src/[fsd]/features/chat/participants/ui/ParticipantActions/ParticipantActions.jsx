import { memo } from 'react';

import { Box } from '@mui/material';

import { McpLogoutButton } from '@/[fsd]/features/mcp/ui';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';

import DeleteParticipantButton from './DeleteParticipantButton';
import EditParticipantButton from './EditParticipantButton';

const ParticipantActions = memo(props => {
  const {
    participant,
    onEdit,
    onDelete,
    disabledEdit,
    disabledDeleteButton = false,
    showButtons = false,
    showEditButton = false,
    hasRemoteMcpLoggedIn,
    serverUrl,
  } = props;
  const isPublic = participant.entity_meta?.project_id == PUBLIC_PROJECT_ID;

  return (
    <Box sx={{ display: showButtons ? 'flex' : 'none', gap: '4px', alignItems: 'center' }}>
      {hasRemoteMcpLoggedIn && <McpLogoutButton serverUrl={serverUrl} />}
      {showEditButton && (
        <EditParticipantButton
          id="EditButton"
          sx={{
            width: '1.75rem',
            height: '1.75rem',
          }}
          participant={participant}
          onEdit={onEdit}
          tooltip={
            participant.entity_settings?.agent_type === 'pipeline'
              ? 'Edit pipeline'
              : participant.entity_name === ChatParticipantType.Applications
                ? 'Edit agent'
                : participant.meta?.mcp || participant?.entity_settings?.toolkit_type === 'mcp'
                  ? 'Edit mcp'
                  : 'Edit toolkit'
          }
          disabled={disabledEdit}
          isPublic={isPublic}
        />
      )}
      <DeleteParticipantButton
        id="DeleteButton"
        sx={{
          width: '1.75rem',
          height: '1.75rem',
        }}
        participant={participant}
        disabled={disabledDeleteButton}
        onDelete={onDelete}
      />
    </Box>
  );
});

ParticipantActions.displayName = 'ParticipantActions';

export default ParticipantActions;
