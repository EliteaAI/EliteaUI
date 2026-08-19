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

export const DEFAULT_CRON_STATE = { period: 'week', minutes: 0, hours: 0, monthDays: [], weekDays: [] };

export const parseCron = expression => {
  try {
    const parts = (expression || '').trim().split(/\s+/);
    if (parts.length !== 5) return null;
    const [, , dayF, , weekdayF] = parts;

    let period = 'day';
    if (dayF !== '*') period = 'month';
    else if (weekdayF !== '*') period = 'week';

    const [mins, hrs, monthDays, , weekDays] = converter.parseCronString(expression);

    return {
      period,
      minutes: mins[0] ?? 0,
      hours: hrs[0] ?? 0,
      monthDays: dayF !== '*' ? monthDays : [],
      weekDays: weekdayF !== '*' ? weekDays : [],
    };
  } catch {
    return null;
  }
};

// Only uses range notation when ALL values form a single consecutive run
// (e.g. [1,2,3,4,5] → "1-5"). Otherwise joins with commas.
// Keeps output compatible with the validator regex which allows a single range OR a comma list.
const toCompactField = nums => {
  if (!nums?.length) return '*';
  const sorted = [...nums].sort((a, b) => a - b);
  const isConsecutiveRun = sorted.length > 1 && sorted[sorted.length - 1] - sorted[0] === sorted.length - 1;
  if (isConsecutiveRun) return `${sorted[0]}-${sorted[sorted.length - 1]}`;
  return sorted.join(',');
};

export const buildCron = ({ period, minutes, hours, monthDays, weekDays }) => {
  const m = Number.isFinite(minutes) ? minutes : 0;
  const h = Number.isFinite(hours) ? hours : 0;

  if (period === 'day') return `${m} ${h} * * *`;
  if (period === 'week') return `${m} ${h} * * ${toCompactField(weekDays)}`;
  if (period === 'month') {
    return `${m} ${h} ${toCompactField(monthDays)} * ${toCompactField(weekDays)}`;
  }
  return '0 0 * * *';
};
