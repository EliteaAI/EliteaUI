import { memo, useCallback, useEffect, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import { SettingsDrawer, SettingsLayoutConstants, SettingsRedirect } from '@/[fsd]/features/settings';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';
import AnalyticsIcon from '@/assets/analytics-icon.svg?react';
import BrainIcon from '@/assets/brain.svg?react';
import CoinIcon from '@/assets/coin-icon.svg?react';
import ConfigurationIcon from '@/assets/configuration-icon.svg?react';
import EnvironmentIcon from '@/assets/environment-icon.svg?react';
import KeyIcon from '@/assets/key-icon.svg?react';
import PersonalizationIcon from '@/assets/personalization-icon.svg?react';
import ReasonIcon from '@/assets/reason-icon.svg?react';
import { PERMISSIONS, PUBLIC_PROJECT_ID } from '@/common/constants';
import BellIcon from '@/components/Icons/BellIcon';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon';
import Lock from '@/components/Icons/Lock.jsx';
import ModelIcon from '@/components/Icons/ModelIcon';
import Person from '@/components/Icons/Person';
import UsersIcon from '@/components/Icons/UsersIcon';
import useCheckPermission from '@/hooks/useCheckPermission';
import { useSelectedProjectId } from '@/hooks/useSelectedProject';
import RouteDefinitions, { PathSessionMap } from '@/routes';

const VALID_TAB_IDS = [
  'ai-providers',
  'prompts',
  'environment',
  'project-general',
  'project-context',
  'tokens',
  'integrations',
  'secrets',
  'users',
  'analytics',
  'usage',
  'profile',
  'preferences',
  'ai-personality',
  'memory',
  'notifications',
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
        id: 'project-general',
        label: 'General',
        icon: <BriefcaseIcon />,
      },
      {
        id: 'ai-providers',
        label: 'AI Providers',
        icon: <ConfigurationIcon />,
      },
      {
        id: 'project-context',
        label: 'Project Context',
        icon: <BriefcaseIcon />,
        permission: PERMISSIONS.projectContext.view,
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
      {
        id: 'usage',
        label: 'Usage',
        icon: <CoinIcon />,
      },
    ],
  },
  {
    section: SETTINGS_SECTIONS.PERSONAL,
    tabs: [
      {
        id: 'profile',
        label: 'Profile',
        icon: <Person />,
      },
      {
        id: 'preferences',
        label: 'Preferences',
        icon: <PersonalizationIcon />,
      },
      {
        id: 'ai-personality',
        label: 'AI Personality',
        icon: <ReasonIcon />,
      },
      {
        id: 'memory',
        label: 'Memory',
        icon: <BrainIcon />,
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
    ],
  },
];

const DEFAULT_TAB = 'project-general';
const LEGACY_TAB_REDIRECTS = ['configuration', 'information'];

const Settings = memo(() => {
  const navigate = useNavigate();
  const projectId = useSelectedProjectId();

  const styles = settingsPageStyles();

  const { state: locationState, pathname } = useLocation();

  const user = useSelector(state => state.user);

  const tab =
    VALID_TAB_IDS.find(id => pathname.startsWith(`${RouteDefinitions.Settings}/${id}`)) ?? DEFAULT_TAB;

  const { checkPermission } = useCheckPermission();
  const { data: platformSettings } = useGetPlatformSettingsQuery();

  const isPrivateProject = projectId == user.personal_project_id;
  const showUsersSection = !isPrivateProject;

  const sections = useMemo(
    () =>
      SETTINGS_TABS_CONFIG.map(section => ({
        ...section,
        tabs: section.tabs
          .filter(tabItem => VALID_TAB_IDS.includes(tabItem.id))
          .filter(item => {
            if (!checkPermission(item.permission)) return false;
            if (item.publicOnly) return projectId == PUBLIC_PROJECT_ID;
            if (item.id === 'project-context') return projectId !== PUBLIC_PROJECT_ID;
            if (item.id === 'analytics' && platformSettings?.analytics_enabled === false) return false;
            if (item.id === 'usage' && !platformSettings?.cost_budgets_enabled) return false;
            if (item.id === 'users' && !showUsersSection) return false;

            return true;
          }),
      })).filter(section => section.tabs.length > 0),
    [
      checkPermission,
      projectId,
      platformSettings?.analytics_enabled,
      platformSettings?.cost_budgets_enabled,
      showUsersSection,
    ],
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

  // Guard: hide Project Context for the Public project
  useEffect(() => {
    if (tab === 'project-context' && projectId == PUBLIC_PROJECT_ID) {
      navigate(`${RouteDefinitions.Settings}/${DEFAULT_TAB}`, { replace: true });
    }
  }, [navigate, projectId, tab]);

  // Guard: hide Users for private projects
  useEffect(() => {
    if (tab === 'users' && !showUsersSection) {
      handleSettingsItemClick(DEFAULT_TAB);
    }
  }, [handleSettingsItemClick, showUsersSection, tab]);

  // Guard: redirect away from analytics if disabled at platform level
  useEffect(() => {
    if (tab === 'analytics' && platformSettings?.analytics_enabled === false) {
      handleSettingsItemClick(DEFAULT_TAB);
    }
  }, [handleSettingsItemClick, platformSettings, tab]);

  // Guard: redirect away from usage when cost tracking is off (wait for settings to load)
  useEffect(() => {
    if (tab === 'usage' && platformSettings && !platformSettings.cost_budgets_enabled) {
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
