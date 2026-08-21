import cronstrue from 'cronstrue';

const DAILY_FLOOR_MSG = 'Frequency cannot be more than once per day';

const validateMinimumFrequency = (minute, hour) => {
  const invalid = {
    isValid: false,
    field: 'minutes',
    message: 'Frequency cannot be less than every hour',
  };

  if (minute === '*') return invalid;
  if (minute.includes(',')) return invalid;

  if (minute.includes('/')) {
    const stepMatch = minute.match(/\*\/(\d+)/);

    if (stepMatch) {
      const stepValue = parseInt(stepMatch[1], 10);

      if (stepValue < 60) return invalid;
    }
  }

  if (minute.includes('-')) {
    const rangeMatch = minute.match(/(\d+)-(\d+)/);

    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);

      if (end > start) return invalid;
    }
  }

  if (hour.includes('/')) {
    const stepMatch = hour.match(/\*\/(\d+)/);
    if (stepMatch) {
      const stepValue = parseInt(stepMatch[1], 10);

      if (stepValue === 0)
        return {
          isValid: false,
          field: 'hours',
          message: 'Invalid hour step value. Step cannot be 0.',
        };
    }
  }

  return { isValid: true };
};

const validateMinimumDailyFrequency = (minute, hour) => {
  const invalid = {
    isValid: false,
    field: 'hours',
    message: DAILY_FLOOR_MSG,
  };

  const hourly = validateMinimumFrequency(minute, hour);
  if (!hourly.isValid) {
    if (hourly.message && hourly.message.startsWith('Invalid hour step')) {
      return hourly;
    }
    return invalid;
  }

  if (hour === '*') return invalid;
  if (hour.includes(',')) return invalid;

  if (hour.includes('-')) {
    const rangeMatch = hour.match(/(\d+)-(\d+)/);

    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);

      if (end > start) return invalid;
    }
  }

  if (hour.includes('/')) {
    const stepMatch = hour.match(/\*\/(\d+)/);

    if (stepMatch) {
      const stepValue = parseInt(stepMatch[1], 10);
      if (stepValue < 24) return invalid;
    }
  }

  return { isValid: true };
};

export const validateCronExpression = input => {
  if (!input || typeof input !== 'string') {
    return { isValid: false, message: 'Cron expression is required' };
  }

  const parts = input.trim().split(/\s+/);

  if (parts.length !== 5) {
    return {
      isValid: false,
      message: 'Cron must have exactly 5 parts with space between every part',
    };
  }

  const [minute, hour, day, month, weekday] = parts;

  const minutePattern = /^(\*|([0-5]?\d)(,([0-5]?\d))*|([0-5]?\d)-([0-5]?\d)|(\*\/([1-5]?\d)))$/;
  const hourPattern = /^(\*|(1?\d|2[0-3])(,(1?\d|2[0-3]))*|(1?\d|2[0-3])-(1?\d|2[0-3])|(\*\/(1?\d|2[0-3])))$/;
  const dayPattern =
    /^(\*|([1-2]?\d|3[01])(,([1-2]?\d|3[01]))*|([1-2]?\d|3[01])-([1-2]?\d|3[01])|(\*\/([1-2]?\d|3[01])))$/;
  const monthPattern =
    /^(\*|([1-9]|1[0-2])(,([1-9]|1[0-2]))*|([1-9]|1[0-2])-([1-9]|1[0-2])|(\*\/([1-9]|1[0-2])))$/;
  const weekdayPattern = /^(\*|[0-7](,[0-7])*|[0-7]-[0-7]|(\*\/[0-7]))$/;

  if (!minutePattern.test(minute))
    return {
      isValid: false,
      field: 'minutes',
      message: 'Invalid minute (0-59, *, ranges, lists, steps allowed)',
    };

  if (!hourPattern.test(hour))
    return {
      isValid: false,
      field: 'hours',
      message: 'Invalid hour (0-23, *, ranges, lists, steps allowed)',
    };

  if (!dayPattern.test(day))
    return {
      isValid: false,
      field: 'month-days',
      message: 'Invalid day (1-31, *, ranges, lists, steps allowed)',
    };

  if (!monthPattern.test(month))
    return {
      isValid: false,
      field: 'months',
      message: 'Invalid month (1-12, *, ranges, lists, steps allowed)',
    };

  if (!weekdayPattern.test(weekday))
    return {
      isValid: false,
      field: 'week-days',
      message: 'Invalid weekday (0-7 where 0,7=Sunday, *, ranges, lists, steps allowed)',
    };

  const frequencyCheck = validateMinimumDailyFrequency(minute, hour);
  if (!frequencyCheck.isValid) return frequencyCheck;

  try {
    return { isValid: true, message: cronstrue.toString(input, { use24HourTimeFormat: true }) };
  } catch {
    return { isValid: false, message: 'Invalid cron expression format' };
  }
};

const matchesCronField = (value, field) => {
  if (field === '*') return true;
  if (field.includes('/')) {
    const [, step] = field.split('/');
    return value % parseInt(step, 10) === 0;
  }
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(Number);
    return value >= start && value <= end;
  }
  if (field.includes(',')) {
    return field.split(',').map(Number).includes(value);
  }
  return value === parseInt(field, 10);
};

export const getNextCronRunInTimezone = (expression, scheduleTimezone) => {
  if (!scheduleTimezone) return getNextCronRun(expression);
  const now = new Date();
  const tzNow = new Date(now.toLocaleString('en-US', { timeZone: scheduleTimezone }));
  const offsetMs = tzNow.getTime() - now.getTime();
  const nextInTz = getNextCronRun(expression, tzNow);
  if (!nextInTz) return null;
  return new Date(nextInTz.getTime() - offsetMs);
};

export const getNextCronRun = (expression, fromDate = new Date()) => {
  if (!expression || typeof expression !== 'string') return null;
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [minuteF, hourF, dayF, monthF, weekdayF] = parts;

  const d = new Date(fromDate);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() + 1);

  for (let i = 0; i < 366 * 24 * 60; i++) {
    const mon = d.getMonth() + 1;
    const dom = d.getDate();
    const dow = d.getDay();
    const hr = d.getHours();
    const min = d.getMinutes();

    const dowMatch =
      weekdayF === '*' || matchesCronField(dow, weekdayF) || (dow === 0 && matchesCronField(7, weekdayF));

    if (
      matchesCronField(mon, monthF) &&
      matchesCronField(dom, dayF) &&
      dowMatch &&
      matchesCronField(hr, hourF) &&
      matchesCronField(min, minuteF)
    ) {
      return d;
    }
    d.setMinutes(d.getMinutes() + 1);
  }
  return null;
};
