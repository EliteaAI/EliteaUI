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

// True when the Builder shows this cron as it is: the cron it would build runs at the same times.
export const canBuildCron = expression => {
  const parsed = parseCron(expression);
  if (!parsed) return false;
  try {
    const runs = cron => JSON.stringify(converter.parseCronString(cron));
    return runs(buildCron(parsed)) === runs(expression);
  } catch {
    return false;
  }
};

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const joinWithAnd = items =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items.at(-1)}` : items[0];

const ordinal = day => {
  const rest = day % 100;
  if (rest >= 11 && rest <= 13) return `${day}th`;
  return `${day}${{ 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] ?? 'th'}`;
};

/** One sentence for a cron the Builder can show ("Runs every week at 00:00 on Saturday."); '' for any other. */
export const describeCron = expression => {
  const state = parseCron(expression);
  if (!state) return '';
  const time = `${String(state.hours).padStart(2, '0')}:${String(state.minutes).padStart(2, '0')}`;
  const days = joinWithAnd(state.weekDays.map(day => WEEKDAY_NAMES[day]).filter(Boolean));
  if (state.period === 'day') return `Runs every day at ${time}.`;
  if (state.period === 'week') return `Runs every week at ${time}${days ? ` on ${days}` : ''}.`;
  const monthDays = state.monthDays.length ? ` on the ${joinWithAnd(state.monthDays.map(ordinal))}` : '';
  return `Runs every month at ${time}${monthDays}${days ? `, only on ${days}` : ''}.`;
};
