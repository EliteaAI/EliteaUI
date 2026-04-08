import { memo, useMemo } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import ArrowRightIcon from '@/assets/arrow-right-icon.svg?react';

const BreadcrumbNavigation = memo(props => {
  const { breadcrumbs = [], bucketName = '' } = props;

  const getBreadcrumbSx = useMemo(
    () => isClickable =>
      [breadcrumbStyles.breadcrumbName, isClickable && breadcrumbStyles.breadcrumbLink].filter(Boolean),
    [],
  );

  const hasTruncatedBreadcrumbs = useMemo(() => breadcrumbs.length > 3, [breadcrumbs.length]);

  const truncatedBreadcrumbPath = useMemo(() => {
    return breadcrumbs
      .slice(0, -2)
      .map(c => c.name)
      .join('/');
  }, [breadcrumbs]);

  const fullPath = useMemo(() => {
    const pathParts = breadcrumbs.map(c => c.name);
    return bucketName ? `${bucketName}/${pathParts.join('/')}` : pathParts.join('/');
  }, [breadcrumbs, bucketName]);

  const lastTwoBreadcrumbs = useMemo(() => breadcrumbs.slice(-2), [breadcrumbs]);

  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <>
      {hasTruncatedBreadcrumbs && (
        <Box sx={breadcrumbStyles.breadcrumbItem}>
          <Box
            component={ArrowRightIcon}
            sx={breadcrumbStyles.breadcrumbSeparator}
          />
          <Tooltip
            title={truncatedBreadcrumbPath}
            enterDelay={500}
            arrow
          >
            <Typography
              variant="headingSmall"
              sx={breadcrumbStyles.breadcrumbName}
            >
              ...
            </Typography>
          </Tooltip>
        </Box>
      )}
      {!hasTruncatedBreadcrumbs &&
        breadcrumbs.map((crumb, index) => (
          <Box
            key={crumb.path}
            sx={breadcrumbStyles.breadcrumbItem}
          >
            <Box
              component={ArrowRightIcon}
              sx={breadcrumbStyles.breadcrumbSeparator}
            />
            <Typography
              variant="headingSmall"
              sx={getBreadcrumbSx(index < breadcrumbs.length - 1)}
              onClick={
                index < breadcrumbs.length - 1 ? () => props.onBreadcrumbClick?.(crumb.path) : undefined
              }
            >
              {crumb.name}
            </Typography>
          </Box>
        ))}
      {hasTruncatedBreadcrumbs &&
        lastTwoBreadcrumbs.map((crumb, index) => (
          <Box
            key={crumb.path}
            sx={breadcrumbStyles.breadcrumbItem}
          >
            <Box
              component={ArrowRightIcon}
              sx={breadcrumbStyles.breadcrumbSeparator}
            />
            {index === 1 ? (
              <Tooltip
                title={fullPath}
                enterDelay={500}
                arrow
              >
                <Typography
                  variant="headingSmall"
                  sx={breadcrumbStyles.breadcrumbName}
                >
                  {crumb.name}
                </Typography>
              </Tooltip>
            ) : (
              <Typography
                variant="headingSmall"
                sx={getBreadcrumbSx(index < 1)}
                onClick={index < 1 ? () => props.onBreadcrumbClick?.(crumb.path) : undefined}
              >
                {crumb.name}
              </Typography>
            )}
          </Box>
        ))}
    </>
  );
});

BreadcrumbNavigation.displayName = 'BreadcrumbNavigation';

/** @type {MuiSx} */
const breadcrumbStyles = {
  breadcrumbItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '0.25rem',
  },
  breadcrumbSeparator: ({ palette }) => ({
    width: '1rem',
    height: '1rem',
    color: palette.text.secondary,
    flexShrink: 0,
  }),
  breadcrumbName: ({ palette }) => ({
    color: palette.text.secondary,
    whiteSpace: 'nowrap',
  }),
  breadcrumbLink: ({ palette }) => ({
    cursor: 'pointer',
    '&:hover': {
      color: palette.primary.main,
      textDecoration: 'underline',
    },
  }),
};

export default BreadcrumbNavigation;
