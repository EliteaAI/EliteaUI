import { useCallback, useMemo } from 'react';

import { CredentialNameHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { useListCredentialTypesQuery } from '@/api/configurations';
import { useLoadCredentials } from '@/hooks/credentials/useLoadCredentials';

import { useSelectedProjectId } from '../useSelectedProject';

const useLoadCredentialsData = ({
  forceSkip,
  specifiedProjectId,
  section,
  isTableView,
  selectedTypes,
} = {}) => {
  const {
    onLoadMoreCredentials: onLoadMoreCardViewCredentials,
    data: cardViewCredentialsData,
    isCredentialsError: isCardViewCredentialsError,
    isMoreCredentialsError: isMoreCardViewCredentialsError,
    isCredentialsFirstFetching: isCardViewCredentialsFirstFetching,
    isCredentialsFetching: isCardViewCredentialsFetching,
    isCredentialsLoading: isCardViewCredentialsLoading,
    credentialsError: cardViewCredentialsError,
    totalCount: totalCardViewCredentialsCount,
    refetchCredentials: refetchCardViewCredentials,
    setPage: setCardViewPage,
    page: cardViewPage,
    pageSize: cardViewPageSize,
  } = useLoadCredentials({
    specifiedProjectId,
    forceSkip: forceSkip || isTableView,
    section,
    isTableView,
    selectedTypes,
  });

  const {
    onLoadMoreCredentials: onLoadMoreTableViewCredentials,
    data: tableViewCredentialsData,
    isCredentialsError: isTableViewCredentialsError,
    isMoreCredentialsError: isMoreTableViewCredentialsError,
    isCredentialsFirstFetching: isTableViewCredentialsFirstFetching,
    isCredentialsFetching: isTableViewCredentialsFetching,
    isCredentialsLoading: isTableViewCredentialsLoading,
    credentialsError: tableViewCredentialsError,
    totalCount: totalTableViewCredentialsCount,
    refetchCredentials: refetchTableViewCredentials,
    setPage: setTableViewPage,
    page: tableViewPage,
    pageSize: tableViewPageSize,
  } = useLoadCredentials({
    specifiedProjectId,
    forceSkip: forceSkip || !isTableView,
    section,
    isTableView,
    selectedTypes,
  });

  return {
    onLoadMoreCredentials: isTableView ? onLoadMoreTableViewCredentials : onLoadMoreCardViewCredentials,
    data: isTableView ? tableViewCredentialsData : cardViewCredentialsData,
    isCredentialsError: isTableView ? isTableViewCredentialsError : isCardViewCredentialsError,
    isMoreCredentialsError: isTableView ? isMoreTableViewCredentialsError : isMoreCardViewCredentialsError,
    isCredentialsFirstFetching: isTableView
      ? isTableViewCredentialsFirstFetching
      : isCardViewCredentialsFirstFetching,
    isCredentialsFetching: isTableView ? isTableViewCredentialsFetching : isCardViewCredentialsFetching,
    isCredentialsLoading: isTableView ? isTableViewCredentialsLoading : isCardViewCredentialsLoading,
    credentialsError: isTableView ? tableViewCredentialsError : cardViewCredentialsError,
    totalCount: isTableView ? totalTableViewCredentialsCount : totalCardViewCredentialsCount,
    refetchCredentials: isTableView ? refetchTableViewCredentials : refetchCardViewCredentials,
    page: isTableView ? tableViewPage : cardViewPage,
    pageSize: isTableView ? tableViewPageSize : cardViewPageSize,
    setPage: isTableView ? setTableViewPage : setCardViewPage,
  };
};

export const useLoadAllCredentials = ({
  specifiedProjectId,
  forceSkip,
  isTableView,
  selectedTypeNames = [],
} = {}) => {
  const projectId = useSelectedProjectId();
  const { data: credentialTypesData } = useListCredentialTypesQuery(
    { projectId: specifiedProjectId || projectId },
    { skip: (!specifiedProjectId && !projectId) || forceSkip },
  );

  // Build a map from display names to raw type values (similar to useLoadToolkits)
  const credentialTypeNameTypeMap = useMemo(
    () =>
      credentialTypesData?.rows?.reduce((acc, type) => {
        const label = CredentialNameHelpers.extraCredentialName(type);
        acc[label] = type;
        return acc;
      }, {}) || {},
    [credentialTypesData],
  );

  // Convert display names from URL params to raw type values for API filtering
  // Using useMemo instead of useState/useEffect for derived state (per React best practices)
  const selectedTypes = useMemo(
    () => selectedTypeNames.map(name => credentialTypeNameTypeMap[name]).filter(Boolean),
    [selectedTypeNames, credentialTypeNameTypeMap],
  );

  const {
    onLoadMoreCredentials,
    data: credentialsData,
    isCredentialsError,
    isMoreCredentialsError,
    isCredentialsFirstFetching,
    isCredentialsFetching,
    isCredentialsLoading,
    credentialsError,
    totalCount: totalCredentialsCount,
    page: credentialsPage,
    pageSize: credentialsPageSize,
    setPage: setCredentialsPage,
    refetchCredentials,
  } = useLoadCredentialsData({
    specifiedProjectId,
    forceSkip,
    section: 'credentials',
    isTableView,
    selectedTypes,
  });

  const {
    onLoadMoreCredentials: onLoadMoreStorageCredentials,
    data: storageCredentialsData,
    isCredentialsError: isStorageCredentialsError,
    isMoreCredentialsError: isMoreStorageCredentialsError,
    isCredentialsFirstFetching: isStorageCredentialsFirstFetching,
    isCredentialsFetching: isStorageCredentialsFetching,
    isCredentialsLoading: isStorageCredentialsLoading,
    credentialsError: storageCredentialsError,
    totalCount: totalStorageCredentialsCount,
    refetchCredentials: refetchStorageCredentials,
    setPage: setStorageCredentialsPage,
  } = useLoadCredentialsData({
    specifiedProjectId,
    forceSkip,
    section: 'storage',
    isTableView,
    selectedTypes,
  });

  const data = useMemo(() => {
    return [...(credentialsData || []), ...(storageCredentialsData || [])];
  }, [credentialsData, storageCredentialsData]);

  const tagList = useMemo(() => {
    return [...(credentialTypesData?.rows || [])]
      .map((type, index) => {
        return {
          id: type + (index + 1),
          name: CredentialNameHelpers.extraCredentialName(type),
          data: {
            type, // Keep the raw type for filtering
          },
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [credentialTypesData]);

  const totalCount = useMemo(() => {
    return (totalCredentialsCount || 0) + (totalStorageCredentialsCount || 0);
  }, [totalCredentialsCount, totalStorageCredentialsCount]);

  // Memoized error states
  const hasCredentialsError = useMemo(() => {
    return isCredentialsError || isStorageCredentialsError;
  }, [isCredentialsError, isStorageCredentialsError]);

  const isCredentialsFetchingAny = useMemo(() => {
    return isCredentialsFetching || isStorageCredentialsFetching;
  }, [isCredentialsFetching, isStorageCredentialsFetching]);

  const isCredentialsLoadingAny = useMemo(() => {
    return isCredentialsLoading || isStorageCredentialsLoading;
  }, [isCredentialsLoading, isStorageCredentialsLoading]);

  const hasMoreCredentialsError = useMemo(() => {
    return isMoreCredentialsError || isMoreStorageCredentialsError;
  }, [isMoreCredentialsError, isMoreStorageCredentialsError]);

  const isCredentialsFirstFetchingAny = useMemo(() => {
    return isCredentialsFirstFetching || isStorageCredentialsFirstFetching;
  }, [isCredentialsFirstFetching, isStorageCredentialsFirstFetching]);

  const combinedCredentialsError = useMemo(() => {
    return credentialsError || storageCredentialsError;
  }, [credentialsError, storageCredentialsError]);

  const onLoadMore = useCallback(() => {
    if (!isCredentialsFetchingAny) {
      onLoadMoreCredentials();
      onLoadMoreStorageCredentials();
    }
  }, [isCredentialsFetchingAny, onLoadMoreCredentials, onLoadMoreStorageCredentials]);

  const onRefetch = useCallback(() => {
    refetchCredentials();
    refetchStorageCredentials();
  }, [refetchCredentials, refetchStorageCredentials]);

  return {
    tagList,
    onLoadMore,
    data,
    isCredentialsError: hasCredentialsError,
    isCredentialsFetching: isCredentialsFetchingAny,
    isCredentialsLoading: isCredentialsLoadingAny,
    isMoreCredentialsError: hasMoreCredentialsError,
    isCredentialsFirstFetching: isCredentialsFirstFetchingAny,
    credentialsError: combinedCredentialsError,
    totalCount,
    onRefetch,
    page: credentialsPage,
    pageSize: credentialsPageSize,
    setPage: page => {
      setCredentialsPage(page);
      setStorageCredentialsPage(page);
    },
  };
};
