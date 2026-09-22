import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { useHasBreadcrumbTrail } from '@/[fsd]/shared/lib/hooks';
import BackButton from '@/components/BackButton';

import Breadcrumbs from './Breadcrumbs';

const BreadcrumbsOrTitle = memo(props => {
  const { title, testId, menus } = props;
  const hasBreadcrumbTrail = useHasBreadcrumbTrail();

  return (
    <Box sx={styles.root}>
      {hasBreadcrumbTrail ? (
        <Breadcrumbs menus={menus} />
      ) : (
        <>
          <BackButton />
          <Typography
            variant="headingSmall"
            color="text.secondary"
            data-testid={testId}
          >
            {title}
          </Typography>
        </>
      )}
    </Box>
  );
});

BreadcrumbsOrTitle.displayName = 'BreadcrumbsOrTitle';

const styles = {
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
};

export default BreadcrumbsOrTitle;
