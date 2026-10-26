import { memo } from 'react';

import { toExecutionTypeRow } from '@/[fsd]/entities/run-history';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';
import { RunHistoryPage } from '@/[fsd]/widgets/run-history-page';
import RouteDefinitions from '@/routes';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const PipelineRunHistory = memo(() => (
  <RunHistoryPage
    source={ParticipantEntityTypes.Pipeline}
    detailRoute={RouteDefinitions.PipelineDetail}
    analyticsRoute={RouteDefinitions.PipelineRunAnalytics}
    eventColumnLabel="Execution type"
    decorateRow={toExecutionTypeRow}
    scheduleEntityType="pipeline"
  />
));

PipelineRunHistory.displayName = 'PipelineRunHistory';

export default PipelineRunHistory;
