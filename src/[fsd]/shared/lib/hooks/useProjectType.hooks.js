import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { PUBLIC_PROJECT_ID } from '@/common/constants';
import { useSelectedProject } from '@/hooks/useSelectedProject';

const PROJECT_TYPES = {
  PRIVATE: 'private',
  PUBLIC: 'public',
  TEAM: 'team',
};

export const useProjectType = () => {
  const { personal_project_id } = useSelector(state => state.user);
  const selectedProject = useSelectedProject();

  return useMemo(() => {
    const projectId = selectedProject?.id;

    const isPrivate = projectId === personal_project_id;
    const isPublic = projectId === PUBLIC_PROJECT_ID;
    const isTeam = !isPrivate && !isPublic && !!projectId;

    let projectType = PROJECT_TYPES.TEAM;
    if (isPrivate) projectType = PROJECT_TYPES.PRIVATE;
    else if (isPublic) projectType = PROJECT_TYPES.PUBLIC;

    return {
      projectType,
      isPrivate,
      isPublic,
      isTeam,
    };
  }, [personal_project_id, selectedProject?.id]);
};
