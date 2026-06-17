import { useMemo } from 'react';

import { CredentialNameHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { useListCredentialTypesQuery } from '@/api/configurations';
import { useLoadCredentials } from '@/hooks/credentials/useLoadCredentials';

import { useSelectedProjectId } from '../useSelectedProject';

const CREDENTIAL_SECTIONS = ['credentials', 'storage'];

export const useLoadAllCredentials = props => {
  const { specifiedProjectId, forceSkip, isTableView, selectedTypeNames = [] } = props ?? {};

  const projectId = useSelectedProjectId();
  const { data: credentialTypesData } = useListCredentialTypesQuery(
    { projectId: specifiedProjectId || projectId },
    { skip: (!specifiedProjectId && !projectId) || forceSkip },
  );

  const credentialTypeNameTypeMap = useMemo(
    () =>
      credentialTypesData?.rows?.reduce((acc, type) => {
        const label = CredentialNameHelpers.extraCredentialName(type);
        acc[label] = type;
        return acc;
      }, {}) || {},
    [credentialTypesData],
  );

  const selectedTypes = useMemo(
    () => selectedTypeNames.map(name => credentialTypeNameTypeMap[name]).filter(Boolean),
    [selectedTypeNames, credentialTypeNameTypeMap],
  );

  const {
    onLoadMoreCredentials,
    data,
    isCredentialsError,
    isMoreCredentialsError,
    isCredentialsFirstFetching,
    isCredentialsFetching,
    isCredentialsLoading,
    credentialsError,
    totalCount,
    page,
    pageSize,
    setPage,
    refetchCredentials,
  } = useLoadCredentials({
    specifiedProjectId,
    forceSkip,
    section: CREDENTIAL_SECTIONS,
    isTableView,
    selectedTypes,
  });

  const tagList = useMemo(() => {
    return [...(credentialTypesData?.rows || [])]
      .map((type, index) => {
        return {
          id: type + (index + 1),
          name: CredentialNameHelpers.extraCredentialName(type),
          data: {
            type,
          },
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [credentialTypesData]);

  return {
    tagList,
    onLoadMore: onLoadMoreCredentials,
    data,
    isCredentialsError,
    isCredentialsFetching,
    isCredentialsLoading,
    isMoreCredentialsError,
    isCredentialsFirstFetching,
    credentialsError,
    totalCount,
    onRefetch: refetchCredentials,
    page,
    pageSize,
    setPage,
  };
};
