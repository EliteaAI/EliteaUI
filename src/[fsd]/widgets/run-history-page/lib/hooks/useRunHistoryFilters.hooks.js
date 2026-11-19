import { useCallback, useMemo } from 'react';

import { useSearchParams } from 'react-router-dom';

import { toRunStatusLabel } from '@/[fsd]/entities/schedule';

import {
  ALL_OPTION_VALUE,
  EXECUTION_TYPE_PARAM,
  FILTER_PARAMS,
  NO_QUERY_PARAMS,
  RUN_RECORD_FILTERS,
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
const NO_DISABLED_FILTERS = [];

const paramOf = trigger => TRIGGER_OPTIONS.find(option => option.value === trigger)?.param;

// A value outside the allowed set reads as "All", so a hand-edited link never sends a bad filter
const readParam = (searchParams, name, isValid) => {
  const raw = searchParams.get(name) ?? ALL_OPTION_VALUE;
  return isValid(raw) ? raw : ALL_OPTION_VALUE;
};

export const useRunHistoryFilters = ({ schedules, versions }) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const trigger = readParam(searchParams, FILTER_PARAMS.trigger, value =>
    TRIGGER_OPTIONS.some(option => option.value === value),
  );
  const triggerParam = paramOf(trigger);
  // An execution type run has no run record: the run record filters of a link read as "All"
  const isExecutionType = triggerParam === EXECUTION_TYPE_PARAM;
  const readRunParam = (name, isValid) =>
    isExecutionType ? ALL_OPTION_VALUE : readParam(searchParams, name, isValid);

  const scheduleId = readRunParam(FILTER_PARAMS.schedule, value => WHOLE_NUMBER.test(value));
  const versionId = readRunParam(FILTER_PARAMS.version, value => WHOLE_NUMBER.test(value));
  const status = readRunParam(FILTER_PARAMS.status, value => STATUS_VALUES.includes(value));

  const queryParams = useMemo(() => {
    const params = {};
    if (scheduleId) params[FILTER_PARAMS.schedule] = Number(scheduleId);
    if (versionId) params[FILTER_PARAMS.version] = Number(versionId);
    if (status) params[FILTER_PARAMS.status] = status;
    if (trigger) params[triggerParam] = trigger;
    return Object.keys(params).length ? params : NO_QUERY_PARAMS;
  }, [scheduleId, versionId, status, trigger, triggerParam]);

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
  const onTriggerChange = useCallback(
    value => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          if (value) next.set(FILTER_PARAMS.trigger, value);
          else next.delete(FILTER_PARAMS.trigger);
          if (paramOf(value) === EXECUTION_TYPE_PARAM) {
            RUN_RECORD_FILTERS.forEach(key => next.delete(FILTER_PARAMS[key]));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
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
    disabledFilters: isExecutionType ? RUN_RECORD_FILTERS : NO_DISABLED_FILTERS,
    queryParams,
    hasFilters: queryParams !== NO_QUERY_PARAMS,
    onClear,
  };
};
