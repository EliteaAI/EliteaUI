import { memo, useCallback } from 'react';

import { useLocation, useMatch, useNavigate } from 'react-router-dom';

import AgentStudioIcon from '@/assets/agent-studio-icon.svg?react';
import RouteDefinitions from '@/routes';

import SidebarButton from './SidebarButton';

const AgentsStudioButton = memo(() => {
  const isOnAgentStudio = useMatch({ path: RouteDefinitions.AgentStudio });
  const navigate = useNavigate();
  const location = useLocation();

  const handleAgentStudioClick = useCallback(() => {
    if (isOnAgentStudio) {
      return;
    }

    // Navigate to Agent Studio page, preserving current location in state
    navigate(RouteDefinitions.AgentStudio, {
      state: { from: location.pathname },
    });
  }, [isOnAgentStudio, navigate, location.pathname]);

  return (
    <SidebarButton
      icon={<AgentStudioIcon sx={styles.icon} />}
      label="Agents Studio"
      tooltip="Agents Studio"
      onClick={handleAgentStudioClick}
      isActive={!!isOnAgentStudio}
    />
  );
});

AgentsStudioButton.displayName = 'AgentsStudioButton';

const styles = {
  icon: {
    fontSize: '1rem',
  },
};

export default AgentsStudioButton;
