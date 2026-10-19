import { useCallback } from 'react';

import { useSocket } from '@/[fsd]/features/auth/lib/hooks';
import { sioEvents } from '@/common/constants';

export default function useMCPParticipantStatusMonitor({
  projectId,
  mcpType,
  isMCP,
  onMCPConnectionStatusChange,
}) {
  const handleMCPStatusEvent = useCallback(
    async message => {
      if (!isMCP) return;

      const { project_id, connected, type } = message;
      if (type === mcpType && projectId == project_id) {
        onMCPConnectionStatusChange?.(connected);
      }
    },
    [isMCP, mcpType, onMCPConnectionStatusChange, projectId],
  );

  useSocket(sioEvents.mcp_status, handleMCPStatusEvent);
}
