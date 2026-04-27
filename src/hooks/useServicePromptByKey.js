import { useMemo } from 'react';

import { useGetConfigurationsListQuery } from '@/api/configurations.js';
import { PUBLIC_PROJECT_ID } from '@/common/constants.js';

export const SERVICE_PROMPT_KEYS = {
  MERMAID_QUICK_FIX: 'mermaid_quick_fix',
};

export const useServicePromptByKey = (projectId, key) => {
  const { data, isLoading, isFetching, error, refetch } = useGetConfigurationsListQuery(
    {
      projectId,
      section: 'service_prompts',
      includeShared: projectId != PUBLIC_PROJECT_ID,
      pageSize: 100,
    },
    { skip: !projectId || !key },
  );

  const { config, prompt } = useMemo(() => {
    const locals = data?.items || [];
    const shared = data?.shared?.items || [];
    const all = [...locals, ...shared];

    const found =
      all.find(item => item?.data?.key === key) || all.find(item => item?.alita_title === key) || null;

    return {
      config: found,
      prompt: found?.data?.prompt || '',
    };
  }, [data?.items, data?.shared?.items, key]);

  return {
    config,
    prompt,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};
