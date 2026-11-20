import { memo, useCallback } from 'react';

import { useLocation, useMatch, useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import HelpCenterIcon from '@/assets/help-center.svg?react';
import RouteDefinitions from '@/routes';

const ResourcesButton = memo(props => {
  const { cell = false } = props;
  const isOnResources = useMatch({ path: RouteDefinitions.HelpCenter });
  const navigate = useNavigate();
  const location = useLocation();

  const handleResourcesClick = useCallback(
    e => {
      e.stopPropagation();
      if (isOnResources) return;
      navigate(RouteDefinitions.HelpCenter, {
        state: { from: location.pathname },
      });
    },
    [isOnResources, navigate, location.pathname],
  );

  const styles = resourcesButtonStyles(!!isOnResources, cell);

  return (
    <StyledTooltip
      placement="top"
      title="Help Center"
      enterDelay={500}
      enterNextDelay={500}
    >
      <Box
        data-tour={SIDEBAR_TOUR_TARGET_IDS.resources}
        onClick={handleResourcesClick}
        sx={styles.container}
      >
        <Box sx={styles.iconButton}>
          <HelpCenterIcon sx={styles.icon} />
        </Box>
      </Box>
    </StyledTooltip>
  );
});

ResourcesButton.displayName = 'ResourcesButton';

/** @type {MuiSx} */
const resourcesButtonStyles = (isActive, cell) => ({
  container: ({ palette }) => ({
    width: '3.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    color: palette.text.metrics,
    ...(cell && { alignSelf: 'stretch' }),
  }),
  // In a footer cell the whole cell is the button
  iconButton: ({ palette }) => ({
    width: cell ? '100%' : '2rem',
    height: cell ? '100%' : '2rem',
    borderRadius: cell ? 0 : '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isActive ? palette.components.sidebar.menuItem.selected : 'transparent',
    '&:hover': {
      backgroundColor: palette.components.sidebar.menuItem.hover,
    },
    '&:active': {
      backgroundColor: palette.components.sidebar.menuItem.selected,
    },
  }),
  icon: {
    fontSize: '1.25rem',
  },
});

export default ResourcesButton;
