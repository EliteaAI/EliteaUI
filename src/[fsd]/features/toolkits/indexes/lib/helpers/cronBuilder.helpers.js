import { converter } from 'react-js-cron';

export const PERIOD_OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

export const WEEKDAY_OPTIONS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
];

export const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
}));

export const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  value: i,
  label: String(i).padStart(2, '0'),
}));

export const MONTH_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));

export const DEFAULT_CRON_STATE = { period: 'week', minutes: 0, hours: 0, monthDay: null, weekDay: null };

export const parseCron = expression => {
  try {
    const parts = (expression || '').trim().split(/\s+/);
    if (parts.length !== 5) return null;
    const [, , dayF, , weekdayF] = parts;

    let period = 'day';
    if (dayF !== '*') period = 'month';
    else if (weekdayF !== '*') period = 'week';

    const [minutes, hours, monthDays, , weekDays] = converter.parseCronString(expression);

    return {
      period,
      minutes: minutes[0] ?? 0,
      hours: hours[0] ?? 0,
      monthDay: dayF !== '*' ? (monthDays[0] ?? null) : null,
      weekDay: weekdayF !== '*' ? (weekDays[0] ?? null) : null,
    };
  } catch {
    return null;
  }
};

export const buildCron = ({ period, minutes, hours, monthDay, weekDay }) => {
  const m = Number.isFinite(minutes) ? minutes : 0;
  const h = Number.isFinite(hours) ? hours : 0;

  if (period === 'day') return converter.getCronStringFromValues('day', [], [], [], [h], [m]);
  if (period === 'week') {
    const wd = weekDay != null ? weekDay : '*';
    return `${m} ${h} * * ${wd}`;
  }
  if (period === 'month') {
    const md = monthDay != null ? monthDay : '*';
    const wd = weekDay != null ? weekDay : '*';
    return `${m} ${h} ${md} * ${wd}`;
  }
  return '0 0 * * *';
};
