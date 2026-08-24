import { memo, useMemo } from 'react';

import { Box, Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

import { Tooltip } from '@/[fsd]/shared/ui';

import { buildWeightedScoreExplanation, formatScore, getBindingEngineLabel } from '../../lib/helpers';

const formatTarget = binding => {
  if (binding.target == null || binding.target === '' || !binding.operator) return '—';
  return `${binding.operator} ${binding.target}`;
};

const formatMet = binding => {
  if (!binding.targetedCount) return '—';
  return `${binding.metCount}/${binding.targetedCount}`;
};

// Run-level scorecard header (§15): weighted headline with a provisional flag
// while any human dimension is unscored, case counts, and the per-dimension
// aggregate table. This is analysis, not a pass/fail gate — no banner.
const ScorecardOverview = memo(props => {
  const { scorecard } = props;

  const { headline, provisional, pendingHuman, counts, bindings } = scorecard;

  const scoreExplanation = useMemo(() => buildWeightedScoreExplanation(scorecard), [scorecard]);

  const styles = scorecardOverviewStyles();

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-scorecard-overview"
    >
      <Box sx={styles.headlineRow}>
        <Box sx={styles.scoreBlock}>
          <Typography variant="headingSmall">{headline != null ? formatScore(headline) : '—'}</Typography>
          <Typography
            variant="bodySmall"
            color="text.secondary"
          >
            Weighted score
          </Typography>
          <Tooltip.InfoTooltip
            infoTooltip={scoreExplanation}
            testId="evaluation-scorecard-score-info"
          />
        </Box>
        {provisional && (
          <Chip
            size="small"
            variant="outlined"
            label={`Provisional · ${pendingHuman} human ${pendingHuman === 1 ? 'score' : 'scores'} pending`}
            data-testid="evaluation-scorecard-provisional"
          />
        )}
      </Box>

      <Typography
        variant="bodySmall"
        color="text.secondary"
        data-testid="evaluation-scorecard-counts"
      >
        Cases {counts.total} · Met all targets {counts.metAll} · Missed ≥1 {counts.missedAny} · Errors{' '}
        {counts.errors}
      </Typography>

      <Table
        size="small"
        sx={styles.table}
        data-testid="evaluation-scorecard-aggregate"
      >
        <TableHead>
          <TableRow>
            <TableCell>Dimension</TableCell>
            <TableCell>Engine</TableCell>
            <TableCell>Scale</TableCell>
            <TableCell align="right">Avg</TableCell>
            <TableCell align="right">Target</TableCell>
            <TableCell align="right">Met</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {bindings.map(binding => (
            <TableRow key={binding.key}>
              <TableCell>{binding.name}</TableCell>
              <TableCell>{getBindingEngineLabel(binding)}</TableCell>
              <TableCell>{binding.scaleType || '—'}</TableCell>
              <TableCell align="right">{formatScore(binding.avgNative)}</TableCell>
              <TableCell align="right">{formatTarget(binding)}</TableCell>
              <TableCell align="right">{formatMet(binding)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
});

ScorecardOverview.displayName = 'ScorecardOverview';

/** @type {MuiSx} */
const scorecardOverviewStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  headlineRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  scoreBlock: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '0.5rem',
  },
  table: {
    '& .MuiTableCell-root': {
      borderBottom: 'none',
    },
  },
});

export default ScorecardOverview;
