import { memo } from 'react';

import { useSelector } from 'react-redux';

import { Box, Typography } from '@mui/material';

import StyledTooltip from '@/ComponentsLib/Tooltip';

/**
 * Reusable sidebar button component following DRY principles
 * Common base for Settings, Tips, Notifications, etc.
 */
const SidebarButton = memo(props => {
  const { icon, label, tooltip, onClick, isActive = false, children } = props;

  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);

  const styles = sidebarButtonStyles(sideBarCollapsed, isActive);

  return (
    <StyledTooltip
      placement="right"
      title={sideBarCollapsed ? tooltip || label : ''}
      enterDelay={500}
      enterNextDelay={500}
    >
      <Box
        onClick={onClick}
        sx={styles.container}
      >
        {icon}
        {!sideBarCollapsed && (
          <Typography
            component="div"
            variant="labelSmall"
            sx={styles.label}
          >
            {label}
          </Typography>
        )}
        {children}
      </Box>
    </StyledTooltip>
  );
});

SidebarButton.displayName = 'SidebarButton';

/** @type {MuiSx} */
const sidebarButtonStyles = (sideBarCollapsed, isActive) => ({
  container: ({ palette }) => ({
    width: sideBarCollapsed ? '2rem' : '100%',
    height: '2rem',
    marginLeft: 0,
    padding: sideBarCollapsed ? '0.5rem 0' : '0.5rem',
    borderRadius: '0.5rem',
    background: isActive ? palette.background.button.drawerMenu.selected : undefined,
    '&:hover': {
      backgroundColor: palette.background.button.drawerMenu.hover,
    },
    cursor: 'pointer',
    display: 'flex',
    justifyContent: sideBarCollapsed ? 'center' : 'flex-start',
    flexDirection: 'row',
    gap: '0.5rem',
    alignItems: 'center',
    boxSizing: 'border-box',
    color: isActive ? palette.text.secondary : palette.text.metrics,
  }),
  label: ({ palette }) => ({
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordWrap: 'break-word',
    whiteSpace: 'nowrap',
    color: isActive ? palette.text.secondary : palette.text.metrics,
    textAlign: 'left',
  }),
});

export default SidebarButton;
