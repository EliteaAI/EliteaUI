import { memo, useCallback, useMemo } from 'react';

import { useLocation } from 'react-router-dom';

import { Box, Divider, Typography } from '@mui/material';

import { SettingsLayoutConstants } from '@/[fsd]/features/settings/lib/constants';
import AnalyticsIcon from '@/assets/analytics-icon.svg?react';
import ConfigurationIcon from '@/assets/configuration-icon.svg?react';
import KeyIcon from '@/assets/key-icon.svg?react';
import LogoutIcon from '@/assets/logout-icon.svg?react';
import EnvironmentIcon from '@/assets/new-environment-icon.svg?react';
import PersonalizationIcon from '@/assets/personalization-icon.svg?react';
import PromptIcon from '@/assets/prompt.svg?react';
import BellIcon from '@/components/Icons/BellIcon';
import BriefcaseIcon from '@/components/Icons/BriefcaseIcon';
import Lock from '@/components/Icons/Lock.jsx';
import UsersIcon from '@/components/Icons/UsersIcon';

const ICON_COMPONENTS = {
  'model-configuration': ConfigurationIcon,
  prompts: PromptIcon,
  environment: EnvironmentIcon,
  tokens: KeyIcon,
  'project-params': BriefcaseIcon,
  secrets: Lock,
  users: UsersIcon,
  analytics: AnalyticsIcon,
  personalization: PersonalizationIcon,
  notifications: BellIcon,
  logout: LogoutIcon,
};

const getIconComponent = tabId => {
  return ICON_COMPONENTS[tabId] || ConfigurationIcon;
};

const SettingsDrawer = memo(props => {
  const { sections, onItemClick } = props;
  const styles = getStyles();
  const location = useLocation();

  const isActiveTab = useCallback(
    tabId => {
      if (!tabId) return false;

      const pathSegments = location.pathname.split('/');
      const lastSegment = pathSegments[pathSegments.length - 1];

      if (
        tabId === 'model-configuration' &&
        (lastSegment === 'create-configuration' ||
          pathSegments[pathSegments.length - 2] === 'create-configuration')
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

  const renderedSections = useMemo(
    () =>
      sections.map((section, sectionIndex) => (
        <Box
          key={section.section}
          sx={styles.sectionGroup}
        >
          {sectionIndex > 0 && <Divider sx={styles.sectionDivider} />}
          <Box
            component="span"
            sx={styles.sectionHeader}
          >
            {section.section}
          </Box>
          {section.tabs.map(tab => {
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
                <Box
                  component="span"
                  sx={styles.menuItemText(isActive)}
                >
                  {tab.label}
                </Box>
              </Box>
            );
          })}
        </Box>
      )),
    [sections, isActiveTab, styles, handleItemClick],
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

      <Box sx={styles.menuContainer}>{renderedSections}</Box>
    </Box>
  );
});

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
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    maxWidth: '100%',
    overflow: 'auto',
  },

  sectionGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },

  sectionHeader: ({ palette }) => ({
    display: 'block',
    color: palette.text.metrics,
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 500,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '1rem',
  }),

  sectionDivider: ({ palette }) => ({
    borderColor: palette.border.table,
    margin: 0,
  }),

  menuItem:
    isActive =>
    ({ palette }) => ({
      padding: '0.5rem 1rem',
      margin: '0 1rem',
      gap: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      maxWidth: 'calc(100% - 2rem)',
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
      fontFamily: 'Montserrat, sans-serif',
      fontWeight: 500,
      fontSize: '0.75rem',
      lineHeight: '1rem',
      letterSpacing: 0,
      color: isActive ? palette.text.secondary : palette.text.metrics,
    }),
});

export default SettingsDrawer;
