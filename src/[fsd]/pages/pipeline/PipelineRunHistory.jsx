import { memo } from 'react';

import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { RunHistoryPage } from '@/[fsd]/widgets/run-history-page';
import RouteDefinitions from '@/routes';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const PipelineRunHistory = memo(() => (
  <RunHistoryPage
    source={ParticipantEntityTypes.Pipeline}
    detailRoute={RouteDefinitions.PipelineDetail}
  />
));

PipelineRunHistory.displayName = 'PipelineRunHistory';

export default PipelineRunHistory;
