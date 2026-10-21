import { MONTH_NAMES, MONTH_SHORT } from '@/[fsd]/features/settings/lib/constants/period.constants.js';

export const formatPeriodLabel = period => {
  if (!period || period.length < 6) return period || '';

  const year = parseInt(period.slice(0, 4), 10);
  const month = parseInt(period.slice(4, 6), 10);

  return `${MONTH_NAMES[month - 1]} ${year}`;
};

/** Parse a YYYYMM period label and return the full month name (e.g. "202409" → "September"). */
export const parsePeriodMonth = label => {
  if (!label || label.length < 6) return '';
  const idx = parseInt(label.slice(4, 6), 10) - 1;
  return MONTH_NAMES[idx] || '';
};

/** Short label for a bar chart: "Sep" for past months, "Sep (so far)" for the current one. */
export const formatPeriodShort = (period, isCurrentPeriod) => {
  if (!period || period.length < 6) return period;
  const month = parseInt(period.slice(4, 6), 10);
  const label = MONTH_SHORT[month - 1];
  return isCurrentPeriod ? `${label} (so far)` : label;
};

export const formatPeriodDateRange = (period, currentPeriod) => {
  if (!period || period.length < 6) return '';

  const year = parseInt(period.slice(0, 4), 10);
  const month = parseInt(period.slice(4, 6), 10);
  const monthName = MONTH_SHORT[month - 1];

  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  if (period === currentPeriod) {
    const today = new Date();
    const endDay =
      today.getUTCMonth() + 1 === month && today.getUTCFullYear() === year ? today.getUTCDate() : daysInMonth;
    return `${monthName} 1 – ${endDay}`;
  }

  return `${monthName} 1 – ${daysInMonth}`;
};
