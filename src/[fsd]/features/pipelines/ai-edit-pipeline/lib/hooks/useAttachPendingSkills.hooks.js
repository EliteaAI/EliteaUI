import { useCallback } from 'react';

import { useLazySkillDetailsQuery, useUpdateSkillRelationMutation } from '@/[fsd]/features/skill/api';
import { useSelectedProjectId, useToast } from '@/[fsd]/shared/lib/hooks';

/**
 * Attaches the skills an AI draft suggested on the create page, once the new pipeline has a version.
 * A skill relation needs a version id, which only exists after the first Save.
 */
export const useAttachPendingSkills = () => {
  const projectId = useSelectedProjectId();
  const { toastWarning } = useToast();
  const [fetchSkillDetails] = useLazySkillDetailsQuery();
  const [updateSkillRelation] = useUpdateSkillRelationMutation();

  return useCallback(
    async (skills, versionId) => {
      if (!versionId || !skills?.length) return;
      const results = await Promise.allSettled(
        skills.map(async skill => {
          const skillProjectId = skill.project_id ?? projectId;
          const { data: skillDetails } = await fetchSkillDetails({
            projectId: skillProjectId,
            skillId: skill.id,
          });
          if (!skillDetails?.version_details?.id) throw new Error('no skill version');
          return updateSkillRelation({
            projectId: skillProjectId,
            skillId: skill.id,
            entity_version_id: versionId,
            skill_version_id: skillDetails.version_details.id,
            has_relation: true,
          }).unwrap();
        }),
      );
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed) {
        toastWarning(`The pipeline was saved, but ${failed} suggested skill(s) could not be attached.`);
      }
    },
    [fetchSkillDetails, projectId, toastWarning, updateSkillRelation],
  );
};
