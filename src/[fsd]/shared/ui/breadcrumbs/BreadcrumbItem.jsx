import { memo, useCallback } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { Link, Typography } from '@mui/material';

const BreadcrumbItem = memo(props => {
  const { label, to, isCurrent, testId, onTriggerClick, isMenuOpen = false } = props;

  const handleTriggerKeyDown = useCallback(
    event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onTriggerClick?.(event);
    },
    [onTriggerClick],
  );

  const styles = breadcrumbItemStyles();

  // A crumb that opens a menu instead of navigating; it is never the current page, so it keeps the
  // ordinary link look.
  if (onTriggerClick) {
    return (
      <Link
        component="span"
        role="button"
        tabIndex={0}
        variant="headingSmall"
        aria-haspopup="menu"
        aria-expanded={isMenuOpen}
        onClick={onTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        sx={styles.link}
        data-testid={testId ?? 'breadcrumb-menu-trigger'}
      >
        {label}
      </Link>
    );
  }

  if (isCurrent) {
    return (
      <Typography
        variant="headingSmall"
        color="text.secondary"
        aria-current="page"
        data-testid={testId ?? 'breadcrumb-current'}
      >
        {label}
      </Typography>
    );
  }

  return (
    <Link
      component={RouterLink}
      to={to}
      variant="headingSmall"
      sx={styles.link}
      data-testid="breadcrumb-item"
    >
      {label}
    </Link>
  );
});

BreadcrumbItem.displayName = 'BreadcrumbItem';

/** @type {MuiSx} */
const breadcrumbItemStyles = () => ({
  link: ({ palette }) => ({
    color: palette.text.primary,
    whiteSpace: 'nowrap',
    cursor: 'pointer',
    textDecoration: 'none',
    '&:hover': {
      color: palette.primary.main,
      textDecoration: 'underline',
    },
  }),
});

export default BreadcrumbItem;
