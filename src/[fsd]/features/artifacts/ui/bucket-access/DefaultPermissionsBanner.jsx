import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Banner } from '@/[fsd]/shared/ui';

const DefaultPermissionsBanner = memo(() => {
  const styles = defaultPermissionsBannerStyles();

  return (
    <Box sx={styles.container}>
      <Typography
        variant="labelMedium"
        color="text.secondary"
        sx={styles.label}
      >
        Default Permissions
      </Typography>
      <Banner.BannerMessage
        message="All users have read/write permissions by default."
        variant="info"
      />
    </Box>
  );
});

DefaultPermissionsBanner.displayName = 'DefaultPermissionsBanner';

export default DefaultPermissionsBanner;

const defaultPermissionsBannerStyles = () => ({
  container: ({ palette }) => ({
    padding: '1rem 1.5rem 2rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  label: {
    marginBottom: '0.25rem',
  },
});
