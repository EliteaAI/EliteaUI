import cronstrue from 'cronstrue';

const HOURLY_FLOOR_MSG = 'Frequency cannot be less than every hour';
const DAILY_FLOOR_MSG = 'Frequency cannot be more than once per day';

const validateMinimumFrequency = (minute, hour) => {
  const invalid = {
    isValid: false,
    message: HOURLY_FLOOR_MSG,
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
          message: 'Invalid hour step value. Step cannot be 0.',
        };
    }
  }

  return { isValid: true };
};

// Daily-floor variant used by index scheduling (indexing is heavier than
// pipeline runs, so we cap it at one execution per day). Pipelines keep the
// hourly floor via validateMinimumFrequency.
const validateMinimumDailyFrequency = (minute, hour) => {
  const invalid = {
    isValid: false,
    message: DAILY_FLOOR_MSG,
  };

  // Reuse the hourly check, but surface the daily message — anything that
  // fires more than once per hour also fires more than once per day, and
  // the user is configuring an index schedule, so they should see the
  // index-specific limit.
  const hourly = validateMinimumFrequency(minute, hour);
  if (!hourly.isValid) {
    // Preserve "Invalid hour step value. Step cannot be 0." (a syntax-level
    // error, not a frequency-floor violation).
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
    return { isValid: false, message: 'Invalid minute (0-59, *, ranges, lists, steps allowed)' };

  if (!hourPattern.test(hour))
    return { isValid: false, message: 'Invalid hour (0-23, *, ranges, lists, steps allowed)' };

  if (!dayPattern.test(day))
    return { isValid: false, message: 'Invalid day (1-31, *, ranges, lists, steps allowed)' };

  if (!monthPattern.test(month))
    return { isValid: false, message: 'Invalid month (1-12, *, ranges, lists, steps allowed)' };

  if (!weekdayPattern.test(weekday))
    return {
      isValid: false,
      message: 'Invalid weekday (0-7 where 0,7=Sunday, *, ranges, lists, steps allowed)',
    };

  const frequencyCheck = validateMinimumFrequency(minute, hour);
  if (!frequencyCheck.isValid) return frequencyCheck;

  try {
    return { isValid: true, message: cronstrue.toString(input, { use24HourTimeFormat: true }) };
  } catch {
    return { isValid: false, message: 'Invalid cron expression format' };
  }
};

export const validateCronExpressionDaily = input => {
  const base = validateCronExpression(input);
  if (!base.isValid) {
    // validateCronExpression runs the hourly frequency check internally; for
    // the index modal those rejections must surface the daily-floor message
    // instead. Other rejections (syntax errors, hour-step-zero) pass through.
    if (base.message === HOURLY_FLOOR_MSG) {
      return { isValid: false, message: DAILY_FLOOR_MSG };
    }
    return base;
  }

  const parts = input.trim().split(/\s+/);
  const [minute, hour] = parts;

  const dailyCheck = validateMinimumDailyFrequency(minute, hour);
  if (!dailyCheck.isValid) return dailyCheck;

  return base;
};
