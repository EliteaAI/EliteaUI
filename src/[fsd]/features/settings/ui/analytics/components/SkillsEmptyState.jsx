import { memo } from 'react';

import { Box, Typography } from '@mui/material';

import { AnalyticsCommonConstants } from '@/[fsd]/features/settings/lib/constants';

const SkillsEmptyState = memo(() => {
  const { title, description } = AnalyticsCommonConstants.SKILLS_EMPTY_STATE;

  const styles = skillsEmptyStateStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="analytics-skills-empty-state"
    >
      <Typography
        variant="labelMedium"
        sx={styles.title}
      >
        {title}
      </Typography>
      <Typography
        variant="bodySmall"
        sx={styles.description}
      >
        {description}
      </Typography>
    </Box>
  );
});

SkillsEmptyState.displayName = 'SkillsEmptyState';

/** @type {MuiSx} */
const skillsEmptyStateStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '3rem 1rem',
    textAlign: 'center',
  },
  title: ({ palette }) => ({ color: palette.text.secondary }),
  description: ({ palette }) => ({
    color: palette.text.metrics || palette.text.disabled,
    maxWidth: '32rem',
  }),
});

export default SkillsEmptyState;
