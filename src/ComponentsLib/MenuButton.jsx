import React, { useCallback, useRef, useState } from 'react';

import { ArrowDropDown as ArrowDropDownIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  ClickAwayListener,
  Grow,
  IconButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Typography,
} from '@mui/material';

/**
 * MenuButton - A flexible component for buttons that trigger MenuList
 * Supports multiple trigger types: button, icon, dropdown, avatar
 * Handles multiple instances on the same page with unique IDs
 */
export default function MenuButton({
  // Trigger configuration
  triggerType = 'button', // 'button' | 'icon' | 'dropdown' | 'avatar' | 'custom'
  triggerProps = {},
  children, // For custom trigger content

  // Menu configuration
  menuList = [],
  menuListProps = {},
  variant = 'default', // MenuList variant

  // Positioning
  placement = 'bottom-start',
  offset = [0, 4],

  // Behavior
  closeOnSelect = true,
  disabled = false,

  // Callbacks
  onOpen,
  onClose,
  onSelect,

  // Styling
  sx = {},
  paperSx = {},

  // Accessibility
  id,
  'aria-label': ariaLabel,

  ...other
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  // Generate unique ID if not provided, ensuring the hook is called unconditionally.
  const generatedId = React.useMemo(() => `menu-button-${Math.random().toString(36).substr(2, 9)}`, []);
  const menuId = id || generatedId;

  const handleToggle = useCallback(
    event => {
      if (disabled) return;

      setOpen(prevOpen => {
        const newOpen = !prevOpen;
        if (newOpen) {
          onOpen?.(event);
        } else {
          onClose?.(event);
        }
        return newOpen;
      });
    },
    [disabled, onOpen, onClose],
  );

  const handleClose = useCallback(
    event => {
      if (anchorRef.current && anchorRef.current.contains(event.target)) {
        return;
      }
      setOpen(false);
      onClose?.(event);
    },
    [onClose],
  );

  const handleListKeyDown = useCallback(
    event => {
      if (event.key === 'Tab') {
        event.preventDefault();
        setOpen(false);
        onClose?.(event);
      } else if (event.key === 'Escape') {
        setOpen(false);
        onClose?.(event);
      }
    },
    [onClose],
  );

  const handleItemClick = useCallback(
    (item, event) => {
      if (closeOnSelect) {
        setOpen(false);
        onClose?.(event);
      }
      onSelect?.(item, event);

      // Call item's onClick if it exists
      if (item.onClick) {
        item.onClick(event);
      }
    },
    [closeOnSelect, onClose, onSelect],
  );

  // Render different trigger types
  const renderTrigger = () => {
    const commonProps = {
      ref: anchorRef,
      onClick: handleToggle,
      disabled,
      'aria-controls': open ? `${menuId}-menu` : undefined,
      'aria-expanded': open ? 'true' : undefined,
      'aria-haspopup': 'true',
      'aria-label': ariaLabel,
      sx,
      ...triggerProps,
    };

    switch (triggerType) {
      case 'icon':
        return (
          <IconButton
            {...commonProps}
            variant="icon"
          >
            {children || <MoreVertIcon />}
          </IconButton>
        );

      case 'dropdown':
        return (
          <Button
            {...commonProps}
            variant={triggerProps.variant || 'contained'}
            endIcon={<ArrowDropDownIcon />}
          >
            {children || 'Options'}
          </Button>
        );

      case 'avatar':
        return (
          <IconButton
            {...commonProps}
            variant="icon"
            sx={{
              borderRadius: '50%',
              padding: 0,
              ...sx,
            }}
          >
            {children}
          </IconButton>
        );

      case 'custom':
        return React.cloneElement(children, {
          ...commonProps,
          onClick: event => {
            handleToggle(event);
            if (children.props.onClick) {
              children.props.onClick(event);
            }
          },
        });

      case 'button':
      default:
        return (
          <Button
            {...commonProps}
            variant={triggerProps.variant || 'contained'}
          >
            {children || 'Menu'}
          </Button>
        );
    }
  };

  // Create memoized click handlers for menu items
  const menuItemHandlers = React.useMemo(() => {
    return menuList.map(item => event => handleItemClick(item, event));
  }, [menuList, handleItemClick]);

  // Render menu items
  const renderMenuItems = () => {
    return menuList.map((item, index) => {
      return (
        <MenuItem
          key={item.id || item.key || index}
          onClick={menuItemHandlers[index]}
          variant={item.variant}
          selected={item.selected}
          disabled={item.disabled}
          divider={item.divider}
          sx={item.sx}
        >
          {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
          <ListItemText
            primary={item.label || item.primary}
            secondary={item.secondary || item.description}
          />
          {item.shortcut && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ ml: 2 }}
            >
              {item.shortcut}
            </Typography>
          )}
        </MenuItem>
      );
    });
  };

  return (
    <Box {...other}>
      {renderTrigger()}
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        placement={placement}
        transition
        disablePortal
        modifiers={[
          {
            name: 'offset',
            options: {
              offset,
            },
          },
        ]}
      >
        {({ TransitionProps, placement: popperPlacement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin:
                popperPlacement === 'bottom-start'
                  ? 'left top'
                  : popperPlacement === 'bottom-end'
                    ? 'right top'
                    : popperPlacement === 'top-start'
                      ? 'left bottom'
                      : 'right bottom',
            }}
          >
            <Paper
              sx={{
                minWidth: 120,
                ...paperSx,
              }}
            >
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList
                  variant={variant}
                  autoFocusItem={open}
                  id={`${menuId}-menu`}
                  aria-labelledby={`${menuId}-button`}
                  onKeyDown={handleListKeyDown}
                  {...menuListProps}
                >
                  {renderMenuItems()}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  );
}

// Named exports for convenience
export const MenuIconButton = props => (
  <MenuButton
    triggerType="icon"
    {...props}
  />
);

export const MenuDropdownButton = props => (
  <MenuButton
    triggerType="dropdown"
    {...props}
  />
);

export const MenuAvatarButton = props => (
  <MenuButton
    triggerType="avatar"
    {...props}
  />
);
