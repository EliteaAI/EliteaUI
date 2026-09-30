import { memo } from 'react';

import { RunAnalyticsContainer } from '@/[fsd]/features/settings/ui/analytics';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const PipelineRunAnalytics = memo(() => <RunAnalyticsContainer source={ParticipantEntityTypes.Pipeline} />);

PipelineRunAnalytics.displayName = 'PipelineRunAnalytics';

export default PipelineRunAnalytics;
