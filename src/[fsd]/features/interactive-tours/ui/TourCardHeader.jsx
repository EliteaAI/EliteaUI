import { memo } from 'react';

import { Box, Typography } from '@mui/material';

/**
 * Shared header for tour cards: icon + title + gradient divider.
 */
const TourCardHeader = memo(props => {
  const { icon, titleId, children } = props;
  const styles = tourCardHeaderStyles();

  return (
    <Box sx={styles.wrapper}>
      <Box
        component={icon}
        sx={styles.icon}
        aria-hidden="true"
        focusable="false"
      />
      <Typography
        id={titleId}
        variant="headingMedium"
        color="text.secondary"
        align="center"
      >
        {children}
      </Typography>
      <Box sx={styles.divider} />
    </Box>
  );
});

TourCardHeader.displayName = 'TourCardHeader';

/** @type {MuiSx} */
const tourCardHeaderStyles = () => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },

  icon: {
    width: '1.5rem',
    height: '1.5rem',
    flexShrink: 0,
    display: 'block',
  },

  divider: ({ palette }) => ({
    alignSelf: 'stretch',
    height: 0,
    borderBottom: '0.0625rem solid transparent',
    borderImageSlice: 1,
    borderImageSource: palette.background.interactiveTourPrompt.dividerGradient,
  }),
});

export default TourCardHeader;
