import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import RouteDefinitions from '@/routes';

import RunHistoryPage from '../shared/RunHistoryPage';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const PipelineRunHistory = () => (
  <RunHistoryPage
    source={ParticipantEntityTypes.Pipeline}
    detailRoute={RouteDefinitions.PipelineDetail}
  />
);

PipelineRunHistory.displayName = 'PipelineRunHistory';

export default PipelineRunHistory;
