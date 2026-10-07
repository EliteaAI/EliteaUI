import { memo } from 'react';

import { Box, Typography } from '@mui/material';

const UnsavedChangesTestBanner = memo(() => {
  const styles = unsavedChangesTestBannerStyles();

  return (
    <Box
      sx={styles.banner}
      data-testid="skill-test-unsaved-banner"
    >
      <Typography
        variant="bodySmall"
        sx={styles.text}
      >
        Testing unsaved changes — this run is not saved to history
      </Typography>
    </Box>
  );
});

UnsavedChangesTestBanner.displayName = 'UnsavedChangesTestBanner';

/** @type {MuiSx} */
const unsavedChangesTestBannerStyles = () => ({
  banner: ({ palette }) => ({
    flex: 1,
    minWidth: 0,
    padding: '0.375rem 0.75rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.alert.warning.border}`,
    backgroundColor: palette.alert.warning.background,
  }),
  text: ({ palette }) => ({
    color: palette.alert.warning.text,
  }),
});

export default UnsavedChangesTestBanner;
