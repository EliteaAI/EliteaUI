import { memo } from 'react';

import { AgentsTab } from '@/[fsd]/features/agent-hub/ui';

const AgentHub = memo(() => {
  return <AgentsTab />;
});

AgentHub.displayName = 'AgentHub';

export default AgentHub;
