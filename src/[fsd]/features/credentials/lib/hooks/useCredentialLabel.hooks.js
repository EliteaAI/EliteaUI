import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useGetConfigurationsListQuery } from '@/api/configurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

import { resolveCredentialLabel } from '../helpers/credentialLabel.helpers';

const credentialsListArgs = (projectId, type) => ({
  projectId,
  page: 0,
  pageSize: 500,
  sharedOffset: 0,
  sharedLimit: 500,
  includeShared: true,
  section: 'credentials',
  type,
});

export const useCredentialLabel = ({ credential, type = '' }) => {
  const selectedProjectId = useSelectedProjectId();
  const { personal_project_id } = useSelector(state => state.user);
  const hasCredential = Boolean(credential?.elitea_title);
  const isPersonalCredentialInTeamProject =
    Boolean(credential?.private) && Boolean(personal_project_id) && personal_project_id !== selectedProjectId;

  const { data: projectData } = useGetConfigurationsListQuery(credentialsListArgs(selectedProjectId, type), {
    skip: !selectedProjectId || !hasCredential,
  });
  const { data: personalData } = useGetConfigurationsListQuery(
    credentialsListArgs(personal_project_id, type),
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
