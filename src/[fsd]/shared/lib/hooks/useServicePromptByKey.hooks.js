import { useCallback, useEffect, useRef, useState } from 'react';

import { useLazyGetConfigurationsListQuery } from '@/api/configurations';
import { PUBLIC_PROJECT_ID } from '@/common/constants';

export const SERVICE_PROMPT_KEYS = {
  MERMAID_QUICK_FIX: 'mermaid_quick_fix',
};

const SHARED_PAGE_SIZE = 100;

const matchesKey = (item, key) => item?.data?.key === key || item?.elitea_title === key;

export const useServicePromptByKey = (projectId, key) => {
  const [getConfigurations, { isFetching, isLoading }] = useLazyGetConfigurationsListQuery();
  const lookupId = projectId && key ? `${projectId}:${key}` : null;

  // The stored result is tied to the lookup it belongs to, so a result for a previous key or project is never returned.
  const [result, setResult] = useState({ lookupId: null, config: null, error: null });
  const latestRequestRef = useRef(0);

  // Looks up by key instead of relying on the shared list fitting in the first page.
  const fetchPrompt = useCallback(async () => {
    const includeShared = projectId != PUBLIC_PROJECT_ID;
    const fetchPage = async sharedOffset => {
      const { data, error: requestError } = await getConfigurations(
        {
          projectId,
          section: 'service_prompts',
          includeShared,
          pageSize: 100,
          sharedOffset,
          sharedLimit: SHARED_PAGE_SIZE,
        },
        true,
      );
      // A failed request must not look like "prompt not found"
      if (requestError) throw requestError;
      return data || {};
    };

    const firstPage = await fetchPage(0);
    const localMatch = (firstPage.items || []).find(item => matchesKey(item, key));
    if (localMatch || !includeShared) return localMatch || null;

    let sharedOffset = 0;
    let sharedTotal = firstPage.shared?.total || 0;
    let sharedItems = firstPage.shared?.items || [];

    while (sharedItems.length) {
      const match = sharedItems.find(item => matchesKey(item, key));
      if (match) return match;

      sharedOffset += sharedItems.length;
      if (sharedOffset >= sharedTotal) break;

      const nextPage = await fetchPage(sharedOffset);
      sharedTotal = nextPage.shared?.total || 0;
      sharedItems = nextPage.shared?.items || [];
    }

    return null;
  }, [getConfigurations, projectId, key]);

  // Only the most recent request may write its result, so a slow lookup for an old key cannot overwrite a newer one.
  // Resolves with { config, error } so a caller can act on the outcome without waiting for the next render.
  const load = useCallback(async () => {
    if (!lookupId) return { config: null, error: null };
    const requestId = ++latestRequestRef.current;
    let found = null;
    let lookupError = null;
    try {
      found = await fetchPrompt();
    } catch (err) {
      lookupError = err || new Error('Failed to load service prompt');
    }
    if (requestId === latestRequestRef.current) {
      setResult({ lookupId, config: found, error: lookupError });
    }
    return { config: found, error: lookupError };
  }, [fetchPrompt, lookupId]);

  const invalidateInFlightRequest = useCallback(() => {
    latestRequestRef.current += 1;
  }, []);

  useEffect(() => {
    load();
    return () => {
      invalidateInFlightRequest();
    };
  }, [invalidateInFlightRequest, load]);

  const isCurrentResult = result.lookupId === lookupId;
  const config = isCurrentResult ? result.config : null;
  // Derived from the stored lookup id, so the first render for a new key already reports loading
  const isResolving = Boolean(lookupId) && !isCurrentResult;
  const lookupError = isCurrentResult ? result.error : null;

  // Click handlers cannot wait for the next render to see the retried result.
  const ensurePrompt = useCallback(async () => {
    const currentPrompt = config?.data?.prompt || '';
    if (currentPrompt || !lookupError) return { prompt: currentPrompt, error: null };

    const { config: retriedConfig, error: retryError } = await load();
    return { prompt: retriedConfig?.data?.prompt || '', error: retryError };
  }, [config, lookupError, load]);

  return {
    config,
    prompt: config?.data?.prompt || '',
    isLoading: isLoading || isResolving,
    isFetching,
    error: lookupError,
    refetch: load,
    ensurePrompt,
  };
};
