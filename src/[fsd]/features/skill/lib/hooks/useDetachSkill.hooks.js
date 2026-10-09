import { useCallback } from 'react';

import { useUpdateSkillRelationMutation } from '@/[fsd]/features/skill/api';
import { useToast } from '@/[fsd]/shared/lib/hooks';
import { buildErrorMessage } from '@/common/utils';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useDetachSkill = ({ entityVersionId }) => {
  const projectId = useSelectedProjectId();
  const { toastError } = useToast();
  const [updateSkillRelation, { isLoading }] = useUpdateSkillRelationMutation();

  const detachSkill = useCallback(
    async ({ skillId }) => {
      try {
        await updateSkillRelation({
          projectId,
          skillId,
          entity_version_id: entityVersionId,
          has_relation: false,
        }).unwrap();
        return true;
      } catch (error) {
        toastError(buildErrorMessage(error));
        return false;
      }
    },
    [updateSkillRelation, projectId, entityVersionId, toastError],
  );

  return { detachSkill, isLoading };
};
