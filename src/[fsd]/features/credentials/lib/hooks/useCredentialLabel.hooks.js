import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useGetConfigurationsListQuery } from '@/api/configurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { resolveCredentialLabel } from '../helpers/credentialLabel.helpers';
import { credentialsListQueryArgs } from '../helpers/credentialsList.helpers';

export const useCredentialLabel = ({ credential, type = '' }) => {
  const selectedProjectId = useSelectedProjectId();
  const { personal_project_id } = useSelector(state => state.user);
  const hasCredential = Boolean(credential?.elitea_title);
  const isPersonalCredentialInTeamProject =
    Boolean(credential?.private) && Boolean(personal_project_id) && personal_project_id !== selectedProjectId;

  const { data: projectData } = useGetConfigurationsListQuery(
    credentialsListQueryArgs({ projectId: selectedProjectId, section: 'credentials', type }),
    {
      skip: !selectedProjectId || !hasCredential,
    },
  );
  const { data: personalData } = useGetConfigurationsListQuery(
    credentialsListQueryArgs({ projectId: personal_project_id, section: 'credentials', type }),
    {
      skip: !hasCredential || !isPersonalCredentialInTeamProject,
    },
  );

  return useMemo(() => {
    const configurations = [
      ...(projectData?.items ?? []),
      ...(projectData?.shared?.items ?? []),
      ...(isPersonalCredentialInTeamProject ? (personalData?.items ?? []) : []),
    ].filter(configuration => !type || configuration.type === type);
    return resolveCredentialLabel({ configurations, credential, personalProjectId: personal_project_id });
  }, [projectData, personalData, isPersonalCredentialInTeamProject, type, credential, personal_project_id]);
};
