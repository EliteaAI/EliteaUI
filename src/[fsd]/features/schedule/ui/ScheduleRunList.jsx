import { memo, useMemo } from 'react';

import { Box, Chip, Link, Typography } from '@mui/material';

import { compareRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';
import { useRunHistorySorting } from '@/[fsd]/entities/run-history/lib/hooks';
import { RunHistorySortableHeader } from '@/[fsd]/entities/run-history/ui';

import { formatRunDuration, formatRunStarted, toRunStatusLabel } from '../lib/helpers';
import ScheduleRunStatusChip from './ScheduleRunStatusChip';

// Minimums keep a start time on one line, the header labels whole and a Success chip uncut
const COLUMNS =
  'minmax(8rem, 1.2fr) minmax(5.5rem, 0.8fr) minmax(8rem, 1.6fr) minmax(5.5rem, 0.8fr) 4.5rem 4.5rem';
const HEADER_ITEMS = [
  { label: 'Started', type: 'started' },
  { label: 'Trigger', type: 'trigger' },
  { label: 'Status', type: 'status' },
  { label: 'Duration', type: 'duration' },
  { label: 'Version', type: 'version' },
];
const NO_VALUE = '–';

const versionOf = (run, versionNames) => versionNames[run.version_id] ?? NO_VALUE;

// The runs of one schedule (US-32 R4); Open, or Review for a waiting run, shows the run in the test panel
const ScheduleRunList = memo(props => {
  const { runs, versionNames = {}, selectedRunId, onOpen } = props;

  const { sortConfig, handleSortItems, getSortedData } = useRunHistorySorting('started');
  const sortedRuns = useMemo(
    () =>
      getSortedData(runs, {
        started: (a, b) => compareRunTimestamp(a.started_at, b.started_at),
        trigger: (a, b) => (a.trigger ?? '').localeCompare(b.trigger ?? ''),
        status: (a, b) => toRunStatusLabel(a.status).localeCompare(toRunStatusLabel(b.status)),
        duration: (a, b) => (a.duration_ms ?? -1) - (b.duration_ms ?? -1),
        version: (a, b) => versionOf(a, versionNames).localeCompare(versionOf(b, versionNames)),
      }),
    [runs, getSortedData, versionNames],
  );

  const styles = scheduleRunListStyles();

  if (!runs.length)
    return (
      <Typography
        variant="bodyMedium"
        color="text.secondary"
        sx={styles.empty}
      >
        No runs yet.
      </Typography>
    );

  return (
    <Box>
      <RunHistorySortableHeader
        headerItems={HEADER_ITEMS}
        sortConfig={sortConfig}
        onSort={handleSortItems}
        gridTemplateColumns={COLUMNS}
      />
      {sortedRuns.map(run => (
        <Box
          key={run.id}
          data-testid="schedule-run-row"
          aria-selected={run.id === selectedRunId}
          sx={[styles.row, run.id === selectedRunId && styles.selected]}
        >
          <Typography
            data-testid="schedule-run-started"
            variant="bodyMedium"
            noWrap
            title={new Date(run.started_at).toLocaleString()}
          >
            {formatRunStarted(run.started_at)}
          </Typography>
          <Box>
            <Chip
              data-testid="schedule-run-trigger"
              size="small"
              variant="outlined"
              label={run.trigger}
              sx={styles.trigger[run.trigger] ?? styles.trigger.manual}
            />
          </Box>
          <Box
            data-testid="schedule-run-status-cell"
            sx={styles.status}
          >
            <ScheduleRunStatusChip status={run.status} />
            {run.reason && (
              <Typography
                variant="bodySmall"
                color="text.secondary"
                sx={styles.reason}
                title={run.reason}
              >
                {run.reason}
              </Typography>
            )}
          </Box>
          <Typography
            data-testid="schedule-run-duration"
            variant="bodyMedium"
            noWrap
          >
            {formatRunDuration(run.duration_ms)}
          </Typography>
          <Typography
            data-testid="schedule-run-version"
            variant="bodyMedium"
            noWrap
          >
            {versionOf(run, versionNames)}
          </Typography>
          <Box data-testid="schedule-run-open">
            {run.conversation_id != null ? (
              <Link
                component="button"
                type="button"
                variant="bodyMedium"
                onClick={() => onOpen(run)}
              >
                {run.status === 'waiting_for_approval' ? 'Review' : 'Open'}
              </Link>
            ) : (
              NO_VALUE
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
});

ScheduleRunList.displayName = 'ScheduleRunList';

/** @type {MuiSx} */
const scheduleRunListStyles = () => ({
  empty: { padding: '1rem 0', textAlign: 'center' },
  row: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns: COLUMNS,
    alignItems: 'center',
    minHeight: '3.25rem',
    padding: '0.375rem 0',
    color: palette.text.secondary,
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    '& > *': { padding: '0 1rem', minWidth: 0 },
  }),
  selected: ({ palette }) => ({ backgroundColor: palette.background.surface.interactive.default }),
  // test: the primary colour (magenta light, cyan dark), cron: blue, manual: grey
  trigger: {
    test: ({ palette }) => ({ color: palette.text.accent, borderColor: palette.primary.main }),
    cron: ({ palette }) => ({
      color: palette.alert.info.text,
      borderColor: palette.alert.info.border,
      backgroundColor: palette.alert.info.background,
    }),
    manual: ({ palette }) => ({ color: palette.text.secondary, borderColor: palette.border.lines }),
  },
  status: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' },
  reason: { maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
});

export default ScheduleRunList;
