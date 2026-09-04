import { useCallback } from 'react';

import { useMcpTokenChange } from '@/[fsd]/features/mcp';
import useMCPParticipantStatusMonitor from '@/hooks/chat/useMCPParticipantStatusMonitor';

export const useParticipantMcpStatus = ({
  participant,
  originalDetails,
  entity_meta,
  type,
  isToolkitParticipant,
  updateDetails,
}) => {
  const onMCPConnectionStatusChange = useCallback(
    connected => {
      updateDetails(type, entity_meta?.id, entity_meta?.project_id, prev => ({
        ...prev,
        online: connected,
      }));
    },
    [updateDetails, type, entity_meta?.id, entity_meta?.project_id],
  );

  useMCPParticipantStatusMonitor({
    projectId: entity_meta?.project_id,
    mcpType: originalDetails?.type,
    isMCP: originalDetails?.meta?.mcp,
    onMCPConnectionStatusChange,
  });

  const mcpServerUrl = participant.entity_settings?.mcp_server_url || originalDetails?.settings?.url || '';

  const { isLoggedIn: hasRemoteMcpLoggedIn } = useMcpTokenChange(
    isToolkitParticipant && participant?.entity_settings?.toolkit_type === 'mcp' ? mcpServerUrl : null,
  );

  const mcpIsDisconnected = isToolkitParticipant && !!originalDetails?.meta?.mcp && !originalDetails?.online;
  const remoteMcpLoggedOut =
    isToolkitParticipant && participant?.entity_settings?.toolkit_type === 'mcp' && !hasRemoteMcpLoggedIn;

  return { hasRemoteMcpLoggedIn, mcpIsDisconnected, remoteMcpLoggedOut };
};
