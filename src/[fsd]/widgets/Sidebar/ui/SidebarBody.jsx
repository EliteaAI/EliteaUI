import { Fragment, memo, useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { Box, Divider, IconButton, Tooltip, Typography, useTheme } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks/useEnvironmentSettingByKey.hooks';
import { SidebarConstants, SocketConstants } from '@/[fsd]/widgets/Sidebar/lib/constants';
import { useSocketIcon } from '@/[fsd]/widgets/Sidebar/lib/hooks';
import { Buttons, SidebarMenuItem } from '@/[fsd]/widgets/Sidebar/ui';
import { useGetPlatformSettingsQuery } from '@/api/platformSettings';
import AppsIcon from '@/assets/applications-icon.svg?react';
import ArtifactsIcon from '@/assets/artifacts-icon.svg?react';
import BriefcaseIcon from '@/assets/briefcase-icon.svg?react';
import FlowIcon from '@/assets/flow-icon.svg?react';
import KeyIcon from '@/assets/key-icon.svg?react';
import MCPIcon from '@/assets/mcp-icon.svg?react';
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
import ModeratorIcon from '@/components/Icons/ModeratorIcon';
import Person from '@/components/Icons/Person';
import ProjectSelect from '@/components/ProjectSelect';
import ThemeModeToggle from '@/components/ThemeModeToggle';
import useNavBlocker from '@/hooks/useNavBlocker';
import RouteDefinitions from '@/routes';

const SidebarBody = memo(props => {
  const { onKeyDown, onCollapsed, onToggleAssistant } = props;
  const theme = useTheme();
  const { pathname } = useLocation();
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const systemSenderName = useSystemSenderName();
  const { publicPermissions = [], permissions = [] } = useSelector(state => state.user);
  const navigate = useNavigate();
  const { isBlockNav, isStreaming, setIsResetApiState, resetApiState } = useNavBlocker();
  const { isSocketIconVisible, socketStatus } = useSocketIcon();
  const { personal_project_id } = useSelector(state => state.user);
  const { data: platformSettings } = useGetPlatformSettingsQuery();
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
    if (pathname === RouteDefinitions.AgentStudio) {
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
          label: 'Chat',
          icon: <ChatIcon fontSize="1rem" />,
          url: RouteDefinitions.Chat,
          breadCrumb: 'Chat',
          tooltip: 'Chat',
        },
      ],
      [
        {
          value: 'agents',
          label: 'Agents',
          icon: <ApplicationsIcon />,
          url: RouteDefinitions.Applications,
          breadCrumb: 'Agents',
          tooltip: 'Agents',
        },
        {
          value: 'pipelines',
          label: 'Pipelines',
          icon: <FlowIcon />,
          url: RouteDefinitions.Pipelines,
          breadCrumb: 'Pipelines',
          tooltip: 'Pipelines',
        },
      ],
      [
        {
          value: 'credentials',
          label: 'Credentials',
          icon: <KeyIcon />,
          url: RouteDefinitions.Credentials,
          breadCrumb: 'Credentials',
          tooltip: 'Credentials',
        },

        {
          value: 'toolkits',
          label: 'Toolkits',
          icon: <ToolIcon />,
          url: RouteDefinitions.Toolkits,
          breadCrumb: 'Toolkits',
          tooltip: 'Toolkits',
        },
        {
          value: 'applications',
          label: 'Applications',
          icon: <AppsIcon />,
          url: RouteDefinitions.Apps,
          breadCrumb: 'Applications',
          tooltip: 'Applications',
        },
        {
          value: 'mcps',
          label: 'MCPs',
          icon: <MCPIcon />,
          url: RouteDefinitions.MCPs,
          breadCrumb: 'MCP',
          tooltip: 'MCP',
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
        },
      ],
      [
        {
          value: 'moderation',
          label: 'Moderation Space',
          icon: <ModeratorIcon />,
          url: RouteDefinitions.ModerationSpace,
          breadCrumb: 'Moderation Space',
          tooltip: 'Moderation Space',
          publicPermission: true,
        },
      ],
    ];
    const filteredSections = allSections.map(section => {
      return section.filter(i => {
        // Hide MCPs menu item when mcp_in_menu is disabled at platform level
        if (i.value === 'mcps' && platformSettings?.mcp_in_menu_enabled === false) {
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
  }, [permissionsSet, publicPermissionsSet, platformSettings?.mcp_in_menu_enabled]);

  const customRenderProject = useCallback(
    option => {
      const isPublicProject = option?.value === PUBLIC_PROJECT_ID;
      const isPrivateProject = option?.value === personal_project_id;
      const isTeamProject = !isPublicProject && !isPrivateProject;

      return (
        <StyledTooltip
          placement="top"
          title={sideBarCollapsed ? option?.label || '' : ''}
          enterDelay={500}
          enterNextDelay={500}
        >
          <Box sx={styles.projectContainer}>
            <Box sx={styles.projectIconBox}>
              {(isPublicProject || isTeamProject) && (
                <BriefcaseIcon style={{ color: theme.palette.text.metrics }} />
              )}
              {isPrivateProject && <Person sx={styles.projectIcon} />}
            </Box>
            {!sideBarCollapsed && (
              <Typography
                component={'div'}
                sx={styles.projectLabel}
                color={'text.secondary'}
                variant="labelSmall"
              >
                {option?.label || ''}
              </Typography>
            )}
          </Box>
        </StyledTooltip>
      );
    },
    [
      sideBarCollapsed,
      styles.projectContainer,
      styles.projectIconBox,
      styles.projectIcon,
      styles.projectLabel,
      personal_project_id,
      theme.palette.text.metrics,
    ],
  );

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
          {!sideBarCollapsed && <ThemeModeToggle />}
        </Box>

        <Divider sx={styles.divider} />

        <Box sx={styles.projectSection}>
          <ProjectSelect
            customSelectedColor={`${theme.palette.text.secondary} !important`}
            sx={styles.projectSelectSx}
            selectSX={styles.projectSelectSelectSX}
            containerSX={styles.projectSelectContainerSX}
            customRenderValue={customRenderProject}
            inputSX={styles.projectSelectInputSX}
            showBorder={false}
            selectPlaceholder={
              <StyledTooltip
                placement="right"
                title={sideBarCollapsed ? 'No projects' : ''}
                enterDelay={500}
                enterNextDelay={500}
              >
                <Box sx={styles.projectContainer}>
                  <Box sx={styles.projectIconBox}>
                    <BriefcaseIcon />
                  </Box>
                  {!sideBarCollapsed && (
                    <Typography
                      component={'div'}
                      sx={styles.projectLabel}
                      color={'text.primary'}
                      variant="labelSmall"
                    >
                      {'No projects'}
                    </Typography>
                  )}
                </Box>
              </StyledTooltip>
            }
          />
        </Box>

        <Divider sx={styles.divider} />

        <Box sx={styles.section}>
          <Buttons.CreateEntityButton />
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
                />
              ))}
            </Box>
            <Divider sx={styles.sectionDivider} />
          </Fragment>
        ))}

        <Box sx={styles.bottomSection}>
          <Box sx={styles.section}>
            <Buttons.AgentsStudioButton navigateToPage={navigateToPage} />
          </Box>
          <Divider sx={styles.sectionDivider} />
          <Box sx={styles.section}>
            <Buttons.SettingsButton navigateToPage={navigateToPage} />
            <Buttons.TipsButton />
            <Buttons.NotificationButton />
            <Buttons.UserButton navigateToPage={navigateToPage} />
          </Box>
        </Box>
      </Box>

      {onToggleAssistant && (
        <Tooltip
          title={sideBarCollapsed ? 'Support Assistant' : ''}
          placement="left"
        >
          <Box
            sx={styles.assistantBlock}
            onClick={onToggleAssistant}
          >
            {sideBarCollapsed ? null : <Typography component="span">Support Assistant</Typography>}
          </Box>
        </Tooltip>
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
  projectSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem 1rem',
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
  projectContainer: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    color: palette.icon.fill.default,
    width: sideBarCollapsed ? '2rem' : '9.375rem',
    maxWidth: sideBarCollapsed ? '2rem' : '9.375rem',
    height: '2rem',
    gap: '0.5rem',
  }),
  projectIconBox: ({ palette }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '2rem',
    height: '2rem',
    borderRadius: '0.5rem',
    '&:hover': {
      background: sideBarCollapsed ? palette.background.button.drawerMenu.hover : undefined,
    },
  }),
  projectLabel: {
    wordWrap: 'break-word',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    maxWidth: 'calc(100% - 2.5rem)',
    marginTop: '0.125rem', // 2px adjustment for better vertical alignment with icon
  },
  projectIcon: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '1rem',
  }),
  projectSelectSx: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: '0.5rem',
    ...(!sideBarCollapsed && {
      '&:hover': {
        backgroundColor: palette.background.button.drawerMenu.hover,
      },
    }),
  }),
  projectSelectContainerSX: {
    margin: 0,
    padding: 0,
    width: '100%',
  },
  projectSelectSelectSX: {
    margin: 0,
    '& .MuiInputBase-root.MuiInput-underline:before, & .MuiInputBase-root.MuiInput-underline:after, & .MuiInputBase-root.MuiInput-root:not(.Mui-error, .Mui-disabled).MuiInput-underline:hover:before, & .MuiInputBase-root.MuiInput-underline.Mui-focused:not(.Mui-error):after, & .MuiInputBase-root.MuiInput-underline.Mui-error:before, & .MuiInputBase-root.MuiInput-underline.Mui-error:after':
      {
        borderBottom: 'none !important',
        borderBottomColor: 'transparent !important',
      },
  },
  projectSelectInputSX: {
    '& .MuiInputBase-input': {
      padding: 0,
    },
    '& .MuiSelect-icon': {
      display: sideBarCollapsed ? 'none' : undefined,
      top: 'calc(50% - 0.5rem) !important',
    },
  },
  assistantBlock: ({ palette }) => ({
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '3.25rem',
    flexShrink: 0,
    padding: '.75rem 1rem',

    span: {
      fontSize: '.75rem',
      color: palette.text.metrics,
      fontWeight: 500,
      marginLeft: '.75rem',
    },

    ':hover': {
      background: palette.background.button.assistantButton?.hover ?? palette.background.button.drawerMenu.hover,
      cursor: 'pointer',
    },

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
});

SidebarBody.displayName = 'SideBarBody';

export default SidebarBody;
