import { memo } from 'react';

import { RunAnalyticsContainer } from '@/[fsd]/features/settings/ui/analytics';
import { ParticipantEntityConstants } from '@/[fsd]/shared/lib/constants';

const { ParticipantEntityTypes } = ParticipantEntityConstants;

const AgentRunAnalytics = memo(() => <RunAnalyticsContainer source={ParticipantEntityTypes.Agent} />);

AgentRunAnalytics.displayName = 'AgentRunAnalytics';

export default AgentRunAnalytics;
