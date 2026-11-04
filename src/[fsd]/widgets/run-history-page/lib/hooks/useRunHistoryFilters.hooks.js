import { useCallback, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { toRunStatusLabel } from '@/[fsd]/entities/schedule';

import {
  ALL_OPTION_VALUE,
  FILTER_PARAMS,
  NO_QUERY_PARAMS,
  STATUS_VALUES,
  TRIGGER_OPTIONS,
} from '../constants/runHistoryFilters.constants';

const ALL_OPTION = { label: 'All', value: ALL_OPTION_VALUE };
const WHOLE_NUMBER = /^[1-9]\d*$/;

const STATUS_OPTIONS = [
  ALL_OPTION,
  ...STATUS_VALUES.map(value => ({ label: toRunStatusLabel(value), value })),
];
const TRIGGER_FILTER_OPTIONS = [ALL_OPTION, ...TRIGGER_OPTIONS];

// A value outside the allowed set reads as "All", so a hand-edited link never sends a bad filter
const readParam = (searchParams, name, isValid) => {
  const raw = searchParams.get(name) ?? ALL_OPTION_VALUE;
  return isValid(raw) ? raw : ALL_OPTION_VALUE;
};

export const useRunHistoryFilters = ({ schedules, versions }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const scheduleId = readParam(searchParams, FILTER_PARAMS.schedule, value => WHOLE_NUMBER.test(value));
  const versionId = readParam(searchParams, FILTER_PARAMS.version, value => WHOLE_NUMBER.test(value));
  const status = readParam(searchParams, FILTER_PARAMS.status, value => STATUS_VALUES.includes(value));
  const trigger = readParam(searchParams, FILTER_PARAMS.trigger, value =>
    TRIGGER_OPTIONS.some(option => option.value === value),
  );

  const queryParams = useMemo(() => {
    const params = {};
    if (scheduleId) params[FILTER_PARAMS.schedule] = Number(scheduleId);
    if (versionId) params[FILTER_PARAMS.version] = Number(versionId);
    if (status) params[FILTER_PARAMS.status] = status;
    if (trigger) params[FILTER_PARAMS.trigger] = trigger;
    return Object.keys(params).length ? params : NO_QUERY_PARAMS;
  }, [scheduleId, versionId, status, trigger]);

  const scheduleOptions = useMemo(
    () => [
      ALL_OPTION,
      ...schedules.map(schedule => ({ label: schedule.name, value: String(schedule.id) })),
      // A linked id the caller's list does not hold still shows, so the select is never blank
      ...(scheduleId && !schedules.some(schedule => String(schedule.id) === scheduleId)
        ? [{ label: `Schedule ${scheduleId}`, value: scheduleId }]
        : []),
    ],
    [schedules, scheduleId],
  );

  const versionOptions = useMemo(
    () => [
      ALL_OPTION,
      ...versions.map(version => ({ label: version.name, value: String(version.id) })),
      ...(versionId && !versions.some(version => String(version.id) === versionId)
        ? [{ label: `Version ${versionId}`, value: versionId }]
        : []),
    ],
    [versions, versionId],
  );

  const setParam = useCallback(
    (name, value) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          if (value) next.set(name, value);
          else next.delete(name);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const onScheduleChange = useCallback(value => setParam(FILTER_PARAMS.schedule, value), [setParam]);
  const onStatusChange = useCallback(value => setParam(FILTER_PARAMS.status, value), [setParam]);
  const onTriggerChange = useCallback(value => setParam(FILTER_PARAMS.trigger, value), [setParam]);
  const onVersionChange = useCallback(value => setParam(FILTER_PARAMS.version, value), [setParam]);

  const onClear = useCallback(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        Object.values(FILTER_PARAMS).forEach(name => next.delete(name));
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  return {
    values: { schedule: scheduleId, status, trigger, version: versionId },
    options: {
      schedule: scheduleOptions,
      status: STATUS_OPTIONS,
      trigger: TRIGGER_FILTER_OPTIONS,
      version: versionOptions,
    },
    handlers: {
      schedule: onScheduleChange,
      status: onStatusChange,
      trigger: onTriggerChange,
      version: onVersionChange,
    },
    queryParams,
    hasFilters: queryParams !== NO_QUERY_PARAMS,
    onClear,
  };
};
