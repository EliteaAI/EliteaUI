import { useMemo } from 'react';

import { useSkillsLimitsQuery } from '@/[fsd]/entities/import-wizard/api';
import { getSkillLimitErrors } from '@/[fsd]/entities/import-wizard/lib/helpers';
import { useSelectedProjectId } from '@/[fsd]/shared/lib/hooks';

/**
 * Checks the selected import/fork items against the skills-per-agent limit.
 *
 * The limit is a platform setting, so it does not depend on the target project. The fork dialog
 * opens without a target project, hence the current project is used to read the limit until one is
 * picked. When the limit cannot be loaded nothing is blocked: the backend still enforces it.
 */
export const useImportSkillLimit = (importItems, targetProjectId) => {
  const currentProjectId = useSelectedProjectId();
  const limitProjectId = targetProjectId ?? currentProjectId;

  const { data: skillsLimits } = useSkillsLimitsQuery(
    { projectId: limitProjectId },
    { skip: !limitProjectId },
  );

  const maxSkillsPerAgent = skillsLimits?.max_skills_per_agent;

  const skillLimitErrors = useMemo(
    () => getSkillLimitErrors(importItems, maxSkillsPerAgent),
    [importItems, maxSkillsPerAgent],
  );

  return {
    maxSkillsPerAgent,
    skillLimitErrors,
    hasSkillLimitErrors: Object.keys(skillLimitErrors).length > 0,
  };
};
