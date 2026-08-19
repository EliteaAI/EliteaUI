import { memo } from 'react';

import { Link as RouterLink } from 'react-router-dom';

import { Link, Typography } from '@mui/material';

const BreadcrumbItem = memo(props => {
  const { label, to, isCurrent, testId } = props;
  const styles = breadcrumbItemStyles();

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
