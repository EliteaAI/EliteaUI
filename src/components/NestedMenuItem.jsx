import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';

import { Menu, MenuItem, Typography } from '@mui/material';

const NestedMenuItem = React.forwardRef((props, ref) => {
  const {
    parentMenuOpen,
    label,
    fontVariant = 'labelMedium',
    children,
    leftIcon,
    rightIcon,
    tabIndex: tabIndexProp,
    ContainerProps: ContainerPropsProp = {},
    MenuItemComponent = MenuItem,
    ...MenuItemProps
  } = props;

  const { ref: containerRefProp, ...ContainerProps } = ContainerPropsProp;

  const menuItemRef = useRef(null);
  useImperativeHandle(ref, () => menuItemRef.current);

  const containerRef = useRef(null);
  useImperativeHandle(containerRefProp, () => containerRef.current);

  const menuContainerRef = useRef(null);

  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const closeSubMenu = useCallback(() => {
    setIsSubMenuOpen(false);
  }, []);

  const handleMouseEnter = useCallback(
    event => {
      setIsSubMenuOpen(true);

      if (ContainerProps?.onMouseEnter) {
        ContainerProps.onMouseEnter(event);
      }
    },
    [ContainerProps],
  );
  const handleMouseLeave = useCallback(
    event => {
      setIsSubMenuOpen(false);

      if (ContainerProps?.onMouseLeave) {
        ContainerProps.onMouseLeave(event);
      }
    },
    [ContainerProps],
  );

  const isSubmenuFocused = useCallback(() => {
    const active = containerRef.current?.ownerDocument?.activeElement;
    for (const child of menuContainerRef.current?.children ?? []) {
      if (child === active) {
        return true;
      }
    }
    return false;
  }, []);

  const handleFocus = useCallback(
    event => {
      if (event.target === containerRef.current) {
        setIsSubMenuOpen(true);
      }

      if (ContainerProps?.onFocus) {
        ContainerProps.onFocus(event);
      }
    },
    [ContainerProps],
  );

  const handleKeyDown = useCallback(
    event => {
      if (event.key === 'Escape') {
        return;
      }

      if (isSubmenuFocused()) {
        event.stopPropagation();
      }

      const active = containerRef.current?.ownerDocument?.activeElement;

      if (event.key === 'ArrowLeft' && isSubmenuFocused()) {
        containerRef.current?.focus();
      }

      if (event.key === 'ArrowRight' && event.target === containerRef.current && event.target === active) {
        const firstChild = menuContainerRef.current?.children[0];
        firstChild?.focus();
      }
    },
    [isSubmenuFocused],
  );

  const open = useMemo(() => parentMenuOpen && isSubMenuOpen, [parentMenuOpen, isSubMenuOpen]);

  useEffect(() => {
    if (!parentMenuOpen) {
      closeSubMenu();
    }
  }, [parentMenuOpen, closeSubMenu]);

  const tabIndex = useMemo(() => {
    if (!props.disabled) {
      return tabIndexProp !== undefined ? tabIndexProp : -1;
    }
  }, [props.disabled, tabIndexProp]);

  return (
    <div
      {...ContainerProps}
      ref={containerRef}
      onFocus={handleFocus}
      tabIndex={tabIndex}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
    >
      <MenuItemComponent
        {...MenuItemProps}
        ref={menuItemRef}
      >
        {leftIcon}
        <Typography variant={fontVariant}>{label}</Typography>
        {rightIcon}
      </MenuItemComponent>
      <Menu
        style={{ pointerEvents: 'none' }}
        anchorEl={menuItemRef.current}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        open={open}
        autoFocus={false}
        disableAutoFocus
        disableEnforceFocus
        onClose={closeSubMenu}
      >
        <div
          ref={menuContainerRef}
          style={{ pointerEvents: 'auto' }}
        >
          {children}
        </div>
      </Menu>
    </div>
  );
});

NestedMenuItem.displayName = 'NestedMenuItem';
export default NestedMenuItem;
