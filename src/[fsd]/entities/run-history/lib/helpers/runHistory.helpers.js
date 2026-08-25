import { format, fromUnixTime } from 'date-fns';

const RUN_TIMESTAMP_FORMAT = 'dd-MM-yyyy, hh:mm a';

export const resolveRunHistoryColumns = (noVersions, hasEvent) => {
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

export const formatRunTimestamp = value => {
  if (value === null || value === undefined || value === '') return '—';

  const date = toRunDate(value);
  if (Number.isNaN(date.getTime())) return '—';

  return format(date, RUN_TIMESTAMP_FORMAT);
};
