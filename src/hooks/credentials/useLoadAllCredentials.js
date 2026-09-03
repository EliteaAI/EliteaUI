import { useMemo } from 'react';

import { CredentialNameHelpers, CredentialVisibilityHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { useListCredentialTypesQuery } from '@/api/configurations';
import { useLoadCredentials } from '@/hooks/credentials/useLoadCredentials';
import useGetCurrentConfigurationAsSchemas from '@/hooks/useGetCurrentConfigurationAsSchemas';

import { useSelectedProjectId } from '../useSelectedProject';

const CREDENTIAL_SECTIONS = ['credentials', 'storage'];

export const useLoadAllCredentials = props => {
  const {
    specifiedProjectId,
    forceSkip,
    isTableView,
    selectedTypeNames = [],
    folderEntityIds = null,
  } = props ?? {};

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
    folderEntityIds,
  });

  const { configurationsAsSchema } = useGetCurrentConfigurationAsSchemas();
  const allowedTypes = useMemo(
    () => CredentialVisibilityHelpers.getAllowedCredentialTypes(configurationsAsSchema),
    [configurationsAsSchema],
  );

  const visibleData = useMemo(
    () => CredentialVisibilityHelpers.filterCredentialsByAllowedTypes(data, allowedTypes),
    [data, allowedTypes],
  );

  const tagList = useMemo(() => {
    const tags = [...(credentialTypesData?.rows || [])]
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
    return CredentialVisibilityHelpers.filterCredentialTagsByAllowedTypes(tags, allowedTypes);
  }, [credentialTypesData, allowedTypes]);

  return {
    tagList,
    onLoadMore: onLoadMoreCredentials,
    data: visibleData,
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
