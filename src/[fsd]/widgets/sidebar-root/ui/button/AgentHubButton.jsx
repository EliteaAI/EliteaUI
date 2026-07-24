import { memo, useCallback } from 'react';

import { useSelector } from 'react-redux';
import { useLocation, useMatch, useNavigate } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import agentHubIconRaw from '@/assets/agent-hub-icon.svg?raw';
import RouteDefinitions from '@/routes';

const agentHubIconMask = `url("data:image/svg+xml,${encodeURIComponent(agentHubIconRaw)}")`;

const AgentHubButton = memo(() => {
  const isOnAgentHub = useMatch({ path: RouteDefinitions.EliteaCatalog });
  const navigate = useNavigate();
  const location = useLocation();
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);

  const handleAgentHubClick = useCallback(() => {
    if (isOnAgentHub) return;
    navigate(RouteDefinitions.EliteaCatalog, {
      state: { from: location.pathname },
    });
  }, [isOnAgentHub, navigate, location.pathname]);

  const styles = agentHubButtonStyles(sideBarCollapsed, !!isOnAgentHub);

  return (
    <StyledTooltip
      placement="right"
      title={sideBarCollapsed ? 'Catalog' : ''}
      enterDelay={500}
      enterNextDelay={500}
    >
      <Box
        data-testid="sidebar-agent-hub-button"
        data-tour={SIDEBAR_TOUR_TARGET_IDS.agentHub}
        onClick={handleAgentHubClick}
        sx={styles.container}
      >
        <Box sx={styles.icon} />
        {!sideBarCollapsed && (
          <Typography
            component="div"
            variant="labelSmall"
            sx={styles.label}
          >
            Catalog
          </Typography>
        )}
      </Box>
    </StyledTooltip>
  );
});

AgentHubButton.displayName = 'AgentHubButton';

/** @type {MuiSx} */
const agentHubButtonStyles = (sideBarCollapsed, isActive) => ({
  container: ({ palette }) => ({
    width: sideBarCollapsed ? '2rem' : '100%',
    height: '2rem',
    padding: sideBarCollapsed ? '0.5rem 0' : '0.5rem',
    borderRadius: '0.5rem',
    background: isActive
      ? palette.background.button.agentHub.active
      : palette.background.button.agentHub.default,
    boxShadow: isActive
      ? palette.background.button.agentHub.shadowActive
      : palette.background.button.agentHub.shadowDefault,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: sideBarCollapsed ? 'center' : 'flex-start',
    flexDirection: 'row',
    gap: '0.5rem',
    alignItems: 'center',
    boxSizing: 'border-box',
    '&:hover': {
      background: palette.background.button.agentHub.hover,
      boxShadow: palette.background.button.agentHub.shadowHover,
    },
  }),
  icon: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
    background: palette.background.button.agentHub.iconGradient,
    WebkitMaskImage: agentHubIconMask,
    maskImage: agentHubIconMask,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
  }),
  label: ({ palette }) => ({
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    background: palette.background.button.agentHub.textGradient,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    textAlign: 'left',
  }),
});

export default AgentHubButton;
