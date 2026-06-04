import { useCallback, useEffect, useRef, useState } from 'react';

import { useLazyGetConfigurationsListQuery, useListModelsQuery } from '@/api/configurations';

/**
 * Manages credential configuration loading, refreshing, and batch validation.
 * Returns loaded configurations, fetch state, and a refresh handler.
 */
export const useCredentialsData = ({
  selectedProjectId,
  personal_project_id,
  section,
  type,
  onlyPublic,
  batchValidateCredentials,
  resetStatuses,
}) => {
  const [getConfigurations, { isFetching }] = useLazyGetConfigurationsListQuery();
  const [hasFetchedData, setHasFetchedData] = useState(false);
  const [configurations, setConfigurations] = useState([]);
  const hasAutoSelectedRef = useRef(false);

  const {
    data: vectorStorageData = { items: [], total: 0, default_model_name: '', default_model_project_id: '' },
  } = useListModelsQuery(
    { projectId: selectedProjectId, include_shared: true, section: 'vectorstorage' },
    { skip: !selectedProjectId || section !== 'vectorstorage' },
  );

  const projectDefaultVectorStorageModel = vectorStorageData?.default_model_name || '';

  const onRefresh = useCallback(
    async event => {
      event?.stopPropagation();
      setConfigurations([]);
      setHasFetchedData(false);
      hasAutoSelectedRef.current = false;
      resetStatuses();
      let teamProjectConfigurations = [];
      if (selectedProjectId) {
        const { data } = await getConfigurations({
          projectId: selectedProjectId,
          page: 0,
          pageSize: 500,
          sharedOffset: 0,
          sharedLimit: 500,
          includeShared: true,
          section,
          type,
        });
        teamProjectConfigurations = [
          ...(data?.items?.filter(item => !type || item.type === type) || []),
          ...(data?.shared?.items?.filter(item => !type || item.type === type) || []),
        ];
      }
      if (personal_project_id && personal_project_id !== selectedProjectId) {
        if (!onlyPublic) {
          if (section !== 'vectorstorage') {
            const { data } = await getConfigurations({
              projectId: personal_project_id,
              page: 0,
              pageSize: 500,
              sharedOffset: 0,
              sharedLimit: 500,
              includeShared: true,
              section,
              type,
            });
            teamProjectConfigurations = [
              ...teamProjectConfigurations,
              ...(data?.items?.filter(item => !type || item.type === type) || []),
            ];
          }
        }
      }
      setConfigurations(teamProjectConfigurations);
      setHasFetchedData(true);
    },
    [getConfigurations, personal_project_id, resetStatuses, section, selectedProjectId, type, onlyPublic],
  );

  useEffect(() => {
    onRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId, personal_project_id, type, section, onlyPublic]);

  useEffect(() => {
    if (!hasFetchedData || configurations.length === 0) return;
    if (section !== 'credentials') return;
    batchValidateCredentials(
      configurations.map(config => ({
        projectId: config.project_id || selectedProjectId,
        credential: config,
      })),
    );
  }, [hasFetchedData, configurations, batchValidateCredentials, selectedProjectId, section]);

  return {
    configurations,
    hasFetchedData,
    isFetching,
    onRefresh,
    hasAutoSelectedRef,
    projectDefaultVectorStorageModel,
  };
};
