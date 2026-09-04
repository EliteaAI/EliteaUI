import { memo } from 'react';

import { useLocation } from 'react-router-dom';

import { Box, Typography } from '@mui/material';

import { useBreadcrumbTrail } from '@/[fsd]/shared/lib/hooks';

import BreadcrumbItem from './BreadcrumbItem';

const Breadcrumbs = memo(() => {
  const trail = useBreadcrumbTrail();
  const { search } = useLocation();
  const styles = breadcrumbsStyles();

  if (!trail.length) return null;

  return (
    <Box
      component="nav"
      aria-label="Breadcrumb"
      sx={styles.wrapper}
      data-testid="breadcrumbs"
    >
      <Box
        component="ol"
        sx={styles.list}
      >
        {trail.map((crumb, index) => (
          <Box
            component="li"
            key={crumb.key}
            sx={styles.item}
          >
            {index > 0 && (
              <Typography
                aria-hidden
                variant="headingSmall"
                sx={styles.separator}
              >
                /
              </Typography>
            )}
            <BreadcrumbItem
              label={crumb.label}
              to={crumb.isCurrent ? crumb.to : { pathname: crumb.to, search }}
              isCurrent={crumb.isCurrent}
              testId={crumb.entry.testId}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
});

Breadcrumbs.displayName = 'Breadcrumbs';

/** @type {MuiSx} */
const breadcrumbsStyles = () => ({
  wrapper: {
    display: 'flex',
    minWidth: 0,
    overflow: 'hidden',
  },
  list: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    minWidth: 0,
    overflow: 'hidden',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    minWidth: 0,
  },
  separator: ({ palette }) => ({
    color: palette.text.primary,
    marginX: '0.5rem',
    flexShrink: 0,
  }),
});

export default Breadcrumbs;
