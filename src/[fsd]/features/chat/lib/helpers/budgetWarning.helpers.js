import { BudgetWarningConstants } from '@/[fsd]/shared/lib/constants';

const { DISMISS_STORAGE_PREFIX, BUDGET_WARNING_SEVERITY, ELEVATED_LEVEL, CRITICAL_LEVEL } =
  BudgetWarningConstants;

// Budgets reset on the UTC month, so a new month gets a fresh key and warnings return
export const budgetPeriod = (now = new Date()) =>
  `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

// Keyed per user so people sharing a browser profile never inherit each other's dismissals
export const dismissStorageKey = ({ userId, projectId, scope, period }) =>
  `${DISMISS_STORAGE_PREFIX}.${userId}.${projectId}.${scope}.${period}`;

export const severityForLevel = level => {
  if (level >= CRITICAL_LEVEL) return BUDGET_WARNING_SEVERITY.CRITICAL;
  if (level >= ELEVATED_LEVEL) return BUDGET_WARNING_SEVERITY.ELEVATED;
  return BUDGET_WARNING_SEVERITY.WARNING;
};

// A dismissal holds only up to the level it was made at; a higher level shows again.
// Without a level (older backend) nothing can be tracked, so it shows undismissable.
export const isWarningVisible = ({ shouldWarn, level, dismissedLevel, dismissible }) => {
  if (!shouldWarn) return false;
  if (!dismissible || !level) return true;
  return !(Number(dismissedLevel) >= level);
};

const safeStorage = () => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const readDismissedLevel = key => {
  try {
    const value = Number(safeStorage()?.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
};

export const writeDismissedLevel = (key, level) => {
  try {
    safeStorage()?.setItem(key, String(level));
  } catch {
    // Storage blocked: the in-memory copy still hides it for this session
  }
};

// Drops entries from past periods so dismissals do not pile up month after month
export const pruneStaleDismissals = (period, storage = safeStorage()) => {
  try {
    if (!storage) return;
    const stale = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key?.startsWith(`${DISMISS_STORAGE_PREFIX}.`) && !key.endsWith(`.${period}`)) stale.push(key);
    }
    stale.forEach(key => storage.removeItem(key));
  } catch {
    // Best effort only
  }
};
