import { Box } from '@mui/material';

import { McpLogoutButton } from '@/[fsd]/features/mcp/ui';
import { ChatParticipantType, PUBLIC_PROJECT_ID } from '@/common/constants';
import DeleteParticipantButton from '@/components/DeleteParticipantButton';
import EditParticipantButton from '@/components/EditParticipantButton';

const ParticipantActions = ({
  participant,
  onEdit,
  onDelete,
  disabledEdit,
  disabledDeleteButton = false,
  showButtons = false,
  showEditButton = false,
  hasRemoteMcpLoggedIn,
  serverUrl,
}) => {
  const isPublic = participant.entity_meta?.project_id == PUBLIC_PROJECT_ID;
  const sx = {
    width: '28px',
    height: '28px',
  };

  // Always render McpLogoutButton when logged in to keep modal state alive
  // even when hovering away (which hides other buttons)
  if (!showButtons && hasRemoteMcpLoggedIn) {
    return (
      <Box sx={{ display: 'none' }}>
        <McpLogoutButton serverUrl={serverUrl} />
      </Box>
    );
  }

  if (!showButtons) {
    return null;
  }

  return (
    <Box sx={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
      {hasRemoteMcpLoggedIn && <McpLogoutButton serverUrl={serverUrl} />}
      {showEditButton && (
        <EditParticipantButton
          id="EditButton"
          sx={sx}
          participant={participant}
          onEdit={onEdit}
          tooltip={
            participant.entity_settings?.agent_type === 'pipeline'
              ? 'Edit Pipeline'
              : participant.entity_name === ChatParticipantType.Applications
                ? 'Edit Agent'
                : participant.meta?.mcp
                  ? 'Edit MCP'
                  : 'Edit Toolkit'
          }
          disabled={disabledEdit}
          isPublic={isPublic}
        />
      )}
      <DeleteParticipantButton
        id="DeleteButton"
        sx={sx}
        participant={participant}
        disabled={disabledDeleteButton}
        onDelete={onDelete}
      />
    </Box>
  );
};

export default ParticipantActions;
