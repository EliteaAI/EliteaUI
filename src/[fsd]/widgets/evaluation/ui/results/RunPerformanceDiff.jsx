import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import { PERFORMANCE_VERDICT, buildPerformanceDiff } from '../../lib/helpers';

/**
 * "Performance vs reference" (performance design §3.4): the server's run-over-run diff against the
 * suite baseline or the previous finished run on the same dataset. Each figure covers only the
 * cases both runs measured. Renders nothing when the run has no reference.
 */
const RunPerformanceDiff = memo(props => {
  const { compare } = props;

  const view = useMemo(() => buildPerformanceDiff(compare), [compare]);

  const styles = runPerformanceDiffStyles();

  if (!view?.rows.length) return null;

  return (
    <Box
      sx={styles.root}
      data-testid="evaluation-run-performance-diff"
    >
      <Box sx={styles.header}>
        <Typography
          variant="bodySmall2"
          sx={styles.title}
        >
          Performance vs {view.referenceLabel}
        </Typography>
        {view.isSlower && (
          <Box
            component="span"
            sx={[styles.chip, styles.worse]}
            data-testid="evaluation-run-slower-badge"
          >
            Slower than reference
          </Box>
        )}
      </Box>

      <Box
        component="table"
        sx={styles.table}
      >
        <thead>
          <tr>
            <th>Metric</th>
            <th>This run</th>
            <th>Reference</th>
            <th>Change</th>
            <th>Cases</th>
          </tr>
        </thead>
        <tbody>
          {view.rows.map(row => (
            <tr
              key={row.key}
              data-testid={`evaluation-perf-row-${row.key}`}
            >
              <td>{row.label}</td>
              <td>{row.run}</td>
              <td>{row.reference}</td>
              <td>
                <Box
                  component="span"
                  sx={[
                    row.verdict === PERFORMANCE_VERDICT.worse && styles.worseText,
                    row.verdict === PERFORMANCE_VERDICT.better && styles.betterText,
                  ]}
                >
                  {[row.change, row.verdictLabel].filter(Boolean).join(' · ') || '—'}
                </Box>
              </td>
              <td>{row.coverage ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </Box>

      {view.timeouts && (
        <Box
          sx={styles.notes}
          data-testid="evaluation-perf-timeouts"
        >
          {view.timeouts.newly && (
            <Typography
              variant="bodySmall"
              sx={styles.worseText}
            >
              Newly timed out: {view.timeouts.newly}
            </Typography>
          )}
          {view.timeouts.noLonger && (
            <Typography
              variant="bodySmall"
              sx={styles.betterText}
            >
              No longer timed out: {view.timeouts.noLonger}
            </Typography>
          )}
        </Box>
      )}

      {(view.notes.length > 0 || view.noise) && (
        <Box sx={styles.notes}>
          {view.notes.map(note => (
            <Typography
              key={note}
              variant="bodySmall"
              sx={styles.muted}
            >
              {note}
            </Typography>
          ))}
          {view.noise && (
            <Typography
              variant="bodySmall"
              sx={styles.muted}
            >
              {view.noise}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
});

RunPerformanceDiff.displayName = 'RunPerformanceDiff';

/** @type {MuiSx} */
const runPerformanceDiffStyles = () => ({
  root: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    margin: '0.75rem 1.5rem 0',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    backgroundColor: palette.background.surface.interactive.default,
  }),
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  title: ({ palette }) => ({
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: palette.text.primary,
  }),
  chip: {
    padding: '0 0.5rem',
    borderRadius: '1rem',
    fontSize: '0.75rem',
    lineHeight: '1rem',
  },
  worse: ({ palette }) => ({
    color: palette.icon.indexResult.error,
    backgroundColor: palette.alert.error?.background,
  }),
  table: ({ palette }) => ({
    borderCollapse: 'collapse',
    width: '100%',
    '& th, & td': {
      padding: '0.25rem 1rem 0.25rem 0',
      textAlign: 'left',
      fontSize: '0.75rem',
      lineHeight: '1rem',
      whiteSpace: 'nowrap',
    },
    '& th': {
      color: palette.text.primary,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      fontWeight: 500,
    },
    '& td': {
      color: palette.text.secondary,
    },
  }),
  worseText: ({ palette }) => ({
    color: palette.icon.indexResult.error,
  }),
  betterText: ({ palette }) => ({
    color: palette.icon.indexResult.success,
  }),
  notes: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  muted: ({ palette }) => ({
    color: palette.text.primary,
    fontStyle: 'italic',
  }),
});

export default RunPerformanceDiff;
