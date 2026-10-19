import { memo, useMemo } from 'react';

import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';

import { PERFORMANCE_VERDICT, buildPerformanceDiff } from '../../lib/helpers';

/**
 * "Performance vs reference" (performance design §3.4): the server's run-over-run diff against the
 * suite baseline or the previous finished run on the same dataset. Each figure covers only the
 * cases both runs measured. Renders nothing when the run has no reference.
 */
const COLUMNS = ['Metric', 'This run', 'Reference', 'Change', 'Cases'];

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

      <Table
        size="small"
        sx={styles.table}
      >
        <TableHead>
          <TableRow>
            {COLUMNS.map(column => (
              <TableCell
                key={column}
                sx={[styles.cell, styles.headCell]}
              >
                {column}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {view.rows.map(row => (
            <TableRow
              key={row.key}
              data-testid={`evaluation-perf-row-${row.key}`}
            >
              <TableCell sx={styles.cell}>{row.label}</TableCell>
              <TableCell sx={styles.cell}>{row.run}</TableCell>
              <TableCell sx={styles.cell}>{row.reference}</TableCell>
              <TableCell
                sx={[
                  styles.cell,
                  row.verdict === PERFORMANCE_VERDICT.worse && styles.worseText,
                  row.verdict === PERFORMANCE_VERDICT.better && styles.betterText,
                ]}
              >
                {[row.change, row.verdictLabel].filter(Boolean).join(' · ') || '—'}
              </TableCell>
              <TableCell sx={styles.cell}>{row.coverage ?? '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
    color: palette.alert.error.text,
    backgroundColor: palette.alert.error.background,
  }),
  table: {
    width: '100%',
  },
  cell: ({ palette }) => ({
    padding: '0.25rem 1rem 0.25rem 0',
    border: 'none',
    fontSize: '0.75rem',
    lineHeight: '1rem',
    whiteSpace: 'nowrap',
    color: palette.text.secondary,
  }),
  headCell: ({ palette }) => ({
    color: palette.text.primary,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    fontWeight: 500,
  }),
  worseText: ({ palette }) => ({
    color: palette.alert.error.text,
  }),
  betterText: ({ palette }) => ({
    color: palette.alert.success.text,
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
