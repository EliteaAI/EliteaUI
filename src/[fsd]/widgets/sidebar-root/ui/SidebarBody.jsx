import { memo, useCallback, useMemo } from 'react';

import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { Box, Divider, IconButton, Tooltip } from '@mui/material';

import { SIDEBAR_TOUR_TARGET_IDS } from '@/[fsd]/features/interactive-tours';
import { useSystemSenderName } from '@/[fsd]/shared/lib/hooks';
import { BrandLogo } from '@/[fsd]/shared/ui';
import { SocketConstants } from '@/[fsd]/widgets/sidebar-root/lib/constants';
import { useSidebarNavigation, useSocketIcon } from '@/[fsd]/widgets/sidebar-root/lib/hooks';
import {
  Buttons,
  ExploreMenu,
  SidebarChatsArea,
  SidebarFooterRow,
  SidebarMenuItem,
  SidebarProjectSelect,
} from '@/[fsd]/widgets/sidebar-root/ui';
import { useGetSupportAssistantConfigQuery } from '@/[fsd]/widgets/support-assistant';
import ArtifactsIcon from '@/assets/artifacts-icon.svg?react';
import {
  COLLAPSED_SIDE_BAR_WIDTH,
  NAV_BAR_HEIGHT_IN_PX,
  PERMISSION_GROUPS,
  SIDE_BAR_WIDTH,
} from '@/common/constants';
import RouteDefinitions from '@/routes';

const ARTIFACTS_LABEL = 'Artifacts';

const SidebarBody = memo(props => {
  const { onKeyDown, onCollapsed, onToggleAssistant } = props;
  const { pathname } = useLocation();
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const permissions = useSelector(state => state.user.permissions);
  const systemSenderName = useSystemSenderName();
  const { isSocketIconVisible, socketStatus } = useSocketIcon();
  const { navigateToPage, getLinkTarget } = useSidebarNavigation();

  useGetSupportAssistantConfigQuery();

  const styles = sideBarBodyStyles(sideBarCollapsed, socketStatus);

  const showArtifacts = useMemo(
    () => PERMISSION_GROUPS.artifacts.some(permission => (permissions || []).includes(permission)),
    [permissions],
  );

  const onClickHomeButton = useCallback(() => {
    onCollapsed?.(!sideBarCollapsed);
  }, [onCollapsed, sideBarCollapsed]);

  return (
    <Box
      role="presentation"
      onKeyDown={onKeyDown}
      sx={styles.container}
      data-testid="sidebar-body"
    >
      <Box sx={styles.header}>
        <IconButton
          data-tour={SIDEBAR_TOUR_TARGET_IDS.logo}
          data-testid="sidebar-toggle"
          size="large"
          color="inherit"
          aria-label={sideBarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onClickHomeButton}
          sx={styles.homeButton}
        >
          <BrandLogo sx={styles.eliteaIcon} />
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
        <Buttons.NewChatButton />
      </Box>

      {sideBarCollapsed && <Divider sx={styles.divider} />}

      <Box
        component="nav"
        aria-label="Main"
        sx={styles.navSection}
      >
        {showArtifacts && (
          <SidebarMenuItem
            display
            menuTitle={ARTIFACTS_LABEL}
            menuIcon={<ArtifactsIcon />}
            selected={pathname.startsWith(RouteDefinitions.Artifacts)}
            onClick={navigateToPage(RouteDefinitions.Artifacts, ARTIFACTS_LABEL, { collapseSidebar: true })}
            to={getLinkTarget(RouteDefinitions.Artifacts)}
            tooltip={ARTIFACTS_LABEL}
            showLabel={!sideBarCollapsed}
            tourId={SIDEBAR_TOUR_TARGET_IDS.navArtifacts}
          />
        )}
        <ExploreMenu showLabel={!sideBarCollapsed} />
      </Box>

      {sideBarCollapsed ? (
        <Box sx={styles.spacer} />
      ) : (
        <>
          <Divider sx={styles.divider} />
          <SidebarChatsArea />
        </>
      )}

      <SidebarFooterRow onToggleAssistant={onToggleAssistant} />
    </Box>
  );
});

SidebarBody.displayName = 'SideBarBody';

/** @type {MuiSx} */
const sideBarBodyStyles = (sideBarCollapsed, socketStatus) => ({
  container: ({ palette }) => ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    width: `${(sideBarCollapsed ? COLLAPSED_SIDE_BAR_WIDTH : SIDE_BAR_WIDTH) / 16}rem`,
    background: palette.components.sidebar.background,
    overflow: 'hidden',
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
    minHeight: `${NAV_BAR_HEIGHT_IN_PX} !important`,
    padding: '0 1rem',
    width: '100%',
    boxSizing: 'border-box',
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
    borderColor: palette.border.subtle,
  }),
  createSection: {
    padding: sideBarCollapsed ? '0.75rem 1rem' : '0.75rem 1rem 0.25rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
    boxSizing: 'border-box',
  },
  navSection: {
    padding: sideBarCollapsed ? '0.5rem 1rem' : '0.5rem 1rem 0.75rem',
    gap: sideBarCollapsed ? '0.5rem' : '0.25rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: sideBarCollapsed ? 'center' : 'stretch',
    flexShrink: 0,
    boxSizing: 'border-box',
  },
  spacer: {
    flex: 1,
  },
  socketIconContainer: ({ palette }) => ({
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    backgroundColor:
      socketStatus === SocketConstants.SocketStatus.Connected ? palette.icon.success : palette.icon.error,
    position: 'absolute',
    top: '0rem',
    right: '0rem',
    pointer: 'cursor',
  }),
});

export default SidebarBody;
