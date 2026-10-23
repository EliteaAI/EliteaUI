import { memo } from 'react';

import { useBudgetWarning } from '@/[fsd]/features/chat/lib/hooks';
import { BudgetWarningConstants } from '@/[fsd]/shared/lib/constants';

import BudgetWarningBanner from './BudgetWarningBanner';

const { WEB_SEARCH_FEATURE } = BudgetWarningConstants;

// Web Search limit warning, shown only while the conversation has Web Search on
const WebSearchBudgetWarning = memo(props => {
  const { projectId, internalTools = [] } = props;

  const warning = useBudgetWarning({
    projectId,
    feature: WEB_SEARCH_FEATURE.feature,
    enabled: internalTools.includes(WEB_SEARCH_FEATURE.tool),
  });

  if (!warning.shouldShow) return null;

  return (
    <BudgetWarningBanner
      scope={warning.scope}
      percentUsed={warning.percentUsed}
      severity={warning.severity}
      dismissible={warning.dismissible}
      onDismiss={warning.dismiss}
      featureLabel={WEB_SEARCH_FEATURE.label}
    />
  );
});

WebSearchBudgetWarning.displayName = 'WebSearchBudgetWarning';

export default WebSearchBudgetWarning;
