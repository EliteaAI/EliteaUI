import { memo, useCallback } from 'react';

import { useLocation, useMatch, useNavigate } from 'react-router-dom';

import LampIcon from '@/assets/lamp-icon.svg?react';
import RouteDefinitions from '@/routes';

import SidebarButton from './SidebarButton';

const TipsButton = memo(() => {
  const isOnTips = useMatch({ path: RouteDefinitions.Tips });
  const navigate = useNavigate();
  const location = useLocation();

  const handleTipsClick = useCallback(() => {
    if (isOnTips) {
      return;
    }

    // Navigate to tips page, preserving current location in state
    navigate(RouteDefinitions.Tips, {
      state: { from: location.pathname },
    });
  }, [isOnTips, navigate, location.pathname]);

  return (
    <SidebarButton
      icon={<LampIcon sx={styles.icon} />}
      label="Tips"
      tooltip="Tips"
      onClick={handleTipsClick}
      isActive={!!isOnTips}
    />
  );
});

TipsButton.displayName = 'TipsButton';

const styles = {
  icon: {
    fontSize: '1rem',
  },
};

export default TipsButton;
