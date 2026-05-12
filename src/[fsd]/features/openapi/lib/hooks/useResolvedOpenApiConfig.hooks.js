import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useGetConfigurationsByTypeQuery } from '@/api/configurations';

export const useResolvedOpenApiConfig = (openApiConfigRef, projectId) => {
  const { personal_project_id } = useSelector(state => state.user);

  const eliteaTitle = openApiConfigRef?.elitea_title;
  const credProjectId = openApiConfigRef?.private ? personal_project_id : projectId;

  const { data: credData } = useGetConfigurationsByTypeQuery(
    { projectId: credProjectId, type: 'openapi' },
    { skip: !eliteaTitle || !credProjectId },
  );

  const resolvedCred = useMemo(
    () => credData?.items?.find(c => c.elitea_title === eliteaTitle),
    [credData, eliteaTitle],
  );

  const openApiConfig = useMemo(
    () => (resolvedCred?.data ? { ...resolvedCred.data, configuration_uuid: resolvedCred.uuid } : null),
    [resolvedCred],
  );

  const oauthEndpoint = openApiConfig?.oauth_discovery_endpoint ?? '';
  const configUuid = openApiConfig?.configuration_uuid;
  const tokenKey = configUuid && oauthEndpoint ? `${configUuid}:${oauthEndpoint}` : oauthEndpoint;

  return { openApiConfig, oauthEndpoint, configUuid, tokenKey };
};
