import { useMemo } from 'react';

import { useGetPlatformSettingsQuery } from '@/api/platformSettings';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';

/**
 * Tier 1 of the mid-turn input gate: whether the platform offers the feature to
 * this project at all. Blocklist semantics mirroring publishing — off means
 * allowed everywhere, on means allowed only for whitelisted projects.
 * @returns {boolean}
 */
export const useIsMidturnInjectionAvailable = () => {
  const projectId = useSelectedProjectId();
  const { data: platformSettings } = useGetPlatformSettingsQuery();

  return useMemo(() => {
    if (!platformSettings?.is_midturn_injection_blocked) return true;
    const whitelist = platformSettings?.midturn_injection_whitelist_project_ids || [];
    return whitelist.includes(Number(projectId));
  }, [platformSettings, projectId]);
};

/**
 * Both gate tiers: the platform must offer the feature here AND the user must have
 * opted in. The endpoint enforces tier 1 independently, so this is UX only.
 * @param {{midturn_injection_enabled?: boolean}} [userPersonalization]
 * @returns {boolean}
 */
export const useIsMidturnInjectionEnabled = userPersonalization => {
  const isAvailable = useIsMidturnInjectionAvailable();
  const optedIn = Boolean(userPersonalization?.midturn_injection_enabled);
  return useMemo(() => optedIn && isAvailable, [optedIn, isAvailable]);
};
