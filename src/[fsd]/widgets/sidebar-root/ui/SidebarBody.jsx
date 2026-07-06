import { Fragment, memo, useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box, Divider, IconButton, Tooltip, Typography } from '@mui/material';

import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours/lib/constants';
import { useIsMcpVisible } from '@/[fsd]/shared/lib/hooks';
import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';
import { SidebarConstants, SocketConstants } from '@/[fsd]/widgets/sidebar-root/lib/constants';
import { useSocketIcon } from '@/[fsd]/widgets/sidebar-root/lib/hooks';
import { Buttons, SidebarMenuItem, SidebarProjectSelect } from '@/[fsd]/widgets/sidebar-root/ui';
import { useGetSupportAssistantConfigQuery } from '@/[fsd]/widgets/support-assistant';
import AppsIcon from '@/assets/applications-icon.svg?react';
import ArtifactsIcon from '@/assets/artifacts-icon.svg?react';
import FlowIcon from '@/assets/flow-icon.svg?react';
import KeyIcon from '@/assets/key-icon.svg?react';
import MCPIcon from '@/assets/mcp-icon.svg?react';
import SkillsIcon from '@/assets/skill-icon.svg?react';
import ToolIcon from '@/assets/tool-icon.svg?react';
import {
  COLLAPSED_SIDE_BAR_WIDTH,
  NAV_BAR_HEIGHT_IN_PX,
  PERMISSION_GROUPS,
  PUBLIC_PROJECT_ID,
  SIDE_BAR_WIDTH,
} from '@/common/constants';
import ApplicationsIcon from '@/components/Icons/ApplicationsIcon';
import ChatIcon from '@/components/Icons/ChatIcon';
import EliteAIcon from '@/components/Icons/EliteAIcon';
import useNavBlocker from '@/hooks/useNavBlocker';
import RouteDefinitions from '@/routes';

const SidebarBody = memo(props => {
  const { onKeyDown, onCollapsed, onToggleAssistant } = props;
  const { pathname } = useLocation();
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const systemSenderName = useSystemSenderName();
  const { publicPermissions = [], permissions = [] } = useSelector(state => state.user);
  const navigate = useNavigate();
  const { isBlockNav, isStreaming, setIsResetApiState, resetApiState } = useNavBlocker();
  const { isSocketIconVisible, socketStatus } = useSocketIcon();
  const { personal_project_id } = useSelector(state => state.user);
  const selectedProjectId = useSelector(state => state.settings.project?.id);
  const isSelectedProjectPublic = selectedProjectId == PUBLIC_PROJECT_ID;
  const isMcpVisible = useIsMcpVisible();

  useGetSupportAssistantConfigQuery();

  const styles = sideBarBodyStyles(sideBarCollapsed, socketStatus);

  const navigateToPage = useCallback(
    (pagePath, breadCrumb) => () => {
      if (!personal_project_id) {
        navigate(RouteDefinitions.Onboarding);
      } else {
        if (pagePath !== pathname) {
          if (isBlockNav || isStreaming) {
            setIsResetApiState(true);
          } else {
            resetApiState();
          }
          navigate(pagePath, {
            state: {
              routeStack: [
                {
                  breadCrumb,
                  pagePath,
                },
              ],
            },
          });
        }
      }
    },
    [isBlockNav, isStreaming, navigate, pathname, personal_project_id, resetApiState, setIsResetApiState],
  );

  const permissionsSet = useMemo(() => new Set(permissions), [permissions]);
  const publicPermissionsSet = useMemo(() => new Set(publicPermissions), [publicPermissions]);

  const selectedItem = useMemo(() => {
    if (pathname === RouteDefinitions.AgentHub) {
      return '';
    }
    const matchedRoute = SidebarConstants.RouteToSideBarItemMap.find(({ route }) =>
      pathname.startsWith(route),
    );
    return matchedRoute?.item;
  }, [pathname]);

  const sections = useMemo(() => {
    const allSections = [
      [
        {
          value: 'chat',
          label: 'Chats',
          icon: <ChatIcon fontSize="1rem" />,
          url: RouteDefinitions.Chat,
          breadCrumb: 'Chats',
          tooltip: 'Chats',
          tourId: SIDEBAR_TOUR_TARGET_IDS.navChat,
        },
        {
          value: 'agents',
          label: 'Agents',
          icon: <ApplicationsIcon />,
          url: RouteDefinitions.Applications,
          breadCrumb: 'Agents',
          tooltip: 'Agents',
          tourId: SIDEBAR_TOUR_TARGET_IDS.navAgents,
        },
        {
          value: 'pipelines',
          label: 'Pipelines',
          icon: <FlowIcon />,
          url: RouteDefinitions.Pipelines,
          breadCrumb: 'Pipelines',
          tooltip: 'Pipelines',
          tourId: SIDEBAR_TOUR_TARGET_IDS.navPipelines,
        },
      ],
      [
        {
          value: 'skills',
          label: 'Skills',
          icon: <SkillsIcon />,
          url: RouteDefinitions.Skills,
          breadCrumb: 'Skills',
          tooltip: 'Skills',
          tourId: SIDEBAR_TOUR_TARGET_IDS.navSkills,
        },
        {
          value: 'toolkits',
          label: 'Toolkits',
          icon: <ToolIcon />,
          url: RouteDefinitions.Toolkits,
          breadCrumb: 'Toolkits',
          tooltip: 'Toolkits',
          tourId: SIDEBAR_TOUR_TARGET_IDS.navToolkits,
        },
        {
          value: 'mcps',
          label: 'MCPs',
          icon: <MCPIcon />,
          url: RouteDefinitions.MCPs,
          breadCrumb: 'MCP',
          tooltip: 'MCP',
          tourId: SIDEBAR_TOUR_TARGET_IDS.navMcps,
        },
        {
          value: 'credentials',
          label: 'Credentials',
          icon: <KeyIcon />,
          url: RouteDefinitions.Credentials,
          breadCrumb: 'Credentials',
          tooltip: 'Credentials',
          tourId: SIDEBAR_TOUR_TARGET_IDS.navCredentials,
        },
        {
          value: 'applications',
          label: 'Applications',
          icon: <AppsIcon />,
          url: RouteDefinitions.Apps,
          breadCrumb: 'Applications',
          tooltip: 'Applications',
          tourId: SIDEBAR_TOUR_TARGET_IDS.navApplications,
        },
      ],
      [
        {
          value: 'artifacts',
          label: 'Artifacts',
          icon: <ArtifactsIcon />,
          url: RouteDefinitions.Artifacts,
          breadCrumb: 'Artifacts',
          tooltip: 'Artifacts',
          tourId: SIDEBAR_TOUR_TARGET_IDS.navArtifacts,
        },
      ],
    ];
    const filteredSections = allSections.map(section => {
      return section.filter(i => {
        if (i.value === 'mcps' && !isMcpVisible) {
          return false;
        }
        if (i.value === 'skills' && isSelectedProjectPublic) {
          return false;
        }
        const perms = i.publicPermission ? publicPermissionsSet : permissionsSet;
        const realValue = i.value === 'mcps' ? 'toolkits' : i.value;
        return PERMISSION_GROUPS[realValue] && PERMISSION_GROUPS[realValue].length
          ? PERMISSION_GROUPS[realValue].some(p => perms.has(p))
          : true;
      });
    });
    return filteredSections.filter(section => section.length > 0);
  }, [permissionsSet, publicPermissionsSet, isMcpVisible, isSelectedProjectPublic]);

  const onClickHomeButton = useCallback(() => {
    onCollapsed?.(!sideBarCollapsed);
  }, [onCollapsed, sideBarCollapsed]);

  return (
    <Box
      role="presentation"
      onKeyDown={onKeyDown}
      sx={styles.container}
    >
      {/* Sticky Top Section */}
      <Box sx={styles.stickyTop}>
        <Box sx={styles.header}>
          <IconButton
            data-tour={SIDEBAR_TOUR_TARGET_IDS.logo}
            data-testid="sidebar-toggle"
            size="large"
            color="inherit"
            aria-label="open drawer"
            onClick={onClickHomeButton}
            sx={styles.homeButton}
          >
            <EliteAIcon sx={styles.eliteaIcon} />
            {isSocketIconVisible && (
              <Tooltip
                title={`${systemSenderName} is ${socketStatus}`}
                placement="right"
              >
                <Box sx={styles.socketIconContainer} />
              </Tooltip>
            )}
          </IconButton>
          {!sideBarCollapsed && <Buttons.NotificationButton />}
        </Box>

        <Divider sx={styles.divider} />

        <SidebarProjectSelect />

        <Divider sx={styles.divider} />

        <Box sx={styles.createSection}>
          <Buttons.CreateEntityButton tourId={SIDEBAR_TOUR_TARGET_IDS.createButton} />
        </Box>

        <Divider sx={styles.divider} />
      </Box>

      {/* Scrollable Content Section */}
      <Box sx={styles.scrollableContent}>
        {sections.map((section, index) => (
          <Fragment key={index}>
            <Box sx={styles.section}>
              {section.map(i => (
                <SidebarMenuItem
                  key={i.value}
                  display={true}
                  menuTitle={i.label}
                  menuIcon={i.icon}
                  selected={i.value === selectedItem}
                  onClick={navigateToPage(i.url, i.breadCrumb)}
                  isPersonalSpace={false}
                  disabled={i.disabled}
                  tooltip={i.tooltip}
                  showLabel={!sideBarCollapsed}
                  tourId={i.tourId}
                />
              ))}
            </Box>
            <Divider sx={styles.sectionDivider} />
          </Fragment>
        ))}

        <Box sx={styles.bottomSection}>
          <Box sx={styles.section}>
            <Buttons.SettingsButton navigateToPage={navigateToPage} />
            <Buttons.AgentHubButton />
          </Box>
        </Box>
      </Box>

      {onToggleAssistant ? (
        <Box sx={styles.footerBlock}>
          <Tooltip
            title={sideBarCollapsed ? 'Support Assistant' : ''}
            placement="left"
          >
            <Box
              data-tour={SIDEBAR_TOUR_TARGET_IDS.supportAssistant}
              sx={styles.assistantBlock}
              onClick={onToggleAssistant}
            >
              {sideBarCollapsed ? null : <Typography component="span">Support Bot</Typography>}
            </Box>
          </Tooltip>
          {!sideBarCollapsed && <Buttons.ResourcesButton />}
        </Box>
      ) : (
        !sideBarCollapsed && (
          <Box sx={styles.helpCenterFooter}>
            <Buttons.ResourcesButton fullWidth />
          </Box>
        )
      )}
    </Box>
  );
});

/** @type {MuiSx} */
const sideBarBodyStyles = (sideBarCollapsed, socketStatus) => ({
  container: ({ palette }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    width: `${sideBarCollapsed ? COLLAPSED_SIDE_BAR_WIDTH : SIDE_BAR_WIDTH}px`,
    background: palette.background.sideBar,
    overflow: 'hidden',
  }),
  stickyTop: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    width: '100%',
  },
  scrollableContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingBottom: '1.25rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    minHeight: `${NAV_BAR_HEIGHT_IN_PX} !important`,
    padding: '0 1rem',
    width: '100%',
    justifyContent: `${sideBarCollapsed ? 'center' : 'space-between'}`,
  },
  homeButton: {
    mr: 0,
    paddingTop: '1rem',
    paddingBottom: '1rem',
    paddingX: 0,
    background: 'transparent',
    marginLeft: `${sideBarCollapsed ? '0' : '-0.5rem'}`,
    boxSizing: 'border-box',
    width: '2.75rem',
    height: '2.75rem',
  },
  eliteaIcon: {
    fontSize: '1.75rem',
  },
  divider: ({ palette }) => ({
    borderColor: palette.border.sidebarDivider,
  }),
  createSection: {
    padding: '0.75rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  section: {
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    paddingInline: '1rem',
    gap: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
  },
  sectionDivider: ({ palette }) => ({
    borderColor: palette.border.sidebarDivider,
    marginInline: '1rem',
  }),
  bottomSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },
  socketIconContainer: ({ palette }) => ({
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    backgroundColor:
      socketStatus === SocketConstants.SocketStatus.Connected
        ? palette.icon.fill.success
        : palette.icon.fill.error,
    position: 'absolute',
    top: '0rem',
    right: '0rem',
    pointer: 'cursor',
  }),
  helpCenterFooter: ({ palette }) => ({
    position: 'relative',
    flexShrink: 0,
    padding: '0.5rem 1rem',

    ':before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: '1px',
      backgroundColor: palette.border.sidebarDivider,
    },
  }),
  footerBlock: ({ palette }) => ({
    position: 'relative',
    display: 'flex',
    alignItems: 'stretch',
    height: '3.25rem',
    flexShrink: 0,

    ':before': {
      content: '""',
      position: 'absolute',
      left: 0,
      top: 0,
      width: '100%',
      height: '1px',
      backgroundColor: palette.border.sidebarDivider,
    },
  }),
  assistantBlock: ({ palette }) => ({
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 0,
    borderRight: sideBarCollapsed ? 'none' : `1px solid ${palette.border.sidebarDivider}`,

    span: {
      fontSize: '.75rem',
      color: palette.text.metrics,
      fontWeight: 500,
      marginLeft: '1.5rem',
    },

    ':hover': {
      background:
        palette.background.button.assistantButton?.hover ?? palette.background.button.drawerMenu.hover,
      cursor: 'pointer',
    },
  }),
});

SidebarBody.displayName = 'SideBarBody';

export default SidebarBody;
