import { useCallback, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';

import { useTheme } from '@mui/material';

import { CredentialHelpers } from '@/[fsd]/features/credentials/lib/helpers';
import { useGetCurrentToolkitSchemas } from '@/[fsd]/features/toolkits/lib/hooks';
import { useGetConfigurationsListQuery } from '@/api/configurations';
import { pinnedComparator, stableSort } from '@/common/utils';
import useGetCurrentConfigurationAsSchemas from '@/hooks/useGetCurrentConfigurationAsSchemas';
import usePageQuery from '@/hooks/usePageQuery';
import useSortQueryParamsFromUrl from '@/hooks/useSortQueryParamsFromUrl';
import { useUserList } from '@/hooks/useUserList';

export const useLoadCredentials = ({
  specifiedProjectId,
  forceSkip,
  section,
  isTableView,
  selectedTypes,
} = {}) => {
  const theme = useTheme();
  const { query, page, pageSize, setPage, projectId } = usePageQuery(specifiedProjectId);
  const { toolkitSchemas } = useGetCurrentToolkitSchemas();
  const { configurationsAsSchema } = useGetCurrentConfigurationAsSchemas();
  const { sort_by, sort_order } = useSortQueryParamsFromUrl({
    defaultSortOrder: 'desc',
    defaultSortBy: 'created_at',
  });

  // Fetch project users to resolve author_id -> { id, name, avatar }
  const { data: usersData } = useUserList({ forceSkip: !projectId });
  const authorMap = useMemo(() => {
    const rows = usersData?.rows || [];
    return rows.reduce((acc, user) => {
      if (user && user.id) {
        acc[user.id] = { id: user.id, name: user.name, avatar: user.avatar };
      }
      return acc;
    }, {});
  }, [usersData]);
  const currentUser = useSelector(state => state.user || {});

  const {
    data: credentialData,
    error: credentialError,
    isError: isCredentialError,
    isLoading: isCredentialLoading,
    isFetching: isCredentialFetching,
    refetch: refetchCredentialsData,
  } = useGetConfigurationsListQuery(
    {
      projectId,
      section,
      page,
      pageSize,
      isTableView,
      // Pass selectedTypes as type parameter for server-side filtering
      type: selectedTypes?.length > 0 ? selectedTypes : undefined,
      params: {
        query, // Add search query parameter
        sort_by,
        sort_order,
      },
      includeShared: true,
      sharedOffset: 0,
      sharedLimit: pageSize,
    },
    {
      skip: !projectId || forceSkip,
      refetchOnMountOrArgChange: true,
    },
  );

  // Reset page to 0 when credential type filter changes
  // Fix for issue #3082: Prevents stale pagination offset when filtering
  useEffect(() => {
    setPage(0);
  }, [selectedTypes, setPage]);

  const tagList = useMemo(() => {
    if (isCredentialLoading || !credentialData) return [];
    const actualData = credentialData?.items || [];
    const enhancedCredentials = CredentialHelpers.enhanceCredentialData(
      actualData,
      theme,
      toolkitSchemas,
      configurationsAsSchema,
    );
    return CredentialHelpers.generateCredentialTagList(enhancedCredentials);
  }, [configurationsAsSchema, credentialData, isCredentialLoading, theme, toolkitSchemas]);

  const data = useMemo(() => {
    const actualData = credentialData?.items || [];
    const enhancedCredentials = CredentialHelpers.enhanceCredentialData(
      actualData,
      theme,
      toolkitSchemas,
      configurationsAsSchema,
    );

    // Attach author object for rendering in Card and DataTable
    const withAuthors = enhancedCredentials.map(item => {
      // Prefer existing author-like fields if BE provided (robust across endpoints)
      const existingAuthor = item.author || item.created_by || item.user || item.owner;
      if (existingAuthor && (existingAuthor.id || existingAuthor.name || existingAuthor.avatar)) {
        const a = {
          id: existingAuthor.id,
          name: existingAuthor.name || existingAuthor.email || 'Unknown',
          avatar: existingAuthor.avatar,
        };
        return { ...item, author: a, authors: [a] };
      }

      const aid = item.author_id ?? item.authorId;
      if (!aid) return item;

      // Resolve via users list when available
      let author = authorMap?.[aid];

      // Private project fallback: current user often equals author
      if (!author && currentUser?.id && currentUser.id === aid) {
        author = { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar };
      }

      // Final fallback
      author = author || { id: aid, name: 'Unknown' };

      return {
        ...item,
        author,
        authors: [author],
      };
    });

    // Sort to ensure pinned items are always at the top using utility function
    return stableSort(withAuthors, pinnedComparator);
  }, [
    authorMap,
    configurationsAsSchema,
    credentialData,
    theme,
    toolkitSchemas,
    currentUser?.id,
    currentUser?.name,
    currentUser?.avatar,
  ]);

  const totalCount = useMemo(() => {
    return credentialData?.total || data?.length || 0;
  }, [credentialData, data]);

  const onLoadMoreCredentials = useCallback(() => {
    if (!isCredentialFetching && (page + 1) * pageSize < totalCount) {
      setPage(page + 1);
    }
  }, [isCredentialFetching, page, pageSize, totalCount, setPage]);

  const refetchCredentials = useCallback(() => {
    setPage(0);
    refetchCredentialsData();
  }, [setPage, refetchCredentialsData]);

  return {
    tagList,
    onLoadMoreCredentials,
    data,
    isCredentialsError: isCredentialError,
    isCredentialsFetching: !!page && isCredentialFetching,
    isCredentialsLoading: isCredentialLoading,
    isMoreCredentialsError: !!page && isCredentialError,
    isCredentialsFirstFetching: !page && isCredentialFetching,
    credentialsError: credentialError,
    totalCount,
    page,
    pageSize,
    setPage,
    query,
    refetchCredentials,
  };
};
