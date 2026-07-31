import { useCallback, useMemo, useState } from 'react';

import { useGetBudgetWarningQuery } from '@/api/budgetWarning';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';

/**
 * Whether to warn the user a budget is nearing its limit, above the message input.
 *
 * The banner is dismissed per chat: it stays hidden for the conversation the user closed it
 * in and returns in a new one. A budget only grows, so "dismissed until the period resets"
 * would hide it for the rest of the month.
 */
export const useBudgetWarning = ({ projectId, conversationId } = {}) => {
  const [dismissedIn, setDismissedIn] = useState({});

  const { data: platformSettings } = useGetPlatformSettingsQuery();

  // Observe mode tracks spend without ever blocking, so there is nothing to warn about and
  // no reason to spend a request finding that out
  const isEnforcing = Boolean(platformSettings?.cost_budgets_enforcing);

  const { data } = useGetBudgetWarningQuery({ projectId }, { skip: !isEnforcing || !projectId });

  const dismissKey = conversationId ?? 'new';

  const dismiss = useCallback(() => {
    setDismissedIn(prev => ({ ...prev, [dismissKey]: true }));
  }, [dismissKey]);

  return useMemo(() => {
    const shouldShow = Boolean(data?.should_warn) && !dismissedIn[dismissKey];

    return {
      shouldShow,
      scope: data?.scope,
      percentUsed: data?.percent_used,
      dismiss,
    };
  }, [data, dismissedIn, dismissKey, dismiss]);
};
