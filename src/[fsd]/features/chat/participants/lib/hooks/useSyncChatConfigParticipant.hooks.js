import { useCallback } from 'react';

import {
  useProjectInfoQuery,
  useUpdateProjectChatConfigMutation,
} from '@/[fsd]/features/settings/api/projectInfoApi';
import { PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

export const useSyncChatConfigParticipant = ({ projectId }) => {
  const { refetch } = useProjectInfoQuery({ projectId, fields: 'chat_config' }, { skip: !projectId });
  const [updateChatConfig] = useUpdateProjectChatConfigMutation();
  const { checkPermission } = useCheckPermission();

  const syncParticipant = useCallback(
    async ({ applicationId, entityName, newName, newAgentType }) => {
      if (!checkPermission(PERMISSIONS.configuration.update)) return;

      // Refetch to avoid overwriting recent admin changes made since the last cache fill
      const { data: freshProjectInfo } = await refetch();
      const participants = freshProjectInfo?.chat_config?.participants;
      if (!participants?.length) return;

      let changed = false;
      const updated = participants.map(p => {
        if (p.entity_id !== applicationId || p.entity_name !== entityName) return p;
        const updatedName = newName !== p.name;
        const updatedAgentType = newAgentType !== undefined && newAgentType !== p.agent_type;
        if (!updatedName && !updatedAgentType) return p;
        changed = true;
        return {
          ...p,
          ...(updatedName && { name: newName }),
          ...(updatedAgentType && { agent_type: newAgentType }),
        };
      });

      if (!changed) return;

      updateChatConfig({
        projectId,
        chat_config: { ...freshProjectInfo.chat_config, participants: updated },
      });
    },
    [projectId, refetch, updateChatConfig, checkPermission],
  );

  return { syncParticipant };
};
