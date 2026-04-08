import { memo, useCallback } from 'react';

import { useMatch } from 'react-router-dom';

import ConfigurationIcon from '@/assets/gear-icon.svg?react';
import RouteDefinitions from '@/routes';

import SidebarButton from './SidebarButton';

const SettingsButton = memo(props => {
  const { navigateToPage } = props;

  const isOnSettings = useMatch({ path: RouteDefinitions.SettingsWithTab });

  // Direct navigation to Model Configuration page when Settings is clicked
  const handleSettingsClick = useCallback(() => {
    navigateToPage(`${RouteDefinitions.Settings}/model-configuration`, 'Settings')();
  }, [navigateToPage]);

  return (
    <SidebarButton
      icon={<ConfigurationIcon sx={styles.icon} />}
      label="Settings"
      tooltip="Settings"
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
