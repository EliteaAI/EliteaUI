import { memo, useCallback, useEffect, useMemo } from 'react';

import { useDispatch } from 'react-redux';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { SettingsLayoutConstants } from '@/[fsd]/features/settings/lib/constants';
import { SettingsDrawer, SettingsRedirect } from '@/[fsd]/features/settings/ui/settings-drawer';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';
import AnalyticsIcon from '@/assets/analytics-icon.svg?react';
import ConfigurationIcon from '@/assets/configuration-icon.svg?react';
import EnvironmentIcon from '@/assets/environment-icon.svg?react';
import KeyIcon from '@/assets/key-icon.svg?react';
import LogoutIcon from '@/assets/logout-icon.svg?react';
import PersonalizationIcon from '@/assets/personalization-icon.svg?react';
import { PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';
import BellIcon from '@/components/Icons/BellIcon';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon';
import Lock from '@/components/Icons/Lock.jsx';
import ModelIcon from '@/components/Icons/ModelIcon';
import UsersIcon from '@/components/Icons/UsersIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions, { PathSessionMap } from '@/routes';
import { logout } from '@/slices/user.js';

const VALID_TAB_IDS = [
  'model-configuration',
  'prompts',
  'environment',
  'project-params',
  'tokens',
  'integrations',
  'secrets',
  'users',
  'analytics',
  'personalization',
  'notifications',
  'logout',
];

const SETTINGS_SECTIONS = {
  PROJECT: 'PROJECT',
  PERSONAL: 'PERSONAL',
};

const SETTINGS_TABS_CONFIG = [
  {
    section: SETTINGS_SECTIONS.PROJECT,
    tabs: [
      {
        id: 'model-configuration',
        label: 'AI Configuration',
        icon: <ConfigurationIcon />,
      },
      {
        id: 'prompts',
        label: 'Service Prompts',
        icon: <ModelIcon />,
        publicOnly: true,
      },
      {
        id: 'environment',
        label: 'Environment',
        icon: <EnvironmentIcon />,
        publicOnly: true,
      },
      {
        id: 'project-params',
        label: 'Project Params',
        icon: <BriefcaseIcon />,
        permission: PERMISSIONS.projectContext.view,
      },
      {
        id: 'secrets',
        label: 'Secrets',
        icon: <Lock />,
        permission: PERMISSIONS.secrets.list,
      },
      {
        id: 'users',
        label: 'Users',
        icon: <UsersIcon />,
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: <AnalyticsIcon />,
      },
    ],
  },
  {
    section: SETTINGS_SECTIONS.PERSONAL,
    tabs: [
      {
        id: 'personalization',
        label: 'Personalization',
        icon: <PersonalizationIcon />,
      },
      {
        id: 'tokens',
        label: 'Personal Tokens',
        icon: <KeyIcon />,
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: <BellIcon />,
      },
      {
        id: 'logout',
        label: 'Log out',
        icon: <LogoutIcon />,
        isAction: true,
      },
    ],
  },
];

const DEFAULT_TAB = 'model-configuration';
const LEGACY_TAB_REDIRECTS = ['configuration', 'information'];

const Settings = memo(() => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const styles = settingsPageStyles();
  const { state: locationState } = useLocation();
  const { tab = DEFAULT_TAB } = useParams();
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const { data: platformSettings } = useGetPlatformSettingsQuery();

  const sections = useMemo(
    () =>
      SETTINGS_TABS_CONFIG.map(section => ({
        ...section,
        tabs: section.tabs
          .filter(tabItem => VALID_TAB_IDS.includes(tabItem.id))
          .filter(item => {
            if (!checkPermission(item.permission)) return false;
            if (item.publicOnly) return projectId == PUBLIC_PROJECT_ID;
            if (item.id === 'project-params') return projectId !== PUBLIC_PROJECT_ID;
            if (item.id === 'analytics' && platformSettings?.analytics_enabled === false) return false;
            return true;
          }),
      })).filter(section => section.tabs.length > 0),
    [checkPermission, projectId, platformSettings],
  );

  const onLogout = useCallback(() => {
    dispatch(logout());
    window.location.href = window.location.origin.toString() + '/forward-auth/logout';
  }, [dispatch]);

  const handleSettingsItemClick = useCallback(
    tabId => {
      // Find the tab config to check for actions
      const tabConfig = SETTINGS_TABS_CONFIG.flatMap(s => s.tabs).find(t => t.id === tabId);

      if (tabConfig?.isAction && tabId === 'logout') {
        onLogout();
        return;
      }

      const pagePath = `${RouteDefinitions.Settings}/${tabId}`;
      navigate(pagePath, {
        state: locationState || {
          routeStack: [
            {
              pagePath,
              breadCrumb: PathSessionMap[RouteDefinitions.Settings],
            },
          ],
        },
      });
    },
    [navigate, locationState, onLogout],
  );

  // Handle legacy route redirects
  useEffect(() => {
    if (LEGACY_TAB_REDIRECTS.includes(tab)) {
      handleSettingsItemClick(DEFAULT_TAB);
    }
  }, [tab, handleSettingsItemClick]);

  // Guard: hide Service Prompts and Environment for non-Public projects
  useEffect(() => {
    if ((tab === 'prompts' || tab === 'environment') && projectId != PUBLIC_PROJECT_ID) {
      handleSettingsItemClick(DEFAULT_TAB);
    }
  }, [handleSettingsItemClick, projectId, tab]);

  // Guard: redirect away from analytics if disabled at platform level
  useEffect(() => {
    if (tab === 'analytics' && platformSettings?.analytics_enabled === false) {
      handleSettingsItemClick(DEFAULT_TAB);
    }
  }, [handleSettingsItemClick, platformSettings, tab]);

  // Show redirect component for invalid routes
  if (!tab || !VALID_TAB_IDS.includes(tab)) {
    return <SettingsRedirect />;
  }

  return (
    <Box sx={styles.container}>
      <Box sx={styles.drawer}>
        <SettingsDrawer
          sections={sections}
          activeTab={tab}
          onItemClick={handleSettingsItemClick}
        />
      </Box>
      <Box
        component="main"
        sx={styles.mainContent}
      >
        <Outlet />
      </Box>
    </Box>
  );
});

Settings.displayName = 'Settings';

/** @type {MuiSx} */
const settingsPageStyles = () => ({
  container: {
    display: 'flex',
    height: '100%',
  },
  drawer: ({ palette }) => ({
    width: SettingsLayoutConstants.SETTINGS_LAYOUT.DRAWER_WIDTH,
    flexShrink: 0,
    height: '100%',
    backgroundColor: palette.background.secondary,
    borderRight: `0.0625rem solid ${palette.border.table}`,
    boxSizing: 'border-box',
  }),
  mainContent: ({ palette }) => ({
    flexGrow: 1,
    height: '100%',
    background: palette.background.settingsPage,
    maxWidth: `calc(100% - ${SettingsLayoutConstants.SETTINGS_LAYOUT.DRAWER_WIDTH})`,
    overflow: 'auto',
  }),
});

export default Settings;
