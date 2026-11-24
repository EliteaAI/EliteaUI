import { memo } from 'react';

import { useSelector } from 'react-redux';

import { ListItem, ListItemButton, ListItemIcon } from '@mui/material';
import Typography from '@mui/material/Typography';

import Tooltip from '@/ComponentsLib/Tooltip';
import { AppLink } from '@/[fsd]/shared/ui';

const SidebarMenuItem = memo(props => {
  const {
    menuTitle,
    menuIcon,
    onClick,
    to,
    selected,
    display,
    disabled,
    tooltip,
    showLabel = true,
    tourId,
    buttonProps,
  } = props;
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const styles = sidebarMenuItemStyles(selected, showLabel);

  // A real link (href) lets the browser offer "Open link in new tab"; a disabled item stays a plain button
  const linkProps = to && !disabled ? { component: AppLink, to } : {};

  return (
    <Tooltip
      title={sideBarCollapsed ? tooltip : ''}
      placement="right"
      enterDelay={500}
      enterNextDelay={500}
    >
      <ListItem
        data-tour={tourId}
        sx={{ ...styles.menuItem, display }}
      >
        <ListItemButton
          {...linkProps}
          aria-label={showLabel ? undefined : menuTitle}
          {...buttonProps}
          disabled={disabled}
          selected={selected}
          onClick={onClick}
          sx={styles.button}
        >
          <ListItemIcon sx={styles.icon}>{menuIcon}</ListItemIcon>
          {showLabel && <Typography variant="labelSmall">{menuTitle}</Typography>}
        </ListItemButton>
      </ListItem>
    </Tooltip>
  );
});

SidebarMenuItem.displayName = 'SidebarMenuItem';

/** @type {MuiSx} */
const sidebarMenuItemStyles = (selected, showLabel) => ({
  menuItem: {
    padding: '0 !important',
    justifyContent: showLabel ? undefined : 'center',
    marginTop: 0,
    marginBottom: 0,
    height: '2rem',
    boxSizing: 'border-box',
    borderRadius: '0.5rem',
  },
  button: ({ palette }) => ({
    paddingLeft: '0.5rem',
    paddingRight: '0.5rem',
    paddingBottom: '0.5rem',
    paddingTop: '0.5rem',
    borderRadius: '0.5rem',
    height: '2rem',
    boxSizing: 'border-box',
    maxWidth: showLabel ? undefined : '2rem !important',
    '&:hover': {
      background: palette.components.sidebar.menuItem.hover,
    },
    '&.Mui-selected': {
      background: palette.components.sidebar.menuItem.selected,
    },
    '&.Mui-selected:hover': {
      background: palette.components.sidebar.menuItem.hover,
    },
    '& path': {
      fill: selected ? palette.icon.secondary : palette.text.metrics,
    },
    '& span': {
      color: selected ? palette.text.secondary : palette.text.metrics,
      width: showLabel ? undefined : '0 !important',
    },
  }),
  icon: {
    marginRight: showLabel ? '0.5rem' : 0,
    minWidth: '1rem',
    '& .MuiSvgIcon-root': {
      fontSize: '1rem',
    },
  },
});

export default SidebarMenuItem;
