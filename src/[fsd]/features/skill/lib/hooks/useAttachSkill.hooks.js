import { useCallback } from 'react';

import { useUpdateSkillRelationMutation } from '@/[fsd]/features/skill/api';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useToast from '@/hooks/useToast';

export const useAttachSkill = ({ entityVersionId }) => {
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const [updateSkillRelation, { isLoading }] = useUpdateSkillRelationMutation();

  const attachSkill = useCallback(
    async ({ skillId, skillVersionId }) => {
      try {
        await updateSkillRelation({
          projectId,
          skillId,
          entity_version_id: entityVersionId,
          skill_version_id: skillVersionId,
          has_relation: true,
        }).unwrap();
        return true;
      } catch (error) {
        toastError(buildErrorMessage(error));
        return false;
      }
    },
    [updateSkillRelation, projectId, entityVersionId, toastError],
  );

  return { attachSkill, isLoading };
};
