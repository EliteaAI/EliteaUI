import { memo } from 'react';

import { useSelector } from 'react-redux';

import { ListItem, ListItemButton, ListItemIcon } from '@mui/material';
import Typography from '@mui/material/Typography';

import Tooltip from '@/ComponentsLib/Tooltip';
import { useDisablePersonalSpace } from '@/[fsd]/widgets/Sidebar/lib/hooks';
import { TooltipForDisablePersonalSpace } from '@/[fsd]/widgets/Sidebar/ui';

const SidebarMenuItem = memo(props => {
  const {
    menuTitle,
    menuIcon,
    onClick,
    selected,
    display,
    isPersonalSpace,
    disabled,
    tooltip,
    showLabel = true,
  } = props;
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const { shouldDisablePersonalSpace } = useDisablePersonalSpace();
  const styles = sidebarMenuItemStyles(selected, showLabel, isPersonalSpace);

  return isPersonalSpace ? (
    <TooltipForDisablePersonalSpace>
      <ListItem sx={{ ...styles.menuItem, display }}>
        <ListItemButton
          disabled={shouldDisablePersonalSpace || disabled}
          selected={selected}
          onClick={onClick}
          sx={styles.button}
        >
          <ListItemIcon sx={styles.icon}>{menuIcon}</ListItemIcon>
          {showLabel && <Typography variant="labelSmall">{menuTitle}</Typography>}
        </ListItemButton>
      </ListItem>
    </TooltipForDisablePersonalSpace>
  ) : (
    <Tooltip
      title={sideBarCollapsed ? tooltip : ''}
      placement="right"
      enterDelay={500}
      enterNextDelay={500}
    >
      <ListItem sx={{ ...styles.menuItem, display }}>
        <ListItemButton
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
const sidebarMenuItemStyles = (selected, showLabel, isPersonalSpace) => ({
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
    maxWidth: showLabel ? undefined : isPersonalSpace ? '1.5rem !important' : '2rem !important',
    '&:hover': {
      background: palette.background.button.drawerMenu.hover,
    },
    '&.Mui-selected': {
      background: palette.background.button.drawerMenu.selected,
    },
    '&.Mui-selected:hover': {
      background: palette.background.button.drawerMenu.hover,
    },
    '& path': {
      fill: selected ? palette.icon.fill.secondary : palette.text.metrics,
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
