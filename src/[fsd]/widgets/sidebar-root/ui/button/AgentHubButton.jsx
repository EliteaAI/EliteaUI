import { memo, useCallback } from 'react';

import { useLocation, useMatch, useNavigate } from 'react-router-dom';

import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import AgentStudioIcon from '@/assets/agent-hub-icon.svg?react';
import RouteDefinitions from '@/routes';

import SidebarButton from './SidebarButton';

const AgentHubButton = memo(() => {
  const isOnAgentHub = useMatch({ path: RouteDefinitions.AgentHub });
  const navigate = useNavigate();
  const location = useLocation();

  const handleAgentHubClick = useCallback(() => {
    if (isOnAgentHub) {
      return;
    }

    navigate(RouteDefinitions.AgentHub, {
      state: { from: location.pathname },
    });
  }, [isOnAgentHub, navigate, location.pathname]);

  return (
    <SidebarButton
      icon={<AgentStudioIcon sx={styles.icon} />}
      label="Agent HUB"
      tooltip="Agent HUB"
      tourId={SIDEBAR_TOUR_TARGET_IDS.agentHub}
      onClick={handleAgentHubClick}
      isActive={!!isOnAgentHub}
    />
  );
});

AgentHubButton.displayName = 'AgentHubButton';

const styles = {
  icon: {
    fontSize: '1rem',
  },
};

export default AgentHubButton;
