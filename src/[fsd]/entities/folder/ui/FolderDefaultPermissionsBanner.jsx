import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { Banner } from '@/[fsd]/shared/ui';

const FolderDefaultPermissionsBanner = memo(() => {
  const styles = folderDefaultPermissionsBannerStyles();

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
        message="By default, users retain the permissions granted by their project roles. Exceptions can only restrict access."
        variant="info"
      />
    </Box>
  );
});

FolderDefaultPermissionsBanner.displayName = 'FolderDefaultPermissionsBanner';

export default FolderDefaultPermissionsBanner;

const folderDefaultPermissionsBannerStyles = () => ({
  container: ({ palette }) => ({
    padding: '1rem 1.5rem 2rem',
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
  }),
  label: {
    marginBottom: '0.25rem',
  },
});
