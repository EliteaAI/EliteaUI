import { useParams } from 'react-router-dom';

import { useSkillDetailsQuery } from '@/[fsd]/features/skill';
import { useGetPublicSkillDetailsQuery } from '@/[fsd]/features/skill-hub/api';
import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

const NO_VERSIONS = [];

export const useSkillHistoryEntity = ({ isCatalogSkill }) => {
  const { skillId } = useParams();
  const projectId = useSelectedProjectId();

  const { data: ownSkill } = useSkillDetailsQuery(
    { projectId, skillId },
    { skip: isCatalogSkill || !projectId || !skillId },
  );
  const { data: catalogSkill } = useGetPublicSkillDetailsQuery(
    { skillId },
    { skip: !isCatalogSkill || !skillId },
  );
  const skill = isCatalogSkill ? catalogSkill : ownSkill;

  return {
    skillId,
    skill,
    versions: skill?.versions ?? NO_VERSIONS,
    entityProjectId: isCatalogSkill ? PUBLIC_PROJECT_ID : projectId,
  };
};
