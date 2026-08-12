import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { Box, Typography } from '@mui/material';

import {
  DEFAULT_CRON_STATE,
  HOUR_OPTIONS,
  MINUTE_OPTIONS,
  MONTH_DAY_OPTIONS,
  PERIOD_OPTIONS,
  WEEKDAY_OPTIONS,
  buildCron,
  parseCron,
} from '@/[fsd]/shared/lib/helpers/cronBuilder.helpers';

import CronSelect from './CronSelect';

const CronBuilder = memo(props => {
  const { value, onChange, invalidField } = props;
  const styles = cronBuilderStyles();

  const parsed = useMemo(() => parseCron(value) ?? DEFAULT_CRON_STATE, [value]);

  const [period, setPeriod] = useState(parsed.period);
  const prevValue = useRef(value);
  const internalChange = useRef(false);

  useEffect(() => {
    if (value !== prevValue.current) {
      prevValue.current = value;
      if (internalChange.current) {
        internalChange.current = false;
        return;
      }
      const p = parseCron(value);
      if (p) setPeriod(p.period);
    }
  }, [value]);

  const state = useMemo(() => ({ ...parsed, period }), [parsed, period]);

  const emit = useCallback(
    patch => {
      internalChange.current = true;
      if (patch.period !== undefined) setPeriod(patch.period);
      onChange(buildCron({ ...state, ...patch }));
    },
    [state, onChange],
  );

  const periodOption = useMemo(
    () => PERIOD_OPTIONS.find(o => o.value === state.period) ?? null,
    [state.period],
  );

  const weekDayOptions = useMemo(
    () => WEEKDAY_OPTIONS.filter(o => state.weekDays.includes(o.value)),
    [state.weekDays],
  );

  const monthDayOptions = useMemo(
    () => MONTH_DAY_OPTIONS.filter(o => state.monthDays.includes(o.value)),
    [state.monthDays],
  );

  const hourOption = useMemo(
    () => HOUR_OPTIONS.find(o => o.value === state.hours) ?? HOUR_OPTIONS[0],
    [state.hours],
  );

  const minuteOption = useMemo(
    () => MINUTE_OPTIONS.find(o => o.value === state.minutes) ?? MINUTE_OPTIONS[0],
    [state.minutes],
  );

  const hourError = invalidField === 'hours';
  const minuteError = invalidField === 'minutes';
  const monthDayError = invalidField === 'month-days';
  const weekDayError = invalidField === 'week-days';

  return (
    <Box sx={styles.row}>
      <Typography
        variant="bodyMedium"
        sx={styles.label}
      >
        Every
      </Typography>

      <CronSelect
        value={periodOption}
        options={PERIOD_OPTIONS}
        onChange={opt => emit({ period: opt?.value ?? null, monthDays: [], weekDays: [] })}
        allowEmpty={false}
        sx={styles.wideSelect}
      />

      {state.period === 'month' && (
        <>
          <Typography
            variant="bodyMedium"
            sx={styles.label}
          >
            on
          </Typography>
          <CronSelect
            value={monthDayOptions}
            options={MONTH_DAY_OPTIONS}
            onChange={opts => emit({ monthDays: opts.map(o => o.value) })}
            error={monthDayError}
            multiple
            placeholder="Day"
            sx={styles.wideSelect}
          />
          <Typography
            variant="bodyMedium"
            sx={styles.label}
          >
            and
          </Typography>
          <CronSelect
            value={weekDayOptions}
            options={WEEKDAY_OPTIONS}
            onChange={opts => emit({ weekDays: opts.map(o => o.value) })}
            error={weekDayError}
            multiple
            placeholder="Weekday"
            sx={styles.wideSelect}
          />
        </>
      )}

      {state.period === 'week' && (
        <>
          <Typography
            variant="bodyMedium"
            sx={styles.label}
          >
            on
          </Typography>
          <CronSelect
            value={weekDayOptions}
            options={WEEKDAY_OPTIONS}
            onChange={opts => emit({ weekDays: opts.map(o => o.value) })}
            error={weekDayError}
            multiple
            placeholder="Weekday"
            sx={styles.wideSelect}
          />
        </>
      )}

      <Box sx={styles.timeGroup}>
        <Typography
          variant="bodyMedium"
          sx={styles.label}
        >
          at
        </Typography>
        <CronSelect
          value={hourOption}
          options={HOUR_OPTIONS}
          onChange={opt => opt && emit({ hours: opt.value })}
          error={hourError}
          sx={styles.narrowSelect}
        />
        <Typography
          variant="bodyMedium"
          sx={styles.label}
        >
          :
        </Typography>
        <CronSelect
          value={minuteOption}
          options={MINUTE_OPTIONS}
          onChange={opt => opt && emit({ minutes: opt.value })}
          error={minuteError}
          sx={styles.narrowSelect}
        />
      </Box>
    </Box>
  );
});

CronBuilder.displayName = 'CronBuilder';

/** @type {MuiSx} */
const cronBuilderStyles = () => ({
  row: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    rowGap: '1rem',
    columnGap: '0.5rem',
    width: '100%',
  },
  label: {
    color: ({ palette }) => palette.text.primary,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    fontSize: '0.875rem',
    lineHeight: '1.5rem',
  },
  timeGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexShrink: 0,
  },
  wideSelect: {
    width: '8.75rem',
  },
  narrowSelect: {
    width: '5rem',
  },
});

export default CronBuilder;
