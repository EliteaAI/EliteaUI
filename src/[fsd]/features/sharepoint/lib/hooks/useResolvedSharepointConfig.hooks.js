import { useMemo } from 'react';

import { useSelector } from 'react-redux';

import { getSharepointConnectionTokenKey } from '@/[fsd]/features/sharepoint/lib/helpers';
import { useGetConfigurationsByTypeQuery } from '@/api/configurations';

export const useResolvedSharepointConfig = (spConfigRef, projectId) => {
  const { personal_project_id } = useSelector(state => state.user);

  const eliteaTitle = spConfigRef?.elitea_title;
  const credProjectId = spConfigRef?.private ? personal_project_id : projectId;

  const { data: credData } = useGetConfigurationsByTypeQuery(
    { projectId: credProjectId, type: 'sharepoint' },
    { skip: !eliteaTitle || !credProjectId },
  );

  const resolvedCred = useMemo(
    () => credData?.items?.find(c => c.elitea_title === eliteaTitle),
    [credData, eliteaTitle],
  );

  const spConfig = useMemo(
    () => (resolvedCred?.data ? { ...resolvedCred.data, configuration_uuid: resolvedCred.uuid } : null),
    [resolvedCred],
  );

  const oauthEndpoint = spConfig?.oauth_discovery_endpoint ?? '';
  const configUuid = spConfig?.configuration_uuid;
  const siteUrl = spConfig?.site_url ?? '';
  const oauthTokenKey = configUuid && oauthEndpoint ? `${configUuid}:${oauthEndpoint}` : oauthEndpoint;
  const connectionTokenKey = getSharepointConnectionTokenKey({ oauthEndpoint, configUuid, siteUrl });

  return { spConfig, oauthEndpoint, configUuid, oauthTokenKey, connectionTokenKey };
};
