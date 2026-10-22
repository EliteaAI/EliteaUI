import { format, fromUnixTime } from 'date-fns';

import { toRunStatusLabel } from '@/[fsd]/entities/schedule/lib/helpers';

const RUN_TIMESTAMP_FORMAT = 'dd-MM-yyyy, hh:mm a';
export const RUN_ANALYTICS_TIMESTAMP_FORMAT = 'dd MMM yyyy, hh:mm a';
// Usage is tagged with `run_id` / `eval_run_id` only from this date; older runs have nothing to show
const RUN_ANALYTICS_AVAILABLE_FROM = Date.UTC(2026, 8, 30);

// CR-22 D7: with extra columns the tracks are fixed rem widths: Date, extras, Execution type, Version, Duration
const FIXED_TRACKS = { date: '7.5rem', event: '8rem', version: '5rem', duration: '5rem' };

export const resolveRunHistoryColumns = (noVersions, hasEvent, extraColumns = []) => {
  if (extraColumns.length) {
    const { date, event, version, duration } = FIXED_TRACKS;
    return [
      date,
      ...extraColumns.map(column => column.width),
      ...(hasEvent ? [event] : []),
      ...(noVersions ? [] : [version]),
      duration,
    ].join(' ');
  }

  const date = '1.5fr';
  const event = hasEvent ? ['1.5fr'] : [];
  const version = noVersions ? [] : ['1.5fr'];
  const duration = hasEvent || !noVersions ? '1fr' : '1.5fr';

  return [date, ...event, ...version, duration].join(' ');
};

export const compareRunDuration = (a, b) => {
  if (a.duration == null && b.duration == null) return 0;
  if (a.duration == null) return 1;
  if (b.duration == null) return -1;

  return a.duration - b.duration;
};

// Conversations serialize as "…+00:00Z" — an offset AND a trailing Z, which Date rejects outright.
const toRunDate = value => {
  if (typeof value === 'number') return fromUnixTime(value);

  const raw = String(value).replace(/([+-]\d{2}:?\d{2})Z$/, '$1');
  const carriesZone = /(Z|[+-]\d{2}:?\d{2})$/.test(raw);

  return new Date(carriesZone ? raw : `${raw}Z`);
};

export const parseRunTimestamp = value => {
  if (value === null || value === undefined || value === '') return NaN;

  return toRunDate(value).getTime();
};

// Sortable columns are negated for descending, which would invert any ±1 sink and float an
// unreadable row to the top. Leaving it in place is the only direction-neutral answer.
export const compareRunTimestamp = (a, b) => {
  const left = parseRunTimestamp(a);
  const right = parseRunTimestamp(b);

  if (Number.isNaN(left) || Number.isNaN(right)) return 0;

  return left - right;
};

export const byNewestRunFirst = (a, b) => {
  const left = parseRunTimestamp(a.created_at);
  const right = parseRunTimestamp(b.created_at);

  if (Number.isNaN(left) && Number.isNaN(right)) return 0;
  if (Number.isNaN(left)) return 1;
  if (Number.isNaN(right)) return -1;

  return right - left;
};

export const formatRunTimestamp = (value, pattern = RUN_TIMESTAMP_FORMAT) => {
  if (value === null || value === undefined || value === '') return '—';

  const date = toRunDate(value);
  if (Number.isNaN(date.getTime())) return '—';

  return format(date, pattern);
};

export const toRunISOString = value => {
  const time = parseRunTimestamp(value);

  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
};

// Restoring and re-running a chat bumps `updated_at`, so it wins over `created_at`. A missing or
// unparseable timestamp is NaN, which never passes the cutoff.
export const hasRunAnalytics = run =>
  parseRunTimestamp(run?.updated_at || run?.created_at) >= RUN_ANALYTICS_AVAILABLE_FROM;

// One label per trigger source of the shared run enum (BUG-12); `manual` stays for older runs
const EXECUTION_TYPE_LABELS = new Map([
  ['manual', 'Manual (legacy)'],
  ['scheduled', 'Scheduled'],
  ['schedule_manual', 'Run now'],
  ['chat', 'Chat'],
  ['api', 'API'],
  ['mcp', 'MCP'],
  ['webhook', 'Webhook'],
]);

// A missing or unknown type (older runs) renders "-" and the row stays selectable. Run now and Test run both store
// schedule_manual, so the run record's trigger tells a test apart (CR-22, R3.4)
export const toExecutionTypeRow = row => ({
  ...row,
  event_label:
    row.schedule_run?.trigger === 'test' ? 'Test' : (EXECUTION_TYPE_LABELS.get(row.execution_type) ?? '-'),
});

// CR-22 R3.1-R3.3: the Schedule and Status columns of Agent and Pipeline Run History; '-' without a run record
export const SCHEDULE_RUN_COLUMNS = [
  { id: 'schedule', label: 'Schedule', width: '9rem', render: row => row.schedule_run?.schedule_name ?? '-' },
  {
    id: 'status',
    label: 'Status',
    width: '7rem',
    render: row => (row.schedule_run ? toRunStatusLabel(row.schedule_run.status) : '-'),
  },
];
