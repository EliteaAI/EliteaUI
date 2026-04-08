import { memo, useCallback, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useMatch } from 'react-router-dom';

import { Box, Typography, useTheme } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';
import LogoutIcon from '@/assets/logout-icon.svg?react';
import UserIcon from '@/assets/personalization-icon.svg?react';
import DotMenu from '@/components/DotMenu';
import ArrowRightIcon from '@/components/Icons/ArrowRightIcon';
import UserAvatar from '@/components/UserAvatar';
import RouteDefinitions from '@/routes';
import { logout } from '@/slices/user.js';

const UserButton = memo(props => {
  const { navigateToPage } = props;
  const dispatch = useDispatch();
  const { name, avatar } = useSelector(state => state.user);
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const isOnUserSettings = useMatch({ path: RouteDefinitions.UserSettingsWithTab });
  const theme = useTheme();

  const styles = componentStyles(sideBarCollapsed, isOnUserSettings);

  const onLogout = useCallback(() => {
    dispatch(logout());
    window.location.href = window.location.origin.toString() + '/forward-auth/logout';
  }, [dispatch]);

  const menuItems = useMemo(
    () => [
      {
        label: 'Personalization',
        icon: <UserIcon sx={{ fontSize: '1rem' }} />,
        onClick: navigateToPage(`${RouteDefinitions.UserSettings}/profile`, 'User settings'),
        isSelected: isOnUserSettings?.params.tab === 'profile',
        addSeparator: true,
      },
      // TODO: Uncomment for future releases
      // {
      //   label: 'Credentials',
      //   icon: <KeyIcon sx={{ fontSize: '1rem' }} />,
      //   onClick: navigateToPage(`${RouteDefinitions.UserSettings}/credentials`, 'User settings'),
      //   disabled: true,
      //   isSelected: isOnUserSettings?.params.tab === 'credentials'
      // },
      // {
      //   label: 'Secrets',
      //   icon: <LockIcon sx={{ fontSize: '1rem' }} />,
      //   onClick: navigateToPage(`${RouteDefinitions.UserSettings}/secrets`, 'User settings'),
      //   disabled: true,
      //   addSeparator: true,
      //   isSelected: isOnUserSettings?.params.tab === 'secrets'
      // },
      {
        label: 'Logout',
        icon: <LogoutIcon sx={{ fontSize: '1rem' }} />,
        onClick: onLogout,
      },
    ],
    [onLogout, navigateToPage, isOnUserSettings?.params.tab],
  );

  const slotProps = useMemo(
    () => ({
      ListItemText: {
        sx: styles.listItemText,
        primaryTypographyProps: { variant: 'bodyMedium' },
      },
      ListItemIcon: {
        sx: styles.listItemIcon,
      },
    }),
    [styles.listItemText, styles.listItemIcon],
  );

  return (
    <DotMenu
      id="user-menu"
      slotProps={slotProps}
      menuStyle={styles.menuStyle}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
      menuIconSX={styles.menuIconSX(theme)}
      menuIcon={
        <StyledTooltip
          placement="right"
          title={sideBarCollapsed ? 'User profile' : ''}
          enterDelay={500}
          enterNextDelay={500}
        >
          <Box sx={styles.menuIconContainer}>
            <UserAvatar
              avatar={avatar}
              name={name}
              size={16}
            />
            {!sideBarCollapsed && (
              <Typography
                variant="labelSmall"
                sx={styles.typography}
              >
                {name}
              </Typography>
            )}
            {!sideBarCollapsed && <ArrowRightIcon style={styles.arrowIcon} />}
          </Box>
        </StyledTooltip>
      }
    >
      {menuItems}
    </DotMenu>
  );
});

UserButton.displayName = 'UserButton';

/** @type {MuiSx} */
const componentStyles = (sideBarCollapsed, isOnUserSettings) => ({
  listItemText: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  listItemIcon: {
    minWidth: '1rem !important',
    marginRight: '0.75rem',
  },
  menuStyle: {
    marginLeft: '1rem',
    marginTop: '-1rem',
  },
  menuIconSX: ({ palette }) => ({
    width: sideBarCollapsed ? '2rem' : '100% !important',
    height: '2rem',
    marginLeft: 0,
    padding: sideBarCollapsed ? '0.5rem 0' : '0.5rem 0.5rem',
    borderRadius: '0.5rem',
    background: isOnUserSettings ? palette.background.button.drawerMenu.selected : undefined,
    '&:hover': {
      backgroundColor: palette.background.button.drawerMenu.hover,
    },
  }),
  menuIconContainer: {
    width: '100%',
    justifyContent: sideBarCollapsed ? 'center' : 'flex-start',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    height: '2rem',
    boxSizing: 'border-box',
    cursor: 'pointer',
    color: ({ palette }) => (isOnUserSettings ? palette.text.button.selected : palette.text.metrics),
  },
  typography: ({ palette }) => ({
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordWrap: 'break-word',
    whiteSpace: 'nowrap',
    color: isOnUserSettings ? palette.text.secondary : palette.text.metrics,
    textAlign: 'left',
  }),
  arrowIcon: {
    fontSize: '1rem',
  },
});

export default UserButton;
