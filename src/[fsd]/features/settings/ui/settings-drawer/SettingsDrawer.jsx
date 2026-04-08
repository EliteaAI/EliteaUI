import React, { useCallback, useMemo } from 'react';

import { useLocation } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import { SettingsLayoutConstants } from '@/[fsd]/features/settings/lib/constants';
import AnalyticsIcon from '@/assets/analytics-icon.svg?react';
import ConfigurationIcon from '@/assets/configuration-icon.svg?react';
import KeyIcon from '@/assets/key-icon.svg?react';
import EnvironmentIcon from '@/assets/new-environment-icon.svg?react';
import PromptIcon from '@/assets/prompt.svg?react';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon';
import IntegrationIcon from '@/components/Icons/IntegrationIcon';
import Lock from '@/components/Icons/Lock.jsx';
import ModelIcon from '@/components/Icons/ModelIcon';
import UsersIcon from '@/components/Icons/UsersIcon';

const ICON_COMPONENTS = {
  'model-configuration': ConfigurationIcon,
  tokens: KeyIcon,
  integrations: IntegrationIcon,
  environment: EnvironmentIcon,
  secrets: Lock,
  projects: BriefcaseIcon,
  users: UsersIcon,
  prompts: PromptIcon,
  analytics: AnalyticsIcon,
};

const getIconComponent = tabId => {
  return ICON_COMPONENTS[tabId] || ModelIcon;
};

const SettingsDrawer = props => {
  const { tabs, onItemClick } = props;
  const styles = getStyles();
  const location = useLocation();

  const isActiveTab = useCallback(
    tabId => {
      if (!tabId) return false;

      const pathSegments = location.pathname.split('/');
      const lastSegment = pathSegments[pathSegments.length - 1];

      if (tabId === 'information' && (lastSegment === 'settings' || lastSegment === 'system')) {
        return true;
      }
      if (
        tabId === 'model-configuration' &&
        (lastSegment === 'create-integration' ||
          pathSegments[pathSegments.length - 2] === 'create-integration')
      ) {
        return true;
      }
      if (tabId === 'tokens' && lastSegment === 'create-personal-token') {
        return true;
      }
      return lastSegment === tabId;
    },
    [location.pathname],
  );

  const handleItemClick = useCallback(
    tabId => {
      onItemClick?.(tabId);
    },
    [onItemClick],
  );

  const renderedTabs = useMemo(
    () =>
      tabs.map(tab => {
        const IconComponent = getIconComponent(tab.id);
        const isActive = isActiveTab(tab.id);
        return (
          <Box
            key={tab.id}
            onClick={() => handleItemClick(tab.id)}
            sx={styles.menuItem(isActive)}
          >
            <Box sx={styles.iconWrapper(isActive)}>
              <IconComponent />
            </Box>
            <Typography
              variant="labelSmall"
              sx={styles.menuItemText(isActive)}
            >
              {tab.label}
            </Typography>
          </Box>
        );
      }),
    [tabs, isActiveTab, styles, handleItemClick],
  );

  return (
    <Box sx={styles.drawer}>
      <Box sx={styles.header}>
        <Typography
          variant="headingSmall"
          sx={styles.headerText}
        >
          Settings
        </Typography>
      </Box>

      <Box sx={styles.menuContainer}>{renderedTabs}</Box>
    </Box>
  );
};

SettingsDrawer.displayName = 'SettingsDrawer';

/**
 * @type {MuiSx}
 */
const getStyles = () => ({
  drawer: ({ palette }) => ({
    width: SettingsLayoutConstants.SETTINGS_LAYOUT.DRAWER_WIDTH,
    minWidth: SettingsLayoutConstants.SETTINGS_LAYOUT.DRAWER_WIDTH,
    maxWidth: SettingsLayoutConstants.SETTINGS_LAYOUT.DRAWER_WIDTH,
    borderRight: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.tabPanel,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxSizing: 'border-box',
  }),

  header: ({ palette }) => ({
    padding: '1rem 1rem 1.1875rem 1.5rem',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
  }),

  headerText: ({ palette }) => ({
    color: palette.text.secondary,
  }),

  menuContainer: {
    paddingTop: '.5rem',
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: '1rem',
    paddingRight: '1rem',
    boxSizing: 'border-box',
    gap: '0.5rem',
    maxWidth: '100%',
  },

  menuItem:
    isActive =>
    ({ palette }) => ({
      padding: '0.5rem 1rem',
      gap: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      width: '100%',
      maxWidth: '100%',
      height: '2rem',
      background: isActive
        ? palette.background.userInputBackgroundActive
        : palette.background.conversation.normal,
      borderRadius: '0.375rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease-in-out',
      boxSizing: 'border-box',
      '&:hover': {
        backgroundColor: palette.background.conversation.hover,
      },
    }),

  iconWrapper:
    isActive =>
    ({ palette }) => ({
      display: 'flex',
      alignItems: 'center',
      minWidth: '0.875rem',
      color: isActive ? palette.text.secondary : palette.icon.fill.stateButtonHover,
      '& svg': {
        fill: isActive ? palette.text.secondary : palette.icon.fill.stateButtonHover,
        width: '0.875rem',
        height: '0.875rem',
      },
    }),

  icon: {
    fontSize: '0.875rem',
  },

  menuItemText:
    isActive =>
    ({ palette }) => ({
      color: isActive ? palette.text.secondary : palette.text.metrics,
    }),
});

export default React.memo(SettingsDrawer);
