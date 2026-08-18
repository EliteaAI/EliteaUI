import { format, fromUnixTime } from 'date-fns';

const RUN_TIMESTAMP_FORMAT = 'dd-MM-yyyy, hh:mm a';

export const resolveRunHistoryColumns = (noVersions, hasEvent) => {
  const date = '1.5fr';
  const event = hasEvent ? ['1.5fr'] : [];
  const version = noVersions ? [] : ['1.5fr'];
  const duration = hasEvent || !noVersions ? '1fr' : '1.5fr';

  return [date, ...event, ...version, duration].join(' ');
};

export const formatRunTimestamp = value => {
  if (value === null || value === undefined || value === '') return '—';

  const date = typeof value === 'number' ? fromUnixTime(value) : new Date(String(value).replace('Z', ''));
  if (Number.isNaN(date.getTime())) return '—';

  return format(date, RUN_TIMESTAMP_FORMAT);
};
