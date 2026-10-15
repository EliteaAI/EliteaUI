import { useMemo } from 'react';

import { useSelector } from 'react-redux';

const useSelectedProjectProperty = (property, defaultValue) => {
  const { personal_project_id } = useSelector(state => state.user);
  const { project } = useSelector(state => state.settings);
  return useMemo(
    () => project?.[property] || (personal_project_id ? defaultValue : ''),
    [project, property, personal_project_id, defaultValue],
  );
};

export const useSelectedProjectName = () => useSelectedProjectProperty('name', 'Private');

export const useSelectedProjectId = () => useSelectedProjectProperty('id', undefined);

export const useSelectedProject = () => {
  const { personal_project_id } = useSelector(state => state.user);
  const { project } = useSelector(state => state.settings);
  return useMemo(
    () =>
      project?.id
        ? project
        : {
            id: personal_project_id,
            name: 'Private',
          },
    [project, personal_project_id],
  );
};
