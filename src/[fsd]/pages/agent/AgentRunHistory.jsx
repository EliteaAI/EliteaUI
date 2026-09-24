import { memo } from 'react';

import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { RunHistoryPage } from '@/[fsd]/widgets/run-history-page';
import RouteDefinitions from '@/routes';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const AgentRunHistory = memo(() => (
  <RunHistoryPage
    source={ParticipantEntityTypes.Agent}
    detailRoute={RouteDefinitions.ApplicationsDetail}
  />
));

AgentRunHistory.displayName = 'AgentRunHistory';

export default AgentRunHistory;
