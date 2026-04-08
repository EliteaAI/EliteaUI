import { useCallback, useEffect, useRef } from 'react';

import { useSelector } from 'react-redux';

import { useLazyToolkitTypesQuery } from '@/api/toolkits';
import { sioEvents } from '@/common/constants';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import useSocket from '@/hooks/useSocket';

// Module-level Map to track ongoing fetches by projectId
// Prevents duplicate API calls when multiple components use this hook simultaneously
const pendingFetches = new Map();

export const useGetCurrentToolkitSchemas = ({ skip, isMCP } = {}) => {
  const projectId = useSelectedProjectId();
  const [getToolkitTypes, { isFetching }] = useLazyToolkitTypesQuery();
  const toolkitSchemas = useSelector(state => state.applications.toolkitSchemas);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const shouldFetch = !skip && !Object.keys(toolkitSchemas || {}).length;

    if (shouldFetch && !pendingFetches.has(projectId) && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      const fetchPromise = getToolkitTypes({ projectId })
        .unwrap()
        .finally(() => {
          pendingFetches.delete(projectId);
        });
      pendingFetches.set(projectId, fetchPromise);
    }
  }, [getToolkitTypes, projectId, skip, toolkitSchemas]);

  const handleMCPStatusEvent = useCallback(async () => {
    if (isMCP) {
      getToolkitTypes({ projectId });
    }
  }, [getToolkitTypes, isMCP, projectId]);

  useSocket(sioEvents.mcp_status, handleMCPStatusEvent);

  return {
    toolkitSchemas,
    isFetching,
  };
};
