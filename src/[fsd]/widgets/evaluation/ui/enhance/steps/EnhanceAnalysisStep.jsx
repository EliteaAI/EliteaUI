import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { buildCoverageStats } from '../../../lib/helpers';

const EnhanceAnalysisStep = memo(props => {
  const { proposal } = props;

  const stats = useMemo(() => buildCoverageStats(proposal?.coverage), [proposal?.coverage]);

  const hasFixes = (proposal?.agent_fixes?.length ?? 0) > 0 || (proposal?.eval_fixes?.length ?? 0) > 0;

  const styles = enhanceAnalysisStepStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="enhance-analysis-step"
    >
      {stats.length > 0 && (
        <Box sx={styles.statsRow}>
          {stats.map(stat => (
            <Box
              key={stat.label}
              sx={styles.statCard}
            >
              <Typography
                variant="labelSmall"
                sx={styles.statLabel}
              >
                {stat.label}
              </Typography>
              <Box sx={styles.statValueRow}>
                <Typography
                  variant="headingMedium"
                  sx={styles.statValue}
                >
                  {stat.value}
                </Typography>
                {stat.valueSuffix && (
                  <Typography
                    variant="bodySmall"
                    sx={styles.statValueSuffix}
                  >
                    {stat.valueSuffix}
                  </Typography>
                )}
              </Box>
              <Typography
                variant="bodySmall"
                sx={styles.statSubtitle}
              >
                {stat.subtitle}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      <Box sx={styles.section}>
        <Typography sx={styles.sectionLabel}>Why this run missed its targets</Typography>
        <Typography
          variant="bodyMedium"
          sx={styles.diagnosis}
        >
          {proposal?.diagnosis || 'The analysis returned no diagnosis for this run.'}
        </Typography>
      </Box>

      <Typography
        variant="bodySmall2"
        sx={styles.hint}
        data-testid={hasFixes ? 'enhance-analysis-hint' : 'enhance-with-ai-empty'}
      >
        {hasFixes
          ? 'The next steps show every suggested change side by side with what is there today. Uncheck anything you do not want applied.'
          : 'No changes suggested — the agent and the evaluation look consistent for this run.'}
      </Typography>
    </Box>
  );
});

EnhanceAnalysisStep.displayName = 'EnhanceAnalysisStep';

/** @type {MuiSx} */
const enhanceAnalysisStepStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
    padding: '1.5rem 2rem',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
    gap: '1rem',
  },
  statCard: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
    padding: '1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
  }),
  statLabel: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.6875rem',
  }),
  statValueRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
  },
  statValue: ({ palette }) => ({
    color: palette.text.secondary,
  }),
  statValueSuffix: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.875rem',
  }),
  statSubtitle: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.6875rem',
    marginTop: '-0.125rem',
  }),
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sectionLabel: {
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.045rem',
    textTransform: 'uppercase',
    color: 'text.primary',
  },
  diagnosis: ({ palette }) => ({
    color: palette.text.secondary,
    whiteSpace: 'pre-wrap',
  }),
  hint: ({ palette }) => ({
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
});

export default EnhanceAnalysisStep;
