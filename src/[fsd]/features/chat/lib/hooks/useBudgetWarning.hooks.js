import { useCallback, useEffect, useMemo, useState } from 'react';

import { useSelector } from 'react-redux';

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

const BUDGET_WARNING_POLL_MS = 60_000;

let prunedForPeriod = null;

// Whether to warn that a budget is nearing its limit; a dismissal lasts until the next level or period
export const useBudgetWarning = ({ projectId } = {}) => {
  const { data: platformSettings } = useGetPlatformSettingsQuery();
  const userId = useSelector(state => state.user.id);

  // Observe mode tracks spend without ever blocking, so there is nothing to warn about
  const isEnforcing = Boolean(platformSettings?.cost_budgets_enforcing);
  const dismissibleByAdmin = platformSettings?.cost_budgets_warning_dismissible !== false;

  // Polls at the backend's 60s cache interval, so a level crossed while a chat stays open still shows.
  // currentData, not data: after a project switch data still holds the previous project's warning.
  const { currentData: data } = useGetBudgetWarningQuery(
    { projectId },
    {
      skip: !isEnforcing || !projectId,
      refetchOnMountOrArgChange: 60,
      pollingInterval: BUDGET_WARNING_POLL_MS,
      skipPollingIfUnfocused: true,
    },
  );

  const period = budgetPeriod();
  const storageKey =
    data?.scope && userId ? dismissStorageKey({ userId, projectId, scope: data.scope, period }) : null;

  // In-memory mirror, so a dismissal still holds when storage is blocked
  const [dismissedByKey, setDismissedByKey] = useState({});

  useEffect(() => {
    if (prunedForPeriod === period) return;
    prunedForPeriod = period;
    pruneStaleDismissals(period);
  }, [period]);

  // ChatBox re-renders per streamed token, so storage is read only when the key changes
  const storedLevel = useMemo(() => (storageKey ? readDismissedLevel(storageKey) : null), [storageKey]);
  const dismissedLevel = storageKey ? (dismissedByKey[storageKey] ?? storedLevel) : null;

  const level = data?.level;
  const dismissible = dismissibleByAdmin && Boolean(level) && Boolean(storageKey);

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
