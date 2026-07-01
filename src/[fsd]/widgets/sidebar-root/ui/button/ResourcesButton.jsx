import { memo, useCallback } from 'react';

import { useLocation, useMatch, useNavigate } from 'react-router-dom';

import { Box, Typography } from '@mui/material';
import HelpOutlineRoundedIcon from '@mui/icons-material/HelpOutlineRounded';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import RouteDefinitions from '@/routes';

const ResourcesButton = memo(({ fullWidth = false }) => {
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

  const styles = resourcesButtonStyles(fullWidth, !!isOnResources);

  if (fullWidth) {
    return (
      <StyledTooltip
        placement="right"
        title=""
        enterDelay={500}
        enterNextDelay={500}
      >
        <Box
          data-tour={SIDEBAR_TOUR_TARGET_IDS.resources}
          onClick={handleResourcesClick}
          sx={styles.fullWidthContainer}
        >
          <HelpOutlineRoundedIcon sx={styles.icon} />
          <Typography variant="labelSmall">Help Center</Typography>
        </Box>
      </StyledTooltip>
    );
  }

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
          <HelpOutlineRoundedIcon sx={styles.icon} />
        </Box>
      </Box>
    </StyledTooltip>
  );
});

ResourcesButton.displayName = 'ResourcesButton';

/** @type {MuiSx} */
const resourcesButtonStyles = (fullWidth, isActive) => ({
  container: ({ palette }) => ({
    width: '3.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    color: palette.text.metrics,
  }),
  iconButton: ({ palette }) => ({
    width: '2rem',
    height: '2rem',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isActive
      ? palette.background.button.drawerMenu.selected
      : 'transparent',
    '&:hover': {
      backgroundColor: palette.background.button.drawerMenu.hover,
    },
    '&:active': {
      backgroundColor: palette.background.button.drawerMenu.selected,
    },
  }),
  fullWidthContainer: ({ palette }) => ({
    width: '100%',
    height: '2rem',
    padding: '0.5rem',
    borderRadius: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    boxSizing: 'border-box',
    color: isActive ? palette.text.secondary : palette.text.metrics,
    background: isActive ? palette.background.button.drawerMenu.selected : 'transparent',

    '& .MuiSvgIcon-root': {
      color: isActive ? palette.text.secondary : palette.text.metrics,
    },

    '&:hover': {
      background: palette.background.button.drawerMenu.hover,
    },
  }),
  icon: {
    fontSize: '1.25rem',
  },
});

export default ResourcesButton;
