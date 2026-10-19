import { useCallback, useEffect, useMemo, useState } from 'react';

import { useGetPlatformBannersQuery } from '@/[fsd]/features/maintenance/api';
import { LEGACY_BANNER_STORAGE_KEY } from '@/[fsd]/features/maintenance/lib/constants';
import { getActiveBanner, getBannerVersionKey } from '@/[fsd]/features/maintenance/lib/helpers';
import { persistDismissedBanners, readDismissedBanners } from '@/[fsd]/features/maintenance/lib/utils';

const EMPTY_BANNERS = [];

/**
 * Global banner queue: one banner at a time, in admin-defined order. Closing a banner reveals the next one.
 * "Closed" is remembered in localStorage only for banners with persist_dismissal; otherwise it lasts
 * until the next page load.
 */
export const usePlatformBanners = () => {
  const { data: banners = EMPTY_BANNERS, isSuccess } = useGetPlatformBannersQuery(undefined, {
    refetchOnFocus: true,
  });

  const [persistedDismissed, setPersistedDismissed] = useState(readDismissedBanners);
  const [sessionDismissed, setSessionDismissed] = useState(() => new Set());

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_BANNER_STORAGE_KEY);
    } catch {
      // noop
    }
  }, []);

  const activeBanner = useMemo(
    () => getActiveBanner(banners, persistedDismissed, sessionDismissed),
    [banners, persistedDismissed, sessionDismissed],
  );

  const dismissBanner = useCallback(() => {
    if (!activeBanner?.dismissible) return;

    setSessionDismissed(prev => new Set(prev).add(getBannerVersionKey(activeBanner)));

    if (!activeBanner.persist_dismissal) return;

    // Drop entries of banners that no longer exist so the stored map doesn't grow forever. Only prune
    // against a loaded list: after a failed refetch the list is stale, and pruning could forget
    // banners the user has closed
    const liveIds = isSuccess ? new Set(banners.map(banner => String(banner.id))) : null;
    const kept = liveIds
      ? Object.fromEntries(Object.entries(persistedDismissed).filter(([id]) => liveIds.has(id)))
      : persistedDismissed;
    const next = { ...kept, [activeBanner.id]: activeBanner.updated_at };

    setPersistedDismissed(next);
    persistDismissedBanners(next);
  }, [activeBanner, banners, isSuccess, persistedDismissed]);

  return { activeBanner, dismissBanner };
};
