import { memo, useMemo } from 'react';

import { Box, ButtonBase, Chip, Typography } from '@mui/material';

import { compareRunTimestamp } from '@/[fsd]/entities/run-history/lib/helpers';

import { formatRunDuration, formatRunStarted, toRunStatusLabel } from '../lib/helpers';
import ScheduleRunStatusChip from './ScheduleRunStatusChip';

const NO_VALUE = '–';

// The sort options of the Runs section; Newest is the default
export const RUN_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'status', label: 'Status' },
  { value: 'trigger', label: 'Trigger' },
  { value: 'duration', label: 'Duration' },
  { value: 'version', label: 'Version' },
];

const newestFirst = (a, b) => compareRunTimestamp(b.started_at, a.started_at);
// A missing value sorts after every value; equal values keep the newest run first
const byKey = (key, compare) => (a, b) => {
  const left = key(a);
  const right = key(b);
  if (left == null || right == null) return (left == null) - (right == null) || newestFirst(a, b);
  return compare(left, right) || newestFirst(a, b);
};
const byText = (left, right) => left.localeCompare(right, undefined, { numeric: true });

const sortsFor = versionNames => ({
  newest: newestFirst,
  oldest: (a, b) => compareRunTimestamp(a.started_at, b.started_at),
  status: byKey(run => toRunStatusLabel(run.status), byText),
  trigger: byKey(run => run.trigger, byText),
  duration: byKey(
    run => run.duration_ms,
    (left, right) => right - left,
  ),
  version: byKey(run => versionNames[run.version_id], byText),
});

const versionOf = (run, versionNames) => versionNames[run.version_id] ?? NO_VALUE;

// The runs of one schedule as two-line rows (US-32 R4, CR-21). A row opens the run in the test panel;
// a run without a conversation opens too, and shows its log and reason there.
const ScheduleRunList = memo(props => {
  const { runs, versionNames = {}, selectedRunId, sort = 'newest', onOpen } = props;

  const sortedRuns = useMemo(() => {
    const sorts = sortsFor(versionNames);
    return [...runs].sort(sorts[sort] ?? sorts.newest);
  }, [runs, sort, versionNames]);

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
    <Box
      component="ul"
      sx={styles.list}
    >
      {sortedRuns.map(run => {
        const selected = run.id === selectedRunId;
        return (
          <Box
            component="li"
            key={run.id}
            data-testid="schedule-run-row"
            sx={styles.item}
          >
            <ButtonBase
              data-run-id={run.id}
              aria-current={selected ? 'true' : undefined}
              sx={[styles.row, selected && styles.selected]}
              onClick={() => onOpen(run)}
            >
              <Box
                data-testid="schedule-run-line1"
                sx={styles.line}
              >
                <Typography
                  data-testid="schedule-run-started"
                  variant="bodyMedium"
                  noWrap
                  sx={styles.started}
                  title={new Date(run.started_at).toLocaleString()}
                >
                  {formatRunStarted(run.started_at)}
                </Typography>
                <Chip
                  data-testid="schedule-run-trigger"
                  size="small"
                  variant="outlined"
                  label={run.trigger}
                  sx={styles.trigger[run.trigger] ?? styles.trigger.manual}
                />
                <Box sx={styles.status}>
                  <ScheduleRunStatusChip status={run.status} />
                </Box>
              </Box>
              <Box
                data-testid="schedule-run-line2"
                sx={styles.line}
              >
                <Typography
                  variant="bodySmall"
                  noWrap
                  sx={styles.meta}
                >
                  <span data-testid="schedule-run-version">{versionOf(run, versionNames)}</span>
                  {' · '}
                  <span data-testid="schedule-run-duration">{formatRunDuration(run.duration_ms)}</span>
                </Typography>
                {run.reason && (
                  <Typography
                    variant="bodySmall"
                    noWrap
                    sx={styles.reason}
                    title={run.reason}
                  >
                    {run.reason}
                  </Typography>
                )}
                {run.status === 'waiting_for_approval' && (
                  <Typography
                    component="span"
                    variant="bodySmall"
                    sx={styles.review}
                  >
                    Review
                  </Typography>
                )}
              </Box>
            </ButtonBase>
          </Box>
        );
      })}
    </Box>
  );
});

ScheduleRunList.displayName = 'ScheduleRunList';

/** @type {MuiSx} */
const scheduleRunListStyles = () => ({
  empty: { padding: '1rem 0', textAlign: 'center' },
  list: { listStyle: 'none', margin: 0, padding: 0 },
  item: ({ palette }) => ({ borderBottom: `0.0625rem solid ${palette.border.lines}` }),
  row: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '0.125rem',
    width: '100%',
    minHeight: '3.5rem',
    padding: '0.375rem 1rem',
    textAlign: 'left',
    color: palette.text.secondary,
    borderLeft: '0.1875rem solid transparent',
    '&:focus-visible': { outline: `0.125rem solid ${palette.primary.main}`, outlineOffset: '-0.125rem' },
  }),
  // A bar and aria-current, so the colour is not the only cue
  selected: ({ palette }) => ({
    backgroundColor: palette.background.surface.interactive.default,
    borderLeftColor: palette.primary.main,
  }),
  line: { display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 },
  started: { fontWeight: 600 },
  status: { marginLeft: 'auto' },
  meta: ({ palette }) => ({ color: palette.text.secondary, flexShrink: 0 }),
  reason: ({ palette }) => ({ color: palette.text.secondary, minWidth: 0 }),
  review: ({ palette }) => ({ marginLeft: 'auto', color: palette.text.link, textDecoration: 'underline' }),
  // test: the primary border with the strong ink (the magenta text is 4.3:1 on the card), cron: blue, manual: grey
  trigger: {
    test: ({ palette }) => ({ color: palette.text.secondary, borderColor: palette.primary.main }),
    cron: ({ palette }) => ({
      color: palette.alert.info.text,
      borderColor: palette.alert.info.border,
      backgroundColor: palette.alert.info.background,
    }),
    manual: ({ palette }) => ({ color: palette.text.secondary, borderColor: palette.border.lines }),
  },
});

export default ScheduleRunList;
