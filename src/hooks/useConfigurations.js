import { useCallback, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

import { useGetConfigurationsListQuery } from '@/api/configurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const Manual_Title = 'Manual_Title';
export const Create_Personal_Title = 'Create_Personal_Title';
export const Create_Project_Title = 'Create_Project_Title';

export default function useConfigurations(type, specifiedProjectId) {
  const [page, setPage] = useState(0);
  const [privatePage, setPrivatePage] = useState(0);
  const [query, setQuery] = useState('');
  const selectedProjectId = useSelectedProjectId();
  const projectId = useMemo(
    () => specifiedProjectId || selectedProjectId,
    [selectedProjectId, specifiedProjectId],
  );
  const { personal_project_id } = useSelector(state => state.user);

  const {
    data: projectConfigurationsData = {},
    isFetching,
    refetch: refetchProjectIntegrations,
  } = useGetConfigurationsListQuery(
    {
      projectId,
      section: 'credentials',
      page,
      pageSize: 20,
      params: {
        sort_by: 'title',
        sort_order: 'asc',
      },
    },
    {
      skip: !projectId,
      refetchOnMountOrArgChange: true,
    },
  );

  const {
    data: privateConfigurationsData = {},
    isFetching: isFetchingPrivate,
    refetch: refetchPrivateIntegrations,
  } = useGetConfigurationsListQuery(
    {
      projectId: personal_project_id,
      section: 'credentials',
      page: privatePage,
      pageSize: 20,
      params: {
        sort_by: 'title',
        sort_order: 'asc',
      },
    },
    {
      skip: !personal_project_id || projectId == personal_project_id,
      refetchOnMountOrArgChange: true,
    },
  );

  const projectIntegrations = useMemo(
    () => projectConfigurationsData?.items || [],
    [projectConfigurationsData?.items],
  );
  const total = useMemo(() => projectConfigurationsData?.total || 0, [projectConfigurationsData?.total]);
  const privateIntegrations = useMemo(
    () => privateConfigurationsData?.items || [],
    [privateConfigurationsData?.items],
  );
  const privateTotal = useMemo(
    () => privateConfigurationsData?.total || 0,
    [privateConfigurationsData?.total],
  );

  const originalConfigurations = useMemo(
    () => [...projectIntegrations, ...privateIntegrations],
    [privateIntegrations, projectIntegrations],
  );

  const configurations = useMemo(() => {
    const filteredIntegrations = originalConfigurations.filter(
      integration =>
        (!query || integration.title.toLowerCase().includes(query.toLowerCase())) &&
        integration.type === type,
    );
    return filteredIntegrations;
  }, [originalConfigurations, query, type]);

  const onLoadMore = useCallback(() => {
    if (projectIntegrations.length < total && (page + 1) * 20 < total) {
      setPage(prev => prev + 1);
    }

    if (
      projectId != personal_project_id &&
      privateIntegrations.length < privateTotal &&
      (privatePage + 1) * 20 < privateTotal
    ) {
      setPrivatePage(prev => prev + 1);
    }
  }, [
    projectIntegrations.length,
    total,
    page,
    projectId,
    personal_project_id,
    privateIntegrations.length,
    privateTotal,
    privatePage,
  ]);
  return {
    onLoadMore,
    query,
    setQuery,
    isFetching: isFetching || isFetchingPrivate,
    configurations,
    originalConfigurations,
    refetchProjectIntegrations,
    refetchPrivateIntegrations: () =>
      personal_project_id && projectId != personal_project_id
        ? refetchPrivateIntegrations()
        : Promise.resolve(),
  };
}

export function useOriginalConfigurations(specifiedProjectId) {
  const [page, setPage] = useState(0);
  const [privatePage, setPrivatePage] = useState(0);
  const [query, setQuery] = useState('');
  const selectedProjectId = useSelectedProjectId();
  const projectId = useMemo(
    () => specifiedProjectId || selectedProjectId,
    [selectedProjectId, specifiedProjectId],
  );
  const { personal_project_id } = useSelector(state => state.user);
  const { data: projectConfigurationsData = {}, isFetching } = useGetConfigurationsListQuery(
    {
      projectId,
      page,
      pageSize: 20,
      includeShared: true,
      sharedOffset: 0,
      sharedLimit: 100,
      params: {
        sort_by: 'title',
        sort_order: 'asc',
      },
    },
    {
      skip: !projectId,
      refetchOnMountOrArgChange: true,
    },
  );

  const { data: privateConfigurationsData = {}, isFetching: isFetchingPrivate } =
    useGetConfigurationsListQuery(
      {
        projectId: personal_project_id,
        page: privatePage,
        pageSize: 20,
        includeShared: true,
        sharedOffset: 0,
        sharedLimit: 100,
        params: {
          sort_by: 'title',
          sort_order: 'asc',
        },
      },
      {
        skip: !personal_project_id || projectId == personal_project_id,
        refetchOnMountOrArgChange: true,
      },
    );

  const projectIntegrations = useMemo(
    () => [...(projectConfigurationsData?.items || []), ...(projectConfigurationsData?.shared?.items || [])],
    [projectConfigurationsData?.items, projectConfigurationsData?.shared?.items],
  );
  const total = projectConfigurationsData?.total || 0;
  const privateIntegrations = useMemo(
    () => [...(privateConfigurationsData?.items || []), ...(privateConfigurationsData?.shared?.items || [])],
    [privateConfigurationsData?.items, privateConfigurationsData?.shared?.items],
  );
  const privateTotal = privateConfigurationsData?.total || 0;

  const originalConfigurations = useMemo(
    () => [...projectIntegrations, ...privateIntegrations],
    [privateIntegrations, projectIntegrations],
  );

  const onLoadMore = useCallback(() => {
    if (projectIntegrations.length < total && (page + 1) * 20 < total) {
      setPage(prev => prev + 1);
    }

    if (
      projectId != personal_project_id &&
      privateIntegrations.length < privateTotal &&
      (privatePage + 1) * 20 < privateTotal
    ) {
      setPrivatePage(prev => prev + 1);
    }
  }, [
    projectIntegrations.length,
    total,
    page,
    projectId,
    personal_project_id,
    privateIntegrations.length,
    privateTotal,
    privatePage,
  ]);
  return {
    onLoadMore,
    query,
    setQuery,
    isFetching: isFetching || isFetchingPrivate,
    originalConfigurations,
  };
}
