import { NPS_DISMISSED_STORAGE_KEY } from '../constants';

export const readDismissedIds = () => {
  try {
    const raw = localStorage.getItem(NPS_DISMISSED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const persistDismissedIds = ids => {
  try {
    localStorage.setItem(NPS_DISMISSED_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // noop
  }
};
