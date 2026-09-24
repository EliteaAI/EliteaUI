import { useCallback } from 'react';

import { useLazyProjectInfoQuery, useUpdateProjectChatConfigMutation } from '@/[fsd]/features/settings/api';
import { ChatParticipantType, PERMISSIONS } from '@/common/constants';
import useCheckPermission from '@/hooks/useCheckPermission';

export const useSyncChatConfigParticipant = ({ projectId }) => {
  const [fetchProjectInfo] = useLazyProjectInfoQuery();
  const [updateChatConfig] = useUpdateProjectChatConfigMutation();
  const { checkPermission } = useCheckPermission();

  const syncParticipant = useCallback(
    async ({ applicationId, newName, newAgentType }) => {
      if (!checkPermission(PERMISSIONS.configuration.update)) return;

      // Refetch to avoid overwriting recent admin changes made since the last cache fill
      const { data: freshProjectInfo } = await fetchProjectInfo({ projectId, fields: 'chat_config' });
      const participants = freshProjectInfo?.chat_config?.participants;
      if (!participants?.length) return;

      const newEntityName =
        newAgentType === 'pipeline' ? ChatParticipantType.Pipelines : ChatParticipantType.Applications;

      let changed = false;
      const updated = participants.map(p => {
        const isAgentOrPipeline =
          p.entity_name === ChatParticipantType.Applications ||
          p.entity_name === ChatParticipantType.Pipelines;
        if (p.entity_id !== applicationId || (p.project_id ?? projectId) !== projectId || !isAgentOrPipeline)
          return p;
        const updatedName = newName !== p.name;
        const updatedEntityName = newEntityName !== p.entity_name;
        const updatedAgentType = newAgentType !== undefined && newAgentType !== p.agent_type;
        if (!updatedName && !updatedEntityName && !updatedAgentType) return p;
        changed = true;
        return {
          ...p,
          ...(updatedName && { name: newName }),
          ...(updatedEntityName && { entity_name: newEntityName }),
          ...(updatedAgentType && { agent_type: newAgentType }),
        };
      });

      if (!changed) return;

      updateChatConfig({
        projectId,
        chat_config: { ...freshProjectInfo.chat_config, participants: updated },
      });
    },
    [projectId, fetchProjectInfo, updateChatConfig, checkPermission],
  );

  return { syncParticipant };
};
