import { useCallback } from 'react';

import { ChatParticipantType } from '@/common/constants';

export const useSkillCreation = ({
  projectId,
  onSkillEditorCreated,
  addNewParticipants,
  onSetActiveParticipant,
}) => {
  const onSkillCreated = useCallback(
    async createdSkill => {
      if (!createdSkill) return;

      const skillProjectId = createdSkill.project_id ?? projectId;

      onSkillEditorCreated?.({
        entity_name: ChatParticipantType.Skills,
        entity_meta: { id: createdSkill.id, project_id: skillProjectId },
        entity_settings: { version_id: createdSkill.version_details?.id },
        meta: { name: createdSkill.name },
        name: createdSkill.name,
      });

      await addNewParticipants?.(
        [{ participantType: ChatParticipantType.Skills, ...createdSkill, project_id: skillProjectId }],
        addedParticipants => {
          const addedSkill = addedParticipants?.find(
            p => p.entity_name === ChatParticipantType.Skills && p.entity_meta?.id === createdSkill.id,
          );
          if (addedSkill) onSetActiveParticipant?.(addedSkill);
        },
      );
    },
    [projectId, onSkillEditorCreated, addNewParticipants, onSetActiveParticipant],
  );

  return { onSkillCreated };
};
