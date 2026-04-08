import { memo, useCallback, useEffect, useMemo } from 'react';

import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { SettingsLayoutConstants } from '@/[fsd]/features/settings/lib/constants';
import { SettingsDrawer, SettingsRedirect } from '@/[fsd]/features/settings/ui/settings-drawer';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';
import AnalyticsIcon from '@/assets/analytics-icon.svg?react';
import ConfigurationIcon from '@/assets/configuration-icon.svg?react';
import EnvironmentIcon from '@/assets/environment-icon.svg?react';
import KeyIcon from '@/assets/key-icon.svg?react';
import { PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';
import Lock from '@/components/Icons/Lock.jsx';
import ModelIcon from '@/components/Icons/ModelIcon';
import UsersIcon from '@/components/Icons/UsersIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions, { PathSessionMap } from '@/routes';

const VALID_TAB_IDS = [
  'model-configuration',
  'prompts',
  'environment',
  'tokens',
  'integrations',
  'secrets',
  'users',
  'analytics',
];

const SETTINGS_TABS_CONFIG = [
  {
    id: 'model-configuration',
    label: 'AI Configuration',
    icon: <ConfigurationIcon />,
  },
  {
    id: 'prompts',
    label: 'Service Prompts',
    icon: <ModelIcon />,
  },
  {
    id: 'environment',
    label: 'Environment',
    icon: <EnvironmentIcon />,
  },
  {
    id: 'tokens',
    label: 'Personal Tokens',
    icon: <KeyIcon />,
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
].filter(tab => VALID_TAB_IDS.includes(tab.id));

const DEFAULT_TAB = 'model-configuration';
const LEGACY_TAB_REDIRECTS = ['configuration', 'information'];

const Settings = memo(() => {
  const navigate = useNavigate();
  const styles = settingsPageStyles();
  const { state: locationState } = useLocation();
  const { tab = DEFAULT_TAB } = useParams();
  const projectId = useSelectedProjectId();
  const { checkPermission } = useCheckPermission();
  const { data: platformSettings } = useGetPlatformSettingsQuery();

  const tabs = useMemo(
    () =>
      SETTINGS_TABS_CONFIG.filter(item => {
        if (!checkPermission(item.permission)) return false;
        if (item.id === 'prompts' || item.id === 'environment') return projectId == PUBLIC_PROJECT_ID;
        if (item.id === 'analytics' && platformSettings?.analytics_enabled === false) return false;
        return true;
      }),
    [checkPermission, projectId, platformSettings],
  );

  const handleSettingsItemClick = useCallback(
    tabId => {
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
    [navigate, locationState],
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
          tabs={tabs}
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
