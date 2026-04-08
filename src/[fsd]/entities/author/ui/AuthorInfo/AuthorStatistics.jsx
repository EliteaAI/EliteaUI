import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { STATISTICS_USER_INFO } from '@/[fsd]/entities/author/lib/constants';

const AuthorStatistics = memo(props => {
  const { statistic } = props;

  const styles = authorStatisticsStyles();

  if (!statistic) return null;

  return (
    <Box sx={styles.statisticsBlock}>
      <Typography variant="bodySmall">
        <>
          <Box
            component="span"
            sx={styles.statisticsLabel}
          >
            {statistic.label}:
          </Box>
          <Box
            component="span"
            sx={styles.statisticsValue}
          >
            {statistic.value}
          </Box>
        </>

        {statistic.published >= 0 && (
          <>
            <Box
              component="span"
              sx={styles.statisticsPublishedLabel}
            >
              {STATISTICS_USER_INFO.AGENTS_PUBLIC}:
            </Box>
            <Box
              component="span"
              sx={styles.statisticsPublishedValue}
            >
              {statistic.published}
            </Box>
          </>
        )}
      </Typography>
    </Box>
  );
});

/** @type {MuiSx} */
const authorStatisticsStyles = () => ({
  statisticsBlock: {
    height: '1.5rem',
    display: 'flex',
    alignItems: 'center',
  },
  statisticsLabel: {
    // No special styling needed
  },
  statisticsValue: ({ palette }) => ({
    color: palette.text.secondary,
    marginLeft: '0.25rem',
  }),
  statisticsPublishedLabel: {
    marginLeft: '0.5rem',
  },
  statisticsPublishedValue: ({ palette }) => ({
    color: palette.text.secondary,
    marginLeft: '0.25rem',
  }),
});

AuthorStatistics.displayName = 'AuthorStatistics';

export default AuthorStatistics;
