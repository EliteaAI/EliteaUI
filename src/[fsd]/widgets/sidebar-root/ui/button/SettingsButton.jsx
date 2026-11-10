import { memo, useCallback, useMemo } from 'react';

import { useMatch } from 'react-router-dom';

import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import ConfigurationIcon from '@/assets/gear-icon.svg?react';
import RouteDefinitions from '@/routes';

import SidebarButton from './SidebarButton';

const SettingsButton = memo(props => {
  const { navigateToPage } = props;

  const isOnSettings = useMatch({ path: RouteDefinitions.SettingsWithTab });

  // Direct navigation to Model Configuration page when Settings is clicked
  const settingsPath = RouteDefinitions.SettingsWithTab.replace(':tab', 'project-general');
  const linkState = useMemo(
    () => ({ routeStack: [{ breadCrumb: 'Settings', pagePath: settingsPath }] }),
    [settingsPath],
  );

  const handleSettingsClick = useCallback(
    event => {
      // The link is only a carrier for the href; a plain click keeps the existing guarded navigation
      event.preventDefault();
      navigateToPage(settingsPath, 'Settings')();
    },
    [navigateToPage, settingsPath],
  );

  return (
    <SidebarButton
      icon={<ConfigurationIcon sx={styles.icon} />}
      label="Settings"
      tooltip="Settings"
      tourId={SIDEBAR_TOUR_TARGET_IDS.settings}
      to={settingsPath}
      linkState={linkState}
      onClick={handleSettingsClick}
      isActive={!!isOnSettings}
    />
  );
});

SettingsButton.displayName = 'SettingsButton';

const styles = {
  icon: {
    fontSize: '1rem',
  },
};

export default SettingsButton;
