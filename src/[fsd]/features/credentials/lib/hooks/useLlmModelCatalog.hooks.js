import { useLlmModelCatalogQuery } from '../../api/llmModelCatalogApi.js';
import { useLlmModelTargetProjectId } from './useLlmModelTargetProjectId.hooks.js';

export const useLlmModelCatalog = () => {
  const targetProjectId = useLlmModelTargetProjectId();
  const { data, isError, isFetching, isUninitialized } = useLlmModelCatalogQuery(
    { projectId: targetProjectId },
    { skip: !targetProjectId },
  );

  return { catalog: data, isCatalogPending: isFetching || isUninitialized, isCatalogUnavailable: isError };
};
