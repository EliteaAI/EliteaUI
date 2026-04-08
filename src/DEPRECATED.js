import { useMemo } from 'react';

import { useListModelsQuery } from '@/api/configurations.js';
import { GROUP_SELECT_VALUE_SEPARATOR, PUBLIC_PROJECT_ID } from '@/common/constants.js';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

export const genModelSelectValue = (integrationUid, modelName, integrationName = '') => {
  if (integrationUid || modelName || integrationName) {
    return [integrationUid, modelName, integrationName].join(GROUP_SELECT_VALUE_SEPARATOR);
  } else {
    return '';
  }
};

const getFilteredModels = configurations => {
  return configurations.map(i => ({
    label: i.name,
    value: i.name,
    shared: i.shared || false,
    group: i.shared ? 'shared' : 'project',
    group_name: i.shared ? 'shared' : 'project',
    config_name: i.name,
    default: false,
  }));
};

// todo: refactor so this function is never used anywhere
export const getIntegrationOptions = configurations =>
  getFilteredModels(configurations).reduce((accumulator, configuration) => {
    accumulator[configuration.value] = [...(accumulator[configuration.value] || []), configuration];
    return accumulator;
  }, {});

export const useModelOptions = ({ specifiedProjectId, usePublicProjectId } = {}) => {
  const selectedProjectId = useSelectedProjectId();
  const projectId = useMemo(
    () =>
      specifiedProjectId ? specifiedProjectId : usePublicProjectId ? PUBLIC_PROJECT_ID : selectedProjectId,
    [selectedProjectId, specifiedProjectId, usePublicProjectId],
  );
  const { data: modelsData = { items: [], total: 0 } } = useListModelsQuery(
    {
      projectId,
      include_shared: true,
    },
    { skip: !projectId },
  );
  // const [modelOptions, setModelOptions] = useState({});
  // const [embeddingModelOptions, setEmbeddingModelOptions] = useState({})
  // useEffect(() => {
  //   if (isSuccess && modelsData.items) {
  //     setModelOptions(getIntegrationOptions(modelsData.items));
  //     // setEmbeddingModelOptions(getIntegrationOptions(modelsData.items, ['embeddings']));
  //   }
  // }, [modelsData.items, isSuccess]);

  return {
    llmModels: modelsData.items,
    modelOptions: modelsData.items,
    embeddingModelOptions: [],
  };
};
