import { useCallback } from 'react';

import {
  useProjectInfoQuery,
  useUpdateProjectChatConfigMutation,
} from '@/[fsd]/features/settings/api/projectInfoApi';

export const useSyncChatConfigParticipant = ({ projectId }) => {
  const { data: projectInfo } = useProjectInfoQuery(
    { projectId, fields: 'chat_config' },
    { skip: !projectId },
  );
  const [updateChatConfig] = useUpdateProjectChatConfigMutation();

  const syncParticipant = useCallback(
    ({ applicationId, entityName, newName, newAgentType }) => {
      const participants = projectInfo?.chat_config?.participants;
      if (!participants?.length) return;

      const hasMatch = participants.some(p => p.entity_id === applicationId && p.entity_name === entityName);
      if (!hasMatch) return;

      const updated = participants.map(p => {
        if (p.entity_id !== applicationId || p.entity_name !== entityName) return p;
        return {
          ...p,
          name: newName,
          ...(newAgentType !== undefined && { agent_type: newAgentType }),
        };
      });

      updateChatConfig({
        projectId,
        chat_config: { ...projectInfo.chat_config, participants: updated },
      });
    },
    [projectInfo, projectId, updateChatConfig],
  );

  return { syncParticipant };
};
