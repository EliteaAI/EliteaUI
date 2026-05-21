import { memo, useCallback } from 'react';

import { useLocation, useMatch, useNavigate } from 'react-router-dom';

import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import ResourcesIcon from '@/assets/resources-icon.svg?react';
import RouteDefinitions from '@/routes';

import SidebarButton from './SidebarButton';

const ResourcesButton = memo(() => {
  const isOnResources = useMatch({ path: RouteDefinitions.Resources });
  const navigate = useNavigate();
  const location = useLocation();

  const handleResourcesClick = useCallback(() => {
    if (isOnResources) {
      return;
    }

    navigate(RouteDefinitions.Resources, {
      state: { from: location.pathname },
    });
  }, [isOnResources, navigate, location.pathname]);

  const styles = resourcesButtonStyles();

  return (
    <SidebarButton
      icon={<ResourcesIcon style={styles.icon} />}
      label="Resources"
      tooltip="Resources"
      tourId={SIDEBAR_TOUR_TARGET_IDS.resources}
      onClick={handleResourcesClick}
      isActive={!!isOnResources}
    />
  );
});

ResourcesButton.displayName = 'ResourcesButton';

/** @type {MuiSx} */
const resourcesButtonStyles = () => ({
  icon: {
    width: '1rem',
    height: '1rem',
  },
});

export default ResourcesButton;
