import { memo } from 'react';

import { Box } from '@mui/material';

import { Banner } from '@/[fsd]/shared/ui';

const DimensionFieldError = memo(props => {
  const { message, sx = {}, 'data-testid': dataTestId } = props;

  if (!message) return null;

  const styles = dimensionFieldErrorStyles();

  return (
    <Box
      sx={[styles.root, sx]}
      data-testid={dataTestId}
    >
      <Banner.BannerMessage
        variant="error"
        message={message}
        containerSx={styles.banner}
      />
    </Box>
  );
});

DimensionFieldError.displayName = 'DimensionFieldError';

/** @type {MuiSx} */
const dimensionFieldErrorStyles = () => ({
  root: {
    width: '100%',
  },
  banner: {
    marginTop: 0,
  },
});

export default DimensionFieldError;
