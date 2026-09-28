import { useCallback, useEffect, useMemo, useState } from 'react';

import { useGetBudgetWarningQuery } from '@/[fsd]/features/chat/api/budgetWarningApi';
import { BudgetWarningHelpers } from '@/[fsd]/features/chat/lib/helpers';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';

const {
  budgetPeriod,
  dismissStorageKey,
  isWarningVisible,
  pruneStaleDismissals,
  readDismissedLevel,
  severityForLevel,
  writeDismissedLevel,
} = BudgetWarningHelpers;

let prunedForPeriod = null;

// Whether to warn that a budget is nearing its limit; a dismissal lasts until the next level or period
export const useBudgetWarning = ({ projectId } = {}) => {
  const { data: platformSettings } = useGetPlatformSettingsQuery();

  // Observe mode tracks spend without ever blocking, so there is nothing to warn about
  const isEnforcing = Boolean(platformSettings?.cost_budgets_enforcing);
  const dismissible = platformSettings?.cost_budgets_warning_dismissible !== false;

  // Re-ask on mount once the backend's 60s cache could have moved, so a newly crossed level shows
  const { data } = useGetBudgetWarningQuery(
    { projectId },
    { skip: !isEnforcing || !projectId, refetchOnMountOrArgChange: 60 },
  );

  const period = budgetPeriod();
  const storageKey = data?.scope ? dismissStorageKey({ projectId, scope: data.scope, period }) : null;

  // In-memory mirror, so a dismissal still holds when storage is blocked
  const [dismissedByKey, setDismissedByKey] = useState({});

  useEffect(() => {
    if (prunedForPeriod === period) return;
    prunedForPeriod = period;
    pruneStaleDismissals(period);
  }, [period]);

  const dismissedLevel = storageKey ? (dismissedByKey[storageKey] ?? readDismissedLevel(storageKey)) : null;

  const level = data?.level;

  const dismiss = useCallback(() => {
    if (!dismissible || !storageKey || !level) return;
    writeDismissedLevel(storageKey, level);
    setDismissedByKey(prev => ({ ...prev, [storageKey]: level }));
  }, [dismissible, storageKey, level]);

  return useMemo(
    () => ({
      shouldShow: isWarningVisible({ shouldWarn: data?.should_warn, level, dismissedLevel, dismissible }),
      scope: data?.scope,
      percentUsed: data?.percent_used,
      level,
      severity: severityForLevel(level),
      dismissible,
      dismiss,
    }),
    [data, level, dismissedLevel, dismissible, dismiss],
  );
};
