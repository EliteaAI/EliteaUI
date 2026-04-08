import { useMemo } from 'react';

import { useListModelsQuery } from '@/api/configurations';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

/**
 * Hook to fetch and resolve the default model for the current project.
 * Returns the model list, default model, and loading state.
 *
 * Resolution order:
 * 1. Model matching default_model_name from API response
 * 2. Model with `default: true` flag
 * 3. First model in the list
 * 4. null if no models available
 
 */
export const useDefaultModel = (options = {}) => {
  const selectedProjectId = useSelectedProjectId();
  const { projectId = selectedProjectId, includeShared = true, skip = false } = options;

  const {
    data: { items: modelList = [], default_model_name: defaultModelName = '' } = {},
    isLoading,
    isFetching,
    isError,
  } = useListModelsQuery({ projectId, include_shared: includeShared }, { skip: skip || !projectId });

  const defaultModel = useMemo(() => {
    // If defaultModelName is specified, find that model in the list
    if (defaultModelName) {
      const foundModel = modelList.find(model => model.name === defaultModelName);
      if (foundModel) return foundModel;
    }

    // Otherwise, find model marked as default, or use first available
    return modelList.find(model => model.default) || modelList[0] || null;
  }, [defaultModelName, modelList]);

  return {
    modelList,
    defaultModel,
    defaultModelName,
    isLoading,
    isFetching,
    isError,
  };
};
