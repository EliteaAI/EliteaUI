import { memo } from 'react';

import { toExecutionTypeRow } from '@/[fsd]/entities/run-history/lib/helpers';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { RunHistoryPage } from '@/[fsd]/widgets/run-history-page';
import RouteDefinitions from '@/routes';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const AgentRunHistory = memo(() => (
  <RunHistoryPage
    source={ParticipantEntityTypes.Agent}
    detailRoute={RouteDefinitions.ApplicationsDetail}
    analyticsRoute={RouteDefinitions.ApplicationsRunAnalytics}
    eventColumnLabel="Execution type"
    decorateRow={toExecutionTypeRow}
    scheduleEntityType="agent"
  />
));

AgentRunHistory.displayName = 'AgentRunHistory';

export default AgentRunHistory;
