import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import RouteDefinitions from '@/routes';

import RunHistoryPage from '../shared/RunHistoryPage';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const AgentRunHistory = () => (
  <RunHistoryPage
    source={ParticipantEntityTypes.Agent}
    detailRoute={RouteDefinitions.ApplicationsDetail}
  />
);

AgentRunHistory.displayName = 'AgentRunHistory';

export default AgentRunHistory;
