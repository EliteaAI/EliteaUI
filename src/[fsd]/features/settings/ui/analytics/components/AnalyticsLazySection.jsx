import { memo } from 'react';

import { Box, CircularProgress, Typography } from '@mui/material';

import { useInViewOnce } from '@/[fsd]/shared/lib/hooks';

const AnalyticsLazySection = memo(props => {
  const { children, title } = props;

  const { ref, hasBeenVisible } = useInViewOnce();
  const styles = analyticsLazySectionStyles();

  return (
    <Box ref={ref}>
      {hasBeenVisible ? (
        children
      ) : (
        <Box sx={styles.placeholder}>
          <Typography
            variant="labelMedium"
            sx={styles.title}
          >
            {title}
          </Typography>
          <Box sx={styles.loadingRow}>
            <CircularProgress size={20} />
          </Box>
        </Box>
      )}
    </Box>
  );
});

AnalyticsLazySection.displayName = 'AnalyticsLazySection';

/** @type {MuiSx} */
const analyticsLazySectionStyles = () => ({
  placeholder: ({ palette }) => ({
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  }),
  title: ({ palette }) => ({ color: palette.text.secondary }),
  loadingRow: { display: 'flex', justifyContent: 'center', padding: '1.5rem' },
});

export default AnalyticsLazySection;
