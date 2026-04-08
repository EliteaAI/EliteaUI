import { useCallback, useEffect, useState } from 'react';

import { useSelector } from 'react-redux';

import { useLazyGetConfigurationsListQuery } from '@/api/configurations';

import { useSelectedProjectId } from './useSelectedProject';

export default function useConfigurationsFromAllSections() {
  const { personal_project_id } = useSelector(state => state.user);
  const selectedProjectId = useSelectedProjectId();
  const [getConfigurations] = useLazyGetConfigurationsListQuery();
  const [isFetching, setIsFetching] = useState(false);
  const [configurations, setConfigurations] = useState([]);

  const fetchConfigurations = useCallback(
    async event => {
      event?.stopPropagation();
      setIsFetching(true);
      let teamProjectConfigurations = [];

      if (selectedProjectId) {
        const { data } = await getConfigurations({
          projectId: selectedProjectId,
          page: 0,
          pageSize: 500,
          includeShared: true,
          section: 'credentials',
        });
        teamProjectConfigurations = [...(data?.items || []), ...(data?.shared?.items || [])];

        const { data: storageData } = await getConfigurations({
          projectId: selectedProjectId,
          page: 0,
          pageSize: 500,
          includeShared: true,
          section: 'storage',
        });
        teamProjectConfigurations = [
          ...teamProjectConfigurations,
          ...(storageData?.items || []),
          ...(storageData?.shared?.items || []),
        ];

        const { data: vectorStorageData } = await getConfigurations({
          projectId: selectedProjectId,
          page: 0,
          pageSize: 500,
          includeShared: true,
          section: 'vectorstorage',
        });
        teamProjectConfigurations = [
          ...teamProjectConfigurations,
          ...(vectorStorageData?.items || []),
          ...(vectorStorageData?.shared?.items || []),
        ];

        const { data: embeddingModelsData } = await getConfigurations({
          projectId: selectedProjectId,
          page: 0,
          pageSize: 500,
          includeShared: true,
          section: 'embedding',
        });
        teamProjectConfigurations = [
          ...teamProjectConfigurations,
          ...(embeddingModelsData?.items || []),
          ...(embeddingModelsData?.shared?.items || []),
        ];
      }

      if (personal_project_id && personal_project_id !== selectedProjectId) {
        const { data } = await getConfigurations({
          projectId: personal_project_id,
          page: 0,
          pageSize: 500,
          includeShared: true,
          section: 'credentials',
        });
        teamProjectConfigurations = [
          ...teamProjectConfigurations,
          ...(data?.items || []),
          ...(data?.shared?.items || []),
        ];

        const { data: storageData } = await getConfigurations({
          projectId: personal_project_id,
          page: 0,
          pageSize: 500,
          includeShared: true,
          section: 'storage',
        });
        teamProjectConfigurations = [
          ...teamProjectConfigurations,
          ...(storageData?.items || []),
          ...(storageData?.shared?.items || []),
        ];

        // Skip vectorstorage for personal project when in a team project
        // Private pgvector configs are not allowed in team projects
        // Only shared public pgvector configs are fetched via the team project call above

        const { data: embeddingModelsData } = await getConfigurations({
          projectId: personal_project_id,
          page: 0,
          pageSize: 500,
          includeShared: true,
          section: 'embedding',
        });
        teamProjectConfigurations = [
          ...teamProjectConfigurations,
          ...(embeddingModelsData?.items || []),
          ...(embeddingModelsData?.shared?.items || []),
        ];
      }
      setConfigurations(teamProjectConfigurations);
      setIsFetching(false);
    },
    [getConfigurations, personal_project_id, selectedProjectId],
  );

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  return {
    configurations,
    isFetching,
    refetch: fetchConfigurations,
  };
}
