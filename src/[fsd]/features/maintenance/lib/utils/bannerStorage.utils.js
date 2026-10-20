import { BANNERS_DISMISSED_STORAGE_KEY } from '@/[fsd]/features/maintenance/lib/constants';

/** Map of banner id → `updated_at` of the version the user closed. */
export const readDismissedBanners = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(BANNERS_DISMISSED_STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const persistDismissedBanners = dismissed => {
  try {
    localStorage.setItem(BANNERS_DISMISSED_STORAGE_KEY, JSON.stringify(dismissed));
  } catch {
    // noop
  }
};
