/** Identifies one version of a banner, so an edited banner counts as new and is shown again. */
export const getBannerVersionKey = banner => `${banner.id}:${banner.updated_at}`;

/**
 * First banner in queue order the user hasn't closed. A non-dismissible banner can't be closed,
 * so it stays at the head and blocks the banners after it.
 */
export const getActiveBanner = (banners, persistedDismissed, sessionDismissed) =>
  banners.find(banner => {
    if (sessionDismissed.has(getBannerVersionKey(banner))) return false;
    // persisted state counts only while the admin keeps "remember dismissal" on and the banner unchanged
    return !(banner.persist_dismissal && persistedDismissed[banner.id] === banner.updated_at);
  }) ?? null;
