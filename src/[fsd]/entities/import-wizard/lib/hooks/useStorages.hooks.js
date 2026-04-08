import { useEffect, useState } from 'react';

import { useGetConfigurationsListQuery } from '@/api/configurations.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const useStorages = props => {
  const { specifiedProjectId, skip } = props || {};

  const projectId = useSelectedProjectId();

  const [storageOptions, setStorageOptions] = useState([]);

  const {
    isSuccess: isStoragesSuccess,
    data: storagesResponse,
    isError,
  } = useGetConfigurationsListQuery(
    {
      projectId: specifiedProjectId || projectId,
      type: 's3',
      includeShared: true,
    },
    { skip: !projectId || skip },
  );

  useEffect(() => {
    if (isStoragesSuccess && storagesResponse) {
      const storages = storagesResponse.items || [];

      setStorageOptions(
        storages.map(item => ({
          label: `${item.label}`,
          value: item.elitea_title,
        })),
      );
    }
  }, [isStoragesSuccess, storagesResponse]);

  useEffect(() => {
    if (isError) setStorageOptions([]);
  }, [isError]);

  return {
    storageOptions,
    isStoragesSuccess,
  };
};
