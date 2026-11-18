import { useCallback } from 'react';

import { useLazySkillDetailsQuery, useUpdateSkillRelationMutation } from '@/[fsd]/features/skill';
import {
  useAttachPublicSkillMutation,
  useLazyGetPublicSkillDetailsQuery,
} from '@/[fsd]/features/skill-hub/api';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';

export const useAttachSuggestedSkills = () => {
  const projectId = useSelectedProjectId();
  const [fetchSkillDetails] = useLazySkillDetailsQuery();
  const [updateSkillRelation] = useUpdateSkillRelationMutation();
  const [fetchPublicSkillDetails] = useLazyGetPublicSkillDetailsQuery();
  const [attachPublicSkill] = useAttachPublicSkillMutation();

  const attachProjectSkill = useCallback(
    async (skill, versionId) => {
      const { data: skillDetails } = await fetchSkillDetails({ projectId, skillId: skill.id });
      if (!skillDetails?.version_details?.id) return;
      return updateSkillRelation({
        projectId,
        skillId: skill.id,
        entity_version_id: versionId,
        skill_version_id: skillDetails.version_details.id,
        has_relation: true,
      }).unwrap();
    },
    [fetchSkillDetails, projectId, updateSkillRelation],
  );

  const attachCatalogSkill = useCallback(
    async (skill, versionId) => {
      const { data: publicDetails } = await fetchPublicSkillDetails({ skillId: skill.id });
      const publicVersionId = publicDetails?.version_details?.id;
      if (!publicVersionId) throw new Error(`No published version of skill ${skill.name}`);
      const { results } = await attachPublicSkill({
        projectId,
        publicSkillId: skill.id,
        publicVersionId,
        agentVersionIds: [versionId],
      }).unwrap();
      if (!results?.[0]?.ok)
        throw new Error(results?.[0]?.error || `Skill ${skill.name} could not be attached`);
      return results[0];
    },
    [attachPublicSkill, fetchPublicSkillDetails, projectId],
  );

  return useCallback(
    (skills, versionId) =>
      Promise.allSettled(
        skills.map(skill =>
          skill.project_id ? attachCatalogSkill(skill, versionId) : attachProjectSkill(skill, versionId),
        ),
      ),
    [attachCatalogSkill, attachProjectSkill],
  );
};
