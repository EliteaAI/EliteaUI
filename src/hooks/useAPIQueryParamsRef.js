import { useEffect, useMemo, useRef } from 'react';

import { useSelector } from 'react-redux';

import { convertToJson } from '@/common/utils';

export const useAPIQueryParamsRef = endpointName => {
  const queries = useSelector(state => state.eliteaApi.queries);
  const queryParams = useMemo(() => {
    const cacheKeys = Object.keys(queries || {});
    const matchingKeys = cacheKeys.filter(key => queries[key]?.endpointName === endpointName);

    if (matchingKeys.length === 0) {
      return {};
    }

    if (matchingKeys.length === 1) {
      const foundKey = matchingKeys[0];
      const foundParams = convertToJson(foundKey?.replace(endpointName, '') || '{}');
      return foundParams;
    }

    // If multiple cache entries exist, determine which one to use based on current URL
    const currentPath = window.location.pathname;
    let preferredKey = null;

    if (currentPath.includes('/agents')) {
      // On agents page, prefer cache entry with agents_type: 'classic' or no agents_type
      preferredKey = matchingKeys.find(key => {
        try {
          const params = convertToJson(key.replace(endpointName, '') || '{}');
          return params.agents_type === 'classic' || !params.agents_type;
        } catch {
          return false;
        }
      });

      // If we're on agents page but only pipeline cache exists, use whatever cache exists
      if (!preferredKey) {
        preferredKey = matchingKeys[0];
      }
    } else if (currentPath.includes('/pipelines')) {
      // On pipelines page, prefer cache entry with agents_type: 'pipeline'
      preferredKey = matchingKeys.find(key => {
        try {
          const params = convertToJson(key.replace(endpointName, '') || '{}');
          return params.agents_type === 'pipeline';
        } catch {
          return false;
        }
      });
    }

    // If no preferred key found based on context, use the first available key
    const selectedKey = preferredKey || matchingKeys[0];
    const result = convertToJson(selectedKey?.replace(endpointName, '') || '{}');

    return result;
  }, [endpointName, queries]);
  const queryParamsRef = useRef(queryParams);

  useEffect(() => {
    queryParamsRef.current = queryParams;
  }, [queryParams]);

  return queryParamsRef;
};
