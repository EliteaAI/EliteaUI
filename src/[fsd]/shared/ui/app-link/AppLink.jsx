import { forwardRef, memo, useCallback } from 'react';

import { useSelector } from 'react-redux';
import { useHref, useLinkClickHandler } from 'react-router-dom';

import { Link } from '@mui/material';

import { NavigationHelpers } from '@/[fsd]/shared/lib/helpers';

/**
 * A real `<a href>` for in-app navigation.
 * - Plain left click: runs `onClick`, then navigates client-side to the clean `to` (no extra params).
 * - Ctrl/Cmd/Shift+Click and middle-click: left to the browser ("Open link in new tab"); `onClick` is
 *   skipped so side effects never run for a tab that does not navigate.
 * - The `href` carries the active `project_id`, because a new tab has no per-tab project of its own.
 * The native context menu is never touched.
 */
const AppLink = memo(
  forwardRef((props, ref) => {
    const { to, state, replace, onClick, children, sx, ...restProps } = props;
    const projectId = useSelector(reduxState => reduxState.settings?.project?.id);
    const href = NavigationHelpers.appendProjectParam(useHref(to), projectId);
    const handleRouterClick = useLinkClickHandler(to, { state, replace });

    const handleClick = useCallback(
      event => {
        if (NavigationHelpers.isModifiedClick(event)) return;
        onClick?.(event);
        // Another handler already took over the click (e.g. a guarded navigation): don't navigate twice
        if (event.defaultPrevented) return;
        handleRouterClick(event);
      },
      [onClick, handleRouterClick],
    );

    const styles = appLinkStyles();

    return (
      <Link
        // Spread first: a wrapper (e.g. ListItemButton) may pass its own href, which must not win
        {...restProps}
        ref={ref}
        href={href}
        underline="none"
        color="inherit"
        onClick={handleClick}
        sx={[styles.root, ...(Array.isArray(sx) ? sx : [sx])]}
      >
        {children}
      </Link>
    );
  }),
);

AppLink.displayName = 'AppLink';

/** @type {MuiSx} */
const appLinkStyles = () => ({
  root: {
    color: 'inherit',
    textDecoration: 'none',
    cursor: 'pointer',
    '&:hover': { textDecoration: 'none' },
  },
});

export default AppLink;
