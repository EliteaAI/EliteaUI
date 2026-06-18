import { useCallback } from 'react';

import { isMcpToolkit } from '@/[fsd]/shared/lib/helpers/mcp.helpers';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';

export const useIsMcpVisible = () => {
  const { data: platformSettings } = useGetPlatformSettingsQuery();
  return platformSettings?.mcp_exposure_enabled !== false && platformSettings?.mcp_in_menu_enabled !== false;
};

/**
 * Returns a stable filter predicate: item => isMcpVisible || !isMcpToolkit(item).
 * Use this to filter toolkit arrays — replaces the repeated inline pattern.
 */
export const useMcpFilter = () => {
  const isMcpVisible = useIsMcpVisible();
  return useCallback(item => isMcpVisible || !isMcpToolkit(item), [isMcpVisible]);
};
