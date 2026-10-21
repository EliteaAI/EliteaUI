import { memo, useMemo, useState } from 'react';

import { useSearchParams } from 'react-router-dom';

import { Box, Link, Typography } from '@mui/material';

import { compareRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';
import { useRunHistorySorting } from '@/[fsd]/entities/run-history/lib/hooks';
import { RunHistorySortableHeader } from '@/[fsd]/entities/run-history/ui';

import { formatRunStarted, toRunStatusLabel, toRunTriggerLabel } from '../lib/helpers';
import ScheduleRunConversation from './ScheduleRunConversation';
import ScheduleRunStatusChip from './ScheduleRunStatusChip';

// Minimums keep a start time on one line, the header labels whole and a Success chip uncut
const COLUMNS = 'minmax(8rem, 1.2fr) minmax(7rem, 1fr) minmax(8rem, 1.6fr) 3.5rem';
const HEADER_ITEMS = [
  { label: 'Started', type: 'started' },
  { label: 'Trigger', type: 'trigger' },
  { label: 'Status', type: 'status' },
];
const SORT_FUNCTIONS = {
  started: (a, b) => compareRunTimestamp(a.started_at, b.started_at),
  trigger: (a, b) => toRunTriggerLabel(a.trigger).localeCompare(toRunTriggerLabel(b.trigger)),
  status: (a, b) => toRunStatusLabel(a.status).localeCompare(toRunStatusLabel(b.status)),
};

// The runs of one schedule; Open shows the run's conversation below the table (R4.1, R4.2)
const ScheduleRunList = memo(props => {
  const { runs, schedule } = props;

  const [openedRunId, setOpenedRunId] = useState(null);
  // The approval notice links here with the conversation of the waiting run (R1.2)
  const linkedConversationId = useSearchParams()[0].get('history_run_id');
  const { sortConfig, handleSortItems, getSortedData } = useRunHistorySorting('started');
  const sortedRuns = useMemo(() => getSortedData(runs, SORT_FUNCTIONS), [runs, getSortedData]);
  const openedRun = runs.find(run =>
    openedRunId == null
      ? linkedConversationId != null && String(run.conversation_id) === linkedConversationId
      : run.id === openedRunId && run.conversation_id != null,
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
    <Box sx={styles.root}>
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
            sx={[styles.row, run.id === openedRun?.id && styles.selected]}
          >
            <Typography
              data-testid="schedule-run-started"
              variant="bodyMedium"
              noWrap
              title={new Date(run.started_at).toLocaleString()}
            >
              {formatRunStarted(run.started_at)}
            </Typography>
            <Typography
              data-testid="schedule-run-trigger"
              variant="bodyMedium"
              noWrap
            >
              {toRunTriggerLabel(run.trigger)}
            </Typography>
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
            <Box
              data-testid="schedule-run-open"
              sx={styles.open}
            >
              {run.conversation_id != null ? (
                <Link
                  component="button"
                  type="button"
                  variant="bodyMedium"
                  onClick={() => setOpenedRunId(run.id)}
                >
                  Open
                </Link>
              ) : (
                '–'
              )}
            </Box>
          </Box>
        ))}
      </Box>
      {openedRun && (
        <ScheduleRunConversation
          run={openedRun}
          schedule={schedule}
        />
      )}
    </Box>
  );
});

ScheduleRunList.displayName = 'ScheduleRunList';

/** @type {MuiSx} */
const scheduleRunListStyles = () => ({
  root: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  empty: { padding: '1rem 0', textAlign: 'center' },
  row: ({ palette }) => ({
    display: 'grid',
    gridTemplateColumns: COLUMNS,
    alignItems: 'center',
    minHeight: '2.75rem',
    padding: '0.375rem 0',
    color: palette.text.secondary,
    borderBottom: `0.0625rem solid ${palette.border.lines}`,
    '& > *': { padding: '0 1rem', minWidth: 0 },
  }),
  selected: ({ palette }) => ({ backgroundColor: palette.background.surface.interactive.default }),
  status: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' },
  reason: { maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  open: { textAlign: 'right' },
});

export default ScheduleRunList;
