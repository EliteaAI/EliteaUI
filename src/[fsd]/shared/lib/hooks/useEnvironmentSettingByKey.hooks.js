import { useMemo } from 'react';

import { ENVIRONMENT_KEYS, ENVIRONMENT_SECTION } from '@/[fsd]/shared/lib/constants/environment.constants';
import { useGetConfigurationsListQuery } from '@/api/configurations.js';
import { DEFAULT_PARTICIPANT_NAME, PUBLIC_PROJECT_ID, TOAST_DURATION } from '@/common/constants.js';

const ENVIRONMENT_QUERY_ARGS = {
  projectId: PUBLIC_PROJECT_ID,
  section: ENVIRONMENT_SECTION,
  includeShared: false,
  pageSize: 100,
};

export const useEnvironmentSettingByKey = key => {
  const { data, isLoading, isFetching, error } = useGetConfigurationsListQuery(ENVIRONMENT_QUERY_ARGS, {
    skip: !key,
  });

  const value = useMemo(() => {
    const items = data?.items || [];
    return items[0]?.data?.[key] ?? null;
  }, [data?.items, key]);

  return { value, isLoading, isFetching, error };
};

export const useSystemSenderName = () => {
  const { value } = useEnvironmentSettingByKey(ENVIRONMENT_KEYS.SYSTEM_SENDER_NAME);
  return value || DEFAULT_PARTICIPANT_NAME;
};

export const useErrorToastDuration = () => {
  const { value } = useEnvironmentSettingByKey(ENVIRONMENT_KEYS.ERROR_TOAST_DURATION);
  return value ? parseInt(value, 10) : TOAST_DURATION;
};
