import { useEffect, useRef } from 'react';

import { useSelector } from 'react-redux';

import { useLazyToolkitTypesQuery } from '@/api/toolkits';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

// Module-level Map to track ongoing MCP fetches by projectId
// Prevents duplicate API calls when multiple components use this hook simultaneously
const pendingMCPFetches = new Map();

export const useGetCurrentMCPSchemas = ({ isMCP, refetch } = {}) => {
  const projectId = useSelectedProjectId();
  const [getToolkitTypes, { isFetching }] = useLazyToolkitTypesQuery();
  const mcpSchemas = useSelector(state => state.applications.mcpSchemas);
  const mcpSchemasRef = useRef(mcpSchemas);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    mcpSchemasRef.current = mcpSchemas;
  }, [mcpSchemas]);

  useEffect(() => {
    const shouldFetch = isMCP && !Object.keys(mcpSchemasRef.current || {}).length;
    const cacheKey = `${projectId}-mcp`;

    if (shouldFetch && !pendingMCPFetches.has(cacheKey) && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      const fetchPromise = getToolkitTypes({ projectId, params: { mcp: true } })
        .unwrap()
        .finally(() => {
          pendingMCPFetches.delete(cacheKey);
        });
      pendingMCPFetches.set(cacheKey, fetchPromise);
    }
  }, [getToolkitTypes, projectId, isMCP]);

  useEffect(() => {
    if (refetch) {
      getToolkitTypes({ projectId });
    }
  }, [refetch, getToolkitTypes, projectId]);

  return {
    mcpSchemas,
    isFetching,
  };
};
