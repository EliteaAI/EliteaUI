import cronstrue from 'cronstrue';

const validateMinimumFrequency = (minute, hour) => {
  const invalid = {
    isValid: false,
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
          message: 'Invalid hour step value. Step cannot be 0.',
        };
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
